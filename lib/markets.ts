// lib/markets.ts
type GeckoTicker = {
  base: string;
  target: string;
  market: { name: string; identifier: string; has_trading_incentive: boolean };
  trade_url?: string | null;
  is_anomaly?: boolean;
  is_stale?: boolean;
};

export type LiveMarketData = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  cex: { exchange: string; pair: string; url?: string | null }[];
  dex: { exchange: string; pair: string; url?: string | null }[];
};

export async function getLiveMarketData(): Promise<LiveMarketData> {
  // 1) CoinGecko – coin details + tickers
  const geckoUrl =
    "https://api.coingecko.com/api/v3/coins/bitcoinos?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false";
  const r = await fetch(geckoUrl, { cache: "no-store" });
  if (!r.ok) {
    // Fallback: nur Dexscreener
    const { dex } = await dexPairsFallback();
    return { priceUsd: null, marketCapUsd: null, cex: [], dex };
  }
  const j = await r.json();

  const priceUsd: number | null = j?.market_data?.current_price?.usd ?? null;
  const marketCapUsd: number | null = j?.market_data?.market_cap?.usd ?? null;

  const tickers: GeckoTicker[] = (j?.tickers ?? []).filter(
    (t: GeckoTicker) => t?.base?.toUpperCase().includes("BOS")
  );

  const cex: LiveMarketData["cex"] = [];
  const dex: LiveMarketData["dex"] = [];

  for (const t of tickers) {
    const item = {
      exchange: t.market?.name ?? "Unknown",
      pair: `${t.base}/${t.target}`,
      url: t.trade_url ?? null,
    };
    const ex = (t.market?.name ?? "").toLowerCase();
    const isDex =
      ex.includes("pancake") ||
      ex.includes("uniswap") ||
      ex.includes("raydium") ||
      ex.includes("meteora") ||
      ex.includes("sushiswap") ||
      ex.includes("jupiter") ||
      ex.includes("sovryn");
    if (isDex) dex.push(item);
    else cex.push(item);
  }

  // 2) Dexscreener Fallback: füge evtl. weitere DEX-Paare hinzu
  const fallback = await dexPairsFallback();
  const dexMap = new Map(dex.map((d) => [d.exchange + d.pair, true]));
  for (const d of fallback.dex) {
    const key = d.exchange + d.pair;
    if (!dexMap.has(key)) dex.push(d);
  }

  return { priceUsd, marketCapUsd, cex, dex };
}

async function dexPairsFallback(): Promise<Pick<LiveMarketData, "dex">> {
  // Wir kennen reale BOS-Paare auf DEXs (BSC/Raydium etc.).
  // Dexscreener public, no key needed.
  const endpoints = [
    // Pancake BSC BOS/USDT
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x49b8cf47decb57ff3bffa6ee9847dfa3aeb33b77",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x822095637b433fe9f11e4d1d7a11470519403e39",
    // BSC WBNB pair
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x755a53cd819868ba74c9d782f1409c8ba0390d48",
    // Solana Raydium examples (liquidity may vary)
    "https://api.dexscreener.com/latest/dex/pairs/solana/3sqzijipk8piv6z9mt5mkawnxablzpqekacb8zz5kscs"
  ];
  const dex: { exchange: string; pair: string; url?: string | null }[] = [];

  await Promise.allSettled(
    endpoints.map(async (u) => {
      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      const pairs: any[] = j?.pairs ?? (j?.pair ? [j.pair] : []);
      for (const p of pairs) {
        dex.push({
          exchange: p?.dexId ? `${p.dexId} (${p.chainId ?? p.chain})` : "DEX",
          pair: `${p?.baseToken?.symbol ?? "BOS"}/${p?.quoteToken?.symbol ?? ""}`.trim(),
          url: p?.url ?? null,
        });
      }
    })
  );

  return { dex };
}
