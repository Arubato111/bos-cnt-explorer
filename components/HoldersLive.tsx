// components/HoldersLive.tsx
"use client";

import { useEffect, useState } from "react";

type Holder = { address: string; raw: number; scaled: number };
type ApiResp =
  | { ok: true; decimals: number; totalHolders: number; top: Holder[]; ts: number }
  | { ok: false; error: string };

function fmt(n: number, maxFrac = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(n);
}

export default function HoldersLive({ title = "Top 10 Holders" }: { title?: string }) {
  const [data, setData] = useState<ApiResp | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/holders", { cache: "no-store" });
      const j: ApiResp = await r.json();
      setData(j);
    } catch {
      setData({ ok: false, error: "network_error" });
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // alle 30s aktualisieren
    return () => clearInterval(id);
  }, []);

  const total =
    data && "ok" in data && data.ok ? data.totalHolders : null;
  const holders =
    data && "ok" in data && data.ok ? data.top : [];

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10">
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="text-xs text-white/60">
          Total holder wallets: <span className="text-white">{total ?? "–"}</span>
        </div>
      </header>
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
            {(holders ?? []).map((h) => (
              <tr key={h.address} className="border-t border-white/10">
                <td className="px-4 py-2 truncate">{h.address}</td>
                <td className="px-4 py-2">{fmt(h.scaled, 2)}</td>
                <td className="px-4 py-2">
                  <a
                    className="text-[#66a3ff] hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://cardanoscan.io/address/${h.address}`}
                  >
                    Cardanoscan
                  </a>
                </td>
              </tr>
            ))}
            {(!holders || holders.length === 0) && (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={3}>
                  Keine Holder gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-white/40">
        Auto-Refresh alle 30s • Datenquelle: Koios
      </div>
    </section>
  );
}
