import { useEffect, useMemo, useState } from 'react';
import { Search, Compass, Users2, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllPublicCommittees, fetchMemberCount } from '../lib/contract';
import type { Committee, CommitteeStatus } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';
import { EmptyState } from '../components/EmptyState';

type FilterTab = 'all' | 'forming' | 'active' | 'completed';

export function ExplorePage() {
  const { identity } = useApp();
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
    { key: 'all', label: 'All' },
    { key: 'forming', label: 'Forming' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Explore committees</h1>
          <p className="mt-1 text-sm text-ink-500">
            {identity ? 'Join a forming committee or browse active ones.' : 'Browse live committees on the testnet.'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-inset ring-ink-200 focus-within:ring-2 focus-within:ring-brand-500">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or organizer"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-ink-400" />
        {tabs.map((t) => {
          const n = t.key === 'all' ? committees.length : committees.filter((c) => c.status === (t.key as CommitteeStatus)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-ink-900 text-white shadow-soft'
                  : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] ${tab === t.key ? 'bg-white/20' : 'bg-ink-100 text-ink-500'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-56 animate-pulse p-5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 card">
          <EmptyState
            icon={<Compass className="h-7 w-7" />}
            title="No committees found"
            description={query ? 'Try a different search or filter.' : 'Be the first to create a committee on the testnet.'}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CommitteeCard
              key={c.id}
              committee={c}
              memberCount={counts[c.id]}
              isOrganizer={identity?.publicKey === c.organizer_wallet}
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-ink-400">
        <Users2 className="h-4 w-4" />
        Showing {filtered.length} of {committees.length} committees on Stellar testnet
      </div>
    </div>
  );
}
