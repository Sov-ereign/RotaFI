import { useEffect, useMemo, useState } from 'react';
import { Search, Compass, Users2, Filter, Sparkles, Plus, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllPublicCommittees, fetchMemberCount } from '../lib/contract';
import type { Committee, CommitteeStatus } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';
import { EmptyState } from '../components/EmptyState';
import { Leaderboard } from '../components/Leaderboard';

type FilterTab = 'all' | 'forming' | 'active' | 'completed';

export function ExplorePage() {
  const { identity, navigate, theme } = useApp();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  useEffect(() => {
    setLoading(true);
    fetchAllPublicCommittees()
      .then(async (cs) => {
        setCommittees(cs);
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await fetchMemberCount(c.id)] as const),
        );
        setCounts(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return committees.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.organizer_name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [committees, tab, query]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Circles' },
    { key: 'forming', label: 'Forming (Open Slots)' },
    { key: 'active', label: 'Active Rotations' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8 animate-page-enter">
        {/* ── Executive Header Banner ── */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white'
            : 'bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/40 border border-slate-200/90 text-slate-900 shadow-md'
        }`}>
          {/* Glow halos */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 opacity-90" />
          {theme === 'dark' && (
            <div className="pointer-events-none absolute -top-16 -right-16 sm:-top-24 sm:-right-24 h-44 w-44 sm:h-64 sm:w-64 rounded-full bg-emerald-500/10 blur-2xl sm:blur-3xl animate-pulse" />
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                theme === 'dark'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20'
              }`}>
                <Sparkles className="h-3.5 w-3.5" /> Public Soroban Marketplace
              </span>
              <h1 className={`font-display text-3xl font-black tracking-tight sm:text-4xl ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Explore On-Chain ROSCAs
              </h1>
              <p className={`text-sm max-w-xl leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Discover active savings circles, join forming committees with open slots, or inspect smart contract rotation logic on Stellar Testnet.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              {identity && (
                <button
                  onClick={() => navigate({ name: 'create' })}
                  className={`rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition flex items-center gap-1.5 shrink-0 ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-white/90 font-black'
                      : 'btn-primary'
                  }`}
                >
                  <Plus className="h-4 w-4" /> Start A Committee
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Search & Filter Navigation Bar ── */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-200/90'
        }`}>
          {/* Category Tabs */}
          <div className={`inline-flex items-center rounded-xl p-1 text-xs font-bold border overflow-x-auto max-w-full ${
            theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200/80'
          }`}>
            {tabs.map((t) => {
              const count = t.key === 'all' ? committees.length : committees.filter((c) => c.status === (t.key as CommitteeStatus)).length;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all duration-200 ${
                    active
                      ? theme === 'dark'
                        ? 'bg-white text-black shadow-md font-black'
                        : 'bg-white text-slate-900 shadow-sm font-black'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active
                      ? theme === 'dark' ? 'bg-slate-200 text-black font-extrabold' : 'bg-slate-100 text-slate-900 font-extrabold'
                      : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or organizer..."
              className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900/90 text-white border border-white/10 placeholder-slate-500'
                  : 'bg-white text-slate-900 border border-slate-200 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* ── Marketplace Grid ── */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`card h-60 animate-pulse p-5 rounded-2xl ${
                theme === 'dark' ? 'bg-slate-900/50 border border-white/10' : 'bg-slate-100'
              }`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-3xl p-10 text-center space-y-4 shadow-sm border ${
            theme === 'dark' ? 'liquid-glass bg-slate-900/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <EmptyState
              icon={<Users2 className="h-8 w-8 text-emerald-500" />}
              title="No committees found"
              description="Try altering your search term or switching filter tabs to see more results."
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CommitteeCard
                key={c.id}
                committee={c}
                memberCount={counts[c.id]}
                isOrganizer={identity ? c.organizer_wallet === identity.publicKey : false}
              />
            ))}
          </div>
        )}

        {/* ── Community Leaderboard ── */}
        <div className="pt-8">
          <Leaderboard
            title="Community Reputation & Bidding Leaderboard"
            periodLabel="Ranked in real-time by on-time contributions & credit rating"
          />
        </div>

        <div className={`flex items-center justify-center gap-2 text-xs font-medium ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Showing {filtered.length} of {committees.length} smart contract committees on Stellar testnet
        </div>
      </div>
    );
  }
