// components/DataSources.tsx
export default function DataSources() {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h3 className="text-lg font-medium">Data & Disclaimers</h3>
      <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-white/80">
        <li>Prices, market cap, ranking, supply stats: CoinGecko public API for <em>BitcoinOS (BOS)</em>.</li>
        <li>Gate.io trading data (price, 24h volume, OHLC): Gate.io public API v4 (BOS/USDT, CNT market).</li>
        <li>On-chain Cardano metrics (holders, circulating, transfers): Koios public API.<br/>If a metric cannot be fetched right now, we show <em>Not available yet</em>.</li>
        <li>Unofficial explorer by Arubato – not affiliated with BitcoinOS.</li>
        <li>No personal data collected. No API keys required. Public endpoints only.</li>
      </ul>
    </section>
  );
}
