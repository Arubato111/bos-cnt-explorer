export async function getAssetInfo() {
  const res = await fetch("https://api.koios.rest/api/v1/asset_info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _asset_list: [
        "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e"
      ]
    })
  });
  return await res.json();
}

export async function getAssetTxs() {
  const res = await fetch("https://api.koios.rest/api/v1/asset_txs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _asset_list: [
        "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e"
      ]
    })
  });
  return await res.json();
}
