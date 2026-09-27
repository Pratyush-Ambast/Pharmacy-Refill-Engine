"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoleSwitcher() {
  const pathname = usePathname();
  const [role, setRole] = useState("staff");

  useEffect(() => setRole(localStorage.getItem("demo-role") || "staff"), []);

  if (pathname === "/" || pathname === "/login") {
    return <Link className="header-login" href="/login">Staff / Provider Login</Link>;
  }

  return (
    <label className="role-switch">
      Workspace:
      <select value={role} onChange={(e) => { setRole(e.target.value); localStorage.setItem("demo-role", e.target.value); window.location.reload(); }}>
        <option value="staff">Staff</option>
        <option value="provider">Provider</option>
      </select>
    </label>
  );
}
