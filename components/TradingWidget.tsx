// components/TradingWidget.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type Ticker = { ok: boolean; price?: number|null; volBOS?: number|null; volUSDT?: number|null; pair?: string; exchange?: string; changePct?: number|null; };
type Ohlc = { ok: boolean; points: { t:number; close:number }[] };

function money(n:number|null|undefined, frac=6){ if(n==null) return "Not available yet"; return `$${new Intl.NumberFormat("en-US",{maximumFractionDigits:frac}).format(n)}`; }
function num(n:number|null|undefined, frac=2){ if(n==null) return "Not available yet"; return new Intl.NumberFormat("en-US",{maximumFractionDigits:frac}).format(n); }

export default function TradingWidget() {
  const [tk, setTk] = useState<Ticker|null>(null);
  const [oh, setOh] = useState<Ohlc|null>(null);

  async function load() {
    try { const r = await fetch("/api/gate/ticker", { cache: "no-store" }); setTk(await r.json()); } catch { setTk({ok:false}); }
    try { const r2 = await fetch("/api/gate/ohlc", { cache: "no-store" }); setOh(await r2.json()); } catch { setOh({ok:false, points:[]}); }
  }
  useEffect(() => { load(); const id=setInterval(load, 15000); return()=>clearInterval(id); }, []);

  const pts = oh?.points ?? [];
  const { path, last, min, max } = useMemo(() => {
    if (!pts.length) return { path: "", last: null, min: 0, max: 0 };
    const w = 420, h = 120, pad = 6;
    const closes = pts.map(p=>p.close);
    const mn = Math.min(...closes), mx = Math.max(...closes);
    const span = mx - mn || 1;
    const step = (w - pad*2) / Math.max(1, pts.length - 1);
    const d = pts.map((p,i) => {
      const x = pad + i*step;
      const y = pad + (h - pad*2) * (1 - (p.close - mn) / span);
      return `${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return { path: d, last: closes[closes.length-1], min: mn, max: mx };
  }, [pts]);

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Gate.io – {tk?.pair ?? "BOS/USDT"}</h2>
        <div className="text-xs text-white/60">Auto-refresh: 15s</div>
      </header>

      <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
        <Card label="Last Price (USD)" value={money(tk?.price ?? null, 6)} />
        <Card label="24h Volume (USDT)" value={money(tk?.volUSDT ?? null, 0)} />
        <Card label="24h Volume (BOS)" value={`${num(tk?.volBOS ?? null, 0)} BOS`} />
      </div>

      <div className="mt-3">
        <svg width="100%" height="140" viewBox="0 0 432 140" preserveAspectRatio="none" role="img" aria-label="Live price chart">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="mt-1 text-xs text-white/60">
          Last: {money(last ?? null, 6)} · Range (60m): {money(min ?? null, 6)} – {money(max ?? null, 6)}
        </div>
      </div>

      <div className="mt-3 text-sm">
        <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href="https://www.gate.io/trade/BOS_USDT">Trade on Gate.io</a>
      </div>

      <p className="mt-3 text-xs text-white/60">
        Gate.io currently offers two token standards for BOS: <strong>ERC-20</strong> and <strong>CNT</strong>. This widget tracks the <strong>CNT</strong> market (BOS/USDT), because Gate.io is presently the only centralized market for BOS-CNT.
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
