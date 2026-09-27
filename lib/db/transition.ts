import { getSql } from "./client";
import { logPatientNotification, statusMessage } from "../notify";

export async function recordTransition(refillId:number, from:string|null, to:string, actor:string, reason:string|null, payload:any=null):Promise<void>{
  const sql=getSql();
  const current=await sql`SELECT status, patient_name, medication FROM refills WHERE id=${refillId}`;
  if(!current.length) throw new Error("Refill not found");
  if(from && current[0].status!==from) throw new Error(`STALE_STATE: refill is ${current[0].status}, not ${from}`);
  const updated=await sql`UPDATE refills SET status=${to},state_changed_at=now() WHERE id=${refillId} AND status=${from || current[0].status} RETURNING id`;
  if(!updated.length) throw new Error(`STALE_STATE: refill changed before this action was committed`);
  await sql`INSERT INTO events(refill_id,from_state,to_state,actor,reason,payload) VALUES(${refillId},${from},${to},${actor},${reason},${payload})`;
  await logPatientNotification({id:refillId,patient_name:current[0].patient_name,medication:current[0].medication},statusMessage(to,current[0].medication),"automatic",actor);
}
