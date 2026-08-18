import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap, Coins, ExternalLink, Cpu } from 'lucide-react';

export function NetworkTicker() {
  const [ledger, setLedger] = useState(54892104);
  const [tvl, setTvl] = useState(125000);

  useEffect(() => {
    const interval = setInterval(() => {
      setLedger((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950 text-slate-300 text-xs border-b border-slate-800/90 py-2 px-4 shadow-inner">
      <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        
        {/* Left: Network Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-white uppercase text-[10px] tracking-wider">Stellar Testnet</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Cpu className="h-3 w-3 text-sky-400" />
            <span>Ledger <strong className="text-white">#{ledger.toLocaleString()}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Avg Finality: <strong className="text-emerald-400">4.8s</strong></span>
          </div>
        </div>

        {/* Center: Live Contract Metrics */}
        <div className="hidden md:flex items-center gap-6 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Contract: <code className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 border border-slate-800">CATIMLHB…N4D</code></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span>Total ROSCA Vault TVL: <strong className="text-white font-bold">₹{tvl.toLocaleString()} INR</strong></span>
          </div>
        </div>

        {/* Right: Explorer Link */}
        <div className="flex items-center gap-2">
          <a
            href="https://stellar.expert/explorer/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            <span>Stellar Expert Explorer</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
