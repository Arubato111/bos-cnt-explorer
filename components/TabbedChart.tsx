// components/TabbedChart.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type Gate = { ok:boolean; points:{t:number; close:number}[] };
type AdaS = { ok:boolean; points:{t:number; usd:number}[] };
type Range = "1h"|"24h"|"7d";
type Tab = "usdt"|"ada";

const USDT_CFG: Record<Range,{ interval:string; limit:number }> = {
  "1h": { interval: "1m", limit: 60 },
  "24h": { interval: "15m", limit: 96 },
  "7d": { interval: "1h", limit: 168 },
};

export default function TabbedChart(){
  const [tab,setTab]=useState<Tab>("usdt");
  const [range,setRange]=useState<Range>("1h");
  const [usdt,setUsdt]=useState<Gate|null>(null);
  const [ada,setAda]=useState<AdaS|null>(null);
  const [lastAdaUsd,setLastAdaUsd]=useState<number|null>(null);
  const [lastBosUsd,setLastBosUsd]=useState<number|null>(null);

  async function load(){
    // USDT series
    try{
      const cfg=USDT_CFG[range];
      const r=await fetch(`/api/gate/ohlc?interval=${cfg.interval}&limit=${cfg.limit}`,{cache:"no-store"});
      setUsdt(await r.json());
    }catch{ setUsdt({ok:false,points:[]} as any); }
    // ADA series (USD)
    try{
      const r=await fetch(`/api/market/ada/series?range=${range}`,{cache:"no-store"});
      const j:AdaS=await r.json(); setAda(j);
      const last=j?.points?.[j.points.length-1]?.usd ?? null; setLastAdaUsd(last ?? null);
    }catch{ setAda({ok:false,points:[]} as any); }
    // BOS USD (for derived info header)
    try{
      const r=await fetch("/api/market",{cache:"no-store"}); const j=await r.json();
      setLastBosUsd(j?.priceUsd ?? null);
    }catch{ setLastBosUsd(null); }
  }
  useEffect(()=>{ load(); },[range]);

  // Derived BOS/ADA series: take BOS/USDT close ∼ BOS/USD, divide by ADA/USD (interpolate by nearest time)
  const adaDerived = useMemo(()=>{
    if(!usdt?.ok || !ada?.ok) return [];
    const a = ada.points; const g = usdt.points;
    if(!a.length || !g.length) return [];
    return g.map(p=>{
      const t=p.t;
      // nearest ADA point by time
      let idx=0, best=Infinity;
      for(let i=0;i<a.length;i++){
        const d=Math.abs(a[i].t - t); if(d<best){best=d; idx=i;}
      }
      const adaUsd=a[idx].usd;
      const bosUsd=p.close; // treat as USD-ish since USDT peg
      const v=(adaUsd>0)?(bosUsd/adaUsd):null;
      return { t, v };
    }).filter(x=>x.v!=null) as {t:number; v:number}[];
  },[usdt,ada]);

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TabButton active={tab==="usdt"} onClick={()=>setTab("usdt")}>BOS/USDT</TabButton>
          <TabButton active={tab==="ada"} onClick={()=>setTab("ada")}>BOS/ADA</TabButton>
        </div>
        <div className="flex items-center gap-2">
          <RangeButton active={range==="1h"} onClick={()=>setRange("1h")}>1H</RangeButton>
          <RangeButton active={range==="24h"} onClick={()=>setRange("24h")}>24H</RangeButton>
          <RangeButton active={range==="7d"} onClick={()=>setRange("7d")}>7D</RangeButton>
        </div>
      </header>

      <Chart
        series={tab==="usdt"
          ? (usdt?.points?.map(p=>({t:p.t, v:p.close})) ?? [])
          : adaDerived}
        yLabel={tab==="usdt" ? "Price (USD/T)" : "Price (ADA)"}
        sourceLabel={tab==="usdt" ? "Source: Gate.io" : "Derived: BOS/USD ÷ ADA/USD (CoinGecko)"}
      />

      {tab==="ada" ? (
        <p className="text-xs text-white/60 mt-2">
          Until a native BOS/ADA pool is live on Cardano DEX, this series is derived from USD feeds.
          Latest BOS/USD: {lastBosUsd!=null?`$${lastBosUsd}`:"–"} · ADA/USD: {lastAdaUsd!=null?`$${lastAdaUsd}`:"–"}
        </p>
      ):null}
    </section>
  );
}

function TabButton({active,children,onClick}:{active:boolean;children:any;onClick:()=>void}){
  return <button onClick={onClick} className={`px-3 py-1 rounded-lg ${active?"bg-white/20":"bg-white/10 hover:bg-white/15"}`}>{children}</button>;
}
function RangeButton({active,children,onClick}:{active:boolean;children:any;onClick:()=>void}){
  return <button onClick={onClick} className={`px-2 py-1 rounded ${active?"bg-white/20":"bg-white/10 hover:bg-white/15"}`}>{children}</button>;
}

function Chart({series,yLabel,sourceLabel}:{series:{t:number;v:number}[]; yLabel:string; sourceLabel:string}){
  // Render as simple SVG with axes, grid, tooltip
  const [hover,setHover]=useState<{x:number;y:number;label:string;v:number}|null>(null);
  const w=720,h=260,pad=40;
  const xs = series.map(p=>p.t), ys=series.map(p=>p.v);
  const mn = ys.length?Math.min(...ys):0, mx = ys.length?Math.max(...ys):1;
  const span = mx - mn || 1;
  const path = series.map((p,i)=>{
    const x = pad + ((p.t - xs[0])/(xs[xs.length-1]-xs[0]||1))*(w-2*pad);
    const y = pad + (h-2*pad)*(1-(p.v - mn)/span);
    return `${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  function fmt(n:number, f=6){ return new Intl.NumberFormat("en-US",{maximumFractionDigits:f}).format(n); }

  return (
    <div className="mt-3 relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[280px]"
           onMouseMove={(e)=>{
             if(!series.length) return;
             const rect=(e.target as SVGElement).closest("svg")!.getBoundingClientRect();
             const rx=e.clientX-rect.left;
             const ratio=Math.min(1,Math.max(0,(rx-pad)/(w-2*pad)));
             const idx=Math.round(ratio*(series.length-1));
             const p=series[idx];
             const x=pad+ratio*(w-2*pad);
             const y=pad+(h-2*pad)*(1-(p.v - mn)/span);
             setHover({x,y,label:new Date(p.t).toLocaleString(),v:p.v});
           }}
           onMouseLeave={()=>setHover(null)}
      >
        {/* grid */}
        <g stroke="currentColor" opacity="0.15">
          {Array.from({length:5},(_,i)=>(
            <line key={i} x1={pad} x2={w-pad} y1={pad+i*(h-2*pad)/4} y2={pad+i*(h-2*pad)/4}/>
          ))}
        </g>
        {/* axes */}
        <g stroke="currentColor" opacity="0.3">
          <line x1={pad} y1={pad} x2={pad} y2={h-pad}/>
          <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad}/>
        </g>
        {/* y ticks */}
        <g fill="currentColor" opacity="0.6" fontSize="10">
          {Array.from({length:5},(_,i)=> {
            const yy=pad+i*(h-2*pad)/4;
            const val=mn + (span*i)/4;
            return <text key={i} x={6} y={yy+3}>{fmt(val,6)}</text>;
          })}
          <text x={6} y={14}>{yLabel}</text>
        </g>
        {/* line */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2}/>
        {/* hover */}
        {hover && <>
          <line x1={hover.x} x2={hover.x} y1={pad} y2={h-pad} stroke="currentColor" opacity="0.35"/>
          <circle cx={hover.x} cy={hover.y} r={3} fill="currentColor"/>
        </>}
      </svg>
      <div className="mt-1 text-xs text-white/60">{sourceLabel}</div>
      {hover && (
        <div className="absolute px-2 py-1 rounded bg-black/70 text-xs" style={{left:Math.max(0,hover.x-60), top:Math.max(0,hover.y-30)}}>
          <div>{hover.label}</div>
          <div className="font-mono">{fmt(hover.v,6)}</div>
        </div>
      )}
    </div>
  );
}
