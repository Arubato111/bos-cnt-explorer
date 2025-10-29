// lib/markets.ts
import { gateTicker, gateChains } from "./gate";

export type MarketRow = { exchange: string; pair: string; url?: string | null; priceUsd?: number | null; chain?: string | null; contract?: string | null; };
export type LiveMarketData = { priceUsd: number | null; marketCapUsd: number | null; cex: MarketRow[]; dex: MarketRow[]; };

function num(x:any){ const v=Number(x); return Number.isFinite(v)?v:null; }
async function j(u:string){ const r=await fetch(u,{cache:"no-store",headers:{accept:"application/json","user-agent":"BOS-CNT-Explorer/1.0"}}); if(!r.ok) throw new Error(`${r.status}`); return r.json(); }

export async function getLiveMarketData(): Promise<LiveMarketData> {
  // 1) CoinGecko als Fallback/Aggregat für Preis/MC
  let priceUsd: number | null = null, marketCapUsd: number | null = null;
  try {
    const sp = await j("https://api.coingecko.com/api/v3/simple/price?ids=bitcoinos&vs_currencies=usd&include_market_cap=true");
    priceUsd = num(sp?.bitcoinos?.usd);
    marketCapUsd = num(sp?.bitcoinos?.usd_market_cap);
  } catch {}

  // 2) Gate.io Spot – BOS_USDT
  const [{ priceUsd: gatePrice }, chains] = await Promise.all([
    gateTicker("BOS_USDT"),
    gateChains("BOS"),
  ]);
  // Wenn Gate Preis vorhanden, überschreibt er CG (CEX-nahe „live“)
  if (gatePrice != null) priceUsd = gatePrice;

  // CEX-Listing: Gate.io
  const cex: MarketRow[] = [{
    exchange: "Gate.io",
    pair: "BOS/USDT",
    url: "https://www.gate.io/trade/BOS_USDT",
    priceUsd: gatePrice,
    // zeige bekannte Chains/Contracts (ERC20/BEP20/…)
    chain: chains.map(c=>c.chain).join(", "),
    contract: chains.map(c=>c.contract).filter(Boolean).join(" | ") || null,
  }];

  // DEX bleibt wie bisher leer/extern gefiltert – hier kein Gate-DEX
  const dex: MarketRow[] = [];

  return { priceUsd, marketCapUsd, cex, dex };
}
