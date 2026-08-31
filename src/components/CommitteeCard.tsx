import { Users, Calendar, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Committee } from '../lib/types';
import { formatINR, formatINRShort, rupeesFromPaise } from '../lib/contract';
import { StatusBadge } from './Badges';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials } from '../lib/wallet';

interface CommitteeCardProps {
  committee: Committee;
  memberCount?: number;
  isOrganizer?: boolean;
}

export function CommitteeCard({ committee, memberCount, isOrganizer }: CommitteeCardProps) {
  const { navigate, theme } = useApp();
  const pot = committee.contribution_amount * committee.member_count;
  const cycleProgress =
    committee.status === 'completed' ? 1 : committee.current_cycle / committee.member_count;
  const fillCount = memberCount ?? 0;
  const fillPct = Math.round((fillCount / committee.member_count) * 100);

  if (theme === 'light') {
    return (
      <button
        onClick={() => navigate({ name: 'committee', id: committee.id })}
        className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left border border-slate-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex w-full flex-col justify-between"
        style={{ contain: 'layout style paint', transform: 'translateZ(0)' }}
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Subtle Hover Aura Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="space-y-4 relative z-10">
          {/* Header Row: Avatar + Title & Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm"
                style={{ background: avatarGradient(committee.name) }}
              >
                {initials(committee.name)}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight">
                  {committee.name}
                </h3>
                <p className="line-clamp-1 text-xs text-slate-500 font-medium">
                  {committee.description || `Organized by ${committee.organizer_name}`}
                </p>
              </div>
            </div>
            <StatusBadge status={committee.status} />
          </div>

          {/* 3-Box Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <StatLight label="Contribution" value={formatINRShort(committee.contribution_amount)} icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} />
            <StatLight label="Members" value={`${fillCount}/${committee.member_count}`} icon={<Users className="h-3.5 w-3.5 text-sky-500" />} />
            <StatLight label="Pot / Cycle" value={formatINRShort(pot)} icon={<Calendar className="h-3.5 w-3.5 text-amber-500" />} />
          </div>

          {/* Cycle Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="uppercase text-[10px] tracking-wider text-slate-400">
                {committee.status === 'forming' ? 'Capacity' : 'Rotation Progress'}
              </span>
              <span className="text-emerald-600 font-extrabold">
                {committee.status === 'forming' ? `${fillPct}%` : `${Math.round(cycleProgress * 100)}%`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-500 shadow-sm"
                style={{ width: `${(committee.status === 'forming' ? fillPct / 100 : cycleProgress) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200">
              {committee.asset_code}
            </span>
            {isOrganizer ? (
              <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                Organizer
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> On-Chain
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm group-hover:bg-emerald-600 group-hover:shadow-md transition-all duration-200">
            View Circle
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate({ name: 'committee', id: committee.id })}
      className="group relative overflow-hidden rounded-2xl p-6 text-left shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex w-full flex-col justify-between liquid-glass bg-slate-900/80 border border-white/10 text-white hover:border-emerald-500/40 hover:bg-slate-900/95"
      style={{ contain: 'layout style paint', transform: 'translateZ(0)' }}
    >
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Subtle Hover Aura Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="space-y-4 relative z-10">
        {/* Header Row: Avatar + Title & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm"
              style={{ background: avatarGradient(committee.name) }}
            >
              {initials(committee.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                {committee.name}
              </h3>
              <p className="line-clamp-1 text-xs text-slate-400 font-medium">
                {committee.description || `Organized by ${committee.organizer_name}`}
              </p>
            </div>
          </div>
          <StatusBadge status={committee.status} />
        </div>

        {/* 3-Box Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatDark label="Contribution" value={formatINRShort(committee.contribution_amount)} icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />} />
          <StatDark label="Members" value={`${fillCount}/${committee.member_count}`} icon={<Users className="h-3.5 w-3.5 text-sky-400" />} />
          <StatDark label="Pot / Cycle" value={formatINRShort(pot)} icon={<Calendar className="h-3.5 w-3.5 text-amber-400" />} />
        </div>

        {/* Cycle Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="uppercase text-[10px] tracking-wider text-slate-400">
              {committee.status === 'forming' ? 'Capacity' : 'Rotation Progress'}
            </span>
            <span className="text-emerald-400 font-extrabold">
              {committee.status === 'forming' ? `${fillPct}%` : `${Math.round(cycleProgress * 100)}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 transition-all duration-500 shadow-sm"
              style={{ width: `${(committee.status === 'forming' ? fillPct / 100 : cycleProgress) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-300 border border-white/10">
            {committee.asset_code}
          </span>
          {isOrganizer ? (
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/30">
              Organizer
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> On-Chain
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black shadow-md group-hover:bg-emerald-400 group-hover:text-black transition-all duration-200">
          View Circle
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

function StatLight({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50/90 p-2.5 border border-slate-200/70">
      <div className="flex items-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">{label}</span>
      </div>
      <div className="font-display text-xs font-extrabold text-slate-900 truncate">{value}</div>
    </div>
  );
}

function StatDark({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/10">
      <div className="flex items-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">{label}</span>
      </div>
      <div className="font-mono text-xs font-black text-white truncate">{value}</div>
    </div>
  );
}

export { rupeesFromPaise, formatINR };
