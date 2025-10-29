import { getAssetInfo, getAssetTxs } from "@/lib/koios";

export default async function TokenPage() {
  const info = await getAssetInfo();
  const txs = await getAssetTxs();

  const asset = info[0];
  return (
    <main className="p-8 text-gray-800">
      <h1 className="text-3xl font-semibold text-[#0062FF] mb-4">
        BOS Token Overview
      </h1>
      <div className="mb-4 bg-white p-4 rounded-2xl shadow">
        <p><strong>Policy ID:</strong> {asset.policy_id}</p>
        <p><strong>Asset Name:</strong> BOS Token</p>
        <p><strong>Total Supply:</strong> {asset.total_supply}</p>
      </div>
      <h2 className="text-2xl mt-6 mb-2">Recent Transactions</h2>
      <ul className="space-y-2">
        {txs[0]?.tx_hashes?.slice(0, 10).map((tx: string) => (
          <li key={tx} className="truncate text-blue-600">
            {tx}
          </li>
        ))}
      </ul>
    </main>
  );
}
