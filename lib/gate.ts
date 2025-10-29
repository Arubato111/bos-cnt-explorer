// lib/gate.ts
type GateTicker = {
  currency_pair: string; last: string; change_percentage?: string; base_volume?: string;
};
type GateCurrency = {
  currency: string; chain?: string | null; contract_address?: string | null; deposit_status?: string; withdraw_status?: string;
};

async function j<T>(u: string) {
  const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json", "user-agent": "BOS-CNT-Explorer/1.0" } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<T>;
}

/** Live-Ticker bspw. BOS_USDT (Spot) */
export async function gateTicker(pair = "BOS_USDT"): Promise<{ priceUsd: number | null }> {
  try {
    const arr = await j<GateTicker[]>(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${encodeURIComponent(pair)}`);
    const t = Array.isArray(arr) ? arr[0] : null;
    const price = t?.last ? Number(t.last) : null;
    return { priceUsd: Number.isFinite(price!) ? price! : null };
  } catch { return { priceUsd: null }; }
}

/** Chains/Contracts für BOS (zeigt z. B. ERC20/BEP20; wenn Gate CNT/Cardano führt, steht hier eine BOS_ADA Chain) */
export async function gateChains(currency = "BOS"): Promise<Array<{chain:string; contract?:string|null; deposit?:string; withdraw?:string}>> {
  try {
    // Hinweis: Gate liefert entweder `BOS` oder mehrere Einträge `BOS_<CHAIN>`
    const list = await j<GateCurrency[]>(`https://api.gateio.ws/api/v4/spot/currencies?currency=${encodeURIComponent(currency)}`);
    const norm = (list || []).map((c) => ({
      chain: c.chain || (c.currency.includes("_") ? c.currency.split("_")[1] : "NATIVE"),
      contract: c.contract_address || null,
      deposit: c.deposit_status,
      withdraw: c.withdraw_status,
    }));
    // Duplikate zusammenführen
    const map = new Map<string, {chain:string; contract?:string|null; deposit?:string; withdraw?:string}>();
    for (const x of norm) map.set(x.chain, x);
    return [...map.values()];
  } catch { return []; }
}
