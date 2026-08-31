import { useState } from 'react';
import {
  Wallet, LogOut, Copy, Check, ChevronDown, ExternalLink,
  AlertCircle, Edit2, User, Mail, Lock, Eye, EyeOff, X, Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress, isFreighterSync } from '../lib/wallet';
import { Modal } from './Modal';

// ── Auth Modal ─────────────────────────────────────────────────────────────────

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, login, navigate, toast, theme } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reset = () => { setName(''); setEmail(''); setPassword(''); setErr(''); setBusy(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (tab === 'register') {
        if (name.trim().length < 2) { setErr('Name must be at least 2 characters'); setBusy(false); return; }
        if (password.length < 6) { setErr('Password must be at least 6 characters'); setBusy(false); return; }
        await register(name.trim(), email.trim(), password);
        toast({ kind: 'success', title: 'Welcome to RotaFi!', description: 'Your account is ready.' });
        navigate({ name: 'dashboard' });
      } else {
        await login(email.trim(), password);
        toast({ kind: 'success', title: 'Signed in', description: 'Welcome back!' });
        navigate({ name: 'dashboard' });
      }
      onClose();
      reset();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title=""
    >
      {/* Header Banner inside Modal */}
      <div className="mb-6 space-y-1">
        <h3 className={`font-display text-2xl font-black tracking-tight ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          {tab === 'login' ? 'Welcome Back to RotaFi' : 'Join the RotaFi Network'}
        </h3>
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {tab === 'login'
            ? 'Sign in to access your ROSCA circles, rotation schedules, and yield.'
            : 'Create your decentralized identity to join or launch Soroban ROSCA circles.'}
        </p>
      </div>

      {/* Segmented Tabs */}
      <div className={`mb-6 flex rounded-xl p-1 text-xs font-bold border ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-100 border-slate-200/80'
      }`}>
        {(['login', 'register'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setErr(''); }}
            className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
              tab === t
                ? theme === 'dark'
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-white text-slate-900 font-black shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            {t === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {tab === 'register' && (
          <div>
            <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <User className="h-3.5 w-3.5 text-emerald-500" /> Display name
            </label>
            <input
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/80 text-white border border-white/10 placeholder-slate-500'
                  : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
              }`}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoFocus={tab === 'register'}
              required
              maxLength={40}
            />
          </div>
        )}

        <div>
          <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Mail className="h-3.5 w-3.5 text-emerald-500" /> Email address
          </label>
          <input
            className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
              theme === 'dark'
                ? 'bg-slate-950/80 text-white border border-white/10 placeholder-slate-500'
                : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
            }`}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus={tab === 'login'}
            required
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Lock className="h-3.5 w-3.5 text-emerald-500" /> Password
          </label>
          <div className="relative">
            <input
              className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/80 text-white border border-white/10 placeholder-slate-500'
                  : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
              }`}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {err && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold border ${
            theme === 'dark'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className={`w-full rounded-xl py-3 text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'bg-white text-black hover:bg-white/90 font-black'
              : 'btn-primary'
          }`}
        >
          {busy ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{tab === 'login' ? 'Signing in…' : 'Creating account…'}</>
          ) : (
            tab === 'login' ? 'Sign in to RotaFi' : 'Create RotaFi Account'
          )}
        </button>
      </form>

      <p className={`mt-5 text-center text-xs font-medium ${
        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          className={`font-bold transition ${
            theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
          }`}
          onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setErr(''); }}
        >
          {tab === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </Modal>
  );
}

// ── WalletBar ─────────────────────────────────────────────────────────────────

export function WalletBar() {
  const { identity, freighterInstalled, freighterChecking, linkWallet, logout, navigate, toast } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <>
        <button
          className="btn-primary btn-sm"
          onClick={() => setAuthOpen(true)}
        >
          <Wallet className="h-4 w-4" /> Connect
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  // ── Logged in ────────────────────────────────────────────────────────────────

  const copyAddr = async () => {
    if (!identity.publicKey) return;
    await navigator.clipboard.writeText(identity.publicKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleLinkWallet = async () => {
    setLinkingWallet(true);
    try {
      await linkWallet();
      toast({ kind: 'success', title: 'Freighter linked!', description: 'Your Stellar wallet is now connected.' });
      setMenuOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const isNotInstalled = !msg || msg.toLowerCase().includes('freighter') === false;
      toast({
        kind: 'error',
        title: isNotInstalled ? 'Freighter not found' : 'Link failed',
        description: isNotInstalled
          ? `Install the Freighter extension at freighter.app, then try again. (Error: ${msg || 'Unknown'})`
          : msg,
      });
    } finally {
      setLinkingWallet(false);
    }
  };

  const seed = identity.publicKey || identity.email;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="group flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 py-1 pl-1 pr-2.5 transition text-white cursor-pointer select-none"
          title="Account Menu"
        >
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white shadow-sm"
            style={{ background: avatarGradient(seed) }}
          >
            {initials(identity.name)}
          </span>
          <span className="text-left min-w-0 max-w-[75px] xs:max-w-[95px] sm:max-w-[120px] truncate">
            <span className="block text-xs font-bold leading-none text-white truncate">{identity.name}</span>
            <span className="block text-[9px] leading-none text-slate-400 truncate mt-0.5">
              {identity.publicKey ? shortAddress(identity.publicKey, 4, 4) : identity.email.split('@')[0]}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-white shrink-0" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-50 mt-2.5 w-72 animate-scale-in rounded-2xl border border-white/15 bg-slate-950/95 text-white p-2 backdrop-blur-2xl shadow-2xl">
              {/* Header */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-md"
                    style={{ background: avatarGradient(seed) }}>
                    {initials(identity.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-white leading-tight truncate">{identity.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{identity.email}</div>
                  </div>
                </div>

                {/* Wallet status */}
                <div className="mt-2.5">
                  {identity.publicKey ? (
                    <button
                      onClick={copyAddr}
                      className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-left border border-white/10 transition hover:bg-white/10"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span className="font-mono text-[11px] text-slate-300 truncate">{shortAddress(identity.publicKey, 10, 8)}</span>
                      </span>
                      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-amber-500/10 px-2.5 py-1.5 border border-amber-500/20">
                      <p className="text-[11px] text-amber-300">No Stellar wallet linked yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-1 h-px bg-white/10" />

              {/* Nav */}
              <button onClick={() => { setMenuOpen(false); navigate({ name: 'dashboard' }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10">
                <Wallet className="h-4 w-4 text-slate-400" /> Dashboard
              </button>
              <button onClick={() => { setMenuOpen(false); navigate({ name: 'profile' }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10">
                <User className="h-4 w-4 text-slate-400" /> My profile
              </button>

              {/* Freighter link/unlink */}
              {!identity.publicKey ? (
                <button
                  onClick={handleLinkWallet}
                  disabled={linkingWallet}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50 font-bold"
                >
                  {linkingWallet
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                    : <><Edit2 className="h-4 w-4 text-emerald-400" /> Link Freighter wallet</>}
                </button>
              ) : (
                <a href={`https://stellar.expert/explorer/testnet/account/${identity.publicKey}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}>
                  <ExternalLink className="h-4 w-4 text-slate-400" /> View on Explorer
                </a>
              )}

              <div className="my-1 h-px bg-white/10" />

              <button onClick={() => { setMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-rose-500/10 font-bold">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Suppress unused import warning */}
      {false && <X />}
    </>
  );
}
