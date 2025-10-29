// components/PriceChart.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = { t: number; close: number };
type OhlcResp = { ok: boolean; points: Point[] };

export default function PriceChart() {
  const [data, setData] = useState<Point[]>([]);
  const [hover, setHover] = useState<{ x: number; y: number; t: number; v: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/gate/ohlc", { cache: "no-store" });
      const j: OhlcResp = await r.json();
      if (j?.ok && j.points?.length) setData(j.points);
    } catch {}
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const { path, min, max, ticksX, ticksY } = useMemo(() => {
    const w = 600, h = 200, pad = 36;
    if (!data.length) return { path: "", min: 0, max: 0, ticksX: [] as number[], ticksY: [] as number[] };
    const closes = data.map(d => d.close);
    const mn = Math.min(...closes);
    const mx = Math.max(...closes);
    const span = mx - mn || 1;

    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
    const d = data.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (p.close - mn) / span);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    // simple 4 ticks on Y
    const ticksY = Array.from({ length: 5 }, (_, i) => mn + (span * i) / 4);
    // 4 ticks on X
    const ticksX = [0, Math.floor(data.length/3), Math.floor(2*data.length/3), data.length - 1].filter(i => i >= 0);

    return { path: d, min: mn, max: mx, ticksX, ticksY };
  }, [data]);

  function fmtMoney(n: number | null, f = 6) {
    if (n == null) return "–";
    return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: f }).format(n)}`;
  }
  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !data.length) return;
    const svg = svgRef.current.getBoundingClientRect();
    const w = 600, h = 200, pad = 36;
    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
    const relX = Math.max(0, Math.min(w, e.clientX - svg.left));
    const idx = Math.round((relX - pad) / stepX);
    const i = Math.max(0, Math.min(data.length - 1, idx));
    const closes = data.map(d => d.close);
    const mn = Math.min(...closes), mx = Math.max(...closes);
    const span = mx - mn || 1;
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (data[i].close - mn) / span);
    setHover({ x, y, t: data[i].t, v: data[i].close });
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-sm mb-2">CNT BOS/USDT – last 60 minutes (Gate.io)</div>

      <div className="relative">
        {/* Chart */}
        <svg
          ref={svgRef}
          viewBox="0 0 600 200"
          className="w-full h-[220px]"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Live price chart"
        >
          {/* Grid */}
          <g stroke="currentColor" opacity="0.15">
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1="36" x2="564" y1={36 + i * (200 - 72) / 4} y2={36 + i * (200 - 72) / 4} />
            ))}
          </g>

          {/* Axes */}
          <g stroke="currentColor" opacity="0.3">
            <line x1="36" y1="36" x2="36" y2="164" />
            <line x1="36" y1="164" x2="564" y2="164" />
          </g>

          {/* Y ticks */}
          <g fill="currentColor" opacity="0.6" fontSize="10">
            {ticksY.map((v, i) => {
              const y = 36 + i * (200 - 72) / 4;
              return <text key={i} x={6} y={y + 3}>{fmtMoney(v, 6)}</text>;
            })}
          </g>

          {/* X ticks */}
          <g fill="currentColor" opacity="0.6" fontSize="10">
            {ticksX.map((i, k) => {
              const x = 36 + (i / Math.max(1, data.length - 1)) * (564 - 36);
              const d = new Date(data[i]?.t ?? Date.now());
              const lbl = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              return <text key={k} x={x - 12} y={180}>{lbl}</text>;
            })}
          </g>

          {/* Line */}
          <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />

          {/* Hover */}
          {hover && (
            <>
              <line x1={hover.x} x2={hover.x} y1={36} y2={164} stroke="currentColor" opacity="0.35" />
              <circle cx={hover.x} cy={hover.y} r={3} fill="currentColor" />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hover && (
          <div className="absolute -mt-2 px-2 py-1 rounded bg-black/70 text-xs"
               style={{ left: Math.max(0, hover.x - 60), top: Math.max(0, hover.y - 36) }}>
            <div>{new Date(hover.t).toLocaleTimeString()}</div>
            <div className="font-mono">{fmtMoney(hover.v, 6)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
