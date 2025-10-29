// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "BOS CNT Explorer (Unofficial by Arubato)",
  description: "Track BOS (BitcoinOS) on Cardano: prices, trading and CNT on-chain metrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f1b] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <header className="mb-6 flex items-center gap-4">
            <div className="text-xl font-semibold">BOS CNT Explorer</div>
            <div className="flex-1"><SearchBar /></div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
