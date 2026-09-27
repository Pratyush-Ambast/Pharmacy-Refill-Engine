import { STATE_LABELS, type State } from "@/lib/core/state-machine";

const COLORS: Record<string, string> = {
  TRIAGED: "gray",
  PENDING_DECISION: "blue",
  NEEDS_VISIT: "orange",
  NEEDS_INFO: "orange",
  INSURANCE_BLOCK: "orange",
  APPROVED: "green",
  SENT_TO_PHARMACY: "purple",
  FILLED: "green",
  DENIED: "red",
  ESCALATED: "red",
};

export default function StatusBadge({ state }: { state: string }) {
  return (
    <span className={`badge ${COLORS[state] || "gray"}`}>
      {STATE_LABELS[state as State] || state}
    </span>
  );
}
