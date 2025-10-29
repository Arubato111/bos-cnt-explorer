// app/page.tsx
import Link from "next/link";
import { getAssetInfo, getAssetTxs, extractDecimals, scale, fmt } from "@/lib/koios";
import { getLiveMarketData } from "@/lib/markets";
import HoldersLive from "@/components/HoldersLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

async function getCirculating() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const r = await fetch(`${base}/api/holders`, { cache: "no-store" }).catch(() =>
      fetch("/api/holders", { cache: "no-store" })
    );
    const j = await r.json().catch(() => null);
    return j?.ok
      ? { total: j.totalHolders as number | null, circulating: j.circulating as number | null }
      : { total: null, circulating: null };
  } catch {
    return { total: null, circulating: null };
  }
}

export default async function Home() {
  const [assetInfo, assetTxs, market, circ] = await Promise.all([
    getAssetInfo().catch(() => []),
    getAssetTxs().catch(() => []),
    getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] })),
    getCirculating(),
  ]);

  const asset = (assetInfo as any[])?.[0] ?? {};
  const decimals = extractDecimals(asset);
  const totalSupplyScaled = scale(asset?.total_supply ?? 0, decimals);
  const totalBOSTxs = ((assetTxs as any[])?.[0]?.tx_hashes ?? []).length;

  const upstreamDown = !asset?.policy_id;

  return (
    <main className="min-h-screen">
      <section className="pt-2 pb-1">
        <div className="mb-1 text-xs text-white/60">
          <strong>Inoffizieller Explorer von Arubato</strong> – nicht mit BitcoinOS verbunden.
        </div>
        {upstreamDown && (
          <div className="mb-3 text-xs text-amber-300">
            Hinweis: Koios liefert aktuell leer – Anzeigen können 0/– zeigen. Wir versuchen automatisch andere Mirrors.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <Card title="Live-Preis (USD)" value={market.priceUsd != null ? `$${fmt(market.priceUsd, 6)}` : "–"} />
        <Card title="Market Cap (USD)" value={market.marketCapUsd != null ? `$${fmt(market.marketCapUsd, 0)}` : "–"} />
        <Card title="Total Supply" value={`${fmt(totalSupplyScaled, 0)} BOS`} />
        <Card title="Circulating (live)" value={circ.circulating != null ? `${fmt(circ.circulating, 0)} BOS` : "–"} />
        <Card title="Tx Count (BOS only)" value={fmt(totalBOSTxs)} />
      </section>

      <section className="grid gap-6 md:grid-cols-2 mt-8">
        <Listings title="CEX Listings" rows={market.cex} />
        <Listings title="DEX Listings (official contracts)" rows={market.dex} />
      </section>

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
              <li key={i} className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-6 truncate">{m.exchange} – {m.pair}</span>
                <span className="col-span-3 text-white/80 text-right">
                  {m.priceUsd != null ? `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(m.priceUsd)}` : "–"}
                </span>
                <span className="col-span-3 text-right">
                  {m.url ? (
                    <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href={m.url}>
                      Trade
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
