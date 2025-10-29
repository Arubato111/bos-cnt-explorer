// lib/koios.ts
const KOIOS = "https://api.koios.rest/api/v1";
const ASSET_ID =
  "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e";

const BF_KEY = process.env.BLOCKFROST_PROJECT_ID; // optional

type FetchOpts = RequestInit & { retry?: number };

async function http<T>(url: string, init: FetchOpts = {}): Promise<T> {
  const { retry = 2, ...opts } = init;
  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(opts.headers || {}),
      },
      ...opts,
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    const text = await r.text();
    try { return JSON.parse(text) as T; } catch { throw new Error("invalid_json"); }
  } catch (e) {
    if (retry > 0) return http<T>(url, { ...init, retry: retry - 1 });
    throw e;
  }
}

async function postKoios<T>(path: string, body: unknown): Promise<T> {
  return http<T>(`${KOIOS}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getKoios<T>(path: string): Promise<T> {
  return http<T>(`${KOIOS}${path}`);
}

/** ---------- Primary (Koios) ---------- */
export async function getAssetInfo() {
  return postKoios<any[]>("/asset_info", { _asset_list: [ASSET_ID] });
}
export async function getAssetTxs(limit = 5000) {
  return postKoios<any[]>("/asset_txs", { _asset_list: [ASSET_ID], _limit: limit });
}
export async function getAssetAddresses(limit = 20000) {
  return postKoios<any[]>("/asset_addresses", { _asset_list: [ASSET_ID], _limit: limit });
}
export async function getTxInfosBulk(txHashes: string[]) {
  if (!txHashes?.length) return [];
  return postKoios<any[]>("/tx_info", { _tx_hashes: txHashes });
}
export async function getTxInfo(txHash: string) {
  const r = await getTxInfosBulk([txHash]);
  return r?.[0] ?? null;
}
export async function getTxUtxos(txHash: string) {
  const r = await postKoios<any[]>("/tx_utxos", { _tx_hashes: [txHash] });
  return r?.[0];
}
export async function getAddressInfo(addr: string) {
  return postKoios<any[]>("/address_info", { _addresses: [addr] });
}
export async function getAddressTxs(addr: string, limit = 500) {
  return postKoios<any[]>("/address_txs", {
    _addresses: [addr],
    _after_block_height: null,
    _limit: limit,
  });
}
export async function getTip() {
  return getKoios<Array<{ block_no: number }>>("/tip");
}

/** ---------- Optional Blockfrost Fallback (wenn KEY gesetzt) ---------- */
async function bf<T>(path: string) {
  if (!BF_KEY) throw new Error("bf_disabled");
  return http<T>(`https://cardano-mainnet.blockfrost.io/api/v0${path}`, {
    headers: { project_id: BF_KEY },
  });
}

export async function getAssetInfoWithFallback() {
  try { return await getAssetInfo(); }
  catch {
    const j = await bf<any>(`/assets/${ASSET_ID}`).catch(() => null);
    if (!j) return [];
    return [{
      policy_id: j.policy_id,
      asset_name: j.asset_name,
      total_supply: Number(j.quantity ?? 0),
      token_registry_metadata: j.onchain_metadata || {},
      decimals: (j.onchain_metadata && (j.onchain_metadata.decimals ?? j.onchain_metadata?.meta?.decimals)) ?? 0,
    }];
  }
}

export async function getAssetAddressesWithFallback(limit = 20000) {
  try { return await getAssetAddresses(limit); }
  catch {
    const j = await bf<any[]>(`/assets/${ASSET_ID}/addresses?count=${Math.min(limit, 100)}`).catch(() => null);
    if (!Array.isArray(j)) return [];
    return [{
      address_count: j.length,
      addresses: j.map((x: any) => ({ address: x.address, quantity: x.quantity })),
    }];
  }
}

export async function getAssetTxsWithFallback(limit = 5000) {
  try { return await getAssetTxs(limit); }
  catch {
    const j = await bf<any[]>(`/assets/${ASSET_ID}/transactions?count=${Math.min(limit, 100)}`).catch(() => null);
    if (!Array.isArray(j)) return [];
    return [{ tx_hashes: j.map((x: any) => x.tx_hash) }];
  }
}

/** ---------- Helpers ---------- */
export function extractDecimals(assetInfo: any): number {
  return assetInfo?.token_registry_metadata?.decimals ?? assetInfo?.decimals ?? 0;
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
