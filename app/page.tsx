// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-semibold">BOS CNT Explorer</h1>
      <p className="text-white/70">
        Live-Daten für den BOS-Token auf Cardano: Supply, Transfers, Adressen & Transaktionen.
      </p>
      <Link href="/token" className="w-fit rounded-xl bg-[#1a5cff] px-4 py-2 hover:bg-[#3270ff]">
        Zum Token-Dashboard
      </Link>
    </div>
  );
}
