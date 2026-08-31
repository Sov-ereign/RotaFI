import { useEffect, useState } from 'react';
import {
  User, Mail, Wallet, Shield, Edit2, Save, X, Loader2, ExternalLink,
  CalendarDays, Star, TrendingUp, Copy, Check, Link2Off, AlertCircle,
  Send, Landmark, History, ArrowUpDown, ShieldCheck, MessageSquare, Plus,
  Zap, Activity, CreditCard, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress, isFreighterSync } from '../lib/wallet';
import { apiGet } from '../lib/api';
import { fetchAnchorTransactions, createAnchorTransaction, fetchFeedbackList } from '../lib/contract';
import type { Committee, AnchorTx, FeedbackItem } from '../lib/types';
import { FeedbackModal } from '../components/FeedbackModal';

interface ProfileStats {
  committeesCreated: number;
  committeesJoined: number;
}

export function ProfilePage() {
  const { identity, updateProfile, linkWallet, unlinkWallet, navigate, toast, freighterInstalled, freighterChecking } = useApp();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myCommittees, setMyCommittees] = useState<Committee[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [creditScore, setCreditScore] = useState(650);
  const [anchorTxs, setAnchorTxs] = useState<AnchorTx[]>([]);
  const [anchorAmountInr, setAnchorAmountInr] = useState('');
  const [anchorAmountXlm, setAnchorAmountXlm] = useState('');
  const [anchorType, setAnchorType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [upiId, setUpiId] = useState('');
  const [simulatingAnchor, setSimulatingAnchor] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const loadProfileData = () => {
    fetchFeedbackList().then(fbs => setFeedbacks(fbs)).catch(() => {});
    if (!identity) return;
    Promise.all([
      apiGet<{ stats: ProfileStats; credit_score: number } & Record<string, unknown>>('/users/profile'),
      apiGet<Committee[]>('/users/my-committees'),
      fetchAnchorTransactions(),
    ]).then(([profile, committees, txs]) => {
      setStats(profile.stats);
      setCreditScore(profile.credit_score || 650);
      setMyCommittees(committees);
      setAnchorTxs(txs);
    }).catch(() => {}).finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchFeedbackList().then(fbs => setFeedbacks(fbs)).catch(() => {});
    loadProfileData();
  }, [identity]);

  if (!identity) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900">Sign in to view your profile</h2>
        <p className="mt-2 text-ink-500">Create an account or sign in to manage your committees.</p>
        <button className="btn-primary mt-6" onClick={() => navigate({ name: 'landing' })}>Back to home</button>
      </div>
    );
  }

  const seed = identity.publicKey || identity.email;

  const startEdit = () => { setNameInput(identity.name); setBioInput(identity.bio || ''); setEditing(true); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: nameInput, bio: bioInput });
      toast({ kind: 'success', title: 'Profile updated' });
      setEditing(false);
    } catch (e) {
      toast({ kind: 'error', title: 'Update failed', description: e instanceof Error ? e.message : '' });
    } finally { setSaving(false); }
  };

  const handleLinkWallet = async () => {
    setLinkingWallet(true);
    try {
      await linkWallet();
      toast({ kind: 'success', title: 'Freighter linked!', description: 'Your Stellar wallet is connected.' });
    } catch (e) {
      toast({ kind: 'error', title: 'Link failed', description: e instanceof Error ? e.message : '' });
    } finally { setLinkingWallet(false); }
  };

  const handleUnlinkWallet = async () => {
    try {
      await unlinkWallet();
      toast({ kind: 'success', title: 'Wallet unlinked' });
    } catch (e) {
      toast({ kind: 'error', title: 'Unlink failed', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleAnchorSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const inr = Number(anchorAmountInr);
    const xlm = Number(anchorAmountXlm);
    if (!inr || !xlm || !upiId.trim()) {
      toast({ kind: 'error', title: 'Invalid inputs', description: 'Enter amount and payment details.' });
      return;
    }
    setSimulatingAnchor(true);
    try {
      await createAnchorTransaction(anchorType, inr, xlm, upiId.trim());
      toast({
        kind: 'success',
        title: anchorType === 'deposit' ? 'INR Deposit Settled' : 'XLM Withdrawal Settled',
        description: anchorType === 'deposit'
          ? `Anchor received ₹${inr} and credited ${xlm} XLM. Credit score boosted!`
          : `Anchor received ${xlm} XLM and paid ₹${inr} via UPI.`,
      });
      setAnchorAmountInr(''); setAnchorAmountXlm(''); setUpiId('');
      loadProfileData();
    } catch (err) {
      toast({ kind: 'error', title: 'Anchor Settlement Failed', description: err instanceof Error ? err.message : '' });
    } finally { setSimulatingAnchor(false); }
  };

  const copyAddr = () => {
    if (!identity.publicKey) return;
    navigator.clipboard.writeText(identity.publicKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // Credit score helpers
  const scoreLabel = creditScore >= 800 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 600 ? 'Fair' : 'Poor';
  const scoreColor = creditScore >= 800 ? '#10b981' : creditScore >= 700 ? '#0ea5e9' : creditScore >= 600 ? '#f59e0b' : '#ef4444';
  const scoreGradientId = 'scoreGrad' + Math.floor(creditScore / 100);
  // SVG arc: half-circle 180°, radius 40, center (50,50), from left to right
  const pct = Math.max(0, Math.min(1, (creditScore - 300) / 600));
  const arcLength = 125.7;
  const dashOffset = arcLength * (1 - pct);

  const statusMeta: Record<string, { label: string; bg: string; dot: string }> = {
    forming:   { label: 'Forming',   bg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     dot: 'bg-amber-400' },
    active:    { label: 'Active',    bg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
    completed: { label: 'Completed', bg: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',     dot: 'bg-slate-400' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-600 ring-1 ring-red-200',            dot: 'bg-red-400' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(2,10,30,0.98) 0%, rgba(5,25,50,0.98) 60%, rgba(2,20,40,0.98) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -top-16 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-60 w-60 rounded-full bg-sky-500/8 blur-[80px]" />
        <div className="pointer-events-none absolute top-0 left-1/3 h-48 w-48 rounded-full bg-indigo-500/6 blur-[80px]" />

        <div className="relative mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Avatar + identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="grid h-20 w-20 place-items-center rounded-3xl text-2xl font-black text-white shadow-2xl"
                  style={{ background: avatarGradient(seed), boxShadow: `0 0 0 3px rgba(255,255,255,0.08), 0 0 40px rgba(16,185,129,0.2)` }}
                >
                  {initials(identity.name)}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 shadow-md"
                     style={{ boxShadow: '0 0 12px rgba(16,185,129,0.6)' }}>
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-black text-white">{identity.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300 ring-1 ring-emerald-500/30">
                    Verified Member
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">{identity.email}</p>
                {identity.bio && <p className="mt-1 text-sm text-slate-300 max-w-md leading-relaxed">{identity.bio}</p>}
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Member since {new Date(identity.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Header stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Activity,    value: stats?.committeesJoined ?? '—',  label: 'Committees Joined' },
                { icon: Star,        value: stats?.committeesCreated ?? '—', label: 'Committees Created' },
                { icon: TrendingUp,  value: `${creditScore}`,                label: 'Credit Score' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-2xl px-4 py-3 text-center min-w-[90px]"
                       style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                    <div className="font-display text-xl font-black text-white">{s.value}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

          {/* ═══════════════ LEFT COLUMN ═════════════════ */}
          <div className="space-y-5">

            {/* Credit Score Gauge */}
            <div className="relative overflow-hidden rounded-3xl p-6 text-center"
                 style={{ background: 'linear-gradient(135deg, rgba(2,10,30,0.97) 0%, rgba(2,26,46,0.97) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
              <div className="pointer-events-none absolute -top-8 right-0 h-40 w-40 rounded-full blur-[60px]" style={{ background: scoreColor + '20' }} />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Credit Trust Score</span>
                </div>

                {/* Large gauge SVG */}
                <div className="relative mx-auto flex h-36 w-56 items-end justify-center">
                  <svg viewBox="0 0 120 70" className="w-full h-full" overflow="visible">
                    <defs>
                      <linearGradient id={scoreGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="#ef4444" />
                        <stop offset="40%"  stopColor="#f59e0b" />
                        <stop offset="75%"  stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      {/* Glow filter */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Track */}
                    <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round"/>
                    {/* Fill */}
                    <path
                      d="M 10 60 A 50 50 0 0 1 110 60"
                      fill="none"
                      stroke={`url(#${scoreGradientId})`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={arcLength}
                      strokeDashoffset={dashOffset}
                      filter="url(#glow)"
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                    {/* Needle dot */}
                    {pct > 0.01 && (() => {
                      const angle = Math.PI * (1 - pct);
                      const cx = 60 + 50 * Math.cos(angle + Math.PI);
                      const cy = 60 + 50 * Math.sin(angle + Math.PI);
                      return <circle cx={cx} cy={cy} r="5" fill={scoreColor} filter="url(#glow)" />;
                    })()}
                    {/* Tick marks */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                      const a = Math.PI * (1 - t);
                      const r1 = 56, r2 = 62;
                      return (
                        <line key={i}
                          x1={60 + r1 * Math.cos(a + Math.PI)} y1={60 + r1 * Math.sin(a + Math.PI)}
                          x2={60 + r2 * Math.cos(a + Math.PI)} y2={60 + r2 * Math.sin(a + Math.PI)}
                          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                  {/* Score text inside gauge */}
                  <div className="absolute bottom-2 text-center">
                    <div className="font-display text-4xl font-black text-white" style={{ textShadow: `0 0 20px ${scoreColor}60` }}>{creditScore}</div>
                    <div className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</div>
                  </div>
                </div>

                {/* Range labels */}
                <div className="flex justify-between text-[9px] font-bold text-slate-600 mt-1 px-2">
                  <span>300 Poor</span>
                  <span>600 Fair</span>
                  <span>Excellent 900</span>
                </div>

                {/* Score bar */}
                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, #ef4444, #f59e0b, ${scoreColor})` }}
                  />
                </div>

                {/* Boosters */}
                <div className="mt-5 space-y-2 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Score Boosters</p>
                  {[
                    { label: 'Contribute on-time', pts: '+15' },
                    { label: 'Complete a full group', pts: '+30' },
                    { label: 'Fiat anchor deposit', pts: '+10' },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center justify-between rounded-xl px-3 py-2"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[11px] text-slate-300">{b.label}</span>
                      <span className="text-[11px] font-bold text-emerald-400">{b.pts}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[10px] leading-relaxed text-slate-500 text-center">
                  Higher scores unlock lower bidding rates and larger pool limits.
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="rounded-3xl bg-white p-5 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-ink-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" /> Account Details
                </h3>
                {!editing
                  ? <button onClick={startEdit} className="btn-ghost btn-sm text-[11px] gap-1"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                  : <div className="flex gap-1.5">
                      <button onClick={() => setEditing(false)} className="btn-ghost btn-sm"><X className="h-4 w-4" /></button>
                      <button onClick={saveEdit} disabled={saving} className="btn-primary btn-sm">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                      </button>
                    </div>
                }
              </div>
              <div className="space-y-3">
                <Field label="Display name" icon={<User className="h-3.5 w-3.5" />}>
                  {editing
                    ? <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={40} autoFocus />
                    : <p className="text-sm font-semibold text-ink-900">{identity.name}</p>}
                </Field>
                <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
                  <p className="text-sm text-ink-500">
                    {identity.email}
                    <span className="ml-2 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400">Cannot change</span>
                  </p>
                </Field>
                <Field label="Bio" icon={<MessageSquare className="h-3.5 w-3.5" />}>
                  {editing
                    ? <textarea className="input resize-none min-h-[68px] text-sm" value={bioInput} onChange={e => setBioInput(e.target.value)} maxLength={280} placeholder="Tell others about yourself…" />
                    : <p className="text-sm text-ink-600">{identity.bio || <span className="text-ink-400 italic">No bio yet</span>}</p>}
                </Field>
              </div>
            </div>

            {/* Stellar Wallet */}
            <div className="rounded-3xl bg-white p-5 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 className="font-display text-sm font-bold text-ink-900 flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-sky-500" /> Stellar Wallet
              </h3>
              <p className="text-[11px] text-ink-400 mb-4">Link your Freighter wallet to sign on-chain transactions and contribute to committees.</p>

              {identity.publicKey ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3"
                       style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-100">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="font-mono text-xs text-emerald-800 truncate">{shortAddress(identity.publicKey, 12, 10)}</span>
                    </div>
                    <button onClick={copyAddr} className="shrink-0 rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-100">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://stellar.expert/explorer/testnet/account/${identity.publicKey}`}
                       target="_blank" rel="noopener noreferrer"
                       className="btn-ghost btn-sm flex-1 justify-center text-[11px]">
                      <ExternalLink className="h-3.5 w-3.5" /> Explorer
                    </a>
                    <button onClick={handleUnlinkWallet} className="btn-ghost btn-sm flex-1 justify-center text-[11px] text-red-600 hover:bg-red-50">
                      <Link2Off className="h-3.5 w-3.5" /> Unlink
                    </button>
                  </div>
                </div>
              ) : (
                !freighterChecking && !freighterInstalled ? (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Freighter not installed</p>
                        <p className="mt-1 text-xs text-amber-700">Install the Freighter browser extension to link your Stellar wallet.</p>
                        <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                          Install Freighter <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleLinkWallet}
                    disabled={linkingWallet || freighterChecking || (!freighterInstalled && !isFreighterSync())}
                    className="btn-primary w-full justify-center rounded-2xl">
                    {linkingWallet ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : <><Wallet className="h-4 w-4" /> Connect Freighter</>}
                  </button>
                )
              )}
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ════════════════ */}
          <div className="space-y-5">

            {/* My Committees */}
            <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-emerald-500" /> My ROSCA Committees
                  </h3>
                  <p className="text-[11px] text-ink-400 mt-0.5">Manage your active savings circles, contributions, and distributions.</p>
                </div>
                <button onClick={() => navigate({ name: 'create' })} className="btn-primary btn-sm rounded-xl gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Committee
                </button>
              </div>

              {loadingData ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                </div>
              ) : myCommittees.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50">
                    <Activity className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-sm text-ink-500">No committees yet.</p>
                  <button onClick={() => navigate({ name: 'create' })} className="btn-primary btn-sm rounded-xl">Create your first →</button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myCommittees.map(c => {
                    const meta = statusMeta[c.status] || statusMeta.completed;
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate({ name: 'committee', id: c.id })}
                        className="group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm gradient-brand">
                            {c.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink-900 truncate text-sm group-hover:text-emerald-700 transition-colors">{c.name}</p>
                            <p className="text-[11px] text-ink-400">{c.contribution_amount} XLM / cycle · {c.member_count} members</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stellar Fiat Anchor */}
            <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2 mb-1">
                <Landmark className="h-4.5 w-4.5 text-sky-500" /> Stellar Fiat Anchor (INR ↔ XLM)
              </h3>
              <p className="text-[11px] text-ink-400 mb-5">
                Simulate Indian Rupee (INR) on/off-ramping via anchor UPI bank transfer. Rate: ₹10 = 1 XLM.
              </p>

              <form onSubmit={handleAnchorSimulate} className="space-y-4">
                {/* Tab toggle */}
                <div className="flex rounded-2xl p-1.5" style={{ background: 'rgba(241,245,249,0.8)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  {(['deposit', 'withdrawal'] as const).map((t) => (
                    <button key={t} type="button"
                      onClick={() => { setAnchorType(t); setAnchorAmountInr(''); setAnchorAmountXlm(''); }}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200 ${
                        anchorType === t
                          ? 'bg-white text-ink-900 shadow-sm'
                          : 'text-ink-500 hover:text-ink-800'
                      }`}
                    >
                      {t === 'deposit' ? '⬇ Deposit (INR → XLM)' : '⬆ Withdraw (XLM → INR)'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[11px]">INR Amount (₹)</label>
                    <input type="number" min={1} className="input" value={anchorAmountInr}
                      onChange={e => { const v = e.target.value; setAnchorAmountInr(v); setAnchorAmountXlm(v ? (Number(v) / 10).toFixed(2) : ''); }}
                      placeholder="e.g. 500" required />
                  </div>
                  <div>
                    <label className="label text-[11px]">XLM {anchorType === 'deposit' ? 'Received' : 'Sent'}</label>
                    <input type="number" className="input bg-slate-50 text-ink-500" value={anchorAmountXlm} readOnly placeholder="50" />
                  </div>
                </div>

                <div>
                  <label className="label text-[11px]">
                    {anchorType === 'deposit' ? 'Pay via UPI ID' : 'Withdrawal UPI / VPA'}
                  </label>
                  <input type="text" className="input" value={upiId}
                    onChange={e => setUpiId(e.target.value)} placeholder="e.g. upi@paytm" required />
                </div>

                <button type="submit" disabled={simulatingAnchor} className="btn-primary w-full justify-center rounded-2xl py-3">
                  {simulatingAnchor
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Settling…</>
                    : anchorType === 'deposit'
                      ? <><Send className="h-4 w-4" /> Deposit ₹{anchorAmountInr || '0'}</>
                      : <><ArrowUpDown className="h-4 w-4" /> Withdraw ₹{anchorAmountInr || '0'}</>}
                </button>
              </form>

              {/* Transaction history */}
              {anchorTxs.length > 0 && (
                <div className="mt-5 pt-5 border-t border-ink-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink-400 flex items-center gap-1.5 mb-3">
                    <History className="h-3.5 w-3.5" /> Settlement History
                  </h4>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {anchorTxs.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                           style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-black ${tx.tx_type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                            {tx.tx_type === 'deposit' ? '↓' : '↑'}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-ink-900 capitalize">{tx.tx_type}</span>
                            <span className="block text-[10px] text-ink-400">
                              {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-ink-900">{tx.amount_xlm} XLM</div>
                          <div className="text-[10px] text-ink-400">₹{tx.amount_inr}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Community Feedback */}
            <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-500" /> Platform Reviews
                </h3>
                <button onClick={() => setIsFeedbackOpen(true)} className="btn-primary btn-sm rounded-xl gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Leave Feedback
                </button>
              </div>
              <p className="text-[11px] text-ink-400 mb-5">Community reviews submitted by RotaFi members.</p>

              {feedbacks.length === 0 ? (
                <p className="text-sm text-ink-400 italic text-center py-6">No reviews yet. Be the first!</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                         style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-600">
                            {fb.user_name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink-900">{fb.user_name}</p>
                            <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 ring-1 ring-indigo-100">
                              {fb.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3 w-3 ${s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-ink-600">"{fb.comment}"</p>
                      <p className="mt-1.5 text-[9px] text-ink-400">
                        {new Date(fb.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} onSubmitted={loadProfileData} />
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5 text-[11px]">
        <span className="text-ink-400">{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}
