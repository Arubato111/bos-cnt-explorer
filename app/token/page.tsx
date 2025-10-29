// app/token/page.tsx
import { getAssetInfo, getAssetTxs, getAssetAddresses } from "@/lib/koios";

export const dynamic = "force-dynamic";

function fmt(n?: string | number) {
  if (n === undefined || n === null) return "-";
  const x = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(x)) return String(n);
  return new Intl.NumberFormat("en-US").format(x);
}

export default async function TokenPage() {
  const [info, txs, holders] = await Promise.all([
    getAssetInfo(),
    getAssetTxs(),
    getAssetAddresses(),
  ]);

  const asset = info?.[0];
  const txHashes: string[] = txs?.[0]?.tx_hashes ?? [];
  const holderCount = holders?.[0]?.address_count ?? holders?.length ?? "-";
  const decimals = asset?.token_registry_metadata?.decimals ?? asset?.decimals ?? 0;
  const name =
    asset?.token_registry_metadata?.ticker ||
    asset?.token_registry_metadata?.name ||
    "BOS Token";

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Token Overview</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/60">Token</div>
          <div className="mt-1 text-lg">{name}</div>
          <div className="mt-2 text-xs text-white/60">Policy</div>
          <div className="truncate text-sm">{asset?.policy_id}</div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/60">Asset Name (hex)</div>
          <div className="truncate text-sm">
            {asset?.asset_name ?? "0014df10424f5320546f6b656e"}
          </div>
          <div className="mt-2 text-xs text-white/60">Decimals</div>
          <div className="text-lg">{decimals}</div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/60">Total Supply</div>
          <div className="text-lg">{fmt(asset?.total_supply)}</div>
          <div className="mt-2 text-xs text-white/60">Fingerprint</div>
          <div className="truncate text-sm">
            asset1mfx4kv75jstyws0u0lpe70w7ny76lhsswampzd
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/60">Holders</div>
          <div className="text-lg">{fmt(holderCount)}</div>
          <div className="mt-2 text-xs text-white/60">Latest Tx</div>
          <div className="text-sm">{txHashes.length}</div>
        </div>
      </div>

      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Transfers (BOS)</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Tx Hash</th>
                <th className="px-4 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {txHashes.slice(0, 50).map((tx) => (
                <tr key={tx} className="border-t border-white/10">
                  <td className="px-4 py-2 truncate">{tx}</td>
                  <td className="px-4 py-2">
                    <a className="text-[#66a3ff] hover:underline" href={`/tx/${tx}`}>Details</a>
                  </td>
                </tr>
              ))}
              {txHashes.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-white/60" colSpan={2}>
                    Keine Transfers gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
