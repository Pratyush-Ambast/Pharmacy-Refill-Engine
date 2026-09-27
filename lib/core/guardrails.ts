// ─────────────────────────────────────────────────────────────
// GUARDRAILS — where AI output is allowed to influence the system.
// The classifier PROPOSES an initial state; these rules decide,
// and low confidence is ALWAYS routed to a human (ESCALATED).
// The AI never calls the decision endpoint; humans act via UI.
// ─────────────────────────────────────────────────────────────
import type { State } from "./state-machine";
import type { Classification } from "../ai/classifier";

export const MIN_CONFIDENCE = 0.6;

export function initialStateFromClassification(c: Classification): {
  state: State;
  reason: string;
} {
  if (c.confidence < MIN_CONFIDENCE) {
    return {
      state: "ESCALATED",
      reason: `Classification confidence ${c.confidence.toFixed(2)} below threshold ${MIN_CONFIDENCE} — routed to human triage`,
    };
  }
  switch (c.blocker) {
    case "NO_REFILLS":
      return { state: "PENDING_DECISION", reason: "No refills remain — provider approval required for new prescription" };
    case "CLINICAL_REVIEW":
      return { state: "PENDING_DECISION", reason: "Clinical review required before refill" };
    case "NEEDS_VISIT":
      return { state: "NEEDS_VISIT", reason: "Patient visit required before refill can be issued" };
    case "MISSING_INFO":
      return { state: "NEEDS_INFO", reason: "Information missing or unclear — patient/pharmacy follow-up needed" };
    case "INSURANCE":
      return { state: "INSURANCE_BLOCK", reason: "Insurance/prior-authorization requirement blocking fulfillment" };
    default:
      return { state: "ESCALATED", reason: "Unrecognized blocker — routed to human triage" };
  }
}
