"use client";
import {useRouter} from "next/navigation";
export default function RoleSwitcher({user}:{user:{name:string;role:string}}){const router=useRouter(); async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.push('/');router.refresh()} return <div className="user-menu"><span>{user.name} · {user.role}</span><button className="small" onClick={logout}>Sign out</button></div>}
