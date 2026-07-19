import { useEffect, useState } from 'react';
import {
  User, Mail, Wallet, Shield, Edit2, Save, X, Loader2, ExternalLink,
  CalendarDays, Star, TrendingUp, Copy, Check, Link2Off, AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress, isFreighterSync } from '../lib/wallet';
import { apiGet } from '../lib/api';
import type { Committee } from '../lib/types';

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
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!identity) return;
    Promise.all([
      apiGet<{ stats: ProfileStats } & Record<string, unknown>>('/users/profile'),
      apiGet<Committee[]>('/users/my-committees'),
    ]).then(([profile, committees]) => {
      setStats(profile.stats);
      setMyCommittees(committees);
    }).catch(() => {}).finally(() => setLoadingData(false));
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
        </div>
      </div>
    </div>
  );
}
