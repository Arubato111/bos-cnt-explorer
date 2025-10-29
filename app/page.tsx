// app/token/page.tsx
import {
  getAssetInfo, getAssetTxs, getAssetAddresses,
  getTxInfosBulk, getTip, extractDecimals, scale, fmt
} from "@/lib/koios";

export const dynamic = "force-dynamic";

export default async function TokenPage({ searchParams }: any) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const pageSize = 25;

  const [info, txsResp, holdersResp, tip] = await Promise.all([
    getAssetInfo(),
    getAssetTxs(),
    getAssetAddresses(500),
    getTip(),
  ]);

  const asset = info?.[0];
  const decimals = extractDecimals(asset);
  const name = asset?.token_registry_metadata?.ticker
    ?? asset?.token_registry_metadata?.name
    ?? "BOS Token";

  const allTxHashes: string[] = txsResp?.[0]?.tx_hashes ?? [];
  const start = (page - 1) * pageSize;
  const slice = allTxHashes.slice(start, start + pageSize);

  // Bulk-Infos für Zeiten/Blöcke/Bestätigungen
  const txInfos = await getTxInfosBulk(slice);
  const head = tip?.[0]?.block_no ?? null;

  // Holder-Liste
  const holderRows =
    (holdersResp?.[0]?.addresses ?? holdersResp ?? []).map((h: any) => ({
      address: h.address,
      raw: Number(h.quantity),
      scaled: scale(h.quantity, decimals),
    })).sort((a: any, b: any) => b.raw - a.raw).slice(0, 50);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">BOS Token Overview</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Token" value={name} sub="Policy" subValue={asset?.policy_id} />
        <Card title="Decimals" value={decimals} sub="Asset (hex)" subValue={asset?.asset_name ?? "0014df10424f5320546f6b656e"} />
        <Card title="Total Supply" value={fmt(scale(asset?.total_supply ?? 0, decimals))} sub="Fingerprint" subValue="asset1mfx4kv75jstyws0u0lpe70w7ny76lhsswampzd" />
        <Card title="Holders" value={holdersResp?.[0]?.address_count ?? holderRows.length} sub="Latest Txs (loaded)" subValue={allTxHashes.length} />
      </div>

      {/* Transfers */}
      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Transfers</h2>
          <Pagination current={page} pageSize={pageSize} total={allTxHashes.length} />
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Tx Hash</th>
                <th className="px-4 py-2">Block</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Conf.</th>
                <th className="px-4 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((tx) => {
                const meta = txInfos.find((t: any) => t.tx_hash === tx);
                const confirms = head && meta?.block_height ? Math.max(0, head - meta.block_height) : null;
                const time = meta?.block_time ? new Date(meta.block_time * 1000).toLocaleString() : "-";
                return (
                  <tr key={tx} className="border-t border-white/10">
                    <td className="px-4 py-2 truncate">{tx}</td>
                    <td className="px-4 py-2">{meta?.block_height ?? "-"}</td>
                    <td className="px-4 py-2">{time}</td>
                    <td className="px-4 py-2">{confirms ?? "-"}</td>
                    <td className="px-4 py-2">
                      <a className="text-[#66a3ff] hover:underline" href={`/tx/${tx}`}>Details</a>
                    </td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={5}>Keine Transfers auf dieser Seite.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Holders */}
      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Top Holders (scaled)</h2>
          <div className="text-xs text-white/60">Erste 50</div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Balance (BOS)</th>
                <th className="px-4 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {holderRows.map((h) => (
                <tr key={h.address} className="border-t border-white/10">
                  <td className="px-4 py-2 truncate">
                    <a className="text-[#66a3ff] hover:underline" href={`/address/${h.address}`}>{h.address}</a>
                  </td>
                  <td className="px-4 py-2">{fmt(h.scaled, 2)}</td>
                  <td className="px-4 py-2">
                    <a className="text-[#66a3ff] hover:underline" target="_blank"
                       href={`https://cardanoscan.io/address/${h.address}`}>Cardanoscan</a>
                  </td>
                </tr>
              ))}
              {holderRows.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={3}>Keine Holder-Daten.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, sub, subValue }:{title:string;value:any;sub?:string;subValue?:any}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-lg">{value ?? "-"}</div>
      {sub ? (
        <>
          <div className="mt-2 text-xs text-white/60">{sub}</div>
          <div className="truncate text-sm">{subValue ?? "-"}</div>
        </>
      ):null}
    </div>
  );
}

function Pagination({ current, pageSize, total }:{current:number;pageSize:number;total:number}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const prev = Math.max(1, current - 1);
  const next = Math.min(pages, current + 1);
  return (
    <div className="flex items-center gap-2 text-sm">
      <a className="px-2 py-1 rounded bg-white/5 hover:bg-white/10" href={`?page=${prev}`}>Prev</a>
      <span className="text-white/60">Page {current} / {pages}</span>
      <a className="px-2 py-1 rounded bg-white/5 hover:bg-white/10" href={`?page=${next}`}>Next</a>
    </div>
  );
}
