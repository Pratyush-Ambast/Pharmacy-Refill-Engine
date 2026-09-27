"use client";

import { useEffect, useState } from "react";

// Demo auth: pick a role; it travels as the x-demo-role header on
// decision calls, where the state machine enforces it server-side.
export default function RoleSwitcher() {
  const [role, setRole] = useState("staff");

  useEffect(() => {
    setRole(localStorage.getItem("demo-role") || "staff");
  }, []);

  return (
    <label className="role-switch">
      Demo role:
      <select
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          localStorage.setItem("demo-role", e.target.value);
        }}
      >
        <option value="staff">Staff</option>
        <option value="provider">Provider</option>
      </select>
    </label>
  );
}
