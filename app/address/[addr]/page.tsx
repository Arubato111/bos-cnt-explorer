// app/address/[addr]/page.tsx
import { getAddressInfo, getAddressTxs } from "@/lib/koios";
export const dynamic = "force-dynamic";

export default async function AddressPage({ params }: { params: { addr: string } }) {
  const addr = decodeURIComponent(params.addr);
  const [info, txs] = await Promise.all([getAddressInfo(addr), getAddressTxs(addr)]);
  const summary = info?.[0];
  const txList: any[] = txs?.[0]?.txs ?? [];

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Address</h1>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Bech32</div>
        <div className="break-all">{addr}</div>
        <div className="mt-2 text-xs text-white/60">Tx Count</div>
        <div>{summary?.tx_count ?? "-"}</div>
      </div>

      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-medium">Recent Transactions</h2>
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
              {txList.slice(0, 50).map((t: any) => (
                <tr key={t.tx_hash} className="border-t border-white/10">
                  <td className="px-4 py-2 truncate">{t.tx_hash}</td>
                  <td className="px-4 py-2">
                    <a className="text-[#66a3ff] hover:underline" href={`/tx/${t.tx_hash}`}>Details</a>
                  </td>
                </tr>
              ))}
              {txList.length === 0 && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={2}>Keine Txs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
