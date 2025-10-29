// app/address/[addr]/page.tsx
import { getAddressInfo, getAddressTxs, getTxInfosBulk } from "@/lib/koios";
export const dynamic = "force-dynamic";

export default async function AddressPage({ params, searchParams }:{ params:{addr:string}, searchParams:any }) {
  const addr = decodeURIComponent(params.addr);
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const pageSize = 25;

  const [info, txsResp] = await Promise.all([getAddressInfo(addr), getAddressTxs(addr, 500)]);
  const summary = info?.[0];
  const txList: { tx_hash: string }[] = txsResp?.[0]?.txs ?? [];
  const start = (page - 1) * pageSize;
  const slice = txList.slice(start, start + pageSize).map(t => t.tx_hash);
  const metas = await getTxInfosBulk(slice);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Address</h1>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Bech32</div>
        <div className="break-all">{addr}</div>
        <div className="mt-2 text-xs text-white/60">Tx Count</div>
        <div>{summary?.tx_count ?? "-"}</div>
        <div className="mt-3 text-sm">
          <a className="text-[#66a3ff] hover:underline" target="_blank"
             href={`https://cardanoscan.io/address/${addr}`}>Open in Cardanoscan</a>
        </div>
      </div>

      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Transactions</h2>
          <div className="text-white/60 text-sm">
            <a className="px-2 py-1 rounded bg-white/5 hover:bg-white/10" href={`?page=${Math.max(1, page-1)}`}>Prev</a>
            <span className="mx-2">Page {page}</span>
            <a className="px-2 py-1 rounded bg-white/5 hover:bg-white/10" href={`?page=${page+1}`}>Next</a>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Tx Hash</th>
                <th className="px-4 py-2">Block</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((h) => {
                const m = metas.find((x:any)=>x.tx_hash===h);
                return (
                  <tr key={h} className="border-t border-white/10">
                    <td className="px-4 py-2 truncate">{h}</td>
                    <td className="px-4 py-2">{m?.block_height ?? "-"}</td>
                    <td className="px-4 py-2">{m?.block_time ? new Date(m.block_time*1000).toLocaleString() : "-"}</td>
                    <td className="px-4 py-2"><a className="text-[#66a3ff] hover:underline" href={`/tx/${h}`}>Details</a></td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={4}>Keine Txs auf dieser Seite.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
