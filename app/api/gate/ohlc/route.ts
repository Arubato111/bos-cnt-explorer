// app/api/gate/ohlc/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Gate.io candlesticks: [t, v, c, h, l, o] as strings
export async function GET() {
  try {
    const url = "https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=BOS_USDT&interval=1m&limit=60";
    const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const rows: string[][] = await r.json();
    const points = rows
      .map(a => ({ t: Number(a[0]) * 1000, close: Number(a[2]) }))
      .filter(p => Number.isFinite(p.t) && Number.isFinite(p.close))
      .sort((a,b) => a.t - b.t);
    return NextResponse.json(
      { ok: true, points },
      { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch {
    return NextResponse.json({ ok: false, points: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
