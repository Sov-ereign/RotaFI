import { useEffect, useState } from 'react';
import { ExternalLink, Cpu } from 'lucide-react';

const ITEMS = [
  '⚡ Stellar Testnet · Network Live',
  '🔒 Soroban Contract Verified: CATIMLHB…N4D',
  '💰 Total ROSCA Vault TVL: ₹1,25,000 INR',
  '👥 Active Members: 50+ Onboarded',
  '🏦 Yield APY: +4.8% on idle committee funds',
  '📈 Avg Finality: 4.8 seconds per block',
  '⭐ Credit Scores: 300–900 on-chain reputation',
  '🔗 Built with Stellar Soroban Smart Contracts',
];

export function NetworkTicker() {
  const [ledger, setLedger] = useState(54892104);

  useEffect(() => {
    const interval = setInterval(() => setLedger((prev) => prev + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const marqueeItems = [...ITEMS, ...ITEMS]; // duplicate for seamless loop

  return (
    <div
      className="relative overflow-hidden border-b border-slate-800/80 bg-slate-950 text-slate-300 text-[11px]"
      style={{ transform: 'translateZ(0)', contain: 'paint layout' }}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-slate-950 to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-slate-950 to-transparent" />

      {/* Fixed Left Panel */}
      <div className="absolute left-0 top-0 z-20 flex h-full items-center gap-4 bg-slate-950 pl-4 pr-6 border-r border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-bold text-white text-[11px] uppercase tracking-wider">Stellar Testnet</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
          <Cpu className="h-3 w-3 text-sky-400" />
          <span>Ledger <strong className="text-white">#{ledger.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Hardware-Accelerated Scrolling Marquee */}
      <div className="flex pl-56 py-2">
        <div className="flex animate-ticker whitespace-nowrap gap-8">
          {marqueeItems.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-slate-400 font-medium">
              <span className="h-1 w-1 rounded-full bg-emerald-500/60 inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Fixed Right Panel */}
      <div className="absolute right-0 top-0 z-20 flex h-full items-center gap-3 bg-slate-950 pl-6 pr-4 border-l border-slate-800/80">
        <a
          href="https://stellar.expert/explorer/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition"
        >
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
