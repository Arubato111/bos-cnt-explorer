// app/page.tsx
import Link from "next/link";
import {
  getAssetInfo,
  getAssetTxs,
  extractDecimals,
  scale,
  fmt,
} from "@/lib/koios";
import { getLiveMarketData } from "@/lib/markets";
import HoldersLive from "@/components/HoldersLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function Home() {
  let assetInfo: any[] = [];
  let assetTxs: any[] = [];
  let market = { priceUsd: null, marketCapUsd: null, cex: [], dex: [] } as Awaited<
    ReturnType<typeof getLiveMarketData>
  >;

  try {
    [assetInfo, assetTxs, market] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetTxs().catch(() => []),
      getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] })),
    ]);
  } catch {}

  const asset = assetInfo?.[0] ?? {};
  const decimals = extractDecimals(asset);
  const totalSupplyScaled = scale(asset?.total_supply ?? 0, decimals);
  const totalTxs = (assetTxs?.[0]?.tx_hashes ?? []).length;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="pt-2 pb-1">
        <div className="mb-1 text-xs text-white/60">
          <strong>Inoffizieller Explorer von Arubato</strong> – nicht mit BitcoinOS verbunden.
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Live-Preis (USD)" value={market.priceUsd != null ? `$${fmt(market.priceUsd, 6)}` : "–"} />
        <Card title="Market Cap (USD)" value={market.marketCapUsd != null ? `$${fmt(market.marketCapUsd, 0)}` : "–"} />
        <Card title="Total Supply" value={`${fmt(totalSupplyScaled, 0)} BOS`} />
        <Card title="Total Transactions" value={fmt(totalTxs)} />
      </section>

      {/* Listings */}
      <section className="grid gap-6 md:grid-cols-2 mt-8">
        <Listings title="CEX Listings" rows={market.cex} />
        <Listings title="DEX Listings" rows={market.dex} />
      </section>

      {/* Live Holders (Total + Top-10, auto-refresh) */}
      <div className="mt-8">
        <HoldersLive title="Top 10 Holders (live)" />
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Link href="/token" className="px-4 py-2 rounded-xl bg-[#1a5cff] hover:bg-[#3270ff]">
          Zum Token-Dashboard
        </Link>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-xl">{value ?? "-"}</div>
    </div>
  );
}

function Listings({
  title,
  rows,
}: {
  title: string;
  rows: { exchange: string; pair: string; url?: string | null }[];
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10">
      <header className="px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-medium">{title}</h2>
      </header>
      <div className="p-4">
        {(!rows || rows.length === 0) ? (
          <p className="text-white/60">Keine Einträge gefunden.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.slice(0, 10).map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="truncate">{m.exchange} – {m.pair}</span>
                {m.url ? (
                  <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href={m.url}>
                    Trade
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
