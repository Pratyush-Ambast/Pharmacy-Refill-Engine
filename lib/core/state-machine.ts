// ─────────────────────────────────────────────────────────────
// DOMAIN CORE — the refill state machine. PURE functions only:
// no framework imports, no DB, no AI. Fully unit-testable.
// This module is the single source of truth for:
//   what states exist, what can transition to what, who may act.
// ─────────────────────────────────────────────────────────────

export const STATES = [
  "TRIAGED",
  "PENDING_DECISION",
  "NEEDS_VISIT",
  "NEEDS_INFO",
  "INSURANCE_BLOCK",
  "APPROVED",
  "SENT_TO_PHARMACY",
  "FILLED",
  "DENIED",
  "ESCALATED",
] as const;

export type State = (typeof STATES)[number];

export const STATE_LABELS: Record<State, string> = {
  TRIAGED: "Triaged — awaiting routing",
  PENDING_DECISION: "With provider",
  NEEDS_VISIT: "Needs visit",
  NEEDS_INFO: "Missing info",
  INSURANCE_BLOCK: "Insurance block",
  APPROVED: "Approved",
  SENT_TO_PHARMACY: "Sent to pharmacy",
  FILLED: "Filled",
  DENIED: "Declined",
  ESCALATED: "Escalated",
};

export type Role = "staff" | "provider" | "system";

export interface Transition {
  from: State[];
  to: State;
  roles: Role[];
  label: string; // human-readable action label for UI buttons
}

export const TRANSITIONS: Transition[] = [
  // Staff routing from triage
  { from: ["TRIAGED"], to: "PENDING_DECISION", roles: ["staff"], label: "Route to provider" },
  { from: ["TRIAGED"], to: "NEEDS_VISIT", roles: ["staff"], label: "Patient needs visit" },
  { from: ["TRIAGED"], to: "NEEDS_INFO", roles: ["staff"], label: "Missing information" },
  { from: ["TRIAGED"], to: "INSURANCE_BLOCK", roles: ["staff"], label: "Insurance / PA block" },
  { from: ["TRIAGED"], to: "ESCALATED", roles: ["staff", "provider"], label: "Escalate" },

  // Blocker cleared → back to provider
  { from: ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"], to: "PENDING_DECISION", roles: ["staff"], label: "Blocker cleared — route to provider" },
  { from: ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"], to: "ESCALATED", roles: ["staff", "provider"], label: "Escalate" },

  // Provider clinical decisions — provider role ONLY (guardrail)
  { from: ["PENDING_DECISION"], to: "APPROVED", roles: ["provider"], label: "Approve refill" },
  { from: ["PENDING_DECISION"], to: "DENIED", roles: ["provider"], label: "Decline" },
  { from: ["PENDING_DECISION"], to: "NEEDS_VISIT", roles: ["provider"], label: "Needs visit first" },
  { from: ["PENDING_DECISION"], to: "ESCALATED", roles: ["provider"], label: "Escalate" },

  // System transitions — no human actor
  { from: ["APPROVED"], to: "SENT_TO_PHARMACY", roles: ["system"], label: "eRx transmitted" },
  { from: ["SENT_TO_PHARMACY"], to: "FILLED", roles: ["system"], label: "Pharmacy confirmed fill" },
  { from: ["SENT_TO_PHARMACY"], to: "ESCALATED", roles: ["system", "staff"], label: "Pharmacy timeout" },

  // Recovery
  { from: ["ESCALATED"], to: "TRIAGED", roles: ["staff"], label: "Re-triage" },
];

/** What can the given role do from the given state right now? (drives UI buttons) */
export function allowedActions(state: State, role: string): Transition[] {
  return TRANSITIONS.filter((t) => t.from.includes(state) && t.roles.includes(role as Role));
}

/** Hard guardrail: is this transition legal, and is this role allowed? */
export function canTransition(
  from: State,
  to: State,
  role: string
): { ok: boolean; reason?: string } {
  const t = TRANSITIONS.find((t) => t.from.includes(from) && t.to === to);
  if (!t) return { ok: false, reason: `Illegal transition: ${from} → ${to}` };
  if (!t.roles.includes(role as Role))
    return { ok: false, reason: `Role '${role}' may not perform '${t.label}'` };
  return { ok: true };
}

// ── Timeouts: states that auto-escalate when they go stale ────
// Production defaults; DEMO_STALE_MINUTES overrides for live demos.
const PRODUCTION_STALE_MINUTES: Partial<Record<State, number>> = {
  NEEDS_VISIT: 24 * 60,
  NEEDS_INFO: 48 * 60,
  INSURANCE_BLOCK: 72 * 60,
  SENT_TO_PHARMACY: 24 * 60,
};

export function staleTimeoutMinutes(state: State): number {
  const base = PRODUCTION_STALE_MINUTES[state];
  if (base == null) return Infinity;
  const demo = Number(process.env.DEMO_STALE_MINUTES);
  return Number.isFinite(demo) && demo > 0 ? demo : base;
}
