// lib/markets.ts
export type LiveMarketData = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  cex: { exchange: string; pair: string; url?: string | null }[];
  dex: { exchange: string; pair: string; url?: string | null }[];
};

function safeNumber(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export async function getLiveMarketData(): Promise<LiveMarketData> {
  try {
    const geckoUrl =
      "https://api.coingecko.com/api/v3/coins/bitcoinos?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false";
    const r = await fetch(geckoUrl, {
      cache: "no-store",
      // kleine Header helfen gegen manche WAFs
      headers: { "accept": "application/json", "user-agent": "BOS-CNT-Explorer/1.0" },
    });

    let j: any | null = null;
    if (r.ok) {
      try { j = await r.json(); } catch { j = null; }
    }

    const priceUsd = j?.market_data?.current_price?.usd ?? null;
    const marketCapUsd = j?.market_data?.market_cap?.usd ?? null;

    const tickers: any[] = Array.isArray(j?.tickers) ? j!.tickers : [];
    const cex: LiveMarketData["cex"] = [];
    const dex: LiveMarketData["dex"] = [];

    for (const t of tickers) {
      const base = String(t?.base ?? "").toUpperCase();
      const target = String(t?.target ?? "").toUpperCase();
      if (!base.includes("BOS")) continue;

      const exchange = String(t?.market?.name ?? "Unknown");
      const pair = `${base}/${target}`;
      const url = t?.trade_url ?? null;

      const ex = exchange.toLowerCase();
      const looksDex =
        ex.includes("pancake") ||
        ex.includes("uniswap") ||
        ex.includes("raydium") ||
        ex.includes("jupiter") ||
        ex.includes("sushi") ||
        ex.includes("meteora");

      const item = { exchange, pair, url };
      if (looksDex) dex.push(item);
      else cex.push(item);
    }

    // Dexscreener Fallback zusammenführen (fehlerrobust)
    const fb = await dexPairsFallback();
    const seen = new Set(dex.map(d => `${d.exchange}|${d.pair}`));
    for (const d of fb.dex) {
      const key = `${d.exchange}|${d.pair}`;
      if (!seen.has(key)) dex.push(d);
    }

    return {
      priceUsd: safeNumber(priceUsd),
      marketCapUsd: safeNumber(marketCapUsd),
      cex,
      dex,
    };
  } catch {
    // Totalausfall → solide Defaults
    const fb = await dexPairsFallback().catch(() => ({ dex: [] as LiveMarketData["dex"] }));
    return { priceUsd: null, marketCapUsd: null, cex: [], dex: fb.dex };
  }
}

async function dexPairsFallback(): Promise<Pick<LiveMarketData, "dex">> {
  const endpoints = [
    // Beispiel-Paare; wenn nicht existent → ignorieren
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x49b8cf47decb57ff3bffa6ee9847dfa3aeb33b77",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x822095637b433fe9f11e4d1d7a11470519403e39",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x755a53cd819868ba74c9d782f1409c8ba0390d48",
  ];
  const dex: { exchange: string; pair: string; url?: string | null }[] = [];

  await Promise.allSettled(
    endpoints.map(async (u) => {
      try {
        const r = await fetch(u, { cache: "no-store", headers: { "accept": "application/json" } });
        if (!r.ok) return;
        const j = await r.json().catch(() => ({}));
        const pairs: any[] = Array.isArray(j?.pairs) ? j.pairs : j?.pair ? [j.pair] : [];
        for (const p of pairs) {
          dex.push({
            exchange: p?.dexId ? `${p.dexId} (${p?.chainId ?? p?.chain ?? "dex"})` : "DEX",
            pair: `${p?.baseToken?.symbol ?? "BOS"}/${p?.quoteToken?.symbol ?? ""}`.trim(),
            url: p?.url ?? null,
          });
        }
      } catch { /* ignore single endpoint errors */ }
    })
  );

  return { dex };
}
