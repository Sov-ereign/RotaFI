import { useState, useEffect } from 'react';
import { Sparkles, Trophy, ShieldCheck, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import type { Committee, Member } from '../lib/types';

export function CycleRotationWheel({
  committee,
  members,
}: {
  committee: Committee;
  members: Member[];
}) {
  const total = committee.member_count || members.length || 1;
  const currentCycle = committee.current_cycle || 1;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(timer);
  }, [total]);

  const radius = 110;
  const centerX = 150;
  const centerY = 150;

  return (
    <div className="card p-6 bg-gradient-to-b from-ink-900 to-slate-900 text-white relative overflow-hidden shadow-lift border border-ink-700/60">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sapphire-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* SVG Interactive Wheel */}
        <div className="relative h-[300px] w-[300px] shrink-0">
          <svg className="h-full w-full" viewBox="0 0 300 300">
            {/* Outer Orbit Track */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-spin-slow opacity-60"
            />

            {/* Inner Glowing Ring */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius - 20}
              fill="none"
              stroke="url(#wheelGrad)"
              strokeWidth="2"
              opacity="0.4"
            />

            <defs>
              <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Member Nodes around circumference */}
            {Array.from({ length: total }).map((_, i) => {
              const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              const isCurrent = i + 1 === currentCycle;
              const isHighlighted = i === activeIdx;
              const member = members[i];
              const name = member ? member.user_name : `Slot #${i + 1}`;

              return (
                <g key={i} className="transition-all duration-500">
                  {/* Connecting Line to Center */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke={isCurrent ? '#10b981' : '#334155'}
                    strokeWidth={isCurrent ? '2' : '1'}
                    opacity={isCurrent ? 0.8 : 0.3}
                  />

                  {/* Member Circle Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isCurrent ? 18 : isHighlighted ? 15 : 12}
                    fill={isCurrent ? '#10b981' : isHighlighted ? '#3b82f6' : '#1e293b'}
                    stroke={isCurrent ? '#34d399' : '#475569'}
                    strokeWidth={isCurrent ? '3' : '2'}
                    className="cursor-pointer transition-all duration-300"
                  />

                  {/* Slot Number */}
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill={isCurrent || isHighlighted ? '#ffffff' : '#94a3b8'}
                    fontSize={isCurrent ? '11' : '10'}
                    fontWeight="bold"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Center Core Display */}
            <circle cx={centerX} cy={centerY} r="38" fill="#0f172a" stroke="#10b981" strokeWidth="3" />
            <text x={centerX} y={centerY - 6} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
              CYCLE
            </text>
            <text x={centerX} y={centerY + 12} textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">
              {currentCycle}/{total}
            </text>
          </svg>
        </div>

        {/* Rotation Metrics & Status Panel */}
        <div className="space-y-4 max-w-md">
          <div className="space-y-1">
            <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" /> Soroban On-Chain Rotation
            </span>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2 mt-1">
              Active Pot Distribution Trajectory
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic cycle progression backed by Soroban smart contract logic. Payout recipient rotates automatically every cycle.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Recipient</span>
              <span className="font-semibold text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                {members[currentCycle - 1]?.user_name || `Member #${currentCycle}`}
              </span>
            </div>

            <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pot / Cycle</span>
              <span className="font-bold text-sm text-white block mt-0.5">
                ₹{((committee.contribution_amount || 0) * total).toLocaleString()} INR
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-950/40 p-3.5 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Smart Contract Verified Payout Engine</span>
            </div>
            <span className="font-mono font-bold text-[10px] bg-emerald-900/60 px-2 py-1 rounded">
              TESTNET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
