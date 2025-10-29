// components/MarketStats.tsx
"use client";

import { useEffect, useState } from "react";

type RespOK = {
  ok: true;
  rank: number | null;
  marketCapUsd: number | null;
  circulating: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  fdvUsd: number | null;
  mcToFdvPct: number | null;
  athUsd: number | null;
  athDate: string | null;
  atlUsd: number | null;
  atlDate: string | null;
  releaseDate: string | null;
  priceUsd: number | null;
};
type Resp = RespOK | { ok: false };

function fmt(n: number | null, frac = 2) {
  if (n == null) return "–";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: frac }).format(n);
}
function fmtMoney(n: number | null, frac = 2) {
  if (n == null) return "–";
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: frac }).format(n)}`;
}
function dstr(s: string | null) {
  if (!s) return "–";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "–";
  return d.toLocaleDateString();
}

export default function MarketStats() {
  const [data, setData] = useState<Resp | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/market", { cache: "no-store" });
      const j: Resp = await r.json();
      setData(j);
    } catch {
      setData({ ok: false } as any);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // 60s
    return () => clearInterval(id);
  }, []);

  const ok = data && "ok" in data && data.ok;
  const v = (ok ? (data as RespOK) : null);

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <header className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Market Overview (CoinGecko)</h2>
        <div className="text-xs text-white/60">Auto-Refresh: 60s</div>
      </header>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Card label="Ranking" value={v?.rank != null ? `No.${v.rank}` : "–"} />
        <Card label="Market Cap" value={fmtMoney(v?.marketCapUsd, 0)} />
        <Card label="Fully Diluted MC" value={fmtMoney(v?.fdvUsd, 0)} />
        <Card label="Circulating Supply" value={`${fmt(v?.circulating, 2)} BOS`} />
        <Card label="Total Supply" value={`${fmt(v?.totalSupply, 2)} BOS`} />
        <Card label="Max Supply" value={`${fmt(v?.maxSupply, 2)} BOS`} />
        <Card label="MC / FDV" value={v?.mcToFdvPct != null ? `${fmt(v.mcToFdvPct, 2)}%` : "–"} />
        <Card label="All-Time High" value={`${fmtMoney(v?.athUsd, 4)} (${dstr(v?.athDate)})`} />
        <Card label="All-Time Low" value={`${fmtMoney(v?.atlUsd, 6)} (${dstr(v?.atlDate)})`} />
        <Card label="Release Date" value={dstr(v?.releaseDate)} />
        <Card label="Spot Price (USD)" value={fmtMoney(v?.priceUsd, 6)} />
      </div>
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
