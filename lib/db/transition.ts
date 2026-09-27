// Centralized, race-safe state transition helper.
// The compare-and-set UPDATE prevents cron/system work from changing a refill
// between validation and persistence. Every successful transition gets an audit event.
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
  const rows = await sql`
    WITH updated AS (
      UPDATE refills
      SET status = ${to}, state_changed_at = now()
      WHERE id = ${refillId}
        AND (${from}::text IS NULL OR status = ${from})
      RETURNING id
    )
    INSERT INTO events (refill_id, from_state, to_state, actor, reason, payload)
    SELECT id, ${from}, ${to}, ${actor}, ${reason}, ${payload}
    FROM updated
    RETURNING id
  `;

  if (rows.length === 0) {
    throw new Error(`Concurrent state change: refill ${refillId} is no longer in ${from ?? "the expected state"}. Refresh and try again.`);
  }
}
