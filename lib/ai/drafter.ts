// ─────────────────────────────────────────────────────────────
// DRAFTER — assembles the provider's decision context so a
// clinical review takes 30 seconds instead of a phone call.
// Template-based (deterministic) for the demo; the seam is here
// to upgrade to LLM-summarized chart context in production.
// ─────────────────────────────────────────────────────────────
export function draftDecisionContext(refill: {
  patient_name: string;
  patient_dob?: string;
  medication: string;
  pharmacy?: string;
  ai_summary?: string;
  raw_intake?: string;
  created_at?: string;
}): string {
  const lines = [
    `PATIENT: ${refill.patient_name}${refill.patient_dob ? ` (DOB ${refill.patient_dob})` : ""}`,
    `MEDICATION: ${refill.medication}`,
    refill.pharmacy ? `PHARMACY: ${refill.pharmacy}` : null,
    ``,
    `REFILL REQUEST (verbatim):`,
    `"${(refill.raw_intake || "").slice(0, 400)}"`,
    ``,
    `TRIAGE SUMMARY: ${refill.ai_summary || "n/a"}`,
    ``,
    `[Demo context — production would append: last 3 fill dates, last visit, recent labs, adherence score]`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
