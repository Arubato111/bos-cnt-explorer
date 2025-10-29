// lib/markets.ts
export type MarketRow = {
  exchange: string;
  pair: string;
  url?: string | null;
  priceUsd?: number | null;
  baseAddress?: string | null; // für Filter
  chain?: string | null;
};

export type LiveMarketData = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  cex: MarketRow[];
  dex: MarketRow[];
};

const OFFICIAL = {
  ETH: "0x13239C268BEDDd88aD0Cb02050D3ff6a9d00de6D".toLowerCase(),
  BSC: "0xAe1E85c3665b70B682dEfd778E3dAFDF09ed3B0f".toLowerCase(),
  CARDANO_ASSET: "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e",
};

function n(x: any): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

export async function getLiveMarketData(): Promise<LiveMarketData> {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/bitcoinos?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false";
    const r = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "BOS-CNT-Explorer/1.0" },
    });

    let j: any | null = null;
    if (r.ok) { try { j = await r.json(); } catch {} }

    const priceUsd = j?.market_data?.current_price?.usd ?? null;
    const marketCapUsd = j?.market_data?.market_cap?.usd ?? null;

    const tickers: any[] = Array.isArray(j?.tickers) ? j.tickers : [];
    const cexRaw: MarketRow[] = [];
    const dexRaw: MarketRow[] = [];

    for (const t of tickers) {
      const base = String(t?.base ?? "").toUpperCase();
      const target = String(t?.target ?? "").toUpperCase();
      if (!base.includes("BOS")) continue;

      const exName = String(t?.market?.name ?? "Unknown");
      const pair = `${base}/${target}`;
      const last = n(t?.last ?? t?.converted_last?.usd);
      const url = t?.trade_url ?? null;

      const item: MarketRow = { exchange: exName, pair, url, priceUsd: last, baseAddress: null, chain: null };

      // CEX vs DEX grob
      const ex = exName.toLowerCase();
      const looksDex = ex.includes("pancake") || ex.includes("uniswap") || ex.includes("raydium")
                    || ex.includes("jupiter") || ex.includes("sushi") || ex.includes("meteora");

      if (looksDex) dexRaw.push(item); else cexRaw.push(item);
    }

    // Dexscreener – holt Adressen, damit wir exakt matchen können
    const fb = await dexPairs();
    // zusammenführen (DEX)
    const dexMap = new Map<string, MarketRow>();
    for (const d of fb) {
      if (!d.baseAddress) continue;
      // nur offizielle Contracts
      const addr = d.baseAddress.toLowerCase();
      const chain = (d.chain || "").toLowerCase();
      const isOfficial =
        (chain.includes("bsc") && addr === OFFICIAL.BSC) ||
        (chain.includes("eth") && addr === OFFICIAL.ETH);
      if (!isOfficial) continue;

      const key = `${d.exchange}|${d.pair}|${addr}`;
      if (!dexMap.has(key)) dexMap.set(key, d);
    }

    return {
      priceUsd: n(priceUsd),
      marketCapUsd: n(marketCapUsd),
      cex: cexRaw,     // CEX liefern selten Contract-Address – bleiben un-gefiltert (nur BOS pair)
      dex: Array.from(dexMap.values()),
    };
  } catch {
    return { priceUsd: null, marketCapUsd: null, cex: [], dex: [] };
  }
}

async function dexPairs(): Promise<MarketRow[]> {
  const endpoints = [
    // BSC – Pancake etc. (Beispiele)
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x49b8cf47decb57ff3bffa6ee9847dfa3aeb33b77",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x822095637b433fe9f11e4d1d7a11470519403e39",
    "https://api.dexscreener.com/latest/dex/pairs/bsc/0x755a53cd819868ba74c9d782f1409c8ba0390d48",
    // (Wenn ETH DEX bekannt, hier ergänzen)
  ];
  const out: MarketRow[] = [];

  await Promise.allSettled(endpoints.map(async (u) => {
    try {
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) return;
      const j = await r.json().catch(() => ({}));
      const pairs: any[] = Array.isArray(j?.pairs) ? j.pairs : j?.pair ? [j.pair] : [];
      for (const p of pairs) {
        out.push({
          exchange: p?.dexId ? `${p.dexId}` : "DEX",
          pair: `${p?.baseToken?.symbol ?? "BOS"}/${p?.quoteToken?.symbol ?? ""}`.trim(),
          url: p?.url ?? null,
          priceUsd: n(p?.priceUsd),
          baseAddress: (p?.baseToken?.address ?? null),
          chain: (p?.chainId ?? p?.chain ?? null),
        });
      }
    } catch {}
  }));

  return out;
}
