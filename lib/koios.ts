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

export async function getAssetInfo() {
  // Infos inkl. total_supply, metadata
  return postJSON<any[]>("/asset_info", { _asset_list: [ASSET_ID] });
}

export async function getAssetTxs() {
  // Tx-Hashes, neueste zuerst
  return postJSON<any[]>("/asset_txs", { _asset_list: [ASSET_ID] });
}

export async function getAssetAddresses() {
  // Holder-Übersicht (Adresse + Menge)
  return postJSON<any[]>("/asset_addresses", { _asset_list: [ASSET_ID] });
}

export async function getTxInfo(txHash: string) {
  return postJSON<any[]>("/tx_info", { _tx_hashes: [txHash] });
}

export async function getTxUtxos(txHash: string) {
  return postJSON<any[]>("/tx_utxos", { _tx_hashes: [txHash] });
}

export async function getAddressInfo(addr: string) {
  return postJSON<any[]>("/address_info", { _addresses: [addr] });
}

export async function getAddressTxs(addr: string) {
  return postJSON<any[]>("/address_txs", {
    _addresses: [addr],
    _after_block_height: null,
  });
}
