import { Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import type { Committee } from '../lib/types';
import { formatINR, formatINRShort, rupeesFromPaise } from '../lib/contract';
import { StatusBadge } from './Badges';
import { useApp } from '../context/AppContext';

interface CommitteeCardProps {
  committee: Committee;
  memberCount?: number;
  isOrganizer?: boolean;
}

export function CommitteeCard({ committee, memberCount, isOrganizer }: CommitteeCardProps) {
  const { navigate } = useApp();
  const pot = committee.contribution_amount * committee.member_count;
  const cycleProgress =
    committee.status === 'completed' ? 1 : committee.current_cycle / committee.member_count;
  const fillCount = memberCount ?? 0;
  const fillPct = Math.round((fillCount / committee.member_count) * 100);

  return (
    <button
      onClick={() => navigate({ name: 'committee', id: committee.id })}
      className="card-hover group flex w-full flex-col p-5 text-left bg-white/95 backdrop-blur-xl border border-ink-200/90 shadow-soft hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden rounded-2xl"
    >
      {/* Top Animated Gradient Accent Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-75 group-hover:opacity-100 transition-opacity" />

      {/* Ambient Glow Aura on Hover */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10 pt-1">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-extrabold text-ink-900 group-hover:text-emerald-600 transition-colors tracking-tight">
            {committee.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500 font-medium">
            {committee.description || `Organized by ${committee.organizer_name}`}
          </p>
        </div>
        <StatusBadge status={committee.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 relative z-10">
        <Stat label="Contribution" value={formatINRShort(committee.contribution_amount)} icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} />
        <Stat label="Members" value={`${fillCount}/${committee.member_count}`} icon={<Users className="h-3.5 w-3.5 text-sky-500" />} />
        <Stat label="Pot / cycle" value={formatINRShort(pot)} icon={<Calendar className="h-3.5 w-3.5 text-amber-500" />} />
      </div>

      <div className="mt-4 relative z-10">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-ink-600">
          <span>{committee.status === 'forming' ? 'Members joined' : 'Cycle progress'}</span>
          <span className="text-emerald-600">{committee.status === 'forming' ? `${fillPct}%` : `${Math.round(cycleProgress * 100)}%`}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-150/80 p-0.5">
          <div
            className="h-full rounded-full gradient-brand transition-all duration-700 shadow-sm"
            style={{ width: `${(committee.status === 'forming' ? fillPct / 100 : cycleProgress) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 relative z-10">
        <div className="flex items-center gap-2 text-[11px] text-ink-400">
          <span className="font-mono bg-ink-100/70 px-2 py-0.5 rounded text-[10px] font-bold text-ink-600">{committee.asset_code}</span>
          {isOrganizer && <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-bold text-[10px]">Organizer</span>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white shadow-soft group-hover:bg-emerald-600 group-hover:shadow-md transition-all duration-200">
          View Circle
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-50/80 p-2.5 ring-1 ring-inset ring-ink-100/80">
      <div className="flex items-center gap-1.5 text-ink-400 mb-0.5">
        {icon}
        <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">{label}</span>
      </div>
      <div className="font-display text-xs font-extrabold text-ink-900 truncate">{value}</div>
    </div>
  );
}

export { rupeesFromPaise, formatINR };
