// lib/markets.ts
// Quelle: CoinGecko (public endpoints). Zieht Live-Preis, Market Cap & Ticker.
// Filtert DEX-Paare strikt auf die offiziellen BOS-Contracts (ETH/BSC).

export type MarketRow = {
  exchange: string;
  pair: string;
  url?: string | null;
  priceUsd?: number | null;
  baseAddress?: string | null;
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

function num(x: any): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

async function getJson(u: string) {
  const r = await fetch(u, {
    cache: "no-store",
    headers: { accept: "application/json", "user-agent": "BOS-CNT-Explorer/1.0" },
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export async function getLiveMarketData(): Promise<LiveMarketData> {
  // 1) Preis/MarketCap: simple/price → stabil, schnell
  let priceUsd: number | null = null;
  let marketCapUsd: number | null = null;
  try {
    const sp = await getJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoinos&vs_currencies=usd&include_market_cap=true"
    ); // :contentReference[oaicite:0]{index=0}
    priceUsd = num(sp?.bitcoinos?.usd);
    marketCapUsd = num(sp?.bitcoinos?.usd_market_cap);
  } catch {}

  // 2) Listings: /coins/{id}/tickers
  const cex: MarketRow[] = [];
  const dex: MarketRow[] = [];
  try {
    const tk = await getJson(
      "https://api.coingecko.com/api/v3/coins/bitcoinos/tickers"
    ); // :contentReference[oaicite:1]{index=1}

    const tickers: any[] = Array.isArray(tk?.tickers) ? tk.tickers : [];
    for (const t of tickers) {
      const base = String(t?.base ?? "").toUpperCase();
      const target = String(t?.target ?? "").toUpperCase();
      if (!base.includes("BOS")) continue;

      const exchange = String(t?.market?.name ?? "Unknown");
      const pair = `${base}/${target}`;
      const url = t?.trade_url ?? null;
      const last = num(t?.last ?? t?.converted_last?.usd);

      const isDex = Boolean(t?.market?.identifier && t?.market?.identifier.toLowerCase().includes("dex"));
      const row: MarketRow = { exchange, pair, url, priceUsd: last, baseAddress: null, chain: null };

      // Wenn verfügbar: Onchain-Info vom Ticker (manche DEX liefern 'base_contract_address')
      const baseAddr = (t?.coin_id === "bitcoinos" && t?.base_contract_address) ? String(t.base_contract_address).toLowerCase() : null;
      const chain = (t?.target ?? "").toLowerCase().includes("wbnb") ? "bsc" : (t?.target ?? "").toLowerCase().includes("weth") ? "eth" : null;
      if (baseAddr) { row.baseAddress = baseAddr; row.chain = chain; }

      if (isDex) dex.push(row); else cex.push(row);
    }

    // Filter DEX streng nach offiziellen Contracts
    const dexFiltered: MarketRow[] = [];
    for (const d of dex) {
      const addr = d.baseAddress?.toLowerCase();
      const ch = (d.chain || "").toLowerCase();
      const match =
        (addr && ch.includes("bsc") && addr === OFFICIAL.BSC) ||
        (addr && ch.includes("eth") && addr === OFFICIAL.ETH);
      if (!d.baseAddress) {
        // Wenn kein Contract mitgeliefert wird, nicht anzeigen (Sicherheitsfilter).
        continue;
      }
      if (match) dexFiltered.push(d);
    }

    return {
      priceUsd,
      marketCapUsd,
      cex,
      dex: dexFiltered,
    };
  } catch {
    return { priceUsd, marketCapUsd, cex, dex: [] };
  }
}
