// app/page.tsx
import Link from "next/link";
import {
  getAssetInfo,
  getAssetTxs,
  getAssetAddresses,
  extractDecimals,
  scale,
  fmt,
} from "@/lib/koios";
import { getLiveMarketData } from "@/lib/markets";

export const dynamic = "force-dynamic";
export const revalidate = 0;           // niemals cachen
export const runtime = "nodejs";       // Edge vermeiden (manche APIs blocken Edge)

type HolderRow = { address: string; raw: number; scaled: number };

export default async function Home() {
  // harte Fallbacks – falls APIs kurz down sind, rendern wir trotzdem
  let assetInfo: any[] = [];
  let assetTxs: any[] = [];
  let holdersResp: any[] = [];
  let market = { priceUsd: null, marketCapUsd: null, cex: [], dex: [] } as Awaited<ReturnType<typeof getLiveMarketData>>;

  try {
    [assetInfo, assetTxs, holdersResp, market] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetTxs().catch(() => []),
      getAssetAddresses(500).catch(() => []),
      getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] })),
    ]);
  } catch {
    // Ignorieren – wir zeigen unten sinnvolle Defaults an
  }

  const asset = assetInfo?.[0] ?? {};
  const decimals = extractDecimals(asset);
  const totalSupplyScaled = scale(asset?.total_supply ?? 0, decimals);
  const totalTxs = (assetTxs?.[0]?.tx_hashes ?? []).length;

  const rawHolders = (holdersResp?.[0]?.addresses ?? holdersResp ?? []) as any[];
  const holderRows: HolderRow[] = rawHolders
    .map((h) => ({
      address: String(h?.address ?? ""),
      raw: Number(h?.quantity ?? 0),
      scaled: scale(h?.quantity ?? 0, decimals),
    }))
    .filter((x) => x.address)
    .sort((a: HolderRow, b: HolderRow) => (b.raw || 0) - (a.raw || 0))
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <section className="px-4 md:px-6 pt-8 pb-4 border-b border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">BOS CNT Explorer</h1>
          <p className="mt-2 text-white/70">
            <strong>Inoffizieller Explorer von Arubato</strong> – nicht mit BitcoinOS verbunden.
            Live-Daten: Preis, Market Cap, Listings, Holder, Transaktionen.
          </p>
          <div className="mt-4 flex gap-3 text-sm">
            <Link href="/token" className="px-4 py-2 rounded-xl bg-[#1a5cff] hover:bg-[#3270ff]">
              Zum Token-Dashboard
            </Link>
            <a
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
              target="_blank"
              href="https://cardanoscan.io/"
              rel="noreferrer"
            >
              Cardanoscan öffnen
            </a>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="px-4 md:px-6 py-8">
        <div className="mx-auto max-w-6xl grid gap-4 md:grid-cols-4">
          <Card
            title="Live-Preis (USD)"
            value={market.priceUsd != null ? `$${fmt(market.priceUsd, 6)}` : "–"}
          />
          <Card
            title="Market Cap (USD)"
            value={market.marketCapUsd != null ? `$${fmt(market.marketCapUsd, 0)}` : "–"}
          />
          <Card title="Total Supply" value={`${fmt(totalSupplyScaled, 0)} BOS`} />
          <Card title="Total Transactions" value={fmt(totalTxs)} />
        </div>
      </section>

      {/* Listings */}
      <section className="px-4 md:px-6 pb-8">
        <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 border border-white/10">
            <header className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-medium">CEX Listings</h2>
            </header>
            <div className="p-4">
              {market.cex.length === 0 ? (
                <p className="text-white/60">Keine CEX-Listings erkannt.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {market.cex.slice(0, 10).map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {m.exchange} – {m.pair}
                      </span>
                      {m.url ? (
                        <a
                          className="text-[#66a3ff] hover:underline"
                          target="_blank"
                          href={m.url}
                          rel="noreferrer"
                        >
                          Trade
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10">
            <header className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-medium">DEX Listings</h2>
            </header>
            <div className="p-4">
              {market.dex.length === 0 ? (
                <p className="text-white/60">Keine DEX-Paare gefunden.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {market.dex.slice(0, 10).map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {m.exchange} – {m.pair}
                      </span>
                      {m.url ? (
                        <a
                          className="text-[#66a3ff] hover:underline"
                          target="_blank"
                          href={m.url}
                          rel="noreferrer"
                        >
                          Trade
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top 10 Holders */}
      <section className="px-4 md:px-6 pb-12">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white/5 border border-white/10">
          <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-medium">Top 10 Holders</h2>
            <span className="text-xs text-white/60">
              Mengen skaliert (decimals: {decimals})
            </span>
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
                {holderRows.map((h) => (
                  <tr key={h.address} className="border-t border-white/10">
                    <td className="px-4 py-2 truncate">{h.address}</td>
                    <td className="px-4 py-2">{fmt(h.scaled, 2)}</td>
                    <td className="px-4 py-2">
                      <a
                        className="text-[#66a3ff] hover:underline"
                        target="_blank"
                        href={`https://cardanoscan.io/address/${h.address}`}
                        rel="noreferrer"
                      >
                        Cardanoscan
                      </a>
                    </td>
                  </tr>
                ))}
                {holderRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-white/60" colSpan={3}>
                      Keine Holder gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
