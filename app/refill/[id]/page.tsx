// Refill detail: patient context, AI triage panel, human decisions,
// and the full event timeline (the audit trail / observability story).
import { notFound } from "next/navigation";
import { getSql } from "@/lib/db/client";
import StatusBadge from "@/components/StatusBadge";
import DecisionPanel from "@/components/DecisionPanel";
import { draftDecisionContext } from "@/lib/ai/drafter";
import { timeAgo, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RefillPage({ params }: { params: { id: string } }) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM refills WHERE id = ${Number(params.id)}`;
  const refill = rows[0];
  if (!refill) notFound();

  const events = await sql`
    SELECT * FROM events WHERE refill_id = ${refill.id}
    ORDER BY created_at ASC, id ASC
  `;

  return (
    <>
      <p className="muted" style={{ marginBottom: 12 }}>
        <a href="/dashboard">← Work queue</a>
      </p>

      <div className="panel">
        <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Refill #{refill.id} — {refill.patient_name}
          <StatusBadge state={refill.status} />
        </h2>
        <dl className="kv">
          <dt>Medication</dt><dd>{refill.medication}</dd>
          <dt>Pharmacy</dt><dd>{refill.pharmacy || "Unknown"}</dd>
          <dt>Blocker</dt><dd>{refill.blocker || "—"}</dd>
          <dt>Last change</dt><dd>{timeAgo(refill.state_changed_at)} ({fmtTime(refill.state_changed_at)})</dd>
          <dt>Requested</dt><dd>{timeAgo(refill.created_at)}</dd>
        </dl>

        <div className="ai-box">
          <span className="label">AI triage — proposes, never decides</span>
          <div><b>{refill.ai_summary}</b></div>
          <div style={{ marginTop: 6 }}>
            Confidence:
            <div className="confidence-bar">
              <div style={{ width: `${Math.round((refill.confidence ?? 0) * 100)}%` }} />
            </div>
            <span className="muted">{Math.round((refill.confidence ?? 0) * 100)}%</span>
          </div>
          <div style={{ marginTop: 6 }}>Suggested action: {refill.ai_suggestion}</div>
        </div>

        <div className="ai-box" style={{ background: "#f8fafc", borderColor: "#e2e8f0", marginTop: 12 }}>
          <span className="label" style={{ color: "#475569" }}>Provider decision context (auto-drafted)</span>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, fontFamily: "inherit" }}>
            {draftDecisionContext(refill)}
          </pre>
        </div>
      </div>

      <DecisionPanel refillId={refill.id} state={refill.status} />

      <div className="panel">
        <h2>Timeline — every state change, every actor, every reason (audit trail)</h2>
        <ul className="timeline">
          {events.map((e: any) => (
            <li key={e.id} className={e.actor === "system" ? "system" : ""}>
              <div className="t-actor">{e.actor}{e.actor === "system" ? " · automated" : ""}</div>
              <div className="t-what">
                {e.from_state ? `${e.from_state} → ` : ""}<b>{e.to_state}</b>
              </div>
              {e.reason && <div className="t-reason">{e.reason}</div>}
              <div className="t-time">{fmtTime(e.created_at)}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
