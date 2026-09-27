"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntakeForm() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!raw.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Intake failed");
      setRaw("");
      router.push(`/refill/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h2>New refill intake — paste a fax, portal message, or e-prescribe request</h2>
      <form className="intake-form" onSubmit={submit}>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="e.g. Pharmacy fax: John Doe requests refill of Lisinopril 10mg. 0 refills remaining. Patient stable, last visit 2 months ago…"
        />
        <div className="intake-actions">
          <button type="submit" disabled={busy}>{busy ? "Classifying…" : "Intake & classify"}</button>
          <span className="muted">AI proposes a triage state — guardrails decide; humans act.</span>
        </div>
        {error && <div className="error-box">{error}</div>}
      </form>
    </div>
  );
}
