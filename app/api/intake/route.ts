// POST /api/intake
// Entry point for any refill request (fax text, portal message,
// e-prescribe payload). Pipeline: classify → guardrails → create
// refill at its initial state → log the creation event.
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { classifyIntake } from "@/lib/ai/classifier";
import { initialStateFromClassification } from "@/lib/core/guardrails";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { raw } = await req.json();
    if (!raw || !raw.trim()) {
      return NextResponse.json({ error: "Missing 'raw' intake text" }, { status: 400 });
    }

    // 1. AI (or rules fallback) proposes a classification
    const classification = await classifyIntake(raw);

    // 2. Guardrails decide the initial state — never the AI directly
    const { state, reason } = initialStateFromClassification(classification);

    // 3. Persist refill + creation event
    const sql = getSql();
    const rows = await sql`
      INSERT INTO refills
        (patient_name, patient_dob, medication, pharmacy, status, blocker,
         confidence, ai_summary, ai_suggestion, raw_intake, state_changed_at)
      VALUES
        (${classification.entities.patient_name || "Unknown patient"},
         ${null},
         ${classification.entities.medication || "Unknown medication"},
         ${classification.entities.pharmacy || null},
         ${state},
         ${classification.blocker},
         ${classification.confidence},
         ${classification.summary},
         ${classification.suggested_action},
         ${raw},
         now())
      RETURNING id
    `;
    const id = rows[0].id;

    await sql`
      INSERT INTO events (refill_id, from_state, to_state, actor, reason, payload)
      VALUES (${id}, null, ${state}, 'system', ${reason},
              ${JSON.stringify({ classification })})
    `;

    return NextResponse.json({ id, state, classification });
  } catch (e: any) {
    console.error("[intake]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
