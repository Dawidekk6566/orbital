import "server-only";

import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { limitsFor } from "@/lib/plans";
import {
  authenticateApiKey,
  bearerToken,
  hasScope,
  type ApiScope,
  type AuthedKey,
} from "@/lib/apiKeys";

/* ============================================================
   Shared auth gate for the public REST API (/api/v1/*). Verifies
   the bearer key, that the team's plan includes the API, and that
   the key carries the required scope. Returns the AuthedKey on
   success, or a ready-to-send error Response.
   ============================================================ */

export async function authorizeApiRequest(
  request: Request,
  scope: ApiScope,
): Promise<AuthedKey | Response> {
  if (!isServiceRoleConfigured()) {
    return Response.json({ error: "api_unavailable" }, { status: 503 });
  }
  const authed = await authenticateApiKey(
    bearerToken(request.headers.get("authorization")),
  );
  if (!authed) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!limitsFor(authed.plan).api) {
    return Response.json({ error: "plan_forbidden" }, { status: 403 });
  }
  if (!hasScope(authed, scope)) {
    return Response.json(
      { error: "insufficient_scope", required: scope },
      { status: 403 },
    );
  }
  return authed;
}
