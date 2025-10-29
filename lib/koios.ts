// lib/koios.ts
const KOIOS = "https://api.koios.rest/api/v1";
const ASSET_ID =
  "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${KOIOS}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return res.json();
}
async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${KOIOS}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

/** ---------- Asset / Holders / Tx ---------- **/
export async function getAssetInfo() {
  // total_supply, token_registry_metadata.decimals|ticker|name
  return postJSON<any[]>("/asset_info", { _asset_list: [ASSET_ID] });
}
export async function getAssetTxs() {
  // tx_hashes[] (neueste zuerst)
  return postJSON<any[]>("/asset_txs", { _asset_list: [ASSET_ID] });
}
export async function getAssetAddresses(limit = 200) {
  // holder addresses + quantities
  return postJSON<any[]>("/asset_addresses", { _asset_list: [ASSET_ID], _limit: limit });
}

/** ---------- Tx / Address ---------- **/
export async function getTxInfosBulk(txHashes: string[]) {
  if (!txHashes.length) return [];
  return postJSON<any[]>("/tx_info", { _tx_hashes: txHashes });
}
export async function getTxUtxosBulk(txHashes: string[]) {
  if (!txHashes.length) return [];
  return postJSON<any[]>("/tx_utxos", { _tx_hashes: txHashes });
}
export async function getTxInfo(txHash: string) {
  const r = await getTxInfosBulk([txHash]);
  return r?.[0];
}
export async function getTxUtxos(txHash: string) {
  const r = await getTxUtxosBulk([txHash]);
  return r?.[0];
}
export async function getAddressInfo(addr: string) {
  return postJSON<any[]>("/address_info", { _addresses: [addr] });
}
export async function getAddressTxs(addr: string, limit = 100) {
  return postJSON<any[]>("/address_txs", {
    _addresses: [addr],
    _after_block_height: null,
    _limit: limit,
  });
}

/** ---------- Chain tip (confirmations) ---------- **/
export async function getTip() {
  return getJSON<Array<{ block_no: number }>>("/tip");
}

/** ---------- Helpers ---------- **/
export function extractDecimals(assetInfo: any): number {
  return assetInfo?.token_registry_metadata?.decimals ??
         assetInfo?.decimals ?? 0;
}
export function scale(n: string | number, decimals = 0): number {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return 0;
  return v / Math.pow(10, decimals);
}
export function fmt(n: number | string, maxFrac = 6) {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(v);
}
