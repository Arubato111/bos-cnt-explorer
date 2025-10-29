// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import SearchBar from "@/components/SearchBar";

export const metadata = {
  title: "BOS CNT Explorer",
  description: "Explorer & Analytics (inoffiziell, von Arubato).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-[#0b0d12] text-white">
        <header className="sticky top-0 z-50 backdrop-blur bg-black/30 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span className="text-white">BOS</span>{" "}
              <span className="text-[#66a3ff]">CNT</span>{" "}
              <span className="text-white/80">Explorer</span>
            </Link>
            <nav className="hidden md:flex gap-6 text-sm text-white/70">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/token" className="hover:text-white">Token</Link>
            </nav>
            <div className="ml-auto w-80 max-w-[50vw]">
              <SearchBar />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-white/40">
          Inoffiziell – von Arubato. Nicht mit BitcoinOS verbunden. © {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
