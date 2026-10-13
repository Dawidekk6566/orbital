import { NextResponse } from "next/server";
import { generateRemediationPatch } from "@/lib/analysis/aiRemediation";
import type { RemediationRequest } from "@/lib/analysis/remediationTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RemediationRequest;
    if (!body || !body.title) {
      return NextResponse.json(
        { error: "Invalid remediation request payload." },
        { status: 400 }
      );
    }

    const patch = await generateRemediationPatch(body);
    return NextResponse.json(patch, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate patch: ${message}` },
      { status: 500 }
    );
  }
}
