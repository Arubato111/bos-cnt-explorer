'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * BOS CNT Explorer — Single-file UI v3
 * - Dual price strip: BOS/USDT (Gate) + BOS/ADA (derived via CoinGecko)
 * - Tabbed chart: BOS/USDT vs BOS/ADA with 1H/24H/7D
 * - English UI, clear sources, “Derived” badge for ADA
 * No extra API routes needed (direct fetch to Gate.io & CoinGecko).
 */

// ------- Config -------
const POLICY_ID = '1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d';
const CNT_ASSET_ID =
  '1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e';
const FINGERPRINT = 'asset1mfx4kv75jstyws0u0lpe70w7ny76lhsswampzd';

// ------- Helpers -------
function money(n: number | null | undefined, f = 6) {
  if (n == null || !Number.isFinite(n)) return 'Not available yet';
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: f }).format(n)}`;
}
function num(n: number | null | undefined, f = 6) {
  if (n == null || !Number.isFinite(n)) return 'Not available yet';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: f }).format(n);
}

// ------- Data hooks (direct public APIs) -------
type GateTicker = {
  currency_pair: string;
  last: string;
  base_volume: string;
  quote_volume: string;
  change_percentage?: string;
};
type GateCandle = string[]; // [t, v, c, h, l, o] strings
type CGSimple = { [k: string]: { usd: number } };
type CGSeries = { prices: [number, number][] };

function useGateTicker() {
  const [state, setState] = useState<{ price: number | null; volUSDT: number | null; volBOS: number | null }>({
    price: null,
    volUSDT: null,
    volBOS: null,
  });
  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const r = await fetch(
          'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BOS_USDT',
          { cache: 'no-store', headers: { accept: 'application/json' } }
        );
        const arr: GateTicker[] = await r.json();
        const t = arr?.[0];
        if (!cancel) {
          setState({
            price: t?.last ? Number(t.last) : null,
            volUSDT: t?.quote_volume ? Number(t.quote_volume) : null,
            volBOS: t?.base_volume ? Number(t.base_volume) : null,
          });
        }
      } catch {
        if (!cancel) setState({ price: null, volUSDT: null, volBOS: null });
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, []);
  return state;
}

function useGateSeries(range: '1h' | '24h' | '7d') {
  const [points, setPoints] = useState<{ t: number; close: number }[]>([]);
  useEffect(() => {
    let cancel = false;
    async function load() {
      // Map range -> interval/limit
      const cfg =
        range === '1h'
          ? { interval: '1m', limit: 60 }
          : range === '24h'
          ? { interval: '15m', limit: 96 }
          : { interval: '1h', limit: 168 };
      try {
        const url = `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=BOS_USDT&interval=${cfg.interval}&limit=${cfg.limit}`;
        const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
        const rows: GateCandle[] = await r.json();
        const pts =
          rows
            ?.map((a) => ({ t: Number(a[0]) * 1000, close: Number(a[2]) }))
            ?.filter((p) => Number.isFinite(p.t) && Number.isFinite(p.close))
            ?.sort((a, b) => a.t - b.t) ?? [];
        if (!cancel) setPoints(pts);
      } catch {
        if (!cancel) setPoints([]);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [range]);
  return points;
}

function useAdaUsd(range: '1h' | '24h' | '7d') {
  const [latestUsd, setLatestUsd] = useState<number | null>(null);
  const [series, setSeries] = useState<{ t: number; usd: number }[]>([]);
  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        // Latest ADA/USD
        const r1 = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd',
          { cache: 'no-store', headers: { accept: 'application/json' } }
        );
        const j1: CGSimple = await r1.json();
        if (!cancel) setLatestUsd(j1?.cardano?.usd ?? null);
      } catch {
        if (!cancel) setLatestUsd(null);
      }
      try {
        // Series
        const cfg = range === '1h' ? { days: '1', interval: 'minute' } : range === '24h' ? { days: '1', interval: 'hourly' } : { days: '7', interval: 'hourly' };
        const url = `https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=${cfg.days}&interval=${cfg.interval}`;
        const r2 = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
        const j2: CGSeries = await r2.json();
        const pts =
          Array.isArray(j2?.prices)
            ? j2.prices.map((p) => ({ t: Number(p[0]), usd: Number(p[1]) })).filter((x) => Number.isFinite(x.t) && Number.isFinite(x.usd))
            : [];
        if (!cancel) setSeries(pts);
      } catch {
        if (!cancel) setSeries([]);
      }
    }
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [range]);
  return { latestUsd, series };
}

// ------- UI pieces (inline) -------
function HeaderBar() {
  return (
    <header className="mb-6 flex items-center gap-4">
      <div className="text-xl font-semibold">BOS CNT Explorer</div>
      <div className="flex-1">
        <input
          placeholder="Search by Cardano address or transaction hash…"
          className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/15 outline-none focus:border-[#66a3ff]"
          onKeyDown={(e: any) => {
            const v = (e.target as HTMLInputElement).value.trim();
            if (e.key === 'Enter' && v) {
              const isHex64 = /^[0-9a-f]{64}$/i.test(v);
              const isAddr = /^addr1[0-9a-z]+$/i.test(v);
              if (isHex64) window.location.href = `/tx/${v}`;
              else if (isAddr) window.location.href = `/address/${v}`;
              else window.location.href = `/token`;
            }
          }}
        />
      </div>
      <nav className="hidden md:flex items-center gap-3 text-sm">
        <Link href="https://bitcoinos.build/" target="_blank" className="text-[#66a3ff] hover:underline">Website</Link>
        <Link href="https://x.com/BTC_OS" target="_blank" className="text-[#66a3ff] hover:underline">X</Link>
        <Link href="https://linktr.ee/bitcoinos" target="_blank" className="text-[#66a3ff] hover:underline">Discord</Link>
      </nav>
    </header>
  );
}

function HeroBlock() {
  return (
    <section className="grid gap-6 md:grid-cols-3 items-start">
      <div className="md:col-span-2">
        <div className="text-xs text-white/60">UI v3 active</div>
        <h1 className="text-3xl md:text-4xl font-semibold mt-1">BOS CNT Explorer</h1>
        <p className="mt-3 text-white/80">
          Unofficial explorer by <strong>Arubato</strong> for tracking the <strong>BOS</strong> (BitcoinOS) token activity on <strong>Cardano</strong>.
          The goal is to monitor the BOS ecosystem on Cardano’s CNT standard.
        </p>
        <p className="mt-3 text-white/70">
          <strong>What is BitcoinOS?</strong> A smart-contract operating system to scale Bitcoin using rollups and ZK.{' '}
          <Link href="https://bitcoinos.build/" className="text-[#66a3ff] hover:underline" target="_blank">Website</Link>{' · '}
          <Link href="https://x.com/BTC_OS" className="text-[#66a3ff] hover:underline" target="_blank">X (Twitter)</Link>{' · '}
          <Link href="https://linktr.ee/bitcoinos" className="text-[#66a3ff] hover:underline" target="_blank">Discord</Link>.
        </p>
        <p className="mt-3 text-white/70">
          <strong>Cardano’s role:</strong> Cardano hosts the BOS <em>CNT</em> token for liquidity and community trading within its DeFi ecosystem.
        </p>
        <p className="mt-3 text-xs text-white/60">
          Data sources: Gate.io (BOS/USDT), CoinGecko (USD & ADA). If a metric is not available right now, we display <em>Not available yet</em>.
        </p>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Official Contracts</div>
        <ul className="mt-2 text-sm space-y-2">
          <li><strong>Cardano (CNT)</strong>
            <div className="font-mono text-xs break-all">Asset ID: {CNT_ASSET_ID}</div>
            <div className="font-mono text-xs break-all">Policy ID: {POLICY_ID}</div>
            <div className="font-mono text-xs break-all">Fingerprint: {FINGERPRINT}</div>
          </li>
          <li><strong>Ethereum (ERC-20)</strong>
            <div className="font-mono text-xs break-all">0x13239C268BEDDd88aD0Cb02050D3ff6a9d00de6D</div>
          </li>
          <li><strong>BNB Chain (BEP-20)</strong>
            <div className="font-mono text-xs break-all">0xAe1E85c3665b70B682dEfd778E3dAFDF09ed3B0f</div>
          </li>
        </ul>
        <p className="mt-3 text-xs text-white/60">
          Currently, Gate.io lists both <strong>ERC-20</strong> and <strong>CNT</strong>. We track the <strong>CNT</strong> market because Gate.io is presently the only centralized venue for BOS-CNT. A Minswap pool is expected soon (per BitcoinOS).
        </p>
      </div>
    </section>
  );
}

function DualPriceStrip() {
  const gate = useGateTicker();
  const [bosUsd, setBosUsd] = useState<number | null>(null);
  const [adaUsd, setAdaUsd] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    async function loadUsd() {
      try {
        // BOS/USD: we use Gate BOS/USDT (peg) as USD proxy; if you prefer CoinGecko BOS, replace here.
        const bos = gate.price ?? null;
        if (!cancel) setBosUsd(bos ?? null);
      } catch {
        if (!cancel) setBosUsd(null);
      }
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd',
          { cache: 'no-store', headers: { accept: 'application/json' } }
        );
        const j: CGSimple = await r.json();
        if (!cancel) setAdaUsd(j?.cardano?.usd ?? null);
      } catch {
        if (!cancel) setAdaUsd(null);
      }
    }
    loadUsd();
    const id = setInterval(loadUsd, 15000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [gate.price]);

  const bosAda = bosUsd != null && adaUsd != null && adaUsd > 0 ? bosUsd / adaUsd : null;

  return (
    <section className="grid md:grid-cols-2 gap-4">
      <Tile
        title="BOS/USDT (CNT)"
        value={money(gate.price, 6)}
        subLeft={`24h Vol (USDT): ${money(gate.volUSDT, 0)}`}
        subRight={`24h Vol (BOS): ${num(gate.volBOS, 0)} BOS`}
        badge="Source: Gate.io"
        link={{ href: 'https://www.gate.io/trade/BOS_USDT', label: 'Trade' }}
      />
      <Tile
        title="BOS/ADA"
        value={num(bosAda, 6)}
        subLeft={`BOS/USD: ${money(bosUsd, 6)}`}
        subRight={`ADA/USD: ${money(adaUsd, 6)}`}
        badge="Derived from USD feeds (CoinGecko)"
      />
    </section>
  );
}

function Tile({
  title,
  value,
  subLeft,
  subRight,
  badge,
  link,
}: {
  title: string;
  value: string;
  subLeft?: string;
  subRight?: string;
  badge?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        {badge ? <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">{badge}</span> : null}
      </div>
      <div className="mt-1 text-2xl">{value}</div>
      <div className="mt-1 text-xs text-white/70 flex items-center justify-between gap-3">
        <span className="truncate">{subLeft ?? '\u00A0'}</span>
        <span className="truncate">{subRight ?? '\u00A0'}</span>
      </div>
      {link ? (
        <div className="mt-2 text-sm">
          <a className="text-[#66a3ff] hover:underline" target="_blank" rel="noreferrer" href={link.href}>
            {link.label}
          </a>
        </div>
      ) : null}
    </div>
  );
}

function TabbedChart() {
  type Range = '1h' | '24h' | '7d';
  type Tab = 'usdt' | 'ada';

  const [tab, setTab] = useState<Tab>('usdt');
  const [range, setRange] = useState<Range>('1h');

  const gate = useGateSeries(range);
  const ada = useAdaUsd(range);

  const adaDerived = useMemo(() => {
    if (!gate.length || !ada.series.length) return [] as { t: number; v: number }[];
    const a = ada.series;
    const g = gate;
    return g
      .map((p) => {
        // nearest ADA point
        let idx = 0,
          best = Infinity;
        for (let i = 0; i < a.length; i++) {
          const d = Math.abs(a[i].t - p.t);
          if (d < best) {
            best = d;
            idx = i;
          }
        }
        const adaUsd = a[idx].usd;
        const bosUsd = p.close; // USDT peg
        const v = adaUsd > 0 ? bosUsd / adaUsd : null;
        return v != null ? { t: p.t, v } : null;
      })
      .filter(Boolean) as { t: number; v: number }[];
  }, [gate, ada.series]);

  const series = tab === 'usdt' ? gate.map((p) => ({ t: p.t, v: p.close })) : adaDerived;
  const yLabel = tab === 'usdt' ? 'Price (USD/T)' : 'Price (ADA)';
  const sourceLabel = tab === 'usdt' ? 'Source: Gate.io' : 'Derived: BOS/USD ÷ ADA/USD (CoinGecko)';

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TabButton active={tab === 'usdt'} onClick={() => setTab('usdt')}>
            BOS/USDT
          </TabButton>
          <TabButton active={tab === 'ada'} onClick={() => setTab('ada')}>
            BOS/ADA
          </TabButton>
        </div>
        <div className="flex items-center gap-2">
          <RangeButton active={range === '1h'} onClick={() => setRange('1h')}>
            1H
          </RangeButton>
          <RangeButton active={range === '24h'} onClick={() => setRange('24h')}>
            24H
          </RangeButton>
          <RangeButton active={range === '7d'} onClick={() => setRange('7d')}>
            7D
          </RangeButton>
        </div>
      </header>

      <SVGChart series={series} yLabel={yLabel} sourceLabel={sourceLabel} />
      {tab === 'ada' ? (
        <p className="text-xs text-white/60 mt-2">
          Until a native BOS/ADA pool is live on Cardano DEX, this series is derived from USD feeds.
          Latest BOS/USD: {money(gate[gate.length - 1]?.close ?? null, 6)} · ADA/USD: {money(ada.latestUsd ?? null, 6)}
        </p>
      ) : null}
    </section>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-lg ${active ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}>
      {children}
    </button>
  );
}
function RangeButton({ active, children, onClick }: { active: boolean; children: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded ${active ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}>
      {children}
    </button>
  );
}

function SVGChart({ series, yLabel, sourceLabel }: { series: { t: number; v: number }[]; yLabel: string; sourceLabel: string }) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; v: number } | null>(null);
  const w = 720,
    h = 260,
    pad = 40;

  const xs = series.map((p) => p.t),
    ys = series.map((p) => p.v);
  const mn = ys.length ? Math.min(...ys) : 0,
    mx = ys.length ? Math.max(...ys) : 1;
  const span = mx - mn || 1;
  const x0 = xs[0] ?? 0,
    x1 = xs[xs.length - 1] ?? 1;

  const path = series
    .map((p, i) => {
      const xr = (p.t - x0) / (x1 - x0 || 1);
      const x = pad + xr * (w - 2 * pad);
      const y = pad + (h - 2 * pad) * (1 - (p.v - mn) / span);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  function fmt(n: number, f = 6) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: f }).format(n);
  }

  return (
    <div className="mt-3 relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[280px]"
        onMouseMove={(e) => {
          if (!series.length) return;
          const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
          const rx = e.clientX - rect.left;
          const ratio = Math.min(1, Math.max(0, (rx - pad) / (w - 2 * pad)));
          const idx = Math.round(ratio * (series.length - 1));
          const p = series[idx];
          const x = pad + ratio * (w - 2 * pad);
          const y = pad + (h - 2 * pad) * (1 - (p.v - mn) / span);
          setHover({ x, y, label: new Date(p.t).toLocaleString(), v: p.v });
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* grid */}
        <g stroke="currentColor" opacity="0.15">
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={pad} x2={w - pad} y1={pad + (i * (h - 2 * pad)) / 4} y2={pad + (i * (h - 2 * pad)) / 4} />
          ))}
        </g>
        {/* axes */}
        <g stroke="currentColor" opacity="0.3">
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} />
        </g>
        {/* y ticks */}
        <g fill="currentColor" opacity="0.6" fontSize="10">
          {Array.from({ length: 5 }, (_, i) => {
            const yy = pad + (i * (h - 2 * pad)) / 4;
            const val = mn + (span * i) / 4;
            return (
              <text key={i} x={6} y={yy + 3}>
                {fmt(val, 6)}
              </text>
            );
          })}
          <text x={6} y={14}>
            {yLabel}
          </text>
        </g>
        {/* line */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
        {/* hover */}
        {hover && (
          <>
            <line x1={hover.x} x2={hover.x} y1={pad} y2={h - pad} stroke="currentColor" opacity="0.35" />
            <circle cx={hover.x} cy={hover.y} r={3} fill="currentColor" />
          </>
        )}
      </svg>
      <div className="mt-1 text-xs text-white/60">{sourceLabel}</div>
      {hover && (
        <div
          className="absolute px-2 py-1 rounded bg-black/70 text-xs"
          style={{ left: Math.max(0, hover.x - 60), top: Math.max(0, hover.y - 30) }}
        >
          <div>{hover.label}</div>
          <div className="font-mono">{fmt(hover.v, 6)}</div>
        </div>
      )}
    </div>
  );
}

// ------- Page -------
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0f1b] text-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <HeaderBar />
        <HeroBlock />

        {/* Dual price strip */}
        <div className="mt-6">
          <DualPriceStrip />
        </div>

        {/* Tabbed chart */}
        <div className="mt-6">
          <TabbedChart />
        </div>

        {/* Quick links & copy */}
        <section className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60">BOS CNT Asset (Cardano)</div>
            <div className="mt-1 font-mono break-all text-sm">{CNT_ASSET_ID}</div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(CNT_ASSET_ID);
                  alert('Asset ID copied');
                } catch {}
              }}
              className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Copy
            </button>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60">Quick Links</div>
            <ul className="mt-2 text-sm space-y-2">
              <li>
                <a className="text-[#66a3ff] hover:underline" target="_blank" href={`https://cardanoscan.io/token/${CNT_ASSET_ID}`}>
                  BOS CNT on Cardanoscan
                </a>
              </li>
              <li>
                <a className="text-[#66a3ff] hover:underline" target="_blank" href="https://www.gate.io/trade/BOS_USDT">
                  Gate.io BOS/USDT (CNT)
                </a>
              </li>
              <li>
                <a className="text-[#66a3ff] hover:underline" target="_blank" href="/token">
                  Token dashboard
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-white/60">
              Purpose: track the BOS ecosystem on Cardano (CNT) — prices, trading, and, as soon as available, live on-chain metrics.
            </p>
          </div>
        </section>

        <footer className="mt-10 text-xs text-white/60">Unofficial — by Arubato. Not affiliated with BitcoinOS. © 2025</footer>
      </div>
    </main>
  );
}
