import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, Users, Coins, CalendarClock, TrendingUp, Loader2, Check,
  ShieldAlert, Sparkles, Play, HandCoins, History, Crown, Wallet, ScrollText,
  Lock, UserPlus, Hourglass, PartyPopper, Gift, Share2, Gavel, Award, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CommitteeDetail, MemberWithStatus, ActivityLog, Payout } from '../lib/types';
import {
  fetchCommitteeDetail, contribute, advanceCycle, handleDefault, excuseMember,
  joinCommittee, startCommittee, formatINR, formatINRShort, submitBid,
} from '../lib/contract';
import { shortAddress, avatarGradient, initials } from '../lib/wallet';
import { ProgressRing } from '../components/ProgressRing';
import { Modal } from '../components/Modal';
import { StatusBadge, ContributionBadge, PayoutBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { CycleRotationWheel } from '../components/CycleRotationWheel';

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

  const [bidDiscount, setBidDiscount] = useState('');
  const [biddingBusy, setBiddingBusy] = useState(false);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = Number(bidDiscount);
    if (isNaN(discount) || discount < 0) {
      toast({ kind: 'error', title: 'Invalid bid', description: 'Please enter a valid positive discount amount.' });
      return;
    }
    setBiddingBusy(true);
    try {
      await submitBid(committeeId, discount);
      toast({ kind: 'success', title: 'Bid Submitted!', description: `Discount bid of ${discount} XLM recorded.` });
      setBidDiscount('');
      reload();
    } catch (err) {
      toast({ kind: 'error', title: 'Bidding failed', description: err instanceof Error ? err.message : 'Could not submit bid.' });
    } finally {
      setBiddingBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        <div className="h-6 w-40 skeleton mb-4" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 skeleton lg:col-span-2 rounded-2xl" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState icon={<ScrollText className="h-7 w-7" />} title="Committee not found" description="This committee may have been removed or does not exist." action={<button className="btn-primary btn-sm rounded-full" onClick={() => navigate({ name: 'explore' })}>Back to explore</button>} />
      </div>
    );
  }

  const {
    name, description, status, contribution_amount, member_count, current_cycle,
    members, payouts, activity, contributionsReceived, contributionsNeeded,
    isOrganizer, isMember, myMember, nextRecipient, organizer_name,
  } = detail;

  const { theme } = useApp();
  const pot = contribution_amount * member_count;
  const cyclePct = contributionsNeeded ? contributionsReceived / contributionsNeeded : 0;

  const canJoin = status === 'forming' && !isMember && !!identity;
  const canStart = isOrganizer && status === 'forming' && members.length === member_count;
  const canContribute = isMember && status === 'active' && myMember?.currentCycleContribution?.status === 'pending';
  const canAdvance = isOrganizer && status === 'active' && contributionsReceived >= contributionsNeeded;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/committee/${committeeId}` : '';

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8">
      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white'
          : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border border-slate-200/90 text-slate-900 shadow-md'
      }`}>
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" style={{ transform: 'translateZ(0)' }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" style={{ transform: 'translateZ(0)' }} />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate({ name: 'dashboard' })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition backdrop-blur-md ${
                theme === 'dark'
                  ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition backdrop-blur-md ${
                  theme === 'dark'
                    ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />} Refresh
              </button>
              <ShareButton url={joinUrl} name={name} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={status} />
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-md border ${
                  theme === 'dark' ? 'bg-white/10 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  Asset: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{detail.asset_code}</strong>
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  Soroban Verified
                </span>
              </div>
              <h1 className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {name}
              </h1>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {description || `Rotating savings circle organized by ${organizer_name}`}
              </p>
              <div className={`flex items-center gap-4 text-xs pt-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span className={`flex items-center gap-1.5 font-medium ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  <Crown className="h-4 w-4 text-amber-400" /> {organizer_name}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Wallet className="h-3.5 w-3.5 text-sky-400" /> {shortAddress(detail.organizer_wallet, 6, 6)}
                </span>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl shrink-0 backdrop-blur-xl ${
              theme === 'dark'
                ? 'bg-white/10 ring-1 ring-white/15 text-white'
                : 'bg-white/90 ring-1 ring-slate-200/80 text-slate-900 shadow-sm'
            }`}>
              <div className="text-center px-2">
                <div className={`font-display text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatINRShort(contribution_amount)}</div>
                <div className={`text-[10px] uppercase font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Contribution</div>
              </div>
              <div className={`h-9 w-px ${theme === 'dark' ? 'bg-white/20' : 'bg-slate-200'}`} />
              <div className="text-center px-2">
                <div className={`font-display text-2xl font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatINRShort(pot)}</div>
                <div className={`text-[10px] uppercase font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Pot / Cycle</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className={`p-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl shadow-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white'
          : 'card bg-white border border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {canContribute && <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1 border border-amber-200">Your cycle contribution is due</span>}
          {canAdvance && <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-200">All member funds collected — ready to advance cycle</span>}
          {status === 'active' && !canContribute && myMember?.currentCycleContribution?.status === 'paid' && <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-200">✓ You have contributed for Cycle {current_cycle + 1}</span>}
          {status === 'forming' && <span className={`rounded-full px-3 py-1 border ${theme === 'dark' ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>Circle is forming ({members.length}/{member_count} members)</span>}
        </div>
        <div className="flex items-center gap-2">
          {canJoin && (
            <button className={`btn-sm rounded-full px-5 py-2 text-xs font-extrabold shadow-md ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'btn-primary'}`} disabled={busy} onClick={guard(() => joinCommittee(committeeId, identity!), 'Joined committee successfully!')}>
              <UserPlus className="h-4 w-4 mr-1" /> Join Committee
            </button>
          )}
          {canStart && (
            <button className={`btn-sm rounded-full px-5 py-2 text-xs font-extrabold shadow-md ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'btn-primary'}`} disabled={busy} onClick={guard(() => startCommittee(committeeId, identity!), 'Committee started!')}>
              <Play className="h-4 w-4 mr-1" /> Start Rotation Cycles
            </button>
          )}
          {canContribute && (
            <button className={`btn-sm rounded-full px-5 py-2 text-xs font-extrabold shadow-md ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'btn-primary'}`} disabled={busy} onClick={guard(() => contribute(committeeId, myMember!.id, identity!), 'Contribution recorded!')}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <HandCoins className="h-4 w-4 mr-1" />} Contribute {formatINRShort(contribution_amount)}
            </button>
          )}
          {canAdvance && (
            <button className={`btn-sm rounded-full px-5 py-2 text-xs font-extrabold shadow-md ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'btn-primary'}`} disabled={busy} onClick={guard(() => advanceCycle(committeeId, identity!), 'Cycle advanced!')}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />} Advance Cycle & Release Pot
            </button>
          )}
          {!identity && status === 'forming' && <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Connect wallet to join</span>}
        </div>
      </div>

      {/* Top Grid: Cycle Progress + Wheel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cycle Progress Card */}
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white'
            : 'card bg-white border border-slate-200/90 text-slate-900'
        }`}>
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={cyclePct} size={120} stroke={10}>
              <div className="text-center">
                <div className={`font-display text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{contributionsReceived}<span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}>/{contributionsNeeded}</span></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">paid</div>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-3">
              <div className={`flex items-center gap-2 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {status === 'active' && <><CalendarClock className="h-4 w-4 text-emerald-500" /> Cycle {current_cycle + 1} of {member_count}</>}
                {status === 'forming' && <><Hourglass className="h-4 w-4 text-amber-500" /> Forming — {members.length}/{member_count} members joined</>}
                {status === 'completed' && <><PartyPopper className="h-4 w-4 text-sky-500" /> All Cycles Completed</>}
                {status === 'cancelled' && <><ShieldAlert className="h-4 w-4 text-red-500" /> Committee Cancelled</>}
              </div>

              {status === 'active' && nextRecipient && (
                <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-md border ${
                  theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-slate-900 text-white border-slate-800'
                }`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm" style={{ background: avatarGradient(nextRecipient.wallet_address) }}>
                    {initials(nextRecipient.display_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Current Cycle Winner</div>
                    <div className="truncate font-bold text-sm text-white">{nextRecipient.display_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-black text-emerald-400">{formatINRShort(pot)}</div>
                    <div className="text-[10px] text-slate-400">full pot</div>
                  </div>
                </div>
              )}

              {status === 'forming' && (
                <div className={`rounded-2xl p-4 border space-y-2 ${
                  theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200/80 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Waiting for members to join</span>
                    <span>{members.length}/{member_count}</span>
                  </div>
                  <div className={`h-2 w-full overflow-hidden rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-amber-200/60'}`}>
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${(members.length / member_count) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-center ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Contribution</div>
              <div className={`font-display text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatINR(contribution_amount)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Cycle Length</div>
              <div className={`font-display text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{detail.cycle_length_days} Days</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Default Rule</div>
              <div className={`font-display text-sm font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{detail.penalty_strategy.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Yield APY</div>
              <div className="font-display text-sm font-bold text-amber-500">+4.8% APY</div>
            </div>
          </div>
        </div>

        {/* Rotation Wheel Visualizer */}
        <CycleRotationWheel committee={detail} members={members} />
      </div>

      {/* Main Grid: Bidding + Members + Schedule + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Bidding Auction Panel */}
          {status === 'active' && detail.payout_rule === 'bidding' && (
            <div className={`overflow-hidden rounded-2xl shadow-sm border transition-all duration-300 ${
              theme === 'dark'
                ? 'liquid-glass bg-slate-900/80 border-white/10 text-white'
                : 'card bg-white border-slate-200/90 text-slate-900'
            }`}>
              <div className={`flex items-center justify-between border-b px-5 py-3.5 ${
                theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-slate-950 text-white'
              }`}>
                <h3 className="font-display text-sm font-bold flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-amber-400" /> Cycle Bidding Auction
                </h3>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold text-slate-300">
                  Cycle {current_cycle + 1}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Submit a discount bid to receive this cycle's pot early. The member offering the highest discount wins. The discount amount is redistributed back to all other members as a savings dividend!
                </p>

                {/* Leaderboard */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-500" /> Bids Leaderboard
                  </h4>
                  {(!detail.bids || detail.bids.length === 0) ? (
                    <p className={`text-xs italic py-4 text-center rounded-xl border ${
                      theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>No bids submitted yet for this cycle.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.bids.map((b, idx) => {
                        const bidder = detail.members.find(m => m.id === b.member_id);
                        const isWinner = idx === 0;
                        const netPayout = (contribution_amount * member_count) - b.discount_amount;
                        return (
                          <div key={b.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                            isWinner
                              ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                              : theme === 'dark' ? 'border-white/10 bg-slate-950/50 text-white' : 'border-slate-200 bg-white text-slate-900'
                          }`}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                                isWinner ? 'bg-emerald-500 text-black' : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className={`font-bold text-xs truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{bidder?.display_name ?? 'Member'}</span>
                              {isWinner && <span className="text-[9px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Lowest Ask</span>}
                            </div>
                            <div className="text-right">
                              <span className={`font-bold text-xs block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Discount: {b.discount_amount} XLM</span>
                              <span className={`text-[10px] block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Net Payout: {netPayout} XLM</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Bid Form */}
                {isMember && myMember && !myMember.has_received_payout && (
                  <form onSubmit={handlePlaceBid} className={`border-t pt-4 space-y-3 ${
                    theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label text-[10px] uppercase font-bold text-slate-400">Discount Bid (XLM)</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          max={contribution_amount * member_count - 1}
                          className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-950/80 text-white border border-white/10 placeholder-slate-500'
                              : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
                          }`}
                          value={bidDiscount}
                          onChange={e => setBidDiscount(e.target.value)}
                          placeholder="e.g. 5"
                          required
                        />
                      </div>
                      <div>
                        <label className="label text-[10px] uppercase font-bold text-slate-400">Your Net Payout</label>
                        <div className={`py-2 px-3 text-xs flex items-center rounded-xl font-bold border ${
                          theme === 'dark' ? 'bg-slate-950/90 text-slate-200 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {Math.max(0, (contribution_amount * member_count) - (Number(bidDiscount) || 0))} XLM
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={biddingBusy}
                      className={`btn-sm w-full justify-center rounded-xl py-2.5 font-bold shadow-md transition ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'btn-primary'
                      }`}
                    >
                      {biddingBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Gavel className="h-3.5 w-3.5 mr-1" /> Submit Cycle Bid</>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Members List Section */}
          <MembersSection
            detail={detail}
            onDefault={isOrganizer && status === 'active' ? (mid) => guard(() => handleDefault(committeeId, mid, identity!), 'Member marked defaulted')() : undefined}
            onExcuse={isOrganizer && status === 'active' ? (mid) => guard(() => excuseMember(committeeId, mid, identity!), 'Member excused')() : undefined}
            busy={busy}
          />

          {/* Payout Schedule Section */}
          <PayoutSchedule payouts={payouts} members={members} memberCount={member_count} />
        </div>

        {/* Right Sidebar: Activity Log */}
        <div>
          <ActivitySection activity={activity} />
        </div>
      </div>
    </div>
  );
}

function ShareButton({ url, name }: { url: string; name: string }) {
  const { toast, theme } = useApp();
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
    <button
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-white/10 text-slate-200 hover:bg-white/20'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
      }`}
      onClick={copy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />} Share Invite
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
  const { identity, theme } = useApp();
  const [actionMember, setActionMember] = useState<MemberWithStatus | null>(null);

  const sorted = [...detail.members].sort(
    (a, b) => (a.payout_position ?? 99) - (b.payout_position ?? 99),
  );

  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm border transition-all duration-300 ${
      theme === 'dark'
        ? 'liquid-glass bg-slate-900/80 border-white/10 text-white'
        : 'card bg-white border-slate-200/90 text-slate-900'
    }`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Users className={`h-4 w-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-display text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Committee Members</h3>
        </div>
        <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
          theme === 'dark' ? 'bg-slate-800 text-slate-300 border border-white/10' : 'bg-slate-200 text-slate-700'
        }`}>
          {detail.members.length}/{detail.member_count} Joined
        </span>
      </div>
      <div className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
        {sorted.map((m, i) => {
          const isYou = identity?.publicKey === m.wallet_address;
          const isOrganizerRow = m.wallet_address === detail.organizer_wallet;
          const isNext = detail.nextRecipient?.id === m.id;
          const cc = m.currentCycleContribution;
          return (
            <div key={m.id} className={`flex items-center gap-3.5 px-5 py-3.5 transition ${
              theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
            }`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
              }`}>
                {typeof m.payout_position === 'number' ? m.payout_position + 1 : i + 1}
              </span>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm" style={{ background: avatarGradient(m.wallet_address) }}>
                {initials(m.display_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`truncate text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{m.display_name}</span>
                  {m.credit_score !== undefined && (
                    <span 
                      className={`badge text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        m.credit_score >= 800
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : m.credit_score >= 700
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                      title="Reputation Credit Score"
                    >
                      ★ {m.credit_score}
                    </span>
                  )}
                  {isYou && <span className="rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 border border-sky-500/30">You</span>}
                  {isOrganizerRow && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  {isNext && <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30 flex items-center gap-1"><Gift className="h-3 w-3" /> Winner</span>}
                </div>
                <div className="truncate font-mono text-[11px] text-slate-400">{shortAddress(m.wallet_address, 6, 6)}</div>
              </div>

              <div className="hidden text-right sm:block">
                <div className="text-xs font-medium text-slate-400">Paid {m.cyclesPaid}/{detail.member_count}</div>
                <div className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatINRShort(m.totalPaid)}</div>
              </div>

              {detail.status === 'active' && cc ? (
                <div className="flex items-center gap-2">
                  <ContributionBadge status={cc.status} />
                  {onDefault && cc.status === 'pending' && (
                    <button
                      disabled={busy}
                      onClick={() => setActionMember(m)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 border border-transparent"
                      title="Organizer actions"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : detail.status === 'completed' ? (
                m.has_received_payout
                  ? <Check className="h-5 w-5 text-emerald-500 font-bold" />
                  : <span className="text-xs text-slate-500">—</span>
              ) : (
                <span className="text-xs text-slate-500">—</span>
              )}
            </div>
          );
        })}

        {/* Clean Open Slots Summary Banner */}
        {detail.status === 'forming' && detail.members.length < detail.member_count && (
          <div className={`p-4 m-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            theme === 'dark'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-emerald-50/70 border-emerald-200/80 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-black shadow-sm font-bold text-xs">
                +{detail.member_count - detail.members.length}
              </div>
              <div>
                <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {detail.member_count - detail.members.length} Open Slots Available
                </h4>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Share the invite link to onboard remaining members to this committee.
                </p>
              </div>
            </div>
            <ShareButton url={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/committee/${detail.id}` : ''} name={detail.name} />
          </div>
        )}
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
          <button className="btn-ghost btn-sm rounded-full" onClick={onClose}>Cancel</button>
          <button className="btn-secondary btn-sm rounded-full" onClick={onExcuse}><Check className="h-4 w-4 mr-1" /> Excuse</button>
          <button className="btn-danger btn-sm rounded-full" onClick={onDefault}><ShieldAlert className="h-4 w-4 mr-1" /> Mark Defaulted</button>
        </div>
      }
    >
      <p className="text-xs text-slate-400 leading-relaxed">
        Excusing a member counts their contribution as fulfilled without payment. Marking a default records the missed payment and applies the committee's default penalty rule.
      </p>
    </Modal>
  );
}

// ---- Payout schedule ------------------------------------------------------------

function PayoutSchedule({ payouts, members, memberCount }: { payouts: Payout[]; members: MemberWithStatus[]; memberCount: number }) {
  const { identity, theme } = useApp();
  const byCycle = new Map(payouts.map((p) => [p.cycle_index, p]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const rows = Array.from({ length: memberCount }, (_, i) => {
    const p = byCycle.get(i);
    const recipient = p ? memberById.get(p.recipient_member_id) : null;
    return { cycle: i, payout: p, recipient };
  });

  const assignedRows = rows.filter(r => r.recipient !== null);
  const unassignedCount = memberCount - assignedRows.length;

  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm border transition-all duration-300 ${
      theme === 'dark'
        ? 'liquid-glass bg-slate-900/80 border-white/10 text-white'
        : 'card bg-white border-slate-200/90 text-slate-900'
    }`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <CalendarClock className={`h-4 w-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-display text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Payout Schedule</h3>
        </div>
        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {assignedRows.length}/{memberCount} Cycles Scheduled
        </span>
      </div>
      <div className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
        {assignedRows.length > 0 ? (
          assignedRows.map(({ cycle, payout, recipient }) => {
            const isYou = recipient && identity?.publicKey === recipient.wallet_address;
            return (
              <div key={cycle} className="flex items-center gap-3.5 px-5 py-3.5">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cycle + 1}
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm" style={{ background: avatarGradient(recipient!.wallet_address) }}>
                  {initials(recipient!.display_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`truncate text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{recipient!.display_name}</span>
                    {isYou && <span className="rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 border border-sky-500/30">You</span>}
                  </div>
                </div>
                <span className={`hidden text-xs font-bold sm:block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{formatINRShort(payout?.amount ?? 0)}</span>
                {payout && <PayoutBadge status={payout.status} />}
              </div>
            );
          })
        ) : (
          <div className={`p-5 text-center text-xs italic ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            No payouts executed yet. Payout schedule will populate automatically as rotation cycles start.
          </div>
        )}

        {unassignedCount > 0 && assignedRows.length > 0 && (
          <div className={`p-3.5 text-center text-xs font-medium border-t ${
            theme === 'dark' ? 'bg-slate-950/50 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            Upcoming Cycles {assignedRows.length + 1}–{memberCount} will be assigned as rotation advances.
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Activity section -----------------------------------------------------------

const activityIcons: Record<string, { icon: React.ReactNode; cls: string }> = {
  committee_created: { icon: <Sparkles className="h-4 w-4" />, cls: 'bg-emerald-500/20 text-emerald-400' },
  committee_started: { icon: <Play className="h-4 w-4" />, cls: 'bg-sky-500/20 text-sky-400' },
  member_joined: { icon: <UserPlus className="h-4 w-4" />, cls: 'bg-sky-500/20 text-sky-400' },
  contribution_paid: { icon: <HandCoins className="h-4 w-4" />, cls: 'bg-emerald-500/20 text-emerald-400' },
  cycle_advanced: { icon: <CalendarClock className="h-4 w-4" />, cls: 'bg-amber-500/20 text-amber-400' },
  payout_released: { icon: <Gift className="h-4 w-4" />, cls: 'bg-emerald-500/20 text-emerald-400' },
  member_defaulted: { icon: <ShieldAlert className="h-4 w-4" />, cls: 'bg-red-500/20 text-red-400' },
  member_excused: { icon: <Check className="h-4 w-4" />, cls: 'bg-sky-500/20 text-sky-400' },
  committee_completed: { icon: <PartyPopper className="h-4 w-4" />, cls: 'bg-sky-500/20 text-sky-400' },
};

function ActivitySection({ activity }: { activity: ActivityLog[] }) {
  const { theme } = useApp();
  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm border transition-all duration-300 lg:sticky lg:top-20 ${
      theme === 'dark'
        ? 'liquid-glass bg-slate-900/80 border-white/10 text-white'
        : 'card bg-white border-slate-200/90 text-slate-900'
    }`}>
      <div className={`flex items-center gap-2 border-b px-5 py-4 ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <History className={`h-4 w-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`font-display text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Activity Log</h3>
      </div>
      {activity.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-6 w-6 text-emerald-500" />} title="No activity yet" description="Events will appear here as the committee runs." className="py-10" />
      ) : (
        <ol className={`max-h-[640px] divide-y overflow-y-auto ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
          {activity.map((a) => {
            const meta = activityIcons[a.event_type] ?? { icon: <History className="h-4 w-4" />, cls: 'bg-slate-800 text-slate-400' };
            return (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl ${meta.cls}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-relaxed font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{a.summary}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
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
