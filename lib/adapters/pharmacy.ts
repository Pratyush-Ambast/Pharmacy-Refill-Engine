// Adapter seam for the pharmacy/eRx network.
// DEMO: deterministic mock. PRODUCTION: Surescripts / RxChange
// NCPDP SCRIPT transactions, or pharmacy-system webhooks.
export async function sendERx(refill: {
  id: number;
  patient_name: string;
  medication: string;
  pharmacy?: string;
}): Promise<{ ok: boolean; rxId: string }> {
  const rxId = `RX-${refill.id}-${Date.now()}`;
  console.log(`[erx:mock] transmitted ${rxId} — ${refill.medication} for ${refill.patient_name} → ${refill.pharmacy || "pharmacy"}`);
  return { ok: true, rxId };
}

export async function checkFillStatus(refill: {
  id: number;
  medication: string;
}): Promise<{ filled: boolean; rxId?: string }> {
  // DEMO: every sent Rx fills. PRODUCTION: poll NCPDP status or
  // receive pharmacy webhook, then confirm.
  console.log(`[pharmacy:mock] fill confirmed for refill #${refill.id} (${refill.medication})`);
  return { filled: true, rxId: `RX-${refill.id}` };
}
