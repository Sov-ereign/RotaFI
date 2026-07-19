import { useEffect, useState } from 'react';
import { Plus, Users, Wallet, TrendingUp, Coins, ArrowRight, Sparkles, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMyCommittees, fetchMemberCount, formatINR, formatINRShort } from '../lib/contract';
import type { Committee } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';
import { EmptyState } from '../components/EmptyState';
import { shortAddress, avatarGradient, initials } from '../lib/wallet';

export function DashboardPage() {
  const { identity, navigate } = useApp();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

  if (!identity) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900">Sign in to view your dashboard</h2>
        <p className="mt-2 text-ink-600">Create an account or sign in to manage your committees.</p>
      </div>
    );
  }

  const active = committees.filter((c) => c.status === 'active');
  const forming = committees.filter((c) => c.status === 'forming');
  const completed = committees.filter((c) => c.status === 'completed');
  const organized = committees.filter((c) => identity.publicKey && c.organizer_wallet === identity.publicKey);
  const totalContributed = committees.reduce((s, c) => s + c.contribution_amount * c.current_cycle, 0);
  const seed = identity.publicKey || identity.email;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Wallet summary */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="card relative overflow-hidden p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center rounded-xl text-base font-bold text-white shadow-soft"
                style={{ background: avatarGradient(seed) }}
              >
                {initials(identity.name)}
              </span>
              <div className="min-w-0">
                <div className="font-display text-lg font-bold text-ink-900">{identity.name}</div>
                <div className="font-mono text-xs text-ink-400">
                  {identity.publicKey ? shortAddress(identity.publicKey, 8, 6) : identity.email}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-ink-400">
              <span className="badge bg-sapphire-50 text-sapphire-700 ring-1 ring-sapphire-200">Stellar Testnet</span>
              <span className="badge bg-ink-100 text-ink-600 ring-1 ring-ink-200">TESTINR</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Coins className="h-5 w-5" />} label="Committees" value={`${committees.length}`} accent="brand" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Active" value={`${active.length}`} accent="sapphire" />
          <StatCard icon={<Users className="h-5 w-5" />} label="Organizing" value={`${organized.length}`} accent="saffron" />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Contributed" value={formatINRShort(totalContributed)} accent="brand" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink-900">My committees</h2>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => window.location.reload()}>
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button className="btn-primary btn-sm" onClick={() => navigate({ name: 'create' })}>
            <Plus className="h-4 w-4" /> New committee
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-56 animate-pulse p-5" />)}
        </div>
      ) : committees.length === 0 ? (
        <div className="mt-6 card">
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="No committees yet"
            description="Start your first rotating savings committee, or join one from the explore page."
            action={
              <div className="flex gap-2">
                <button className="btn-primary btn-sm" onClick={() => navigate({ name: 'create' })}>
                  <Plus className="h-4 w-4" /> Create a committee
                </button>
                <button className="btn-secondary btn-sm" onClick={() => navigate({ name: 'explore' })}>
                  Explore <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {active.length > 0 && (
            <Section title="Active" count={active.length}>
              {active.map((c) => (
                <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} isOrganizer={c.organizer_wallet === identity.publicKey} />
              ))}
            </Section>
          )}
          {forming.length > 0 && (
            <Section title="Forming" count={forming.length}>
              {forming.map((c) => (
                <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} isOrganizer={c.organizer_wallet === identity.publicKey} />
              ))}
            </Section>
          )}
          {completed.length > 0 && (
            <Section title="Completed" count={completed.length}>
              {completed.map((c) => (
                <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} isOrganizer={c.organizer_wallet === identity.publicKey} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
        {title} <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500">{count}</span>
      </h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: 'brand' | 'sapphire' | 'saffron' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    sapphire: 'bg-sapphire-50 text-sapphire-600 ring-sapphire-100',
    saffron: 'bg-saffron-50 text-saffron-600 ring-saffron-100',
  };
  return (
    <div className="card p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ring-1 ${colors[accent]}`}>{icon}</div>
      <div className="mt-3 text-xl font-extrabold text-ink-900">{value}</div>
      <div className="text-xs font-medium text-ink-400">{label}</div>
    </div>
  );
}

export { formatINR };
