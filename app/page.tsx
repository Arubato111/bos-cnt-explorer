// app/page.tsx
import Link from "next/link";
import MarketStats from "@/components/MarketStats";
import { getLiveMarketData } from "@/lib/markets";
import HoldersLive from "@/components/HoldersLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function Home() {
  const market = await getLiveMarketData().catch(() => ({ priceUsd: null, marketCapUsd: null, cex: [], dex: [] }));

  return (
    <main className="min-h-screen">
      <section className="pt-2 pb-1">
        <div className="mb-1 text-xs text-white/60">
          <strong>Inoffizieller Explorer von Arubato</strong> – nicht mit BitcoinOS verbunden.
        </div>
      </section>

      {/* NEU: Vollständige Market-KPIs (CoinGecko) */}
      <div className="mt-4">
        <MarketStats />
      </div>

      {/* Gate/CEX & DEX Listings (aus deiner bestehenden lib/markets.ts) */}
      <section className="grid gap-6 md:grid-cols-2 mt-8">
        <Listings title="CEX Listings" rows={market.cex} />
        <Listings title="DEX Listings (official contracts)" rows={market.dex} />
      </section>

      {/* Live Holders (Koios) */}
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
