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
      className="card-hover group flex w-full flex-col p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold text-ink-900">{committee.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">
            {committee.description || `By ${committee.organizer_name}`}
          </p>
        </div>
        <StatusBadge status={committee.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Contribution" value={formatINRShort(committee.contribution_amount)} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <Stat label="Members" value={`${fillCount}/${committee.member_count}`} icon={<Users className="h-3.5 w-3.5" />} />
        <Stat label="Pot / cycle" value={formatINRShort(pot)} icon={<Calendar className="h-3.5 w-3.5" />} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-ink-400">
          <span>{committee.status === 'forming' ? 'Members joined' : 'Cycle progress'}</span>
          <span>{committee.status === 'forming' ? `${fillPct}%` : `${Math.round(cycleProgress * 100)}%`}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full gradient-brand transition-all duration-700"
            style={{ width: `${(committee.status === 'forming' ? fillPct / 100 : cycleProgress) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-ink-400">
          <span className="font-mono">{committee.asset_code}</span>
          {isOrganizer && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">Organizer</span>}
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition group-hover:gap-1.5">
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-ink-50/80 p-2.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-400">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-ink-900">{value}</div>
    </div>
  );
}

export { rupeesFromPaise, formatINR };
