// app/token/page.tsx
import {
  getAssetInfo, getAssetTxs, getAssetAddresses,
  getTxInfosBulk, getTip, extractDecimals, scale
} from "@/lib/koios";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const POLICY_ID = "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d";
const CNT_ASSET_ID = "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e";

type HolderRow = { address: string; raw: number; scaled: number };

export default async function TokenPage({ searchParams }: { searchParams?: Record<string,string> }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const pageSize = 25;

  const [info, txsResp, holdersResp, tip] = await Promise.all([
    getAssetInfo().catch(() => []),
    getAssetTxs().catch(() => []),
    getAssetAddresses(10000).catch(() => []),
    getTip().catch(() => []),
  ]);

  const asset = (info as any[])?.[0] ?? {};
  const decimals = extractDecimals(asset);
  const assetHex = asset?.asset_name ?? CNT_ASSET_ID.slice(POLICY_ID.length);

  // Transfers
  const allTxHashes: string[] = (txsResp as any[])?.[0]?.tx_hashes ?? [];
  const start = (page - 1) * pageSize;
  const slice = allTxHashes.slice(start, start + pageSize);
  const txInfos = await getTxInfosBulk(slice).catch(() => []);
  const head = (tip as any[])?.[0]?.block_no ?? null;

  // Holders
  const rawHolders: any[] =
    ((holdersResp as any[])?.[0]?.addresses ?? (Array.isArray(holdersResp) ? holdersResp : []) ?? []);
  const holderRows: HolderRow[] = rawHolders
    .map((h: any): HolderRow => ({
      address: String(h?.address ?? h?.payment_address ?? ""),
      raw: Number(h?.quantity ?? h?.asset_qty ?? 0),
      scaled: scale(h?.quantity ?? h?.asset_qty ?? 0, decimals),
    }))
    .filter((x) => x.address)
    .sort((a: HolderRow, b: HolderRow) => b.raw - a.raw)
    .slice(0, 50);

  const totalSupplyScaled = scale(asset?.total_supply ?? 0, decimals);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">BOS Token — Overview</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Policy ID (Cardano)" value={<span className="break-all">{POLICY_ID}</span>} sub="Asset (hex)" subValue={assetHex} />
        <Card title="Decimals" value={decimals ?? "Not available yet"} sub="Fingerprint" subValue="asset1mfx4kv75jstyws0u0lpe70w7ny76lhsswampzd" />
        <Card title="Total Supply" value={`${Number.isFinite(totalSupplyScaled) ? new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(totalSupplyScaled) : "Not available yet"} BOS`} sub="Tx loaded" subValue={allTxHashes.length} />
        <Card title="Top Holders (loaded)" value={holderRows.length} sub="Page size" subValue={pageSize} />
      </div>

      {/* Recent Transfers */}
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
                const meta = (txInfos as any[]).find((t: any) => t.tx_hash === tx);
                const confirms = head && meta?.block_height ? Math.max(0, head - meta.block_height) : null;
                const time = meta?.block_time ? new Date(meta.block_time * 1000).toLocaleString() : "Not available yet";
                return (
                  <tr key={tx} className="border-t border-white/10">
                    <td className="px-4 py-2 truncate">{tx}</td>
                    <td className="px-4 py-2">{meta?.block_height ?? "Not available yet"}</td>
                    <td className="px-4 py-2">{time}</td>
                    <td className="px-4 py-2">{confirms ?? "Not available yet"}</td>
                    <td className="px-4 py-2"><a className="text-[#66a3ff] hover:underline" href={`/tx/${tx}`}>Details</a></td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={5}>Not available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Holders */}
      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Top Holders (scaled)</h2>
          <div className="text-xs text-white/60">First 50</div>
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
              {holderRows.map((h: HolderRow) => (
                <tr key={h.address} className="border-t border-white/10">
                  <td className="px-4 py-2 truncate">
                    <a className="text-[#66a3ff] hover:underline" href={`/address/${h.address}`}>{h.address}</a>
                  </td>
                  <td className="px-4 py-2">{new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(h.scaled)}</td>
                  <td className="px-4 py-2">
                    <a className="text-[#66a3ff] hover:underline" target="_blank" href={`https://cardanoscan.io/address/${h.address}`} rel="noreferrer">Cardanoscan</a>
                  </td>
                </tr>
              ))}
              {holderRows.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={3}>Not available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, sub, subValue }:{
  title:string; value:any; sub?:string; subValue?:any
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-lg">{value ?? "Not available yet"}</div>
      {sub ? (
        <>
          <div className="mt-2 text-xs text-white/60">{sub}</div>
          <div className="truncate text-sm">{subValue ?? "Not available yet"}</div>
        </>
      ) : null}
    </div>
  );
}

function Pagination({ current, pageSize, total }:{
  current:number; pageSize:number; total:number
}) {
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
