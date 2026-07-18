import type { CommitteeStatus, ContributionStatus, PayoutStatus } from '../lib/types';

const committeeStatusMap: Record<CommitteeStatus, { label: string; cls: string; dot: string }> = {
  forming: { label: 'Forming', cls: 'bg-saffron-50 text-saffron-700 ring-saffron-200', dot: 'bg-saffron-500' },
  active: { label: 'Active', cls: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-500' },
  completed: { label: 'Completed', cls: 'bg-sapphire-50 text-sapphire-700 ring-sapphire-200', dot: 'bg-sapphire-500' },
  cancelled: { label: 'Cancelled', cls: 'bg-ink-100 text-ink-600 ring-ink-200', dot: 'bg-ink-400' },
};

export function StatusBadge({ status, className = '' }: { status: CommitteeStatus; className?: string }) {
  const s = committeeStatusMap[status];
  return (
    <span className={`badge ring-1 ${s.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

const contribStatusMap: Record<ContributionStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-ink-100 text-ink-600 ring-ink-200' },
  paid: { label: 'Paid', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  defaulted: { label: 'Defaulted', cls: 'bg-danger-50 text-danger-700 ring-danger-200' },
  excused: { label: 'Excused', cls: 'bg-sapphire-50 text-sapphire-600 ring-sapphire-200' },
};

export function ContributionBadge({ status }: { status: ContributionStatus }) {
  const s = contribStatusMap[status];
  return <span className={`badge ring-1 ${s.cls}`}>{s.label}</span>;
}

const payoutStatusMap: Record<PayoutStatus, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-saffron-50 text-saffron-700 ring-saffron-200' },
  released: { label: 'Released', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  forfeited: { label: 'Forfeited', cls: 'bg-danger-50 text-danger-700 ring-danger-200' },
};

export function PayoutBadge({ status }: { status: PayoutStatus }) {
  const s = payoutStatusMap[status];
  return <span className={`badge ring-1 ${s.cls}`}>{s.label}</span>;
}
