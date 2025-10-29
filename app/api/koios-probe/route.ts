// app/api/koios-probe/route.ts
import { NextResponse } from "next/server";
import { getAssetInfo, getAssetTxs, getAssetAddresses, getTip } from "@/lib/koios";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const out: any = {};
  try { const tip = await getTip(); out.tipOk = Array.isArray(tip) && tip.length > 0; } catch { out.tipOk = false; }
  try { const info = await getAssetInfo(); out.infoLen = info?.length ?? 0; } catch { out.infoLen = 0; }
  try { const txs = await getAssetTxs(); out.txsLen = txs?.[0]?.tx_hashes?.length ?? 0; } catch { out.txsLen = 0; }
  try { const addrs = await getAssetAddresses(1000); out.addrCount = addrs?.[0]?.address_count ?? addrs?.[0]?.addresses?.length ?? 0; } catch { out.addrCount = 0; }
  return NextResponse.json({ ok: true, ...out, ts: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
