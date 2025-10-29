// components/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="grid gap-6 md:grid-cols-3 items-start">
      <div className="md:col-span-2">
        <h1 className="text-3xl md:text-4xl font-semibold">BOS CNT Explorer</h1>
        <p className="mt-3 text-white/80">
          Unofficial explorer by <strong>Arubato</strong> for tracking the <strong>BOS</strong> (BitcoinOS) token activity on <strong>Cardano</strong>.
          Our goal is to surface the live market picture and the on-chain footprint of the BOS <em>CNT</em> asset.
        </p>
        <p className="mt-3 text-white/70">
          <strong>What is BitcoinOS?</strong> A smart-contract operating system built to unify and scale Bitcoin with ZK and rollups.{" "}
          <Link href="https://bitcoinos.build/" className="text-[#66a3ff] hover:underline" target="_blank">Website</Link>{" · "}
          <Link href="https://x.com/BTC_OS" className="text-[#66a3ff] hover:underline" target="_blank">X (Twitter)</Link>{" · "}
          <Link href="https://linktr.ee/bitcoinos" className="text-[#66a3ff] hover:underline" target="_blank">Discord</Link>.
        </p>
        <p className="mt-3 text-white/70">
          <strong>Role of Cardano:</strong> Cardano hosts the <em>CNT</em> representation of BOS for liquidity and community trading within its DeFi ecosystem.
        </p>
        <p className="mt-3 text-xs text-white/60">
          Data sources: market from CoinGecko & Gate.io; on-chain (holders, supply, transfers) from Koios. If a metric is not available yet, we show <em>Not available yet</em>. 
        </p>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-xs text-white/60">Official Contracts</div>
        <ul className="mt-2 text-sm space-y-2">
          <li><strong>Cardano (CNT)</strong><div className="font-mono text-xs break-all">
            1fa8a8909a66bb5c850c1fc3fe48903a5879ca2c1c9882e9055eef8d0014df10424f5320546f6b656e
          </div></li>
          <li><strong>Ethereum (ERC-20)</strong><div className="font-mono text-xs break-all">
            0x13239C268BEDDd88aD0Cb02050D3ff6a9d00de6D
          </div></li>
          <li><strong>BNB Chain (BEP-20)</strong><div className="font-mono text-xs break-all">
            0xAe1E85c3665b70B682dEfd778E3dAFDF09ed3B0f
          </div></li>
        </ul>
        <p className="mt-3 text-xs text-white/60">
          Currently, Gate.io lists both <strong>ERC-20</strong> and <strong>CNT</strong>. We reference the CNT market because Gate.io is presently the only centralized venue for BOS-CNT. Minswap pool is expected soon (per BitcoinOS).
        </p>
      </div>
    </section>
  );
}
