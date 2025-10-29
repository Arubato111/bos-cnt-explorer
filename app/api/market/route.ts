// app/api/market/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Stats = {
  ok: true;
  rank: number | null;
  marketCapUsd: number | null;
  circulating: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  fdvUsd: number | null;
  mcToFdvPct: number | null;
  athUsd: number | null;
  athDate: string | null;
  atlUsd: number | null;
  atlDate: string | null;
  releaseDate: string | null;
  priceUsd: number | null;
};

function n(x: any): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

export async function GET() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/bitcoinos?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";
    const r = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "BOS-CNT-Explorer/1.0" },
    });
    if (!r.ok) throw new Error(String(r.status));
    const j: any = await r.json();

    const md = j?.market_data ?? {};
    const priceUsd = n(md?.current_price?.usd);
    const marketCapUsd = n(md?.market_cap?.usd);
    const fdvUsd = n(md?.fully_diluted_valuation?.usd);
    const circulating = n(md?.circulating_supply);
    const totalSupply = n(md?.total_supply);
    const maxSupply = n(md?.max_supply);
    const rank = n(j?.market_cap_rank);
    const releaseDate = j?.genesis_date || null;

    const athUsd = n(md?.ath?.usd);
    const athDate = md?.ath_date?.usd ? new Date(md.ath_date.usd).toISOString() : null;
    const atlUsd = n(md?.atl?.usd);
    const atlDate = md?.atl_date?.usd ? new Date(md.atl_date.usd).toISOString() : null;

    const mcToFdvPct =
      marketCapUsd != null && fdvUsd && fdvUsd > 0 ? Math.round((marketCapUsd / fdvUsd) * 10000) / 100 : null;

    const data: Stats = {
      ok: true,
      rank,
      marketCapUsd,
      circulating,
      totalSupply,
      maxSupply,
      fdvUsd,
      mcToFdvPct,
      athUsd,
      athDate,
      atlUsd,
      atlDate,
      releaseDate,
      priceUsd,
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
