// app/api/token/summary/route.ts
import { NextResponse } from "next/server";
import { getAssetInfo, getAssetTxs, extractDecimals, scale } from "@/lib/koios";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [info, txs] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetTxs().catch(() => []),
    ]);

    const asset = (info as any[])?.[0] ?? {};
    const decimals = extractDecimals(asset);
    const totalSupply = scale(asset?.total_supply ?? 0, decimals);
    const txCount = ((txs as any[])?.[0]?.tx_hashes ?? []).length;

    return NextResponse.json(
      { ok: true, decimals, totalSupply, txCount, policyId: asset?.policy_id ?? null, assetHex: asset?.asset_name ?? null, ts: Date.now() },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
