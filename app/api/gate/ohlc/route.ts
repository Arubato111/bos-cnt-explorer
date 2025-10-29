// app/api/gate/ohlc/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge"; export const dynamic = "force-dynamic";

// Gate.io returns [t, v, c, h, l, o] (strings). We map to {t, close}.
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const interval = sp.get("interval") || "1m";     // 1m,5m,15m,30m,1h,4h,1d
    const limit = Math.min(1000, Math.max(30, Number(sp.get("limit") || 60)));
    const url = `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=BOS_USDT&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const rows: string[][] = await r.json();
    const points = rows
      .map(a => ({ t: Number(a[0]) * 1000, close: Number(a[2]) }))
      .filter(p => Number.isFinite(p.t) && Number.isFinite(p.close))
      .sort((a,b) => a.t - b.t);
    return NextResponse.json({ ok: true, points }, { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } });
  } catch {
    return NextResponse.json({ ok: false, points: [] }, { status: 200 });
  }
}
