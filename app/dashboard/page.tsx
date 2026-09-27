import Link from "next/link";
import { getSql } from "@/lib/db/client";
import IntakeForm from "@/components/IntakeForm";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["all", "All"], ["triaged", "Needs triage"], ["provider", "With provider"], ["blocked", "Blocked"], ["sent", "In fulfillment"], ["escalated", "Escalated"], ["done", "Done"]];
const GROUPS: Record<string, string[]> = { all: [], triaged: ["TRIAGED"], provider: ["PENDING_DECISION"], blocked: ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"], sent: ["APPROVED", "SENT_TO_PHARMACY"], escalated: ["ESCALATED"], done: ["FILLED", "DENIED"] };

export default async function Dashboard({ searchParams }: { searchParams: { status?: string } }) {
  const active = searchParams.status || "all";
  const sql = getSql();
  const all = await sql`SELECT * FROM refills ORDER BY state_changed_at DESC`;
  const count = (states: string[]) => states.length === 0 ? all.length : all.filter((r: any) => states.includes(r.status)).length;
  const rows = (GROUPS[active] ?? []).length === 0 ? all : all.filter((r: any) => GROUPS[active].includes(r.status));
  const filled = count(["FILLED"]), escalated = count(["ESCALATED"]), open = all.length - filled - count(["DENIED"]);
  const sent = count(["SENT_TO_PHARMACY"]), pending = count(["PENDING_DECISION"]);
  const confident = all.filter((r: any) => r.confidence != null && r.confidence >= 0.6).length;

  return <>
    <div className="dashboard-head"><div><div className="section-kicker">OPERATIONS CONTROL CENTER</div><h1>Refill work queue</h1><p>One state, one reason, one owner for every refill.</p></div><div className="live-chip"><span /> Live database</div></div>
    <div className="stat-grid">
      <div className="stat"><span>Open work</span><b>{open}</b><small>active requests</small></div>
      <div className="stat"><span>With provider</span><b>{pending}</b><small>clinical decisions</small></div>
      <div className="stat"><span>In fulfillment</span><b>{sent}</b><small>awaiting pharmacy</small></div>
      <div className="stat"><span>Escalated</span><b>{escalated}</b><small>human attention</small></div>
      <div className="stat"><span>Filled</span><b>{filled}</b><small>verified complete</small></div>
      <div className="stat"><span>AI confidence ≥60%</span><b>{confident}</b><small>current queue</small></div>
    </div>
    <IntakeForm />
    <div className="tabs">{TABS.map(([key, label]) => <Link key={key} href={key === "all" ? "/dashboard" : `/dashboard?status=${key}`} className={active === key ? "active" : ""}>{label}<span className="count">{count(GROUPS[key])}</span></Link>)}</div>
    <div className="table-shell"><table className="queue"><thead><tr><th>Patient</th><th>Medication</th><th>Pharmacy</th><th>State</th><th>Blocker</th><th>AI conf.</th><th>Updated</th></tr></thead><tbody>{rows.map((r: any) => <tr key={r.id}><td><Link href={`/refill/${r.id}`}><b>#{r.id}</b> {r.patient_name}</Link></td><td>{r.medication}</td><td>{r.pharmacy || "—"}</td><td><StatusBadge state={r.status} /></td><td className="muted">{r.blocker || "—"}</td><td>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}</td><td className="muted">{timeAgo(r.state_changed_at)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={7} className="muted empty">Nothing here.</td></tr>}</tbody></table></div>
  </>;
}
