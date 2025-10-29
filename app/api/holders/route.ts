// app/api/holders/route.ts
import { NextResponse } from "next/server";
import {
  getAssetInfo,
  getAssetAddresses,
  extractDecimals,
  scale,
} from "@/lib/koios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [info, holdersResp] = await Promise.all([
      getAssetInfo().catch(() => []),
      getAssetAddresses(2000).catch(() => []), // großzügiges Limit
    ]);

    const asset = (info as any[])?.[0] ?? {};
    const decimals = extractDecimals(asset);

    // Koios kann zwei Formen zurückgeben:
    // 1) [{ addresses: [...], address_count: N }]
    // 2) Array von Einträgen (Fallback)
    const bucket = (holdersResp as any[])?.[0] ?? null;
    const list: any[] = bucket?.addresses ?? (Array.isArray(holdersResp) ? (holdersResp as any[]) : []);
    const totalHolders: number =
      typeof bucket?.address_count === "number" ? bucket.address_count : Array.isArray(list) ? list.length : 0;

    const top = (list || [])
      .map((h: any) => ({
        address: String(h?.address ?? ""),
        raw: Number(h?.quantity ?? 0),
        scaled: scale(h?.quantity ?? 0, decimals),
      }))
      .filter((x: any) => x.address)
      .sort((a: any, b: any) => b.raw - a.raw)
      .slice(0, 10);

    return NextResponse.json(
      {
        ok: true,
        decimals,
        totalHolders,
        top, // [{address, raw, scaled}]
        ts: Date.now(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "holders_fetch_failed" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
