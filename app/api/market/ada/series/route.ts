// app/api/market/ada/series/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge"; export const dynamic = "force-dynamic";

const MAP = { "1h": { days: "1", interval: "minute" }, "24h": { days: "1", interval: "hourly" }, "7d": { days: "7", interval: "hourly" } };

export async function GET(req: NextRequest) {
  try {
    const range = (new URL(req.url).searchParams.get("range") || "1h") as "1h"|"24h"|"7d";
    const m = MAP[range] || MAP["1h"];
    const url = `https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=${m.days}&interval=${m.interval}`;
    const r = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(String(r.status));
    const j:any = await r.json();
    const points = Array.isArray(j?.prices) ? j.prices.map((p:any)=>({ t: Number(p[0]), usd: Number(p[1]) })).filter((x:any)=>Number.isFinite(x.t)&&Number.isFinite(x.usd)) : [];
    return NextResponse.json({ ok:true, points }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ ok:false, points:[] }, { status:200 });
  }
}
