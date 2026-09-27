import { getSql } from "./db/client";

export function statusMessage(status: string, medication?: string) {
  const m = medication ? ` regarding your ${medication} refill` : " regarding your refill";
  const map: Record<string,string> = {
    PENDING_DECISION: `Your refill request${m} is with the provider for review.`,
    NEEDS_VISIT: `Your refill request${m} needs a visit before it can move forward.`,
    NEEDS_INFO: `Your refill request${m} needs additional information from you.`,
    INSURANCE_BLOCK: `Your refill request${m} is currently blocked by an insurance requirement.`,
    APPROVED: `Your refill request${m} was approved.`,
    SENT_TO_PHARMACY: `Your refill request${m} was sent to the pharmacy.`,
    FILLED: `Your refill request${m} is marked filled.`,
    DENIED: `Your refill request${m} was declined. Please contact the office for details.`,
    ESCALATED: `Your refill request${m} needs extra attention. Our care team has been alerted.`,
    TRIAGED: `Your refill request${m} has been received and is being reviewed.`
  };
  return map[status] || `There is an update${m}.`;
}

export async function logPatientNotification(refill: any, body: string, source: "automatic" | "manual", actor = "system") {
  const sql = getSql();
  await sql`INSERT INTO notifications (refill_id, patient_id, channel, status, source, actor, body) VALUES (${refill.id}, null, 'in_app', 'logged', ${source}, ${actor}, ${body})`;
}
