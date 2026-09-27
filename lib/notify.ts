import { sendSms } from "./adapters/sms";

// Fire-and-forget patient notification — never blocks the workflow.
export async function notifyPatient(refill: any, body: string): Promise<void> {
  try {
    const r = await sendSms(`${refill.patient_name.split(" ")[0]} — ${body}`);
    console.log(`[notify:${r.channel}] ${body}`);
  } catch (e) {
    console.error("[notify] failed (non-fatal):", e);
  }
}
