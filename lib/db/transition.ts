// Every state change goes through here: append the event FIRST,
// then update current state. The events table is append-only —
// it IS the audit trail, the observability log, and the UI timeline.
import { getSql } from "./client";

export async function recordTransition(
  refillId: number,
  from: string | null,
  to: string,
  actor: string,
  reason: string | null,
  payload: any = null
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO events (refill_id, from_state, to_state, actor, reason, payload)
    VALUES (${refillId}, ${from}, ${to}, ${actor}, ${reason}, ${payload})
  `;
  await sql`
    UPDATE refills SET status = ${to}, state_changed_at = now()
    WHERE id = ${refillId}
  `;
}
