import Link from "next/link";

const metrics = [
  ["Time to resolution", "Track median time from intake to filled or appropriately closed."],
  ["Stalled refill rate", "See which requests are waiting and why before patients chase the office."],
  ["Staff touches / refill", "Measure how much manual coordination each refill consumes."],
  ["AI auto-triage rate", "Measure requests classified confidently without unnecessary escalation."],
  ["Escalation rate", "Monitor the share of cases that require human intervention."],
  ["Request → pharmacy", "Track how quickly approved prescriptions reach fulfillment."],
  ["Fill confirmation rate", "Verify that sent prescriptions actually become filled."],
  ["Patient notification rate", "Measure whether patients receive timely workflow updates."],
];

const security = [
  ["Server-side RBAC", "Role permissions are enforced by the state machine on the server, not trusted from the UI."],
  ["Fail-safe AI", "AI proposes a blocker; confidence guardrails route uncertain cases to people instead of guessing."],
  ["Audit trail", "State changes record actor, transition, reason, and timestamp for operational traceability."],
  ["Least privilege", "Staff coordinate operational work while provider-only clinical decisions remain restricted."],
  ["Secrets outside code", "Database and model credentials are supplied through managed deployment environment variables."],
  ["PHI-aware architecture", "The prototype keeps the workflow focused on minimum necessary refill context and separates automation from prescribing authority."],
];

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">REFILL OPERATIONS PLATFORM</div>
          <h1>Turn every stuck refill into a clear next action.</h1>
          <p className="hero-lead">
            RefillEngine gives physician groups a shared workflow for triage, staff coordination,
            provider decisions, pharmacy verification, and patient updates — without letting AI make clinical decisions.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" href="/login?role=staff">Login as Staff</Link>
            <Link className="btn outline" href="/login?role=provider">Login as Provider</Link>
          </div>
          <div className="trust-row">
            <span>✓ State-machine guardrails</span>
            <span>✓ Human-in-the-loop</span>
            <span>✓ Full audit trail</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="window-bar"><span /><span /><span /></div>
          <div className="workflow-card">
            <div className="mini-label">LIVE WORKFLOW</div>
            <div className="flow-step active"><b>01</b><span>AI identifies blocker</span><strong>93%</strong></div>
            <div className="flow-line" />
            <div className="flow-step"><b>02</b><span>Right owner gets task</span><strong>Staff</strong></div>
            <div className="flow-line" />
            <div className="flow-step"><b>03</b><span>Provider authorizes</span><strong>Human</strong></div>
            <div className="flow-line" />
            <div className="flow-step"><b>04</b><span>Pharmacy fill verified</span><strong>✓</strong></div>
          </div>
        </div>
      </section>

      <section className="section problem-section">
        <div className="section-kicker">THE OPERATIONS GAP</div>
        <h2>A refill can be clinically simple and operationally stuck.</h2>
        <p className="section-intro">The product is designed for physician groups and outpatient practices where refill volume creates repetitive coordination work.</p>
        <div className="three-cards">
          <article><span className="icon">01</span><h3>Find the blocker</h3><p>Normalize fax, portal, and pharmacy requests into a structured state with a reason and confidence.</p></article>
          <article><span className="icon">02</span><h3>Route the work</h3><p>Staff handle operational blockers; providers retain authority over clinical decisions.</p></article>
          <article><span className="icon">03</span><h3>Close the loop</h3><p>Verify pharmacy fulfillment instead of treating transmission as success, then keep the patient informed.</p></article>
        </div>
      </section>

      <section className="section metrics-section">
        <div className="section-kicker">CUSTOMER VALUE</div>
        <h2>Measure the refill operation, not just the AI.</h2>
        <p className="section-intro">These are the operational signals a practice can use to prove value, improve staffing, and identify workflow bottlenecks.</p>
        <div className="metric-grid">
          {metrics.map(([title, desc]) => <article className="metric-card" key={title}><h3>{title}</h3><p>{desc}</p></article>)}
        </div>
      </section>

      <section className="section security-section">
        <div className="section-kicker">SECURITY & TRUST</div>
        <h2>Automation with explicit boundaries.</h2>
        <p className="section-intro">Security is part of the workflow design: the system should make the safe path the easy path.</p>
        <div className="security-grid">
          {security.map(([title, desc]) => <article className="security-card" key={title}><div className="security-check">✓</div><div><h3>{title}</h3><p>{desc}</p></div></article>)}
        </div>
      </section>

      <section className="section funnel-section">
        <div className="section-kicker">GO-TO-MARKET</div>
        <h2>Built for the practice, not just the prototype.</h2>
        <div className="funnel-grid">
          <div><b>Awareness</b><span>Operations teams see where refill work stalls.</span></div>
          <div><b>Pilot</b><span>Connect one practice workflow and baseline refill metrics.</span></div>
          <div><b>Adoption</b><span>Expand across refill staff, providers, and pharmacy workflows.</span></div>
          <div><b>Expansion</b><span>Use resolution, labor, and fulfillment data to prove ROI.</span></div>
        </div>
        <div className="customer-strip"><b>Primary customer:</b> mid-sized physician groups & outpatient practices <span>•</span> <b>Daily users:</b> refill staff + providers <span>•</span> <b>Beneficiary:</b> patient</div>
      </section>

      <section className="cta-section">
        <div><div className="section-kicker">READY TO DEMO</div><h2>Start with the work queue.</h2><p>Choose the role that matches the workflow you want to demonstrate.</p></div>
        <div className="hero-actions"><Link className="btn primary" href="/login?role=staff">Staff workspace</Link><Link className="btn outline" href="/login?role=provider">Provider workspace</Link></div>
      </section>
    </div>
  );
}
