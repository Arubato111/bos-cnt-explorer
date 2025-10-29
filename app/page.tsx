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
export const revalidate = 0;
export const runtime = "nodejs";

type HolderRow = { address: string; raw: number; scaled: number };

export default async function Home() {
  let assetInfo: any[] = [];
  let assetTxs: any[] = [];
  let holdersResp: any[] = [];
  let market = { priceUsd: null, marketCapUsd: null, cex: [], dex: [] } as Awaited<
    ReturnType<typeof getLiveMarketData>
  >;

  try {
    [assetInfo, assetTxs, holdersResp, market] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetTxs().catch(() => []),
      getAssetAddresses(500).catch(() => []),
      getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] })),
    ]);
  } catch {}

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
    <main className="min-h-screen">
      {/* Header-Section */}
      <section className="pt-2 pb-1">
        <div className="mb-1 text-xs text-white/60">
          Inoffizieller Explorer von <strong>Arubato</strong> – nicht mit BitcoinOS verbunden.
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

      {/* Top-10 Holder */}
      <section className="rounded-2xl bg-white/5 border border-white/10 mt-8">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Top 10 Holder</h2>
          <span className="text-xs text-white/60">Skaliert mit decimals: {decimals}</span>
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
              {holderRows.map((h: HolderRow) => (
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
      </section>

      {/* Call to action */}
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
