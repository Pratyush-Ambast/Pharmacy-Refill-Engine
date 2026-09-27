// GET /api/cron/verify  (invoked by Vercel Cron every 5 min)
// The "did it actually happen?" loop:
//   1. SENT_TO_PHARMACY older than the fill delay → confirm fill → FILLED + SMS
//   2. Stale states (per state-machine timeouts) → auto-ESCALATED + SMS
// DEMO speed-ups: FILL_DELAY_MINUTES / DEMO_STALE_MINUTES env vars.
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { staleTimeoutMinutes, type State } from "@/lib/core/state-machine";
import { recordTransition } from "@/lib/db/transition";
import { checkFillStatus } from "@/lib/adapters/pharmacy";
import { notifyPatient } from "@/lib/notify";

export const dynamic = "force-dynamic";

const FILL_DELAY_MINUTES = Number(process.env.FILL_DELAY_MINUTES) || 2;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const summary: { filled: number[]; escalated: number[] } = { filled: [], escalated: [] };

  // 1. Verification: did the pharmacy actually fill it?
  const sent = await sql`
    SELECT * FROM refills
    WHERE status = 'SENT_TO_PHARMACY'
      AND state_changed_at < now() - make_interval(mins => ${FILL_DELAY_MINUTES})
  `;
  for (const r of sent) {
    const res = await checkFillStatus(r);
    if (res.filled) {
      await recordTransition(r.id, "SENT_TO_PHARMACY", "FILLED", "system",
        "Pharmacy confirmed fill (mock adapter — production: NCPDP status/webhook)", { rxId: res.rxId });
      await notifyPatient(r, `${r.medication} is filled and ready for pickup at ${r.pharmacy || "your pharmacy"}.`);
      summary.filled.push(r.id);
    }
  }

  // 2. Stale-state auto-escalation
  const staleStates: State[] = ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"];
  for (const s of staleStates) {
    const mins = staleTimeoutMinutes(s);
    if (!Number.isFinite(mins)) continue;
    const rows = await sql`
      SELECT * FROM refills
      WHERE status = ${s}
        AND state_changed_at < now() - make_interval(mins => ${mins})
    `;
    for (const r of rows) {
      await recordTransition(r.id, s, "ESCALATED", "system",
        `Auto-escalated: no movement for ${mins} minutes (timeout for ${s})`);
      await notifyPatient(r, `your ${r.medication} refill needs extra attention — our care team has been alerted.`);
      summary.escalated.push(r.id);
    }
  }

  return NextResponse.json({ ok: true, ...summary, checkedAt: new Date().toISOString() });
}
