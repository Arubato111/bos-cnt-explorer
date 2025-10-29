// components/SearchBar.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const isTxHash = (v: string) => /^[0-9a-f]{64}$/i.test(v.trim());
const isAddr = (v: string) => v.startsWith("addr1") || v.startsWith("DdzFF");

export default function SearchBar() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    if (isTxHash(v)) router.push(`/tx/${v}`);
    else if (isAddr(v)) router.push(`/address/${v}`);
    else router.push(`/token?search=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={go} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Adresse oder Tx-Hash einfügen und Enter…"
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-[#66a3ff]"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 rounded-lg px-3 py-1 bg-[#1a5cff] hover:bg-[#3270ff]"
      >
        Search
      </button>
    </form>
  );
}
