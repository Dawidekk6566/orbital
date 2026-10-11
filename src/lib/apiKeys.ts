import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type { PlanId } from "@/lib/plans";

/* ============================================================
   API keys — bearer tokens for the public REST API (/api/v1).

   A key looks like `orb_<random>`. We store only a SHA-256 hash and
   a short prefix (for display); the plaintext is shown once at
   creation and never persisted. Verification runs server-side with
   the service-role client because the caller is an external client,
   not a signed-in user with a Supabase session.
   ============================================================ */

export const KEY_PREFIX_LEN = 12; // e.g. "orb_a1b2c3d4"
export type ApiScope = "audits:read" | "audits:write" | "projects:read";
export const DEFAULT_SCOPES: ApiScope[] = [
  "audits:read",
  "audits:write",
  "projects:read",
];

/** A freshly minted key: the plaintext (shown once) + what we store. */
export type GeneratedKey = {
  key: string; // full plaintext — return to the user ONCE
  prefix: string; // stored + displayed
  hash: string; // stored (SHA-256 hex)
};

export function generateApiKey(): GeneratedKey {
  const secret = randomBytes(24).toString("base64url"); // ~32 url-safe chars
  const key = `orb_${secret}`;
  return { key, prefix: key.slice(0, KEY_PREFIX_LEN), hash: hashApiKey(key) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests of equal length. */
function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export type AuthedKey = {
  keyId: string;
  teamId: string;
  scopes: ApiScope[];
  plan: PlanId;
};

/** Extract a bearer token from an Authorization header, or null. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = m?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Verify a plaintext API key. Returns the owning team + scopes when
 * valid and not revoked, else null. Touches last_used_at (best-effort).
 * Uses the service-role client — there's no user session on API calls.
 */
export async function authenticateApiKey(
  key: string | null,
): Promise<AuthedKey | null> {
  if (!key || !isServiceRoleConfigured()) return null;

  const supabase = createServiceRoleClient();
  const hash = hashApiKey(key);

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, team_id, key_hash, scopes, revoked_at, teams(plan)")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  // Defense in depth: the eq() already matched, but compare in
  // constant time so a lookup can't be used as a timing oracle.
  if (!hashesEqual(String(data.key_hash), hash)) return null;

  const teamsRel = data.teams as { plan?: string } | { plan?: string }[] | null;
  const planRaw = Array.isArray(teamsRel) ? teamsRel[0]?.plan : teamsRel?.plan;

  // Best-effort usage stamp; ignore failures.
  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id as string)
    .then(
      () => undefined,
      () => undefined,
    );

  return {
    keyId: data.id as string,
    teamId: data.team_id as string,
    scopes: (data.scopes as ApiScope[]) ?? [],
    plan: (planRaw as PlanId) ?? "free",
  };
}

export function hasScope(authed: AuthedKey, scope: ApiScope): boolean {
  return authed.scopes.includes(scope);
}
