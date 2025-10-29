// app/page.tsx
import Hero from "@/components/Hero";
import DualPriceStrip from "@/components/DualPriceStrip";
import MarketStats from "@/components/MarketStats";
import TradingWidget from "@/components/TradingWidget";
import TabbedChart from "@/components/TabbedChart";
import CopyField from "@/components/CopyField";
import DataSources from "@/components/DataSources";
import HoldersLive from "@/components/HoldersLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CNT_ASSET_ID = "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e";

export default async function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      {/* NEW: BOS/USDT vs BOS/ADA strip */}
      <div className="mt-6">
        <DualPriceStrip />
      </div>

      {/* Market KPIs (CoinGecko) */}
      <div className="mt-6">
        <MarketStats />
      </div>

      {/* Chart with tabs & ranges */}
      <div className="mt-6">
        <TabbedChart />
      </div>

      {/* Gate.io trading box (USDT CNT market) */}
      <div className="mt-6">
        <TradingWidget />
      </div>

      {/* CNT Asset – copyable + quick links */}
      <section className="mt-8 grid md:grid-cols-2 gap-6">
        <CopyField label="BOS CNT Asset (Cardano)" value={CNT_ASSET_ID} />
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/60">Quick Links</div>
          <ul className="mt-2 text-sm space-y-2">
            <li><a className="text-[#66a3ff] hover:underline" target="_blank" href={`https://cardanoscan.io/token/${CNT_ASSET_ID}`}>BOS CNT on Cardanoscan</a></li>
            <li><a className="text-[#66a3ff] hover:underline" target="_blank" href="https://www.gate.io/trade/BOS_USDT">Gate.io BOS/USDT (CNT)</a></li>
            <li><a className="text-[#66a3ff] hover:underline" target="_blank" href="/token">Token dashboard</a></li>
          </ul>
          <p className="mt-3 text-xs text-white/60">Purpose: track the BOS ecosystem on Cardano (CNT) — prices, trading, and, as soon as available, live on-chain metrics.</p>
        </div>
      </section>

      {/* Live holders (Koios) */}
      <div className="mt-8">
        <HoldersLive />
      </div>

      {/* Data & legal notice */}
      <div className="mt-8">
        <DataSources />
      </div>

      <footer className="mt-10 text-xs text-white/60">
        Unofficial — by Arubato. Not affiliated with BitcoinOS. © 2025
      </footer>
    </main>
  );
}
