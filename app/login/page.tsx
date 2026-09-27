"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("staff");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("role");
    if (requested === "provider" || requested === "staff") setRole(requested);
  }, []);

  function enter() {
    localStorage.setItem("demo-role", role);
    router.push("/dashboard");
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="eyebrow">SECURE DEMO ACCESS</div>
        <h1>Choose your workspace</h1>
        <p className="login-subtitle">This hackathon demo uses role-based access to demonstrate least-privilege workflow boundaries.</p>
        <div className="role-cards">
          <button className={`role-card ${role === "staff" ? "selected" : ""}`} onClick={() => setRole("staff")}>
            <span className="role-icon">S</span><span><b>Staff</b><small>Coordinate operational blockers, information, insurance and routing.</small></span>
          </button>
          <button className={`role-card ${role === "provider" ? "selected" : ""}`} onClick={() => setRole("provider")}>
            <span className="role-icon">P</span><span><b>Provider</b><small>Review clinical context and authorize or decline refill decisions.</small></span>
          </button>
        </div>
        <button className="btn primary full" onClick={enter}>Continue as {role === "staff" ? "Staff" : "Provider"} →</button>
        <div className="login-security"><b>Security boundary</b><span>Role permissions are checked again on the server. The browser selection is never trusted as authorization.</span></div>
      </div>
    </main>
  );
}
