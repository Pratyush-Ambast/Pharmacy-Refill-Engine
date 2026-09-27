// The work queue — the "single pane of glass" for the practice.
import Link from "next/link";
import { getSql } from "@/lib/db/client";
import IntakeForm from "@/components/IntakeForm";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [
  ["all", "All"],
  ["triaged", "Needs triage"],
  ["provider", "With provider"],
  ["blocked", "Blocked"],
  ["sent", "In fulfillment"],
  ["escalated", "Escalated"],
  ["done", "Done"],
];

const GROUPS: Record<string, string[]> = {
  all: [],
  triaged: ["TRIAGED"],
  provider: ["PENDING_DECISION"],
  blocked: ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"],
  sent: ["APPROVED", "SENT_TO_PHARMACY"],
  escalated: ["ESCALATED"],
  done: ["FILLED", "DENIED"],
};

export default async function QueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const active = searchParams.status || "all";
  const sql = getSql();
  const all = await sql`SELECT * FROM refills ORDER BY state_changed_at DESC`;

  const inGroup = (s: string) => {
    const g = GROUPS[active] ?? [];
    return g.length === 0 || g.includes(s);
  };
  const rows = all.filter((r: any) => inGroup(r.status));
  const countFor = (key: string) =>
    all.filter((r: any) => inGroupFor(key, r.status)).length;

  function inGroupFor(key: string, status: string) {
    const g = GROUPS[key] ?? [];
    return g.length === 0 || g.includes(status);
  }

  return (
    <>
      <IntakeForm />

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <Link key={key} href={key === "all" ? "/" : `/?status=${key}`}
                className={active === key ? "active" : ""}>
            {label}<span className="count">{countFor(key)}</span>
          </Link>
        ))}
      </div>

      <table className="queue">
        <thead>
          <tr>
            <th>Patient</th><th>Medication</th><th>Pharmacy</th>
            <th>State</th><th>Blocker</th><th>AI conf.</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td><Link href={`/refill/${r.id}`}><b>#{r.id}</b> {r.patient_name}</Link></td>
              <td>{r.medication}</td>
              <td>{r.pharmacy || "—"}</td>
              <td><StatusBadge state={r.status} /></td>
              <td className="muted">{r.blocker || "—"}</td>
              <td>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}</td>
              <td className="muted">{timeAgo(r.state_changed_at)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="muted" style={{ textAlign: "center" }}>Nothing here.</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
