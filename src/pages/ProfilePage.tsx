import { useEffect, useState } from 'react';
import {
  User, Mail, Wallet, Shield, Edit2, Save, X, Loader2, ExternalLink,
  CalendarDays, Star, TrendingUp, Copy, Check, Link2Off, AlertCircle,
  Send, Landmark, History, ArrowUpDown, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress, isFreighterSync } from '../lib/wallet';
import { apiGet } from '../lib/api';
import { fetchAnchorTransactions, createAnchorTransaction } from '../lib/contract';
import type { Committee, AnchorTx } from '../lib/types';

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
  const [loadingData, setLoadingData] = useState(true);

  const loadProfileData = () => {
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

  const startEdit = () => {
    setNameInput(identity.name);
    setBioInput(identity.bio || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: nameInput, bio: bioInput });
      toast({ kind: 'success', title: 'Profile updated' });
      setEditing(false);
    } catch (e) {
      toast({ kind: 'error', title: 'Update failed', description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWallet = async () => {
    setLinkingWallet(true);
    try {
      await linkWallet();
      toast({ kind: 'success', title: 'Freighter linked!', description: 'Your Stellar wallet is connected.' });
    } catch (e) {
      toast({ kind: 'error', title: 'Link failed', description: e instanceof Error ? e.message : '' });
    } finally {
      setLinkingWallet(false);
    }
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
          : `Anchor received ${xlm} XLM and paid ₹${inr} via UPI.`
      });
      setAnchorAmountInr('');
      setAnchorAmountXlm('');
      setUpiId('');
      loadProfileData();
    } catch (err) {
      toast({ kind: 'error', title: 'Anchor Settlement Failed', description: err instanceof Error ? err.message : '' });
    } finally {
      setSimulatingAnchor(false);
    }
  };

  const copyAddr = () => {
    if (!identity.publicKey) return;
    navigator.clipboard.writeText(identity.publicKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const statusColors: Record<string, string> = {
    forming: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-ink-100 text-ink-500',
    cancelled: 'bg-danger-100 text-danger-600',
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-8">My Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left: avatar + stats ── */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="card p-6 text-center">
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-2xl text-2xl font-bold text-white shadow-soft"
              style={{ background: avatarGradient(seed) }}
            >
              {initials(identity.name)}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink-900">{identity.name}</h2>
            <p className="text-sm text-ink-400">{identity.email}</p>
            {identity.bio && <p className="mt-2 text-sm text-ink-600 leading-relaxed">{identity.bio}</p>}
            <p className="mt-2 text-[11px] text-ink-400 flex items-center justify-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Member since {new Date(identity.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Stats</h3>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-ink-600"><Star className="h-4 w-4 text-brand-400" />Created</span>
                <span className="font-bold text-ink-900">{stats.committeesCreated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-ink-600"><TrendingUp className="h-4 w-4 text-sapphire-400" />Joined</span>
                <span className="font-bold text-ink-900">{stats.committeesJoined}</span>
              </div>
            </div>
          )}

          {/* Credit Trust Score */}
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Credit Trust Score
            </h3>
            
            {/* Speed Gauge Meter */}
            <div className="relative flex flex-col items-center justify-center pt-2">
              <svg className="w-32 h-20" viewBox="0 0 100 60">
                {/* Background arc */}
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                {/* Foreground arc */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * Math.max(0, creditScore - 300)) / 600}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-1 text-center">
                <span className="text-2xl font-extrabold text-ink-900">{creditScore}</span>
                <span className="block text-[9px] uppercase font-bold text-ink-400 tracking-wider">
                  {creditScore >= 800 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 600 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>

            <div className="text-xs text-ink-500 text-center leading-relaxed">
              Based on your RotaFi ROSCA repayment reputation. Higher scores unlock lower bidding rates and higher pool limits.
            </div>

            {/* Score booster tips */}
            <div className="rounded-lg bg-ink-50 p-2.5 text-[10px] text-ink-600 leading-snug">
              <span className="font-semibold block text-brand-600 mb-0.5">🚀 Score Boosters:</span>
              • Contribute on-time (+15)<br />
              • Complete a full group (+30)<br />
              • Deposit fiat via anchor (+10)
            </div>
          </div>
        </div>

        {/* ── Right: details ── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Edit profile */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-900">Account details</h3>
              {!editing
                ? <button onClick={startEdit} className="btn-ghost btn-sm"><Edit2 className="h-4 w-4" /> Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="btn-ghost btn-sm"><X className="h-4 w-4" /></button>
                    <button onClick={saveEdit} disabled={saving} className="btn-primary btn-sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
              }
            </div>

            <div className="space-y-3">
              <div>
                <label className="label flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Display name</label>
                {editing
                  ? <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={40} autoFocus />
                  : <p className="text-sm text-ink-800 mt-1">{identity.name}</p>}
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</label>
                <p className="text-sm text-ink-500 mt-1">{identity.email} <span className="text-[10px] bg-ink-100 text-ink-400 rounded px-1 py-0.5">cannot change</span></p>
              </div>
              <div>
                <label className="label">Bio</label>
                {editing
                  ? <textarea className="input resize-none min-h-[72px]" value={bioInput} onChange={e => setBioInput(e.target.value)} maxLength={280} placeholder="Tell others about yourself…" />
                  : <p className="text-sm text-ink-600 mt-1">{identity.bio || <span className="text-ink-400 italic">No bio yet</span>}</p>}
              </div>
            </div>
          </div>

          {/* Freighter wallet */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink-900 mb-1 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-500" /> Stellar Wallet
            </h3>
            <p className="text-xs text-ink-400 mb-4">Link your Freighter wallet to sign on-chain transactions and contribute to committees.</p>

            {identity.publicKey ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 ring-1 ring-emerald-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-mono text-xs text-emerald-800 truncate">{shortAddress(identity.publicKey, 12, 10)}</span>
                  </div>
                  <button onClick={copyAddr} className="shrink-0 text-emerald-600 hover:text-emerald-800">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <a href={`https://stellar.expert/explorer/testnet/account/${identity.publicKey}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-ghost btn-sm flex-1 justify-center">
                    <ExternalLink className="h-4 w-4" /> Explorer
                  </a>
                  <button onClick={handleUnlinkWallet} className="btn-ghost btn-sm flex-1 justify-center text-danger-600 hover:bg-danger-50">
                    <Link2Off className="h-4 w-4" /> Unlink
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {!freighterChecking && !freighterInstalled ? (
                  <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Freighter not installed</p>
                        <p className="mt-1 text-xs text-amber-700">Install the Freighter browser extension to link your Stellar wallet.</p>
                        <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
                          Install Freighter <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleLinkWallet}
                    disabled={linkingWallet || freighterChecking || (!freighterInstalled && !isFreighterSync())}
                    className="btn-primary w-full justify-center"
                  >
                    {linkingWallet
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                      : <><Wallet className="h-4 w-4" /> Connect Freighter</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* My committees */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-900">My committees</h3>
              <button onClick={() => navigate({ name: 'create' })} className="btn-primary btn-sm">+ Create</button>
            </div>

            {loadingData ? (
              <div className="grid place-items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-ink-300" />
              </div>
            ) : myCommittees.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No committees yet. <button onClick={() => navigate({ name: 'create' })} className="text-brand-600 font-medium hover:underline">Create one?</button></p>
            ) : (
              <div className="space-y-2">
                {myCommittees.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate({ name: 'committee', id: c.id })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">{c.name}</p>
                      <p className="text-xs text-ink-400">{c.contribution_amount} XLM/cycle · {c.member_count} members</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[c.status] || 'bg-ink-100 text-ink-500'}`}>
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stellar Fiat Anchor (INR ↔ XLM) */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-ink-900 flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-brand-500" /> Stellar Fiat Anchor (INR ↔ XLM)
            </h3>
            <p className="text-xs text-ink-400">
              Simulate Indian Rupee (INR) on/off-ramping. Swap INR for native XLM token assets instantly via anchor UPI bank transfer.
            </p>

            <form onSubmit={handleAnchorSimulate} className="space-y-3 bg-ink-50/50 rounded-xl p-3.5 ring-1 ring-ink-100">
              <div className="flex rounded-lg bg-ink-200 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => { setAnchorType('deposit'); setAnchorAmountInr(''); setAnchorAmountXlm(''); }}
                  className={`flex-1 rounded-md py-1 font-semibold transition ${anchorType === 'deposit' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700'}`}
                >
                  Deposit (INR → XLM)
                </button>
                <button
                  type="button"
                  onClick={() => { setAnchorType('withdrawal'); setAnchorAmountInr(''); setAnchorAmountXlm(''); }}
                  className={`flex-1 rounded-md py-1 font-semibold transition ${anchorType === 'withdrawal' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700'}`}
                >
                  Withdraw (XLM → INR)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[10px]">INR Amount (₹)</label>
                  <input
                    type="number"
                    min={1}
                    className="input py-1 text-xs"
                    value={anchorAmountInr}
                    onChange={e => {
                      const inr = e.target.value;
                      setAnchorAmountInr(inr);
                      setAnchorAmountXlm(inr ? (Number(inr) / 10).toFixed(2) : '');
                    }}
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div>
                  <label className="label text-[10px]">XLM Received</label>
                  <input
                    type="number"
                    className="input py-1 text-xs bg-ink-100/50 text-ink-500"
                    value={anchorAmountXlm}
                    readOnly
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px]">
                  {anchorType === 'deposit' ? 'Pay via UPI ID' : 'Withdrawal UPI ID / VPA'}
                </label>
                <input
                  type="text"
                  className="input py-1 text-xs"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. upi-address@paytm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={simulatingAnchor}
                className="btn-primary btn-sm w-full justify-center"
              >
                {simulatingAnchor ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Settling...</>
                ) : anchorType === 'deposit' ? (
                  <><Send className="h-3.5 w-3.5" /> Deposit ₹{anchorAmountInr || '0'}</>
                ) : (
                  <><ArrowUpDown className="h-3.5 w-3.5" /> Withdraw ₹{anchorAmountInr || '0'}</>
                )}
              </button>
            </form>

            {/* Anchor Transactions history */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-ink-500 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Settle History
              </h4>
              {anchorTxs.length === 0 ? (
                <p className="text-[11px] text-ink-400 italic text-center py-3">No anchor transfers settled yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {anchorTxs.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between border-b border-ink-100 pb-1.5 last:border-0">
                      <div>
                        <span className={`inline-block text-[9px] uppercase font-bold px-1 py-0.2 rounded mr-1.5 ${tx.tx_type === 'deposit' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-sapphire-50 text-sapphire-700 ring-1 ring-sapphire-100'}`}>
                          {tx.tx_type}
                        </span>
                        <span className="text-ink-800 font-medium">₹{tx.amount_inr}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-ink-950 font-bold block">{tx.amount_xlm} XLM</span>
                        <span className="text-[9px] text-ink-400 block">
                          {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
