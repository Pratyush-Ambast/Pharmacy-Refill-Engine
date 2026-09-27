// POST /api/refills/:id/decision
// The ONLY way a human changes state. Enforces:
//   1. Role from header (demo auth — guardrail enforced server-side)
//   2. State machine legality (canTransition)
//   3. On approval: eRx fires immediately; SMS notifies patient
// The AI has no code path to this endpoint.
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { canTransition, type State } from "@/lib/core/state-machine";
import { recordTransition } from "@/lib/db/transition";
import { sendERx } from "@/lib/adapters/pharmacy";
import { notifyPatient } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const to = body.action as State;
    const note = (body.note || "").toString().slice(0, 500);
    const role = req.headers.get("x-demo-role") || "staff";

    const sql = getSql();
    const rows = await sql`SELECT * FROM refills WHERE id = ${id}`;
    const refill = rows[0];
    if (!refill) return NextResponse.json({ error: "Refill not found" }, { status: 404 });

    // Guardrail: legal transition + authorized role
    const check = canTransition(refill.status as State, to, role);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason, guardrail: true }, { status: 409 });
    }

    // Human decision recorded with their note
    await recordTransition(id, refill.status, to, role, note || null);

    // Side effects
    if (to === "APPROVED") {
      const rx = await sendERx(refill);
      await recordTransition(id, "APPROVED", "SENT_TO_PHARMACY", "system",
        `eRx transmitted (${rx.rxId}) — mock Surescripts adapter`, { rxId: rx.rxId });
      notifyPatient(refill, `your ${refill.medication} refill was approved and sent to ${refill.pharmacy || "your pharmacy"}. We'll text you when it's filled.`);
    }
    if (to === "DENIED") {
      notifyPatient(refill, `your ${refill.medication} refill request was declined. Please call the office to discuss alternatives.`);
    }
    if (to === "NEEDS_VISIT") {
      notifyPatient(refill, `your ${refill.medication} refill needs a quick visit first — we'll contact you to schedule.`);
    }

    return NextResponse.json({ ok: true, state: to });
  } catch (e: any) {
    console.error("[decision]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
