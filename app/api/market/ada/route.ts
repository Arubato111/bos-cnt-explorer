// app/api/market/ada/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge"; export const dynamic = "force-dynamic";

function n(x:any){ const v=Number(x); return Number.isFinite(v)?v:null; }

export async function GET() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd",
      { cache: "no-store", headers: { accept: "application/json" } }
    );
    const j = await r.json();
    return NextResponse.json(
      { ok: true, adaUsd: n(j?.cardano?.usd) },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ ok: false, adaUsd: null }, { status: 200 });
  }
}
