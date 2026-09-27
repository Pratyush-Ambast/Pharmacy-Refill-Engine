"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const accounts = {
  staff: { label: "Staff", email: "staff@demo.local", password: "StaffDemo!2026", description: "Manage intake, blockers, patient follow-up and refill operations." },
  provider: { label: "Provider", email: "provider@demo.local", password: "ProviderDemo!2026", description: "Review clinical cases and make authorized prescription decisions." }
};

export default function LoginPage() {
  const [role, setRole] = useState<"staff" | "provider">("staff");
  const [email, setEmail] = useState(accounts.staff.email);
  const [password, setPassword] = useState(accounts.staff.password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const choose = (next: "staff" | "provider") => { setRole(next); setEmail(accounts[next].email); setPassword(accounts[next].password); setError(""); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Login failed"); setBusy(false); return; }
      router.replace("/?view=workspace"); router.refresh();
    } catch { setError("Could not reach the authentication service."); setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-back"><Link href="/">← Back to RefillEngine</Link></div><div className="auth-layout"><div className="auth-copy"><div className="eyebrow">SECURE WORKSPACE</div><h1>Welcome back.</h1><p>Choose your workspace and continue managing prescription refill requests with clear ownership, guardrails and auditability.</p><div className="auth-points"><span>✓ Server-side role permissions</span><span>✓ Protected session cookies</span><span>✓ Full workflow audit trail</span></div></div><div className="login-card"><div className="eyebrow">SIGN IN</div><h2>Choose your workspace</h2><div className="role-cards">{(["staff", "provider"] as const).map(r => <button key={r} type="button" className={`role-card ${role === r ? "selected" : ""}`} onClick={() => choose(r)}><span className="role-icon">{r === "staff" ? "S" : "P"}</span><span><b>{accounts[r].label}</b><small>{accounts[r].description}</small></span></button>)}</div><form onSubmit={submit} className="login-form"><label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required /></label><label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label><button className="primary-submit" disabled={busy}>{busy ? "Signing in…" : `Sign in as ${accounts[role].label}`}</button>{error && <div className="error-box">{error}</div>}</form><div className="demo-credentials"><b>Hackathon demo</b><br />Credentials are prefilled for the selected role. In production, accounts would be provisioned through the organization’s identity system.</div></div></div></main>;
}
