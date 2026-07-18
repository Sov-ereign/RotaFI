import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, Users, Coins, CalendarClock, TrendingUp, Loader2, Check,
  ShieldAlert, Sparkles, Play, HandCoins, History, Crown, Wallet, ScrollText,
  Lock, UserPlus, Hourglass, PartyPopper, Gift, Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CommitteeDetail, MemberWithStatus, ActivityLog, Payout } from '../lib/types';
import {
  fetchCommitteeDetail, contribute, advanceCycle, handleDefault, excuseMember,
  joinCommittee, startCommittee, formatINR, formatINRShort,
} from '../lib/contract';
import { shortAddress, avatarGradient, initials } from '../lib/wallet';
import { ProgressRing } from '../components/ProgressRing';
import { Modal } from '../components/Modal';
import { StatusBadge, ContributionBadge, PayoutBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';

export function CommitteeDetailPage({ committeeId }: { committeeId: string }) {
  const { identity, navigate, toast } = useApp();
  const [detail, setDetail] = useState<CommitteeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetchCommitteeDetail(committeeId, identity)
      .then((d) => setDetail(d))
      .finally(() => setLoading(false));
  }, [committeeId, identity]);

  useEffect(() => { reload(); }, [reload]);

  const refresh = () => { setBusy(true); reload(); setTimeout(() => setBusy(false), 400); };

  const guard = <T,>(fn: () => Promise<T>, successMsg: string) => async () => {
    if (!identity) return;
    setBusy(true);
    try {
      await fn();
      toast({ kind: 'success', title: successMsg });
      reload();
    } catch (e) {
      toast({ kind: 'error', title: 'Action failed', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-40 skeleton mb-4" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 skeleton lg:col-span-2" />
          <div className="h-48 skeleton" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState icon={<ScrollText className="h-7 w-7" />} title="Committee not found" description="This committee may have been removed." action={<button className="btn-primary btn-sm" onClick={() => navigate({ name: 'explore' })}>Back to explore</button>} />
      </div>
    );
  }

  const {
    name, description, status, contribution_amount, member_count, current_cycle,
    members, payouts, activity, contributionsReceived, contributionsNeeded,
    isOrganizer, isMember, myMember, nextRecipient, organizer_name,
  } = detail;

  const pot = contribution_amount * member_count;
  const cyclePct = contributionsNeeded ? contributionsReceived / contributionsNeeded : 0;

  const canJoin = status === 'forming' && !isMember && !!identity;
  const canStart = isOrganizer && status === 'forming' && members.length === member_count;
  const canContribute = isMember && status === 'active' && myMember?.currentCycleContribution?.status === 'pending';
  const canAdvance = isOrganizer && status === 'active' && contributionsReceived >= contributionsNeeded;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/committee/${committeeId}` : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => navigate({ name: 'dashboard' })} className="btn-ghost btn-sm mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{name}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
            {description || `Organized by ${organizer_name}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
            <span className="flex items-center gap-1"><Crown className="h-3.5 w-3.5 text-saffron-500" /> {organizer_name}</span>
            <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {shortAddress(detail.organizer_wallet, 6, 6)}</span>
            <span className="font-mono">{detail.asset_code}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="btn-ghost btn-sm" onClick={refresh} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />} Refresh
          </button>
          <ShareButton url={joinUrl} name={name} />
        </div>
      </div>

      {/* Top stats */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Cycle progress card */}
        <div className="card relative overflow-hidden p-6 lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-100/50 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={cyclePct} size={120} stroke={10}>
              <div className="text-center">
                <div className="font-display text-2xl font-extrabold text-ink-900">{contributionsReceived}<span className="text-ink-300">/{contributionsNeeded}</span></div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-ink-400">paid</div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-500">
                {status === 'active' && <><CalendarClock className="h-4 w-4 text-brand-500" /> Cycle {current_cycle + 1} of {member_count}</>}
                {status === 'forming' && <><Hourglass className="h-4 w-4 text-saffron-500" /> Forming — {members.length}/{member_count} members</>}
                {status === 'completed' && <><PartyPopper className="h-4 w-4 text-sapphire-500" /> Completed</>}
                {status === 'cancelled' && <><ShieldAlert className="h-4 w-4 text-danger-500" /> Cancelled</>}
              </div>
              {status === 'active' && nextRecipient && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand-50 to-sapphire-50 p-4 ring-1 ring-brand-100">
                  <span className="grid h-10 w-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: avatarGradient(nextRecipient.wallet_address) }}>
                    {initials(nextRecipient.display_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-brand-700">Next payout releases to</div>
                    <div className="truncate font-semibold text-ink-900">{nextRecipient.display_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-extrabold text-ink-900">{formatINRShort(pot)}</div>
                    <div className="text-[10px] text-ink-400">full pot</div>
                  </div>
                </div>
              )}
              {status === 'forming' && (
                <div className="mt-3 rounded-xl bg-saffron-50 p-4 ring-1 ring-saffron-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-saffron-800">Waiting for members to join</span>
                    <span className="font-display text-lg font-bold text-saffron-900">{members.length}/{member_count}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-saffron-100">
                    <div className="h-full rounded-full bg-saffron-500 transition-all duration-700" style={{ width: `${(members.length / member_count) * 100}%` }} />
                  </div>
                </div>
              )}
              {status === 'completed' && (
                <div className="mt-3 rounded-xl bg-sapphire-50 p-4 ring-1 ring-sapphire-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-sapphire-800">
                    <Gift className="h-4 w-4" /> All {member_count} payouts distributed successfully.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key facts */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Key facts</h3>
          <dl className="mt-3 space-y-2.5">
            <FactRow icon={<TrendingUp className="h-4 w-4" />} label="Contribution" value={formatINR(contribution_amount)} />
            <FactRow icon={<Coins className="h-4 w-4" />} label="Pot / cycle" value={formatINR(pot)} />
            <FactRow icon={<Users className="h-4 w-4" />} label="Members" value={`${members.length}/${member_count}`} />
            <FactRow icon={<CalendarClock className="h-4 w-4" />} label="Cycle length" value={`${detail.cycle_length_days} days`} />
            <FactRow icon={<Lock className="h-4 w-4" />} label="Default rule" value={detail.penalty_strategy.replace('_', ' ')} />
          </dl>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-4 card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          {canContribute && <span className="badge bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200">Your contribution is due</span>}
          {canAdvance && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">All in — ready to advance</span>}
          {status === 'active' && !canContribute && myMember?.currentCycleContribution?.status === 'paid' && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">You've contributed this cycle</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {canJoin && <button className="btn-primary btn-sm" disabled={busy} onClick={guard(() => joinCommittee(committeeId, identity!), 'Joined!')}>
            <UserPlus className="h-4 w-4" /> Join committee
          </button>}
          {canStart && <button className="btn-primary btn-sm" disabled={busy} onClick={guard(() => startCommittee(committeeId, identity!), 'Committee started!')}>
            <Play className="h-4 w-4" /> Start cycles
          </button>}
          {canContribute && <button className="btn-primary btn-sm" disabled={busy} onClick={guard(() => contribute(committeeId, myMember!.id, identity!), 'Contribution recorded!')}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />} Contribute {formatINRShort(contribution_amount)}
          </button>}
          {canAdvance && <button className="btn-primary btn-sm" disabled={busy} onClick={guard(() => advanceCycle(committeeId, identity!), 'Cycle advanced!')}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Advance cycle & release pot
          </button>}
          {!identity && status === 'forming' && <span className="text-xs text-ink-400">Connect a wallet to join</span>}
        </div>
      </div>

      {/* Main grid: members + (schedule | activity) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MembersSection
            detail={detail}
            onDefault={isOrganizer && status === 'active' ? (mid) => guard(() => handleDefault(committeeId, mid, identity!), 'Member marked defaulted')() : undefined}
            onExcuse={isOrganizer && status === 'active' ? (mid) => guard(() => excuseMember(committeeId, mid, identity!), 'Member excused')() : undefined}
            busy={busy}
          />
          <PayoutSchedule payouts={payouts} members={members} memberCount={member_count} />
        </div>
        <div>
          <ActivitySection activity={activity} />
        </div>
      </div>
    </div>
  );
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-sm text-ink-500"><span className="text-ink-400">{icon}</span>{label}</dt>
      <dd className="text-sm font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function ShareButton({ url, name }: { url: string; name: string }) {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ kind: 'success', title: 'Invite link copied', description: `Share it so others can join "${name}".` });
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };
  return (
    <button className="btn-secondary btn-sm" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Share2 className="h-3.5 w-3.5" />} Invite
    </button>
  );
}

// ---- Members section ------------------------------------------------------------

function MembersSection({
  detail, onDefault, onExcuse, busy,
}: {
  detail: CommitteeDetail;
  onDefault?: (memberId: string) => void;
  onExcuse?: (memberId: string) => void;
  busy: boolean;
}) {
  const { identity } = useApp();
  const [actionMember, setActionMember] = useState<MemberWithStatus | null>(null);

  const sorted = [...detail.members].sort(
    (a, b) => (a.payout_position ?? 99) - (b.payout_position ?? 99),
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
        <h3 className="font-display text-base font-bold text-ink-900">Members</h3>
        <span className="text-xs text-ink-400">{detail.members.length}/{detail.member_count} joined</span>
      </div>
      <div className="divide-y divide-ink-100">
        {sorted.map((m, i) => {
          const isYou = identity?.publicKey === m.wallet_address;
          const isOrganizerRow = m.wallet_address === detail.organizer_wallet;
          const isNext = detail.nextRecipient?.id === m.id;
          const cc = m.currentCycleContribution;
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50/60">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-500">
                {typeof m.payout_position === 'number' ? m.payout_position + 1 : i + 1}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: avatarGradient(m.wallet_address) }}>
                {initials(m.display_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-ink-900">{m.display_name}</span>
                  {isYou && <span className="badge bg-sapphire-50 text-sapphire-700 ring-1 ring-sapphire-200">You</span>}
                  {isOrganizerRow && <Crown className="h-3.5 w-3.5 text-saffron-500" />}
                  {isNext && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200"><Gift className="h-3 w-3" /> Next</span>}
                </div>
                <div className="truncate font-mono text-[10px] text-ink-400">{shortAddress(m.wallet_address, 6, 6)}</div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-xs text-ink-400">Paid {m.cyclesPaid}/{detail.member_count}</div>
                <div className="text-[11px] font-medium text-ink-500">{formatINRShort(m.totalPaid)}</div>
              </div>
              {detail.status === 'active' && cc ? (
                <div className="flex items-center gap-2">
                  <ContributionBadge status={cc.status} />
                  {onDefault && cc.status === 'pending' && (
                    <button
                      disabled={busy}
                      onClick={() => setActionMember(m)}
                      className="rounded-md p-1 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600"
                      title="Organizer actions"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : detail.status === 'completed' ? (
                m.has_received_payout
                  ? <Check className="h-4 w-4 text-brand-500" />
                  : <span className="text-xs text-ink-300">—</span>
              ) : (
                <span className="text-xs text-ink-300">—</span>
              )}
            </div>
          );
        })}
        {/* Empty member slots while forming */}
        {detail.status === 'forming' && detail.members.length < detail.member_count &&
          Array.from({ length: detail.member_count - detail.members.length }).slice(0, 3).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 px-5 py-3 text-ink-400">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-100 text-[10px] font-bold">?</span>
              <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-dashed border-ink-200 text-ink-300">
                <UserPlus className="h-4 w-4" />
              </span>
              <span className="text-sm">Open slot — share the invite link</span>
            </div>
          ))}
      </div>

      <MemberActionModal
        member={actionMember}
        onClose={() => setActionMember(null)}
        onDefault={() => { onDefault?.(actionMember!.id); setActionMember(null); }}
        onExcuse={() => { onExcuse?.(actionMember!.id); setActionMember(null); }}
      />
    </div>
  );
}

function MemberActionModal({
  member, onClose, onDefault, onExcuse,
}: {
  member: MemberWithStatus | null;
  onClose: () => void;
  onDefault: () => void;
  onExcuse: () => void;
}) {
  return (
    <Modal
      open={!!member}
      onClose={onClose}
      title={member ? `Manage ${member.display_name}` : ''}
      description="Organizer action for this cycle's contribution."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-secondary btn-sm" onClick={onExcuse}><Check className="h-4 w-4" /> Excuse</button>
          <button className="btn-danger btn-sm" onClick={onDefault}><ShieldAlert className="h-4 w-4" /> Mark defaulted</button>
        </div>
      }
    >
      <p className="text-sm text-ink-600">
        Excusing a member counts their contribution as fulfilled without payment (e.g. they are
        this cycle's recipient, or you are waiving their contribution). Marking a default records
        the missed payment and applies the committee's default rule.
      </p>
    </Modal>
  );
}

// ---- Payout schedule ------------------------------------------------------------

function PayoutSchedule({ payouts, members, memberCount }: { payouts: Payout[]; members: MemberWithStatus[]; memberCount: number }) {
  const { identity } = useApp();
  const byCycle = new Map(payouts.map((p) => [p.cycle_index, p]));
  const memberById = new Map(members.map((m) => [m.id, m]));
  const rows = Array.from({ length: memberCount }, (_, i) => {
    const p = byCycle.get(i);
    const recipient = p ? memberById.get(p.recipient_member_id) : null;
    return { cycle: i, payout: p, recipient };
  });

  return (
    <div className="card mt-6 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
        <CalendarClock className="h-4 w-4 text-ink-400" />
        <h3 className="font-display text-base font-bold text-ink-900">Payout schedule</h3>
      </div>
      <div className="divide-y divide-ink-100">
        {rows.map(({ cycle, payout, recipient }) => {
          const isYou = recipient && identity?.publicKey === recipient.wallet_address;
          return (
            <div key={cycle} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-500">
                {cycle + 1}
              </span>
              {recipient ? (
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: avatarGradient(recipient.wallet_address) }}>
                    {initials(recipient.display_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-ink-900">{recipient.display_name}</span>
                      {isYou && <span className="badge bg-sapphire-50 text-sapphire-700 ring-1 ring-sapphire-200">You</span>}
                    </div>
                  </div>
                  <span className="hidden text-xs text-ink-400 sm:block">{formatINRShort(payout?.amount ?? 0)}</span>
                  {payout && <PayoutBadge status={payout.status} />}
                </>
              ) : (
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-dashed border-ink-200 text-ink-300">
                    <Hourglass className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-ink-400">To be determined</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Activity section -----------------------------------------------------------

const activityIcons: Record<string, { icon: React.ReactNode; cls: string }> = {
  committee_created: { icon: <Sparkles className="h-4 w-4" />, cls: 'bg-brand-50 text-brand-600' },
  committee_started: { icon: <Play className="h-4 w-4" />, cls: 'bg-sapphire-50 text-sapphire-600' },
  member_joined: { icon: <UserPlus className="h-4 w-4" />, cls: 'bg-sapphire-50 text-sapphire-600' },
  contribution_paid: { icon: <HandCoins className="h-4 w-4" />, cls: 'bg-brand-50 text-brand-600' },
  cycle_advanced: { icon: <CalendarClock className="h-4 w-4" />, cls: 'bg-saffron-50 text-saffron-600' },
  payout_released: { icon: <Gift className="h-4 w-4" />, cls: 'bg-brand-50 text-brand-600' },
  member_defaulted: { icon: <ShieldAlert className="h-4 w-4" />, cls: 'bg-danger-50 text-danger-600' },
  member_excused: { icon: <Check className="h-4 w-4" />, cls: 'bg-sapphire-50 text-sapphire-600' },
  committee_completed: { icon: <PartyPopper className="h-4 w-4" />, cls: 'bg-sapphire-50 text-sapphire-600' },
};

function ActivitySection({ activity }: { activity: ActivityLog[] }) {
  return (
    <div className="card overflow-hidden lg:sticky lg:top-20">
      <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
        <History className="h-4 w-4 text-ink-400" />
        <h3 className="font-display text-base font-bold text-ink-900">Activity</h3>
      </div>
      {activity.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No activity yet" description="Events will appear here as the committee runs." className="py-10" />
      ) : (
        <ol className="max-h-[640px] divide-y divide-ink-100 overflow-y-auto">
          {activity.map((a) => {
            const meta = activityIcons[a.event_type] ?? { icon: <History className="h-4 w-4" />, cls: 'bg-ink-100 text-ink-500' };
            return (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${meta.cls}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-ink-700">{a.summary}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    {a.actor_wallet && ` · ${shortAddress(a.actor_wallet, 4, 4)}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
