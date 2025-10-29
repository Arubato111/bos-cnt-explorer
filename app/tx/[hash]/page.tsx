// app/tx/[hash]/page.tsx
import { getTxInfo, getTxUtxos, getTip } from "@/lib/koios";
export const dynamic = "force-dynamic";

export default async function TxPage({ params }: { params: { hash: string } }) {
  const hash = params.hash;
  const [meta, utxos, tip] = await Promise.all([
    getTxInfo(hash),
    getTxUtxos(hash),
    getTip(),
  ]);
  const head = tip?.[0]?.block_no ?? null;
  const confirms = head && meta?.block_height ? Math.max(0, head - meta.block_height) : null;

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Transaction</h1>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Hash</div>
        <div className="break-all">{hash}</div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Info label="Block" value={meta?.block_height} />
          <Info label="Time" value={meta?.block_time ? new Date(meta.block_time*1000).toLocaleString() : "-"} />
          <Info label="Status" value={meta ? "Confirmed" : "-"} />
          <Info label="Confirmations" value={confirms ?? "-"} />
          <Info label="Slot" value={meta?.absolute_slot ?? "-"} />
          <Info label="Size (bytes)" value={meta?.tx_size ?? "-"} />
          <Info label="Fee (lovelace)" value={meta?.fee ?? "-"} />
        </div>
        <div className="mt-3 text-sm">
          <a className="text-[#66a3ff] hover:underline" target="_blank"
             href={`https://cardanoscan.io/transaction/${hash}`}>Open in Cardanoscan</a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <UtxoList title="Inputs" rows={utxos?.inputs ?? []} />
        <UtxoList title="Outputs" rows={utxos?.outputs ?? []} />
      </div>
    </div>
  );
}

function Info({label, value}:{label:string;value:any}) {
  return (
    <div>
      <div className="text-white/60">{label}</div>
      <div>{value ?? "-"}</div>
    </div>
  );
}
function UtxoList({ title, rows }:{title:string;rows:any[]}) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10">
      <header className="px-4 py-3 border-b border-white/10"><h2 className="text-lg font-medium">{title}</h2></header>
      <div className="p-4 space-y-2 text-sm">
        {(rows ?? []).map((r, i) => (
          <div key={i} className="border border-white/10 rounded-xl p-3">
            <div className="truncate">{r.payment_addr?.bech32 ?? "-"}</div>
            <div className="text-white/60">Lovelace: {r.value ?? "-"}</div>
            {r.asset_list?.length ? <div className="text-white/60">Assets: {r.asset_list.length}</div> : null}
          </div>
        ))}
        {(!rows || rows.length===0) && <div className="text-white/60">Keine Daten.</div>}
      </div>
    </section>
  );
}
