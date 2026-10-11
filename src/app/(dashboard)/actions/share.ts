"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/auth/dal";

/* ============================================================
   Share-link mutations. A share link is an opaque token on the
   audit row; the public /share/[token] page reads the report by
   token via the service-role client.

   `audits` rows are immutable under RLS (no client UPDATE policy —
   they are historical records), so the token write itself goes
   through the service-role client. We first re-read the audit under
   the caller's RLS, so a caller can only mint/revoke a link for an
   audit their team owns — verify-under-RLS, then mutate as service
   role, the same pattern the worker/webhook use.
   ============================================================ */

export type ShareResult = { token?: string; error?: string };

/** Mint (or return the existing) public share token for an audit. */
export async function createShareLink(auditId: string): Promise<ShareResult> {
  await requireUser("/dashboard");
  if (!isServiceRoleConfigured()) return { error: "Sharing is not configured." };
  const supabase = await createClient();

  // Re-read under RLS: a foreign id yields null → not found. This is the
  // ownership gate; the write below runs as service role.
  const { data: audit } = await supabase
    .from("audits")
    .select("id, project_id, share_token")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) return { error: "Audit not found." };

  // Idempotent: reuse an existing token so the link stays stable.
  if (audit.share_token) return { token: audit.share_token };

  const token = `sh_${randomBytes(24).toString("base64url")}`;
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("audits")
    .update({ share_token: token, shared_at: new Date().toISOString() })
    .eq("id", auditId);
  if (error) return { error: "Couldn't create a share link." };

  revalidatePath(`/dashboard/audits/${auditId}`);
  return { token };
}

/** Revoke an audit's public share link (the URL stops resolving). */
export async function revokeShareLink(auditId: string): Promise<ShareResult> {
  await requireUser("/dashboard");
  if (!isServiceRoleConfigured()) return { error: "Sharing is not configured." };
  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("audits")
    .select("id")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) return { error: "Audit not found." };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("audits")
    .update({ share_token: null, shared_at: null })
    .eq("id", auditId);
  if (error) return { error: "Couldn't revoke the share link." };

  revalidatePath(`/dashboard/audits/${auditId}`);
  return {};
}
