// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  const holderRows: { address: string; scaled: number; raw?: number }[] = [
    {
      address: "addr1qxyzexample1",
      scaled: 1000,
      raw: 1000000,
    },
    {
      address: "addr1qxyzexample2",
      scaled: 500,
      raw: 500000,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-8">
      <h1 className="text-3xl font-semibold mb-4">BOS CNT Explorer</h1>
      <p className="text-white/70 mb-8">
        Willkommen im offiziellen BOS Token Explorer. Verwenden Sie die Suche
        oben, um Adressen oder Transaktionen zu finden.
      </p>

      <div className="rounded-2xl bg-white/5 border border-white/10">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Beispiel – Top Holder</h2>
          <Link
            href="/token"
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
          >
            Zum Token
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left">
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Balance (BOS)</th>
              </tr>
            </thead>
            <tbody>
              {holderRows.map(
                (h: { address: string; scaled: number; raw?: number }) => (
                  <tr
                    key={h.address}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-2 truncate">{h.address}</td>
                    <td className="px-4 py-2">{h.scaled}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-10 text-white/40 text-sm">
        © {new Date().getFullYear()} BOS CNT Explorer
      </footer>
    </main>
  );
}
