// components/SearchBar.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const isHex64 = (s:string)=>/^[0-9a-f]{64}$/i.test(s);
const isAddr = (s:string)=>/^addr1[0-9a-z]+$/i.test(s);

export default function SearchBar(){
  const [q,setQ]=useState("");
  const r = useRouter();
  function go(e:React.FormEvent){ e.preventDefault();
    const s=q.trim();
    if(isHex64(s)) r.push(`/tx/${s}`);
    else if(isAddr(s)) r.push(`/address/${s}`);
    else r.push(`/token`); // fallback
  }
  return (
    <form onSubmit={go} className="w-full">
      <input
        value={q}
        onChange={e=>setQ(e.target.value)}
        placeholder="Search by address (Cardano) or transaction hash…"
        className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/15 outline-none focus:border-[#66a3ff]"
      />
    </form>
  );
}
