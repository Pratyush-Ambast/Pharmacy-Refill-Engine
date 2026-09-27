"use client";

// DEMO AUTH: role is a client-side switch sent as a header.
// This is deliberately visible — the guardrails live server-side
// (canTransition), and README documents the production path (Clerk + RBAC).
export function getRole(): string {
  if (typeof window === "undefined") return "staff";
  return localStorage.getItem("demo-role") || "staff";
}
