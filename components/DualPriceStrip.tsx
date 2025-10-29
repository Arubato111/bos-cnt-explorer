// components/DualPriceStrip.tsx
"use client";
import { useEffect, useState } from "react";

type Tkr = { ok:boolean; price?:number|null; volUSDT?:number|null; volBOS?:number|null; };
type Ada = { ok:boolean; adaUsd?:number|null };
type Mkt = { ok:boolean; priceUsd?:number|null } | { ok:false };

function money(n:number|null|undefined, f=6){ if(n==null) return "Not available yet"; return `$${new Intl.NumberFormat("en-US",{maximumFractionDigits:f}).format(n)}`; }
function num(n:number|null|undefined, f=2){ if(n==null) return "Not available yet"; return new Intl.NumberFormat("en-US",{maximumFractionDigits:f}).format(n); }

export default function DualPriceStrip(){
  const [gate, setGate] = useState<Tkr|null>(null);
  const [ada, setAda] = useState<Ada|null>(null);
  const [bosUsd, setBosUsd] = useState<number|null>(null);

  async function load(){
    try{ const r=await fetch("/api/gate/ticker",{cache:"no-store"}); const j:any=await r.json(); setGate(j); }catch{ setGate({ok:false}); }
    try{ const r=await fetch("/api/market/ada",{cache:"no-store"}); const j:any=await r.json(); setAda(j); }catch{ setAda({ok:false}); }
    try{ const r=await fetch("/api/market",{cache:"no-store"}); const j:Mkt=await r.json(); setBosUsd(("ok" in j && j.ok) ? (j as any).priceUsd ?? null : null); }catch{ setBosUsd(null); }
  }
  useEffect(()=>{ load(); const id=setInterval(load,15000); return()=>clearInterval(id); },[]);

  const bosUsdt = gate?.price ?? null;
  const adaUsd = ada?.adaUsd ?? null;
  const bosAda = (bosUsd!=null && adaUsd!=null && adaUsd>0) ? (bosUsd/adaUsd) : null;

  return (
    <section className="grid md:grid-cols-2 gap-4">
      <Tile
        title="BOS/USDT (CNT)"
        value={money(bosUsdt, 6)}
        subLeft={`24h Vol (USDT): ${money(gate?.volUSDT ?? null, 0)}`}
        subRight={`24h Vol (BOS): ${num(gate?.volBOS ?? null, 0)} BOS`}
        badge="Source: Gate.io"
        link={{ href:"https://www.gate.io/trade/BOS_USDT", label:"Trade" }}
      />
      <Tile
        title="BOS/ADA"
        value={num(bosAda, 6)}
        subLeft={`BOS/USD: ${money(bosUsd, 6)}`}
        subRight={`ADA/USD: ${money(adaUsd, 6)}`}
        badge="Derived from USD feeds (CoinGecko)"
      />
    </section>
  );
}

function Tile({ title, value, subLeft, subRight, badge, link }:{
  title:string; value:string; subLeft?:string; subRight?:string; badge?:string; link?:{href:string;label:string}
}){
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        {badge ? <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">{badge}</span> : null}
      </div>
      <div className="mt-1 text-2xl">{value}</div>
      <div className="mt-1 text-xs text-white/70 flex items-center justify-between gap-3">
        <span className="truncate">{subLeft ?? "\u00A0"}</span>
        <span className="truncate">{subRight ?? "\u00A0"}</span>
      </div>
      {link ? (
        <div className="mt-2 text-sm">
          <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href={link.href}>{link.label}</a>
        </div>
      ) : null}
    </div>
  );
}
