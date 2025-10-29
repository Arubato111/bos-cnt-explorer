// lib/markets.ts
export type MarketRow = {
  exchange: string;
  pair: string;
  url?: string | null;
  priceUsd?: number | null;
};

export type LiveMarketData = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  cex: MarketRow[];
  dex: MarketRow[];
};

function n(x: any): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

export async function getLiveMarketData(): Promise<LiveMarketData> {
  try {
    // CoinGecko: BitcoinOS (Symbol BOS)
    const geckoUrl =
      "https://api.coingecko.com/api/v3/coins/bitcoinos?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false";
    const r = await fetch(geckoUrl, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "BOS-CNT-Explorer/1.0" },
    });

    let j: any | null = null;
    if (r.ok) {
      try { j = await r.json(); } catch { j = null; }
    }

    const priceUsd = j?.market_data?.current_price?.usd ?? null;
    const marketCapUsd = j?.market_data?.market_cap?.usd ?? null;

    const tickers: any[] = Array.isArray(j?.tickers) ? j.tickers : [];
    const cex: MarketRow[] = [];
    const dex: MarketRow[] = [];

    for (const t of tickers) {
      const base = String(t?.base ?? "").toUpperCase();
      const target = String(t?.target ?? "").toUpperCase();
      if (!base.includes("BOS")) continue;

      const exchange = String(t?.market?.name ?? "Unknown");
      const pair = `${base}/${target}`;
      const url = t?.trade_url ?? null;
      const last = n(t?.last ?? t?.converted_last?.usd);

      const ex = exchange.toLowerCase();
      const isDex =
        ex.includes("pancake") ||
        ex.includes("uniswap") ||
        ex.includes("raydium") ||
        ex.includes("jupiter") ||
        ex.includes("sushi") ||
        ex.includes("meteora");

      const row: MarketRow = { exchange, pair, url, priceUsd: last };
      (isDex ? dex : cex).push(row);
    }

    // Dexscreener Fallback (fügt ggf. DEX-Paare inkl. Preis hinzu)
    const fb = await dexPairsFallback();
    const seen = new Set((dex).map(d => `${d.exchange}|${d.pair}`));
    for (const d of fb.dex) {
      const key = `${d.exchange}|${d.pair}`;
      if (!seen.has(key)) dex.push(d);
    }

    return {
      priceUsd: n(priceUsd),
      marketCapUsd: n(marketCapUsd),
      cex,
      dex,
    };
  } catch {
    const fb = await dexPairsFallback().catch(() => ({ dex: [] as MarketRow[] }));
    return { priceUsd: null, marketCapUsd: null, cex: [], dex: fb.dex };
  }
}

async function dexPairsFallback(): Promise<{ dex: MarketRow[] }> {
  const endpoints = [
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x49b8cf47decb57ff3bffa6ee9847dfa3aeb33b77",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x822095637b433fe9f11e4d1d7a11470519403e39",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x755a53cd819868ba74c9d782f1409c8ba0390d48",
  ];
  const dex: MarketRow[] = [];

  await Promise.allSettled(
    endpoints.map(async (u) => {
      try {
        const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
        if (!r.ok) return;
        const j = await r.json().catch(() => ({}));
        const pairs: any[] = Array.isArray(j?.pairs) ? j.pairs : j?.pair ? [j.pair] : [];
        for (const p of pairs) {
          dex.push({
            exchange: p?.dexId ? `${p.dexId} (${p?.chainId ?? p?.chain ?? "dex"})` : "DEX",
            pair: `${p?.baseToken?.symbol ?? "BOS"}/${p?.quoteToken?.symbol ?? ""}`.trim(),
            url: p?.url ?? null,
            priceUsd: n(p?.priceUsd),
          });
        }
      } catch {}
    })
  );

  return { dex };
}
