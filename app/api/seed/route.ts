// GET /api/seed         — create tables + load demo data once
// GET /api/seed?force=1 — wipe and reseed (demo reset button)
// One click prepares the entire demo environment on a fresh deploy.
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sql = getSql();
    const force = new URL(req.url).searchParams.get("force") === "1";

    await sql`
      CREATE TABLE IF NOT EXISTS refills (
        id            SERIAL PRIMARY KEY,
        patient_name  TEXT NOT NULL,
        patient_dob   TEXT,
        medication    TEXT,
        pharmacy      TEXT,
        status        TEXT NOT NULL DEFAULT 'TRIAGED',
        blocker       TEXT,
        confidence    REAL,
        ai_summary    TEXT,
        ai_suggestion TEXT,
        raw_intake    TEXT,
        state_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id          SERIAL PRIMARY KEY,
        refill_id   INTEGER NOT NULL REFERENCES refills(id),
        from_state  TEXT,
        to_state    TEXT NOT NULL,
        actor       TEXT NOT NULL,
        reason      TEXT,
        payload     JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    const existing = await sql`SELECT count(*)::int AS n FROM refills`;
    if (existing[0].n > 0 && !force) {
      return NextResponse.json({ ok: true, message: `Already seeded (${existing[0].n} refills). Use ?force=1 to reset.` });
    }
    if (force) {
      await sql`DELETE FROM events`;
      await sql`DELETE FROM refills`;
      await sql`ALTER SEQUENCE refills_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE events_id_seq RESTART WITH 1`;
    }

    // ── The six blockers, one refill each, plus one mid-flight ──
    const demo = [
      {
        patient: "Mary Alvarez", med: "Metformin 500mg", pharmacy: "CVS on 5th",
        status: "PENDING_DECISION", blocker: "NO_REFILLS", conf: 0.93,
        summary: "Metformin has 0 refills remaining; patient is stable on current dose.",
        suggestion: "Confirm recent A1c, then approve new 90-day prescription.",
        raw: "Refill request from CVS on 5th: Mary Alvarez, Metformin 500mg, 0 refills remaining. Patient states she takes it twice daily as prescribed. Requesting provider approval for new prescription.",
        age: "3 hours",
      },
      {
        patient: "Robert Chen", med: "Atorvastatin 20mg", pharmacy: "Walgreens #2210",
        status: "NEEDS_VISIT", blocker: "NEEDS_VISIT", conf: 0.88,
        summary: "Patient is 14 months overdue for a visit; policy requires annual review before refill.",
        suggestion: "Schedule office visit; issue bridge supply only if clinically appropriate.",
        raw: "Pharmacy fax: Robert Chen requests Atorvastatin 20mg refill. Note from staff: patient has not been seen since June 2025, overdue for annual lipid panel and visit.",
        age: "1 day",
      },
      {
        patient: "Priya Patel", med: "Levothyroxine", pharmacy: "Rite Aid",
        status: "NEEDS_INFO", blocker: "MISSING_INFO", conf: 0.81,
        summary: "Request does not state which strength (25/50/75/100mcg) the patient currently takes.",
        suggestion: "Call patient to confirm strength and current pharmacy before routing to provider.",
        raw: "Portal message: Priya Patel needs refill of Levothyroxine. Pharmacy unclear which strength — patient changed pharmacies last month and directions were not transferred.",
        age: "6 hours",
      },
      {
        patient: "James Okafor", med: "Insulin glargine 100u/mL", pharmacy: "Costco Pharmacy",
        status: "INSURANCE_BLOCK", blocker: "INSURANCE", conf: 0.9,
        summary: "Insulin glargine requires prior authorization; payer rejected initial claim.",
        suggestion: "Submit PA with recent A1c and dosing history; consider formulary alternative if urgent.",
        raw: "REJECTED CLAIM — James Okafor, Insulin glargine 100u/mL. Rejection code: prior authorization required. Payer: requires PA form + last 3 A1c results.",
        age: "2 days",
      },
      {
        patient: "Susan Wright", med: "Amlodipine 5mg", pharmacy: "CVS on 5th",
        status: "PENDING_DECISION", blocker: "CLINICAL_REVIEW", conf: 0.86,
        summary: "Patient reports new dizziness since dose increase — symptoms require clinician review before refill.",
        suggestion: "Provider to review dizziness; consider BP check or dose adjustment before approving.",
        raw: "Voicemail transcribed: Susan Wright requesting Amlodipine 5mg refill. She mentions feeling dizzy since the dose was increased last month. Please have provider review.",
        age: "30 minutes",
      },
      {
        patient: "Tom Baker", med: "Albuterol HFA", pharmacy: "Walgreens #2210",
        status: "SENT_TO_PHARMACY", blocker: "NO_REFILLS", conf: 0.95,
        summary: "Approved this morning; eRx transmitted, awaiting pharmacy fill confirmation.",
        suggestion: "None — verification loop will confirm fill automatically.",
        raw: "Refill request: Tom Baker, Albuterol HFA inhaler, 0 refills remaining. Approved by Dr. Lee this morning; transmitted to Walgreens #2210.",
        age: "10 minutes",
      },
      {
        patient: "Linda Gomez", med: "Sertraline 50mg", pharmacy: "Independent Rx",
        status: "ESCALATED", blocker: "MISSING_INFO", conf: 0.42,
        summary: "Multiple conflicting requests; classification confidence low. Auto-escalated to human triage.",
        suggestion: "Human triage: reconcile duplicate requests and confirm current pharmacy with patient.",
        raw: "Fax (partial, 2 of 4 pages): Linda Gomez, Sertraline 50mg?? Pharmacy note conflicting with portal request. Pages missing. Unable to determine correct medication or quantity.",
        age: "3 days",
      },
    ];

    const ids: number[] = [];
    for (const d of demo) {
      const rows = await sql`
        INSERT INTO refills
          (patient_name, medication, pharmacy, status, blocker, confidence,
           ai_summary, ai_suggestion, raw_intake, state_changed_at, created_at)
        VALUES
          (${d.patient}, ${d.med}, ${d.pharmacy}, ${d.status}, ${d.blocker}, ${d.conf},
           ${d.summary}, ${d.suggestion}, ${d.raw},
           now() - ${d.age}::interval, now() - ${d.age}::interval)
        RETURNING id
      `;
      ids.push(rows[0].id);
    }

    // Creation events for each seeded refill
    for (let i = 0; i < ids.length; i++) {
      const d = demo[i];
      await sql`
        INSERT INTO events (refill_id, from_state, to_state, actor, reason, payload, created_at)
        VALUES (${ids[i]}, null, ${d.status}, 'system',
                ${`Seeded demo scenario: ${d.blocker}`},
                ${JSON.stringify({ blocker: d.blocker, confidence: d.conf })},
                now() - ${d.age}::interval)
      `;
    }

    // Tom Baker's full history: received → triaged → provider → approved → sent
    const tom = ids[5];
    await sql`INSERT INTO events (refill_id, from_state, to_state, actor, reason, created_at)
              VALUES (${tom}, 'TRIAGED', 'PENDING_DECISION', 'staff', 'No refills remain — routed to provider', now() - interval '50 minutes')`;
    await sql`INSERT INTO events (refill_id, from_state, to_state, actor, reason, created_at)
              VALUES (${tom}, 'PENDING_DECISION', 'APPROVED', 'provider', 'Stable patient, approve 90-day supply', now() - interval '35 minutes')`;
    await sql`INSERT INTO events (refill_id, from_state, to_state, actor, reason, created_at)
              VALUES (${tom}, 'APPROVED', 'SENT_TO_PHARMACY', 'system', 'eRx transmitted (RX-mock-8841) — mock Surescripts adapter', now() - interval '2 minutes')`;

    // Linda Gomez auto-escalation event
    await sql`INSERT INTO events (refill_id, from_state, to_state, actor, reason, created_at)
              VALUES (${ids[6]}, 'NEEDS_INFO', 'ESCALATED', 'system', 'Auto-escalated: no movement for timeout period', now() - interval '1 day')`;

    return NextResponse.json({ ok: true, seeded: ids.length, ids });
  } catch (e: any) {
    console.error("[seed]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
