"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { allowedActions, type State } from "@/lib/core/state-machine";

export default function DecisionPanel({ refillId, state, role }: { refillId: number; state: string; role: string }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  const actions = allowedActions(state as State, role);
  async function act(to: string) {
    if (busy) return; setBusy(true); setError("");
    try { const res = await fetch(`/api/refills/${refillId}/decision`, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:to,note})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||"Action failed"); setNote(""); router.refresh(); }
    catch(err:any){setError(err.message)} finally{setBusy(false)}
  }
  if (!actions.length) return <div className="panel muted">No actions available as <b>{role}</b> from state <b>{state}</b>.</div>;
  const buttonClass=(to:string)=>to==="APPROVED"?"good":to==="DENIED"||to==="ESCALATED"?"danger":"";
  return <div className="panel"><h2>Decide — acting as {role}</h2><div className="muted">Every action is validated by the state machine and logged to the audit trail.</div><textarea className="note" placeholder="Clinical note / reason (goes in the audit trail)…" value={note} onChange={e=>setNote(e.target.value)}/><div className="decision-actions">{actions.map(t=><button key={t.to} className={buttonClass(t.to)} disabled={busy} onClick={()=>act(t.to)}>{t.label}</button>)}</div>{error&&<div className="error-box">{error}</div>}</div>;
}
