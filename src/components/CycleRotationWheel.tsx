import { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, RefreshCw } from 'lucide-react';
import type { CommitteeDetail, MemberWithStatus } from '../lib/types';

export function CycleRotationWheel({
  committee,
  members,
}: {
  committee: CommitteeDetail;
  members: MemberWithStatus[];
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

  const radius = 90;
  const centerX = 130;
  const centerY = 130;
  const pot = committee.contribution_amount * total;

  return (
    <div className="card p-6 bg-slate-950 text-white relative overflow-hidden shadow-2xl border border-slate-800 rounded-2xl flex flex-col justify-between">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
        {/* SVG Interactive Rotation Wheel */}
        <div className="relative h-[260px] w-[260px] shrink-0 mx-auto">
          <svg className="h-full w-full" viewBox="0 0 260 260">
            {/* Outer Orbit Track */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth="3"
              strokeDasharray="6 4"
              className="animate-spin-slow opacity-60"
            />

            {/* Inner Ring */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius - 18}
              fill="none"
              stroke="url(#wheelGrad)"
              strokeWidth="2"
              opacity="0.5"
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

              return (
                <g key={i} className="transition-all duration-300">
                  {/* Line to center */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke={isCurrent ? '#10b981' : '#334155'}
                    strokeWidth={isCurrent ? '2' : '1'}
                    opacity={isCurrent ? 0.8 : 0.25}
                  />

                  {/* Circle Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isCurrent ? 15 : isHighlighted ? 13 : 11}
                    fill={isCurrent ? '#10b981' : isHighlighted ? '#3b82f6' : '#1e293b'}
                    stroke={isCurrent ? '#34d399' : '#475569'}
                    strokeWidth={isCurrent ? '2.5' : '1.5'}
                  />

                  {/* Slot Number */}
                  <text
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    fill={isCurrent || isHighlighted ? '#ffffff' : '#94a3b8'}
                    fontSize={isCurrent ? '10' : '9'}
                    fontWeight="bold"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Center Core Display */}
            <circle cx={centerX} cy={centerY} r="32" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
            <text x={centerX} y={centerY - 5} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
              CYCLE
            </text>
            <text x={centerX} y={centerY + 10} textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="800">
              {currentCycle}/{total}
            </text>
          </svg>
        </div>

        {/* Rotation Metrics & Status Panel */}
        <div className="space-y-3.5 w-full flex-1">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
              <RefreshCw className="h-3 w-3 animate-spin-slow" /> Soroban On-Chain Rotation
            </span>
            <h3 className="font-display text-base font-bold text-white">
              Active Pot Distribution Trajectory
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deterministic cycle progression backed by Soroban smart contract logic. Payout recipient rotates automatically every cycle.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Recipient</span>
              <span className="font-bold text-xs text-emerald-400 flex items-center gap-1 mt-0.5 truncate">
                <Trophy className="h-3 w-3 text-amber-400 shrink-0" />
                {members[currentCycle - 1]?.display_name || `Member #${currentCycle}`}
              </span>
            </div>

            <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Pot / Cycle</span>
              <span className="font-extrabold text-xs text-white block mt-0.5">
                ₹{pot.toLocaleString()} INR
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-950/40 p-2.5 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium truncate">Smart Contract Verified Payout</span>
            </div>
            <span className="font-mono font-bold text-[9px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded shrink-0">
              TESTNET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
