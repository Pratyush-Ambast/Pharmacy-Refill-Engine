// Internal demo notification hook. No phone numbers or external messaging provider are used.
export async function notifyPatient(refill: any, body: string): Promise<void> {
  console.log(`[patient-notification:demo] ${refill.patient_name}: ${body}`);
}
