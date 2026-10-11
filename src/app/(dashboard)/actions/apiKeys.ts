"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getCurrentTeam } from "@/lib/auth/dal";
import { limitsFor } from "@/lib/plans";
import {
  generateApiKey,
  DEFAULT_SCOPES,
  type ApiScope,
} from "@/lib/apiKeys";

/* ============================================================
   API key mutations. Owner/admin only (RLS enforces it too), and
   only on plans where the REST API is included. The plaintext key
   is returned exactly ONCE from createApiKey — we store just a
   SHA-256 hash + prefix, never the key itself.
   ============================================================ */

export type CreateKeyResult = {
  key?: string; // plaintext, shown once
  prefix?: string;
  error?: string;
  fieldError?: string;
};

const NameSchema = z
  .string()
  .trim()
  .min(1, "Give the key a name.")
  .max(60, "Keep the name under 60 characters.");

async function requireApiManager() {
  await requireUser("/dashboard/api-keys");
  const team = await getCurrentTeam();
  if (!team) return { ok: false as const, error: "No active team." };
  if (team.role !== "owner" && team.role !== "admin") {
    return { ok: false as const, error: "Only an owner or admin can manage API keys." };
  }
  if (!limitsFor(team.plan).api) {
    return {
      ok: false as const,
      error: "The REST API isn't included on your plan. Upgrade to Pro or Team.",
    };
  }
  return { ok: true as const, team };
}

export async function createApiKey(
  _prev: CreateKeyResult | undefined,
  formData: FormData,
): Promise<CreateKeyResult> {
  const gate = await requireApiManager();
  if (!gate.ok) return { error: gate.error };

  const parsed = NameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  const user = await requireUser();
  const { key, prefix, hash } = generateApiKey();
  const scopes: ApiScope[] = DEFAULT_SCOPES;

  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").insert({
    team_id: gate.team.id,
    name: parsed.data,
    key_prefix: prefix,
    key_hash: hash,
    scopes,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't create the key. Try again." };

  revalidatePath("/dashboard/api-keys");
  // Plaintext is returned to the client once here and never stored.
  return { key, prefix };
}

/** Revoke a key (soft-delete via revoked_at). Owner/admin only. */
export async function revokeApiKey(
  keyId: string,
): Promise<{ error?: string }> {
  const gate = await requireApiManager();
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .is("revoked_at", null);

  if (error) return { error: "Couldn't revoke the key. Try again." };
  revalidatePath("/dashboard/api-keys");
  return {};
}
