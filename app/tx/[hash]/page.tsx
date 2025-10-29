// app/tx/[hash]/page.tsx
import { getTxInfo, getTxUtxos } from "@/lib/koios";
export const dynamic = "force-dynamic";

export default async function TxPage({ params }: { params: { hash: string } }) {
  const hash = params.hash;
  const [info, utxos] = await Promise.all([getTxInfo(hash), getTxUtxos(hash)]);
  const meta = info?.[0];
  const data = utxos?.[0];

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Transaction</h1>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Hash</div>
        <div className="break-all">{hash}</div>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/60">Block</div>
            <div>{meta?.block_height ?? "-"}</div>
          </div>
          <div>
            <div className="text-white/60">Time</div>
            <div>{meta?.block_time ? new Date(meta.block_time * 1000).toLocaleString() : "-"}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl bg-white/5 border border-white/10">
          <header className="px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-medium">Inputs</h2>
          </header>
          <div className="p-4 space-y-2 text-sm">
            {(data?.inputs ?? []).map((i: any, idx: number) => (
              <div key={idx} className="border border-white/10 rounded-xl p-3">
                <div className="truncate">{i.payment_addr?.bech32 ?? "-"}</div>
                <div className="text-white/60">Lovelace: {i.value ?? "-"}</div>
              </div>
            ))}
            {(data?.inputs ?? []).length === 0 && <div className="text-white/60">Keine Inputs.</div>}
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 border border-white/10">
          <header className="px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-medium">Outputs</h2>
          </header>
          <div className="p-4 space-y-2 text-sm">
            {(data?.outputs ?? []).map((o: any, idx: number) => (
              <div key={idx} className="border border-white/10 rounded-xl p-3">
                <div className="truncate">{o.payment_addr?.bech32 ?? "-"}</div>
                <div className="text-white/60">Lovelace: {o.value ?? "-"}</div>
                {o.asset_list?.length ? (
                  <div className="text-white/60">Assets: {o.asset_list.length}</div>
                ) : null}
              </div>
            ))}
            {(data?.outputs ?? []).length === 0 && <div className="text-white/60">Keine Outputs.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
