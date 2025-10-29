// app/api/gate/ticker/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Tkr = {
  currency_pair: string;
  last: string;
  base_volume: string;
  quote_volume: string;
  change_percentage?: string;
};

export async function GET() {
  try {
    const url = "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BOS_USDT";
    const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const arr: Tkr[] = await r.json();
    const t = arr?.[0];
    const price = t?.last ? Number(t.last) : null;
    const volBOS = t?.base_volume ? Number(t.base_volume) : null;
    const volUSDT = t?.quote_volume ? Number(t.quote_volume) : null;
    const chg = t?.change_percentage ? Number(t.change_percentage) : null;
    return NextResponse.json(
      { ok: true, price, volBOS, volUSDT, changePct: chg, pair: "BOS/USDT", exchange: "Gate.io" },
      { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
