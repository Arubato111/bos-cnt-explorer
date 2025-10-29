// app/tx/[hash]/page.tsx
import { getTxInfo, getTxUtxos, fmt } from "@/lib/koios";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const isHex64 = (h: string) => /^[0-9a-f]{64}$/i.test(h);

export default async function TxPage({ params }: { params: { hash: string } }) {
  const hash = decodeURIComponent(params.hash ?? "");

  if (!isHex64(hash)) {
    return (
      <div className="text-red-300">
        Ungültiger Tx-Hash (erwartet 64 Hex-Zeichen).
      </div>
    );
  }

  // Metadaten
  const info = await getTxInfo(hash).catch(() => null);
  // Inputs/Outputs (um Mengen zu sehen)
  const utxos = await getTxUtxos(hash).catch(() => null);

  const block = info?.block_height ?? "-";
  const time = info?.block_time ? new Date(info.block_time * 1000).toLocaleString() : "-";
  const fee = info?.fee ? Number(info.fee) : null;

  // BOS-Mengen (Cardano Multi-Asset in outputs)
  // Koios-Shape: utxos.outputs[].asset_list[] -> { policy_id, asset_name, quantity }
  const bosPolicy = "1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d";
  const bosNameHex = "0014df10424f5320546f6b656e";

  function sumAsset(arr: any[], policy: string, nameHex: string) {
    let s = 0;
    for (const o of arr || []) {
      for (const a of o?.asset_list || []) {
        if (a.policy_id === policy && a.asset_name === nameHex) {
          s += Number(a.quantity || 0);
        }
      }
    }
    return s;
  }

  const outSumRaw = sumAsset(utxos?.outputs || [], bosPolicy, bosNameHex);
  const inSumRaw  = sumAsset(utxos?.inputs || [],  bosPolicy, bosNameHex);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold break-all">Transaction</h1>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Tx Hash</div>
        <div className="break-all">{hash}</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Kpi title="Block" value={block} />
          <Kpi title="Time" value={time} />
          <Kpi title="Fee (lovelace)" value={fee != null ? fmt(fee, 0) : "-"} />
          <Kpi title="BOS In (raw)" value={fmt(inSumRaw, 0)} />
          <Kpi title="BOS Out (raw)" value={fmt(outSumRaw, 0)} />
        </div>

        <div className="mt-4 text-sm">
          <a
            className="text-[#66a3ff] hover:underline"
            href={`https://cardanoscan.io/transaction/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Cardanoscan
          </a>
        </div>
      </div>

      {/* Outputs Tabelle */}
      <section className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-medium">Outputs</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">BOS (raw)</th>
              </tr>
            </thead>
            <tbody>
              {(utxos?.outputs || []).map((o: any, i: number) => {
                const raw = sumAsset([o], bosPolicy, bosNameHex);
                return (
                  <tr key={i} className="border-t border-white/10">
                    <td className="px-4 py-2 break-all">{o.payment_addr?.bech32 ?? o.address ?? "-"}</td>
                    <td className="px-4 py-2">{fmt(raw, 0)}</td>
                  </tr>
                );
              })}
              {(!utxos?.outputs || utxos.outputs.length === 0) && (
                <tr><td className="px-4 py-4 text-white/60" colSpan={2}>Keine Outputs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1">{value ?? "-"}</div>
    </div>
  );
}
