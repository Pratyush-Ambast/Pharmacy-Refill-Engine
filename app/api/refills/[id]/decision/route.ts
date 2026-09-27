// POST /api/refills/:id/decision
// Human actions are checked against the state machine and persisted with a
// race-safe compare-and-set transition. AI never has a path to this endpoint.
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
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid refill id" }, { status: 400 });
    }

    const body = await req.json();
    const to = body.action as State;
    const note = (body.note || "").toString().slice(0, 500);
    const role = req.headers.get("x-demo-role") || "staff";

    const sql = getSql();
    const rows = await sql`SELECT * FROM refills WHERE id = ${id}`;
    const refill = rows[0];
    if (!refill) return NextResponse.json({ error: "Refill not found" }, { status: 404 });

    const from = refill.status as State;
    const check = canTransition(from, to, role);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason, guardrail: true, currentState: from }, { status: 409 });
    }

    await recordTransition(id, from, to, role, note || null);

    if (to === "APPROVED") {
      const rx = await sendERx(refill);
      await recordTransition(id, "APPROVED", "SENT_TO_PHARMACY", "system",
        `eRx transmitted (${rx.rxId}) — mock Surescripts adapter`, { rxId: rx.rxId });
      await notifyPatient(refill, `your ${refill.medication} refill was approved and sent to ${refill.pharmacy || "your pharmacy"}. We'll text you when it's filled.`);
    }
    if (to === "DENIED") {
      await notifyPatient(refill, `your ${refill.medication} refill request was declined. Please call the office to discuss alternatives.`);
    }
    if (to === "NEEDS_VISIT") {
      await notifyPatient(refill, `your ${refill.medication} refill needs a quick visit first — we'll contact you to schedule.`);
    }

    return NextResponse.json({ ok: true, state: to });
  } catch (e: any) {
    console.error("[decision]", e);
    const status = e?.message?.startsWith("Concurrent state change") ? 409 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
