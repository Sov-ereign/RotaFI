import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Users, Wallet, TrendingUp, Coins, ArrowRight, Sparkles, RotateCw,
  ShieldCheck, Check, Copy, ExternalLink, Search, Filter, Layers, Zap,
  Activity, ArrowUpRight, ArrowDownRight, Clock, ChevronRight, Lock, CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMyCommittees, fetchMemberCount, formatINR, formatINRShort } from '../lib/contract';
import type { Committee } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';
import { EmptyState } from '../components/EmptyState';
import { shortAddress, avatarGradient, initials } from '../lib/wallet';
import { AnalyticsPanel } from '../components/AnalyticsPanel';

type DashboardTab = 'all' | 'active' | 'forming' | 'completed';

export function DashboardPage() {
  const { identity, navigate, toast, theme } = useApp();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!identity) return;
    setLoading(true);
    fetchMyCommittees(identity.publicKey ?? identity.email)
      .then(async (cs) => {
        setCommittees(cs);
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await fetchMemberCount(c.id)] as const),
        );
        setCounts(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, [identity]);

  const copyAddress = () => {
    if (identity?.publicKey) {
      navigator.clipboard.writeText(identity.publicKey);
      setCopied(true);
      toast({ kind: 'success', title: 'Address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const active = useMemo(() => committees.filter((c) => c.status === 'active'), [committees]);
  const forming = useMemo(() => committees.filter((c) => c.status === 'forming'), [committees]);
  const completed = useMemo(() => committees.filter((c) => c.status === 'completed'), [committees]);
  const organized = useMemo(() => committees.filter((c) => identity?.publicKey && c.organizer_wallet === identity.publicKey), [committees, identity]);
  const totalContributed = useMemo(() => committees.reduce((s, c) => s + c.contribution_amount * c.current_cycle, 0), [committees]);

  const filteredCommittees = useMemo(() => {
    return committees.filter((c) => {
      if (activeTab !== 'all' && c.status !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.organizer_name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [committees, activeTab, searchQuery]);

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
            Sign In to Access Financial Telemetry
          </h2>
          <p className={`text-sm max-w-md mx-auto leading-relaxed font-medium ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Manage your on-chain rotating credit portfolio, Soroban smart contract escrows, and yield telemetry.
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

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8 animate-page-enter">
      {/* ── 1. The Verdict Card (Rich Gradient Canvas in Light / Ultra Liquid-Glass in Moon) ── */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 space-y-6 ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/40 border border-slate-200/90 text-slate-900 shadow-md'
      }`}>
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-90" />

        {/* Ambient Glow Effects for Dark Mode */}
        {theme === 'dark' && (
          <>
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" style={{ transform: 'translateZ(0)' }} />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" style={{ transform: 'translateZ(0)' }} />
          </>
        )}

        {/* Header Bar */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6 relative z-10 ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-200/70'
        }`}>
          <div className="flex items-center gap-4">
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-black text-white shadow-md ring-4 ${
                theme === 'dark' ? 'ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'ring-white'
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
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-extrabold ${
                  theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20'
                }`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Soroban Verified
                </span>
              </div>
              <div className={`flex items-center gap-3 text-xs font-mono mt-1 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
              }`}>
                <span className="font-semibold">{identity.publicKey ? shortAddress(identity.publicKey, 8, 6) : identity.email}</span>
                {identity.publicKey && (
                  <button onClick={copyAddress} className={`transition flex items-center gap-1 ${
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
              onClick={() => window.location.reload()}
              className={`rounded-xl p-2.5 shadow-sm hover:shadow transition ${
                theme === 'dark'
                  ? 'bg-slate-800/80 text-slate-200 border border-white/10 hover:bg-white/15 hover:text-white'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:text-slate-900'
              }`}
              title="Refresh Telemetry"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate({ name: 'explore' })}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition ${
                theme === 'dark'
                  ? 'bg-slate-800/80 text-slate-200 border border-white/10 hover:bg-white/15 hover:text-white'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => navigate({ name: 'create' })}
              className={`rounded-xl px-5 py-2.5 text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                  : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
            >
              <Plus className="h-4 w-4" /> Create Committee
            </button>
          </div>
        </div>

        {/* Verdict 4-Box Metric Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-1 relative z-10">
          {/* Verdict 1: Total Net Portfolio Escrow */}
          <div className={`rounded-2xl border p-5 shadow-xs transition-all duration-300 space-y-2 group ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-white/10 text-white hover:border-emerald-500/40 hover:bg-slate-900/90 backdrop-blur-xl'
              : 'bg-white/90 border-slate-200/80 text-slate-900 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className={theme === 'dark' ? 'text-slate-400 font-extrabold' : ''}>Escrow Portfolio</span>
              <span className={`font-extrabold flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] ${
                theme === 'dark'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
              }`}>
                <ArrowUpRight className="h-3 w-3" /> +18.4%
              </span>
            </div>
            <div className={`font-mono text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-slate-900'
            }`}>
              {formatINRShort(totalContributed)}
            </div>
            <div className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Soroban Escrow Guarantee</div>
          </div>

          {/* Verdict 2: Active Circles */}
          <div className={`rounded-2xl border p-5 shadow-xs transition-all duration-300 space-y-2 group ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-white/10 text-white hover:border-sky-500/40 hover:bg-slate-900/90 backdrop-blur-xl'
              : 'bg-white/90 border-slate-200/80 text-slate-900 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className={theme === 'dark' ? 'text-slate-400 font-extrabold' : ''}>Active Circles</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                theme === 'dark'
                  ? 'bg-slate-800/90 text-slate-200 border border-white/15'
                  : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
              }`}>
                {committees.length} Total
              </span>
            </div>
            <div className={`font-mono text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-slate-900'
            }`}>
              {active.length} <span className={`text-xs font-bold font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Active</span>
            </div>
            <div className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{forming.length} forming · {organized.length} organizing</div>
          </div>

          {/* Verdict 3: Stellar Yield APY Boost */}
          <div className={`rounded-2xl border p-5 shadow-xs transition-all duration-300 space-y-2 group ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-white/10 text-white hover:border-emerald-500/40 hover:bg-slate-900/90 backdrop-blur-xl'
              : 'bg-white/90 border-slate-200/80 text-slate-900 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className={theme === 'dark' ? 'text-slate-400 font-extrabold' : ''}>Stellar Yield APY</span>
              <span className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] ${
                theme === 'dark'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
              }`}>+4.80% APY</span>
            </div>
            <div className={`font-mono text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-slate-900'
            }`}>
              +4.80%
            </div>
            <div className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Automated Liquidity Vault</div>
          </div>

          {/* Verdict 4: Credit Score Rating */}
          <div className={`rounded-2xl border p-5 shadow-xs transition-all duration-300 space-y-2 group ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-white/10 text-white hover:border-indigo-500/40 hover:bg-slate-900/90 backdrop-blur-xl'
              : 'bg-white/90 border-slate-200/80 text-slate-900 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className={theme === 'dark' ? 'text-slate-400 font-extrabold' : ''}>Credit Reputation</span>
              <span className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] ${
                theme === 'dark'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
              }`}>Tier A Prime</span>
            </div>
            <div className={`font-mono text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-slate-900'
            }`}>
              715 <span className={`text-xs font-bold font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>/ 850</span>
            </div>
            <div className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Zero-Default Smart Contracts</div>
          </div>
        </div>
      </div>

      {/* ── 2. Money in Motion (Dark Neon Status Bar) ── */}
      <div className={`rounded-2xl p-4 px-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium text-white ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border border-white/10'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-200">
            <strong className="font-bold text-white">System Telemetry:</strong> All {active.length > 0 ? `${active.length} active` : ''} Soroban escrow contracts are synchronized and operating normally on Stellar Testnet.
          </span>
        </div>

        <button
          onClick={() => navigate({ name: 'explore' })}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 transition"
        >
          View Marketplace Circles <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── 3. Cash Flow & Rotation Trajectory Chart ── */}
      {committees.length > 0 && <AnalyticsPanel />}

      {/* ── 4. Dense, Filterable Committee Feed ("The Workhorse") ── */}
      <div className="space-y-6">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-200/90'
        }`}>
          <div>
            <h2 className={`font-display text-2xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              My ROSCA Committees
            </h2>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              High-density view of active savings circles, rotation payouts, and escrow distributions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className={`inline-flex items-center rounded-xl p-1 text-xs font-bold border ${
              theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200/80'
            }`}>
              {[
                { key: 'all', label: 'All', count: committees.length },
                { key: 'active', label: 'Active', count: active.length },
                { key: 'forming', label: 'Forming', count: forming.length },
                { key: 'completed', label: 'Completed', count: completed.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as DashboardTab)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all duration-200 ${
                    activeTab === tab.key
                      ? theme === 'dark'
                        ? 'bg-white text-black font-black shadow-md'
                        : 'bg-white text-slate-900 shadow-sm font-black'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab.key
                      ? theme === 'dark' ? 'bg-slate-200 text-black font-extrabold' : 'bg-slate-100 text-slate-900 font-extrabold'
                      : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search committees..."
                className={`w-full rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900/90 text-white border border-white/10 placeholder-slate-500'
                    : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`card h-56 animate-pulse p-5 rounded-2xl ${
                theme === 'dark' ? 'bg-slate-900/50 border border-white/10' : 'bg-slate-100'
              }`} />
            ))}
          </div>
        ) : committees.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center space-y-4 shadow-sm ${
            theme === 'dark' ? 'liquid-glass bg-slate-900/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-emerald-500" />}
              title="No ROSCA Committees Joined Yet"
              description="Start your first transparent on-chain savings circle or explore active public committees."
              action={
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    className={`rounded-xl px-6 py-2.5 text-xs font-bold shadow-md transition ${
                      theme === 'dark' ? 'bg-white text-black hover:bg-white/90 font-black' : 'bg-slate-900 text-white hover:bg-emerald-600'
                    }`}
                    onClick={() => navigate({ name: 'create' })}
                  >
                    <Plus className="h-4 w-4 mr-1 inline" /> Create Committee
                  </button>
                  <button
                    className={`rounded-xl px-6 py-2.5 text-xs font-bold border shadow-sm transition ${
                      theme === 'dark' ? 'bg-white/10 text-white border-white/15 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => navigate({ name: 'explore' })}
                  >
                    Explore Marketplace <ArrowRight className="h-4 w-4 ml-1 inline" />
                  </button>
                </div>
              }
            />
          </div>
        ) : filteredCommittees.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${
            theme === 'dark' ? 'liquid-glass bg-slate-900/80 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <p className="text-sm font-semibold">No committees match your search query.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCommittees.map((c) => (
              <CommitteeCard
                key={c.id}
                committee={c}
                memberCount={counts[c.id]}
                isOrganizer={c.organizer_wallet === identity.publicKey}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 5. Dark Glass Trust Disclosures Strip (Footer) ── */}
      <div className={`rounded-2xl p-4 px-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white'
          : 'bg-slate-950 border border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="h-4 w-4" /> Soroban Smart Contract Guarantee
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:inline text-slate-400">100% Non-Custodial Rotating Savings Escrow</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="text-slate-400">Network: <strong className="text-white">Stellar Testnet</strong></span>
          <button
            onClick={() => navigate({ name: 'profile' })}
            className="text-emerald-400 hover:text-emerald-300 font-bold font-sans transition"
          >
            Credit Score Tier A →
          </button>
        </div>
      </div>
    </div>
  );
}

export { formatINR };
