import { NextResponse } from "next/server";
import { getAudit } from "@/lib/dashboard/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/export/audit/[id] — download the full report JSON.
   Authenticated + RLS-scoped through getAudit (runs as the signed-in
   user via the cookie-bound client), so a foreign id resolves to
   nothing → 404. Served as an attachment for a clean file download.
   ============================================================ */

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = JSON.stringify(audit.report, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="orbital-audit-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
