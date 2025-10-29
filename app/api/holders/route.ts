// app/api/holders/route.ts
import { NextResponse } from "next/server";
import { getAssetInfo, getAssetAddresses, extractDecimals, scale } from "@/lib/koios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [info, holdersResp] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetAddresses(20000).catch(() => []),
    ]);

    const asset = (info as any[])?.[0] ?? {};
    const decimals = extractDecimals(asset);

    const bucket = (holdersResp as any[])?.[0] ?? {};
    const list: any[] = bucket?.addresses ?? (Array.isArray(holdersResp) ? (holdersResp as any[]) : []);
    const totalHolders: number =
      typeof bucket?.address_count === "number"
        ? bucket.address_count
        : Array.isArray(list) ? list.length : 0;

    const norm = (list || [])
      .map((h: any) => ({
        address: String(h?.address ?? h?.payment_address ?? ""),
        raw: Number(h?.quantity ?? h?.asset_qty ?? 0),
      }))
      .filter((x) => x.address);

    const circulatingRaw = norm.reduce((acc, x) => acc + (Number.isFinite(x.raw) ? x.raw : 0), 0);
    const circulating = scale(circulatingRaw, decimals);

    const top = norm
      .slice()
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 10)
      .map((x) => ({ ...x, scaled: scale(x.raw, decimals) }));

    // CDN-cachebar für 30s, trotzdem im Server SSR kein Stale
    return NextResponse.json(
      { ok: true, decimals, totalHolders, top, circulating, ts: Date.now() },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "holders_fetch_failed" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
