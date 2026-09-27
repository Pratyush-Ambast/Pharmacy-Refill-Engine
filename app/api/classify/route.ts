// GET /api/classify?text=...  — live classification preview.
// Great for the stage demo: paste a fax, show the AI reasoning
// BEFORE anything is created.
import { NextResponse } from "next/server";
import { classifyIntake } from "@/lib/ai/classifier";
import { initialStateFromClassification } from "@/lib/core/guardrails";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text") || "";
  if (!text.trim()) return NextResponse.json({ error: "Provide ?text=" }, { status: 400 });
  const classification = await classifyIntake(text);
  const guard = initialStateFromClassification(classification);
  return NextResponse.json({ classification, guardrail: guard });
}
