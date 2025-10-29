// lib/koios.ts
const DEFAULT_URLS = (process.env.KOIOS_URLS || "https://api.koios.rest/api/v1")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const ASSET_ID =
  "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e";

type FetchOpts = RequestInit & { retry?: number; timeoutMs?: number };

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function httpJson<T>(url: string, init: FetchOpts = {}): Promise<T> {
  const { retry = 2, timeoutMs = 12000, ...opts } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "BOS-CNT-Explorer/koios",
        ...(opts.headers || {}),
      },
      signal: ctrl.signal,
      ...opts,
    });
    if (r.status === 429 && retry > 0) {
      await sleep(500);
      return httpJson<T>(url, { ...init, retry: retry - 1 });
    }
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    const txt = await r.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error("invalid_json"); }
  } finally { clearTimeout(t); }
}

async function postKoiosAny<T>(base: string, path: string, body: any): Promise<T> {
  return httpJson<T>(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
async function getKoiosAny<T>(base: string, path: string): Promise<T> {
  return httpJson<T>(`${base}${path}`);
}

// Try all bases with backoff until one returns non-empty result (or last error)
async function tryAllBases<T>(fn: (base: string) => Promise<T>, validate: (x: any) => boolean): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < DEFAULT_URLS.length; i++) {
    const base = DEFAULT_URLS[i];
    try {
      const res = await fn(base);
      if (validate(res)) return res;
      // kleine Pause, dann nächsten Mirror
      await sleep(150);
    } catch (e) {
      lastErr = e;
      await sleep(150);
    }
  }
  // als Fallback: letzter Versuch auf erstem Base ohne Validate
  if (DEFAULT_URLS[0]) {
    try { return await fn(DEFAULT_URLS[0]); } catch (e) { lastErr = e; }
  }
  if (lastErr) throw lastErr;
  throw new Error("all_koios_failed");
}

/* ================== Public API (Koios only) ================== */
export async function getAssetInfo() {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/asset_info", { _asset_list: [ASSET_ID] }),
    (x) => Array.isArray(x) && x.length > 0
  );
}

export async function getAssetTxs(limit = 5000) {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/asset_txs", { _asset_list: [ASSET_ID], _limit: limit }),
    (x) => Array.isArray(x) && x[0]?.tx_hashes?.length > 0
  );
}

export async function getAssetAddresses(limit = 20000) {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/asset_addresses", { _asset_list: [ASSET_ID], _limit: limit }),
    (x) => Array.isArray(x) && (x[0]?.address_count > 0 || (x[0]?.addresses?.length ?? 0) > 0)
  );
}

export async function getTxInfosBulk(txHashes: string[]) {
  if (!txHashes?.length) return [];
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/tx_info", { _tx_hashes: txHashes }),
    (x) => Array.isArray(x)
  );
}

export async function getTxInfo(txHash: string) {
  const r = await getTxInfosBulk([txHash]).catch(() => []);
  return r?.[0] ?? null;
}

export async function getTxUtxos(txHash: string) {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/tx_utxos", { _tx_hashes: [txHash] }),
    (x) => Array.isArray(x)
  ).then(x => x?.[0]);
}

export async function getAddressInfo(addr: string) {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/address_info", { _addresses: [addr] }),
    (x) => Array.isArray(x)
  );
}

export async function getAddressTxs(addr: string, limit = 500) {
  return tryAllBases<any[]>(
    (base) => postKoiosAny(base, "/address_txs", { _addresses: [addr], _limit: limit }),
    (x) => Array.isArray(x)
  );
}

export async function getTip() {
  return tryAllBases<Array<{ block_no: number }>>(
    (base) => getKoiosAny(base, "/tip"),
    (x) => Array.isArray(x) && x.length > 0
  );
}

/* ================== Helpers ================== */
export function extractDecimals(assetInfo: any): number {
  // Koios liefert ggf. in token_registry_metadata
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
