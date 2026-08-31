import { useEffect, useState } from 'react';
import {
  User, Mail, Wallet, Shield, Edit2, Save, X, Loader2, ExternalLink,
  CalendarDays, Star, TrendingUp, Copy, Check, Link2Off, AlertCircle,
  Send, Landmark, History, ArrowUpDown, ShieldCheck, MessageSquare, Plus,
  Zap, Activity, CreditCard, ChevronRight, Sparkles, Award, Settings, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress, isFreighterSync } from '../lib/wallet';
import { apiGet } from '../lib/api';
import { fetchAnchorTransactions, createAnchorTransaction, fetchFeedbackList } from '../lib/contract';
import type { Committee, AnchorTx, FeedbackItem } from '../lib/types';
import { FeedbackModal } from '../components/FeedbackModal';

type ProfileTab = 'overview' | 'committees' | 'fiat-gateway' | 'settings';

interface ProfileStats {
  committeesCreated: number;
  committeesJoined: number;
}

export function ProfilePage() {
  const { identity, updateProfile, linkWallet, unlinkWallet, navigate, toast, freighterInstalled, freighterChecking, theme } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myCommittees, setMyCommittees] = useState<Committee[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [creditScore, setCreditScore] = useState(715);
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
      setCreditScore(profile.credit_score || 715);
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
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
          theme === 'dark' ? 'bg-slate-900 border border-white/10 text-white shadow-2xl' : 'bg-slate-950 text-white shadow-2xl'
        }`}>
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className={`font-display text-3xl font-black tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Sign In to View Profile
          </h2>
          <p className={`text-sm max-w-md mx-auto leading-relaxed ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Manage your Soroban smart contract credentials, credit score telemetry, and SEP-0024 fiat gateway.
          </p>
        </div>
        <button
          className={`rounded-xl px-8 py-3 text-sm font-bold shadow-md hover:scale-105 transition ${
            theme === 'dark' ? 'bg-white text-black font-black' : 'btn-primary'
          }`}
          onClick={() => navigate({ name: 'landing' })}
        >
          Return to Home Page
        </button>
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
    toast({ kind: 'success', title: 'Address copied' });
    setTimeout(() => setCopied(false), 1400);
  };

  // Credit score helpers
  const scoreLabel = creditScore >= 800 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 600 ? 'Fair' : 'Poor';
  const scoreColor = creditScore >= 800 ? '#10b981' : creditScore >= 700 ? '#0ea5e9' : creditScore >= 600 ? '#f59e0b' : '#ef4444';
  const scoreGradientId = 'scoreGrad' + Math.floor(creditScore / 100);
  const pct = Math.max(0, Math.min(1, (creditScore - 300) / 600));
  const arcLength = 125.7;
  const dashOffset = arcLength * (1 - pct);

  const statusMeta: Record<string, { label: string; bg: string; dot: string }> = {
    forming:   { label: 'Forming',   bg: theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     dot: 'bg-amber-400' },
    active:    { label: 'Active',    bg: theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
    completed: { label: 'Completed', bg: theme === 'dark' ? 'bg-slate-800 text-slate-300 border border-white/10' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',     dot: 'bg-slate-400' },
    cancelled: { label: 'Cancelled', bg: theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 ring-1 ring-red-200',            dot: 'bg-red-400' },
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8 animate-page-enter">
      {/* ── Top Executive Profile Header Bar ── */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 space-y-6 border ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-md ring-4 ${
                theme === 'dark' ? 'ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'ring-slate-100'
              }`}
              style={{ background: avatarGradient(seed) }}
            >
              {initials(identity.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>{identity.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <ShieldCheck className="h-3 w-3" /> Soroban Verified
                </span>
              </div>
              <div className={`flex items-center gap-3 text-xs font-mono mt-1 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
              }`}>
                <span>{identity.publicKey ? shortAddress(identity.publicKey, 8, 6) : identity.email}</span>
                {identity.publicKey && (
                  <button onClick={copyAddr} className={`transition flex items-center gap-1 ${
                    theme === 'dark' ? 'hover:text-emerald-400' : 'hover:text-slate-900'
                  }`}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                )}
                <span className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className={theme === 'dark' ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>Stellar Testnet</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-slate-800/80 text-slate-200 border border-white/10 hover:bg-white/15 hover:text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Leave Review
            </button>
            <button
              onClick={() => navigate({ name: 'create' })}
              className={`rounded-xl px-5 py-2.5 text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                  : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
            >
              <Plus className="h-4 w-4" /> Create Circle
            </button>
          </div>
        </div>

        {/* ── Profile Segmented Tabs ── */}
        <div className={`flex items-center gap-2 border-t pt-6 overflow-x-auto ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}>
          {[
            { key: 'overview', label: 'Overview & Reputation', icon: ShieldCheck },
            { key: 'committees', label: 'My ROSCA Circles', icon: Activity, count: myCommittees.length },
            { key: 'fiat-gateway', label: 'INR Fiat Gateway', icon: Landmark },
            { key: 'settings', label: 'Settings & Wallet', icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as ProfileTab)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs transition-all duration-200 ${
                  active
                    ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-slate-900 text-white font-black shadow-md'
                    : theme === 'dark' ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-white/10' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? (theme === 'dark' ? 'text-black' : 'text-emerald-400') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-400')}`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active
                      ? theme === 'dark' ? 'bg-black/10 text-black font-black' : 'bg-white/20 text-white'
                      : theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & REPUTATION (BENTO BOX GRID) ── */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bento Card 1: Credit Score Gauge */}
          <div className={`rounded-3xl p-6 text-white shadow-2xl space-y-4 relative overflow-hidden border backdrop-blur-2xl ${
            theme === 'dark'
              ? 'liquid-glass bg-slate-900/90 border-white/10'
              : 'bg-slate-950 border-slate-800 shadow-xl'
          }`}>
            <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full blur-3xl opacity-20" style={{ background: scoreColor }} />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Credit Telemetry
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Tier A Prime
              </span>
            </div>

            <div className="relative mx-auto flex h-36 w-56 items-end justify-center pt-2">
              <svg viewBox="0 0 120 70" className="w-full h-full" overflow="visible">
                <defs>
                  <linearGradient id={scoreGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="75%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={`url(#${scoreGradientId})`}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
              </svg>
              <div className="absolute bottom-2 text-center">
                <div className="font-mono text-4xl font-black text-white">{creditScore}</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</div>
              </div>
            </div>

            <div className="space-y-2 text-left pt-2 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score Boosters</p>
              {[
                { label: 'On-Time Payout Contribution', pts: '+15' },
                { label: 'Complete ROSCA Cycle', pts: '+30' },
                { label: 'SEP-0024 Fiat Gateway Settlement', pts: '+10' },
              ].map((b) => (
                <div key={b.label} className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2.5 border border-white/10 text-xs">
                  <span className="text-slate-300 font-medium">{b.label}</span>
                  <span className="font-mono font-bold text-emerald-400">{b.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Card 2: Wallet & Identity Telemetry */}
          <div className={`rounded-3xl p-6 shadow-2xl space-y-4 border transition-all ${
            theme === 'dark'
              ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            <h3 className={`font-display text-base font-black flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Wallet className="h-4 w-4 text-sky-400" /> On-Chain Identity
            </h3>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-900'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stellar Wallet</span>
                <p className={`font-mono text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {identity.publicKey ? identity.publicKey : 'No wallet linked'}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-900'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Member Since</span>
                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(identity.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                theme === 'dark'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>Network Consensus</span>
                <p className={`text-xs font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Soroban Testnet Active
                </p>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Reputation Badges */}
          <div className={`rounded-3xl p-6 shadow-2xl space-y-4 border transition-all ${
            theme === 'dark'
              ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            <h3 className={`font-display text-base font-black flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Award className="h-4 w-4 text-amber-400" /> Reputation Badges
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Soroban Pioneer', desc: 'Verified contract signer', color: theme === 'dark' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                { title: 'Zero Default', desc: '100% on-time payouts', color: theme === 'dark' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { title: 'Anchor Verified', desc: 'SEP-0024 Ramp User', color: theme === 'dark' ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700' },
                { title: 'Community Saver', desc: 'Active ROSCA member', color: theme === 'dark' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700' },
              ].map((badge) => (
                <div key={badge.title} className={`p-3 rounded-2xl border text-center space-y-1 ${badge.color}`}>
                  <div className="font-bold text-xs">{badge.title}</div>
                  <div className="text-[10px] opacity-80">{badge.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY ROSCA CIRCLES ── */}
      {activeTab === 'committees' && (
        <div className={`rounded-3xl p-6 shadow-2xl border transition-all space-y-5 ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div>
              <h3 className={`font-display text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>My ROSCA Committees</h3>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Manage your active savings circles, contributions, and distributions.</p>
            </div>
            <button
              onClick={() => navigate({ name: 'create' })}
              className={`rounded-xl px-4 py-2 text-xs font-black shadow-md transition flex items-center gap-1.5 self-start sm:self-auto ${
                theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
            >
              <Plus className="h-4 w-4" /> Start New Circle
            </button>
          </div>

          {loadingData ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : myCommittees.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border space-y-3 ${
              theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <Activity className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className={`font-display text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No Committees Joined Yet</h4>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Explore active public committees on the marketplace or start your own.</p>
              <button
                onClick={() => navigate({ name: 'explore' })}
                className={`rounded-xl px-6 py-2.5 text-xs font-bold border shadow-sm transition ${
                  theme === 'dark' ? 'bg-white/10 text-white border-white/15 hover:bg-white/20' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Explore Marketplace →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myCommittees.map(c => {
                const meta = statusMeta[c.status] || statusMeta.completed;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate({ name: 'committee', id: c.id })}
                    className={`group flex flex-col justify-between gap-4 rounded-2xl p-5 border text-left transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-slate-950/80 border-white/10 text-white hover:border-emerald-500/40'
                        : 'bg-white border-slate-200/90 text-slate-900 hover:border-emerald-500/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm transition ${
                        theme === 'dark' ? 'bg-white/15 group-hover:bg-emerald-500 group-hover:text-black' : 'bg-slate-900 group-hover:bg-emerald-600'
                      }`}>
                        {c.name[0]}
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className={`font-bold text-sm transition ${
                        theme === 'dark' ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'
                      }`}>{c.name}</h4>
                      <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{c.contribution_amount} XLM / cycle · {c.member_count} members</p>
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between text-xs font-bold text-emerald-400 ${
                      theme === 'dark' ? 'border-white/10' : 'border-slate-100'
                    }`}>
                      <span>View Details</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: INR FIAT GATEWAY ── */}
      {activeTab === 'fiat-gateway' && (
        <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all space-y-6 ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div>
            <h3 className={`font-display text-xl font-black flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Landmark className="h-6 w-6 text-sky-400" /> Stellar SEP-0024 Fiat Ramp (INR ↔ XLM)
            </h3>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulate Indian Rupee (INR) on/off-ramping via anchor UPI bank transfer. Fixed testnet rate: ₹10 = 1 XLM.
            </p>
          </div>

          <form onSubmit={handleAnchorSimulate} className="space-y-5 max-w-2xl">
            <div className={`grid grid-cols-2 rounded-2xl p-1 text-xs font-bold border ${
              theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              {(['deposit', 'withdrawal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setAnchorType(t); setAnchorAmountInr(''); setAnchorAmountXlm(''); }}
                  className={`rounded-xl py-2.5 transition-all ${
                    anchorType === t
                      ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-white text-slate-900 shadow-sm font-black'
                      : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'deposit' ? '⬇ Deposit (INR → XLM)' : '⬆ Withdraw (XLM → INR)'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>INR Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  className={`mt-1 w-full rounded-xl px-3.5 py-2 text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition ${
                    theme === 'dark' ? 'bg-slate-950/80 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
                  }`}
                  value={anchorAmountInr}
                  onChange={e => { const v = e.target.value; setAnchorAmountInr(v); setAnchorAmountXlm(v ? (Number(v) / 10).toFixed(2) : ''); }}
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>XLM {anchorType === 'deposit' ? 'Received' : 'Sent'}</label>
                <input
                  type="number"
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-xs font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-950/90 text-emerald-400 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  value={anchorAmountXlm}
                  readOnly
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                {anchorType === 'deposit' ? 'UPI VPA / Bank ID' : 'Withdrawal UPI VPA'}
              </label>
              <input
                type="text"
                className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition ${
                  theme === 'dark' ? 'bg-slate-950/80 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
                }`}
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. sovereign@upi"
                required
              />
            </div>

            <button
              type="submit"
              disabled={simulatingAnchor}
              className={`w-full rounded-xl py-3 text-xs font-black shadow-md transition flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
            >
              {simulatingAnchor ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Settling SEP-0024 Gateway...</>
              ) : anchorType === 'deposit' ? (
                <><Send className="h-4 w-4" /> Execute INR Deposit (₹{anchorAmountInr || '0'})</>
              ) : (
                <><ArrowUpDown className="h-4 w-4" /> Withdraw XLM to INR (₹{anchorAmountInr || '0'})</>
              )}
            </button>
          </form>

          {/* Settlement History Log */}
          {anchorTxs.length > 0 && (
            <div className={`pt-6 border-t space-y-3 ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                <History className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`} /> Settlement Log
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {anchorTxs.map(tx => (
                  <div key={tx.id} className={`flex items-center justify-between rounded-xl p-3.5 border text-xs ${
                    theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                        tx.tx_type === 'deposit'
                          ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                          : theme === 'dark' ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {tx.tx_type === 'deposit' ? '↓' : '↑'}
                      </span>
                      <div>
                        <span className={`font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tx.tx_type}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tx.amount_xlm} XLM</div>
                      <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>₹{tx.amount_inr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: SETTINGS & WALLET ── */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Credentials Settings Card */}
          <div className={`rounded-3xl p-6 border shadow-2xl space-y-4 transition-all ${
            theme === 'dark'
              ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
              <h3 className={`font-display text-base font-black flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <User className="h-4 w-4 text-emerald-400" /> Profile Credentials
              </h3>
              {!editing ? (
                <button
                  onClick={startEdit}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Edit2 className="h-3 w-3" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditing(false)} className="text-xs font-bold text-slate-400 hover:text-white p-1">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={saveEdit} disabled={saving} className={`rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 ${
                    theme === 'dark' ? 'bg-white text-black font-black' : 'bg-slate-900 text-white'
                  }`}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Display Name</label>
                {editing ? (
                  <input
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      theme === 'dark' ? 'bg-slate-950/80 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
                    }`}
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={40}
                    autoFocus
                  />
                ) : (
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{identity.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Email Address</label>
                <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {identity.email}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                  }`}>Locked</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Bio</label>
                {editing ? (
                  <textarea
                    className={`w-full rounded-xl border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none min-h-[70px] ${
                      theme === 'dark' ? 'bg-slate-950/80 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
                    }`}
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    maxLength={280}
                    placeholder="Tell others about yourself..."
                  />
                ) : (
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{identity.bio || <span className="text-slate-500 italic">No bio provided</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* Freighter Wallet Integration */}
          <div className={`rounded-3xl p-6 border shadow-2xl space-y-4 transition-all ${
            theme === 'dark'
              ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            <h3 className={`font-display text-base font-black flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Wallet className="h-4 w-4 text-sky-400" /> Freighter Wallet Setup
            </h3>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Connect your Stellar Freighter extension to sign Soroban smart contract operations and execute rotation payouts.
            </p>

            {identity.publicKey ? (
              <div className="space-y-3">
                <div className={`flex items-center justify-between gap-2 rounded-2xl p-3.5 border ${
                  theme === 'dark'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs font-bold truncate">{shortAddress(identity.publicKey, 10, 8)}</span>
                  </div>
                  <button onClick={copyAddr} className="text-emerald-400 hover:text-emerald-300 transition shrink-0 p-1">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${identity.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 rounded-xl py-2 text-center text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-200 border-white/10 hover:bg-slate-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Explorer
                  </a>
                  <button
                    onClick={handleUnlinkWallet}
                    className="flex-1 rounded-xl py-2 text-center text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center gap-1"
                  >
                    <Link2Off className="h-3.5 w-3.5" /> Unlink
                  </button>
                </div>
              </div>
            ) : (
              !freighterChecking && !freighterInstalled ? (
                <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold">Freighter Extension Not Detected</p>
                      <p className="text-[11px] text-amber-200">Install Freighter to connect your Stellar wallet on testnet.</p>
                      <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 underline pt-1">
                        Get Freighter Extension <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLinkWallet}
                  disabled={linkingWallet || freighterChecking || (!freighterInstalled && !isFreighterSync())}
                  className={`w-full rounded-xl py-3 text-xs font-black shadow-md transition flex items-center justify-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'bg-slate-900 text-white hover:bg-emerald-600'
                  }`}
                >
                  {linkingWallet ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting Freighter...</> : <><Wallet className="h-4 w-4" /> Link Freighter Wallet</>}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal open={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} onSubmitted={loadProfileData} />
    </div>
  );
}
