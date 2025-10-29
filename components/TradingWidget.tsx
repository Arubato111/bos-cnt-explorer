// components/TradingWidget.tsx
"use client";
import { useEffect, useState } from "react";
import PriceChart from "./PriceChart";

type Ticker = { ok: boolean; price?: number|null; volBOS?: number|null; volUSDT?: number|null; pair?: string; exchange?: string; changePct?: number|null; };

function money(n:number|null|undefined, frac=6){ if(n==null) return "Not available yet"; return `$${new Intl.NumberFormat("en-US",{maximumFractionDigits:frac}).format(n)}`; }
function num(n:number|null|undefined, frac=2){ if(n==null) return "Not available yet"; return new Intl.NumberFormat("en-US",{maximumFractionDigits:frac}).format(n); }

export default function TradingWidget() {
  const [tk, setTk] = useState<Ticker|null>(null);

  async function load() {
    try { const r = await fetch("/api/gate/ticker", { cache: "no-store" }); setTk(await r.json()); } catch { setTk({ok:false}); }
  }
  useEffect(() => { load(); const id=setInterval(load, 15000); return()=>clearInterval(id); }, []);

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Gate.io – {tk?.pair ?? "BOS/USDT"} (CNT)</h2>
        <div className="text-xs text-white/60">Auto-refresh: 15s</div>
      </header>

      <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
        <Card label="Last Price (USD)" value={money(tk?.price ?? null, 6)} />
        <Card label="24h Volume (USDT)" value={money(tk?.volUSDT ?? null, 0)} />
        <Card label="24h Volume (BOS)" value={`${num(tk?.volBOS ?? null, 0)} BOS`} />
      </div>

      <div className="mt-3">
        <PriceChart />
      </div>

      <div className="mt-3 text-sm">
        <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href="https://www.gate.io/trade/BOS_USDT">Trade on Gate.io</a>
      </div>

      <p className="mt-3 text-xs text-white/60">
        Gate.io currently lists two BOS token standards: <strong>ERC-20</strong> and <strong>CNT</strong>. This dashboard uses the <strong>CNT</strong> market because Gate.io is currently the only centralized venue for BOS-CNT. As soon as on-chain CNT data is available on Cardano, we will switch on those metrics live.
      </p>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
