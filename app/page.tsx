// app/page.tsx
import Link from "next/link";
import { getAssetInfo, getAssetTxs, extractDecimals, scale, fmt } from "@/lib/koios";
import { getLiveMarketData } from "@/lib/markets";
import HoldersLive from "@/components/HoldersLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// helper fürs Server-Fetch auf eigene API
async function getCirculating() {
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/holders`, { cache: "no-store" })
      .catch(() => fetch("/api/holders", { cache: "no-store" })); // fallback relativ
    const j = await r.json();
    return j?.ok ? { total: j.totalHolders, circulating: j.circulating } : { total: null, circulating: null };
  } catch { return { total: null, circulating: null }; }
}

export default async function Home() {
  let [assetInfo, assetTxs, market] = await Promise.all([
    getAssetInfo().catch(() => []),
    getAssetTxs().catch(() => []),
    getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] })),
  ]);

  const circ = await getCirculating();

  const asset = (assetInfo as any[])?.[0] ?? {};
  const decimals = extractDecimals(asset);
  const totalSupplyScaled = scale(asset?.total_supply ?? 0, decimals);
  const totalBOSTxs = ((assetTxs as any[])?.[0]?.tx_hashes ?? []).length; // nur BOS-Asset-Transaktionen

  return (
    <main className="min-h-screen">
      <section className="pt-2 pb-1">
        <div className="mb-1 text-xs text-white/60">
          <strong>Inoffizieller Explorer von Arubato</strong> – nicht mit BitcoinOS verbunden.
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-5">
        <Card title="Live-Preis (USD)" value={market.priceUsd != null ? `$${fmt(market.priceUsd, 6)}` : "–"} />
        <Card title="Market Cap (USD)" value={market.marketCapUsd != null ? `$${fmt(market.marketCapUsd, 0)}` : "–"} />
        <Card title="Total Supply" value={`${fmt(totalSupplyScaled, 0)} BOS`} />
        <Card title="Circulating (live)" value={circ.circulating != null ? `${fmt(circ.circulating, 0)} BOS` : "–"} />
        <Card title="Tx Count (BOS only)" value={fmt(totalBOSTxs)} />
      </section>

      {/* Listings mit Preis */}
      <section className="grid gap-6 md:grid-cols-2 mt-8">
        <Listings title="CEX Listings" rows={market.cex} />
        <Listings title="DEX Listings" rows={market.dex} />
      </section>

      {/* Live Holders */}
      <div className="mt-8">
        <HoldersLive />
      </div>

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
  rows: { exchange: string; pair: string; url?: string | null; priceUsd?: number | null }[];
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
            {rows.slice(0, 12).map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="truncate">{m.exchange} – {m.pair}</span>
                <span className="text-white/80">
                  {m.priceUsd != null ? `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(m.priceUsd)}` : "–"}
                </span>
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
