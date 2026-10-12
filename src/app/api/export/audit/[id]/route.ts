import { NextResponse } from "next/server";
import { getAudit } from "@/lib/dashboard/queries";
import { formatReportToMarkdown } from "@/lib/export/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/export/audit/[id] — download report as JSON or Markdown.
   Supports ?format=markdown or ?format=json (default).
   Authenticated + RLS-scoped through getAudit.
   ============================================================ */

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();

  if (format === "markdown" || format === "md") {
    const md = formatReportToMarkdown(audit.report);
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="orbital-audit-${id}.md"`,
        "Cache-Control": "no-store",
      },
    });
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
