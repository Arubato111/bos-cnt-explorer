// components/CopyField.tsx
"use client";
import { useState } from "react";

export default function CopyField({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  async function onCopy() {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(()=>setOk(false), 1200); } catch {}
  }
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 font-mono break-all text-sm">{value}</div>
      <button onClick={onCopy} className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
        {ok ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
