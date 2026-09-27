import Link from "next/link";
import { redirect } from "next/navigation";
import { getSql } from "@/lib/db/client";
import { getSession } from "@/lib/auth";
import IntakeForm from "@/components/IntakeForm";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/format";
import AnalyticsPanel from "@/components/AnalyticsPanel";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["all", "All"], ["triaged", "Needs triage"], ["provider", "With provider"], ["blocked", "Blocked"], ["sent", "In fulfillment"], ["escalated", "Escalated"], ["done", "Done"]];
const GROUPS: Record<string, string[]> = { all: [], triaged: ["TRIAGED"], provider: ["PENDING_DECISION"], blocked: ["NEEDS_VISIT", "NEEDS_INFO", "INSURANCE_BLOCK"], sent: ["APPROVED", "SENT_TO_PHARMACY"], escalated: ["ESCALATED"], done: ["FILLED", "DENIED"] };

function MarketingLanding() {
  return <main className="landing">
    <section className="landing-nav">
      <div className="brand landing-brand"><span className="brand-mark">R</span><span>Refill<span>Engine</span></span><small>REFILL COORDINATION OS</small></div>
      <div className="landing-nav-actions"><a href="#how-it-works">How it works</a><a href="#security">Security</a><a href="#value">Business value</a><Link className="nav-login" href="/login">Sign in</Link></div>
    </section>

    <section className="landing-hero">
      <div className="hero-content">
        <div className="eyebrow">BUILT FOR PHYSICIAN GROUPS &amp; PHARMACY TEAMS</div>
        <h1>Turn stuck prescription refills into <span>owned, visible workflows.</span></h1>
        <p className="hero-lead">Refill Engine coordinates every request from intake to pharmacy verification—identifying blockers, routing work to the right person, and keeping an auditable trail of what happened next.</p>
        <div className="hero-actions"><Link className="primary-cta" href="/login">Enter secure workspace <span>→</span></Link><a className="secondary-cta" href="#how-it-works">See how it works</a></div>
        <div className="hero-trust"><span>✓ AI-assisted triage</span><span>✓ Human clinical decisions</span><span>✓ Audit-ready workflow</span></div>
      </div>
      <div className="hero-product-card">
        <div className="product-window-top"><span>REFILL ENGINE</span><span className="live-dot">● LIVE OPERATIONS</span></div>
        <div className="mini-metrics"><div><small>Open requests</small><b>24</b></div><div><small>Auto-triaged</small><b>87%</b></div><div><small>Escalated</small><b>3</b></div></div>
        <div className="mini-row"><span className="mini-avatar">MA</span><div><b>Mary Alvarez</b><small>Metformin · CVS</small></div><em className="mini-status amber">Provider review</em></div>
        <div className="mini-row"><span className="mini-avatar">RO</span><div><b>Robert Chen</b><small>Atorvastatin · Walgreens</small></div><em className="mini-status orange">Visit needed</em></div>
        <div className="mini-row"><span className="mini-avatar">TO</span><div><b>Tom Baker</b><small>Albuterol · Walgreens</small></div><em className="mini-status green">Verifying fill</em></div>
        <div className="mini-ai"><span>✦</span><div><b>AI triage complete</b><small>3 blockers identified · 1 low-confidence case escalated</small></div></div>
      </div>
    </section>

    <section className="proof-strip" id="value">
      <div><b>One queue</b><span>for every refill request</span></div><div><b>Clear ownership</b><span>for every blocker</span></div><div><b>Human-in-the-loop</b><span>for clinical decisions</span></div><div><b>Verification</b><span>before “resolved”</span></div>
    </section>

    <section className="landing-section" id="how-it-works">
      <div className="section-kicker">THE WORKFLOW</div><h2>From refill request to resolution.</h2><p className="section-lead">The product turns an unstructured refill request into a controlled workflow with explicit states, owners, decisions, and verification.</p>
      <div className="workflow-grid">
        {[['01','Capture','Collect the request, patient context, pharmacy and medication details.'],['02','Triage','AI classifies the likely blocker and proposes the next action with confidence.'],['03','Route','Send the work to staff, provider, insurance workflow or patient follow-up.'],['04','Decide','Authorized humans make clinical decisions; the system records the reasoning.'],['05','Verify','Confirm the pharmacy outcome instead of treating “sent” as “solved.”']].map(([n,t,d])=><div className="workflow-card" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}
      </div>
    </section>

    <section className="landing-section split-section">
      <div><div className="section-kicker">WHY IT MATTERS</div><h2>Make refill operations measurable.</h2><p className="section-lead">Instead of chasing faxes, messages and pharmacy callbacks across disconnected workflows, practice leaders get a shared operational view.</p><div className="benefit-list"><div><b>Reduce manual triage</b><span>Surface the blocker before staff spend time investigating.</span></div><div><b>Shorten time-to-resolution</b><span>Route the next action immediately instead of letting requests sit.</span></div><div><b>Protect clinical judgment</b><span>AI recommends; authorized providers remain responsible for clinical decisions.</span></div><div><b>Prove what happened</b><span>State changes, decisions and communication stay in one audit trail.</span></div></div></div>
      <div className="value-card"><div className="value-card-label">WHAT PRACTICE LEADERS CAN MEASURE</div><div className="value-number">Time-to-resolution</div><div className="value-line"><span>Requests received</span><b>↑</b></div><div className="value-line"><span>Auto-triage rate</span><b>↑</b></div><div className="value-line"><span>Stalled requests</span><b>↓</b></div><div className="value-line"><span>Staff touches / refill</span><b>↓</b></div><div className="value-line"><span>Verified fills</span><b>↑</b></div></div>
    </section>

    <section className="landing-section dark-section" id="security">
      <div className="section-kicker light">SECURITY &amp; CONTROL</div><h2>Designed for sensitive healthcare workflows.</h2><p className="section-lead light-copy">The prototype separates access, decisions and auditability. Production deployment would add the organization-specific compliance, identity and contractual controls required for healthcare use.</p>
      <div className="security-cards"><div><b>Server-side RBAC</b><span>Staff and provider permissions are enforced on the server.</span></div><div><b>Protected sessions</b><span>Passwords are hashed and sessions use secure HttpOnly cookies.</span></div><div><b>Audit trail</b><span>Workflow actions and patient communication are recorded.</span></div><div><b>Least exposure</b><span>Secrets stay in deployment environment variables, never the browser.</span></div></div>
      <div className="security-note">Security-conscious prototype · Not a claim of HIPAA compliance</div>
    </section>

    <section className="landing-section funnel-section">
      <div className="section-kicker">CUSTOMER JOURNEY</div><h2>A simple path from awareness to adoption.</h2>
      <div className="funnel-grid"><div><strong>01</strong><b>Discover</b><span>Practice leaders see the refill bottleneck and operational cost.</span></div><div><strong>02</strong><b>Pilot</b><span>Connect one refill team and measure baseline workflow metrics.</span></div><div><strong>03</strong><b>Adopt</b><span>Expand across providers, locations and refill volume.</span></div><div><strong>04</strong><b>Expand</b><span>Use workflow analytics to identify the next operational bottleneck.</span></div></div>
    </section>

    <section className="landing-cta"><div><div className="section-kicker light">READY TO SEE THE WORKSPACE?</div><h2>Give every refill a next action.</h2><p>Explore the operations workspace with the hackathon demo environment.</p></div><Link className="primary-cta light-cta" href="/login">Open secure workspace →</Link></section>
    <footer className="landing-footer"><span>RefillEngine</span><span>AI-assisted refill coordination for physician groups</span><Link href="/login">Staff &amp; Provider Login</Link></footer>
  </main>;
}

export default async function QueuePage({ searchParams }: { searchParams: { status?: string; view?: string } }) {
  const user = getSession();
  if (!user) return <MarketingLanding />;
  if (searchParams.view === "analytics") return <AnalyticsPanel />;
  const sql = getSql();
  const all = await sql`SELECT * FROM refills ORDER BY state_changed_at DESC`;
  const active = searchParams.status || "all";
  const inGroup = (s: string) => { const g = GROUPS[active] || []; return !g.length || g.includes(s); };
  const countFor = (k: string) => all.filter(r => { const g = GROUPS[k] || []; return !g.length || g.includes(r.status); }).length;
  return <><div className="page-intro"><div><div className="eyebrow">{user.role.toUpperCase()} WORK QUEUE</div><h1>Prescription refill operations</h1><p className="muted large">Every request has a state, blocker, owner and audit trail.</p></div><div className="trust-chip">AI proposes · humans decide</div></div>{user.role === "staff" && <IntakeForm />}<div className="tabs">{TABS.map(([key, label]) => <Link key={key} href={key === "all" ? "/" : `/?status=${key}`} className={active === key ? "active" : ""}>{label}<span className="count">{countFor(key)}</span></Link>)}</div><table className="queue"><thead><tr><th>Patient</th><th>Medication</th><th>Pharmacy</th><th>State</th><th>Blocker</th><th>AI conf.</th><th>Data</th><th>Updated</th></tr></thead><tbody>{all.filter(r => inGroup(r.status)).map((r: any) => <tr key={r.id}><td><Link href={`/refill/${r.id}`}><b>#{r.id}</b> {r.patient_name}</Link></td><td>{r.medication}</td><td>{r.pharmacy || "—"}</td><td><StatusBadge state={r.status} /></td><td className="muted">{r.blocker || "—"}</td><td>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}</td><td><span className={r.is_demo ? "demo-pill" : "live-pill"}>{r.is_demo ? "DEMO" : "LIVE"}</span></td><td className="muted">{timeAgo(r.state_changed_at)}</td></tr>)}{all.filter(r => inGroup(r.status)).length === 0 && <tr><td colSpan={8} className="muted" style={{ textAlign: "center" }}>Nothing here.</td></tr>}</tbody></table></>;
}
