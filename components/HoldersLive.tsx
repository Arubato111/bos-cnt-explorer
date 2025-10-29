// components/HoldersLive.tsx
"use client";
import { useEffect, useState } from "react";

type RespOK = { ok: true; decimals: number; totalHolders: number; circulating: number; top: { address: string; raw: number; scaled: number }[]; };
type Resp = RespOK | { ok: false };

function fmt(n:number|null|undefined, f=2){ if(n==null) return "Not available yet"; return new Intl.NumberFormat("en-US",{maximumFractionDigits:f}).format(n); }

export default function HoldersLive() {
  const [d,setD]=useState<Resp|null>(null);
  async function load(){ try{ const r=await fetch("/api/holders",{cache:"no-store"}); setD(await r.json()); }catch{ setD({ok:false} as any); } }
  useEffect(()=>{ load(); const id=setInterval(load,30000); return()=>clearInterval(id); },[]);
  const ok = !!(d && "ok" in d && d.ok);
  const v = ok ? (d as RespOK) : null;

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10">
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-medium">Top 10 Holders (live)</h2>
        <div className="text-xs text-white/60">Auto-refresh: 30s • Source: Koios</div>
      </header>
      <div className="p-4 grid md:grid-cols-3 gap-4 text-sm">
        <Card label="Total holder wallets" value={ok ? fmt(v.totalHolders,0) : "Not available yet"} />
        <Card label="Circulating (BOS)" value={ok ? `${fmt(v.circulating,0)} BOS` : "Not available yet"} />
        <Card label="Decimals" value={ok ? String(v.decimals) : "Not available yet"} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            <tr className="text-left">
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Balance (BOS)</th>
              <th className="px-4 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {ok && v.top.length>0 ? v.top.map(h=>(
              <tr key={h.address} className="border-t border-white/10">
                <td className="px-4 py-2 truncate"><a className="text-[#66a3ff] hover:underline" href={`/address/${h.address}`}>{h.address}</a></td>
                <td className="px-4 py-2">{fmt(h.scaled,2)}</td>
                <td className="px-4 py-2"><a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href={`https://cardanoscan.io/address/${h.address}`}>Cardanoscan</a></td>
              </tr>
            )):(
              <tr><td className="px-4 py-4 text-white/60" colSpan={3}>Not available yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Card({label,value}:{label:string;value:string}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
