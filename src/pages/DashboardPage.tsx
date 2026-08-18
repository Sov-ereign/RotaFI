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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8">
      {/* Dark Glassmorphic Wallet Summary Banner */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card relative overflow-hidden p-6 bg-gradient-to-br from-slate-900 via-ink-900 to-slate-950 text-white shadow-lift border border-slate-800 backdrop-blur-xl">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-base font-bold text-white shadow-md ring-2 ring-white/20"
                  style={{ background: avatarGradient(seed) }}
                >
                  {initials(identity.name)}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-xl font-extrabold text-white flex items-center gap-2">
                    {identity.name}
                    <span className="badge bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 text-[10px]">
                      Verified Member
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    {identity.publicKey ? shortAddress(identity.publicKey, 8, 6) : identity.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="badge bg-slate-800 text-slate-300 ring-1 ring-slate-700">Stellar Testnet</span>
                <span className="badge bg-emerald-950 text-emerald-300 ring-1 ring-emerald-800 font-mono">TESTINR</span>
              </div>
              <button
                onClick={() => navigate({ name: 'profile' })}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
              >
                View Credit Profile <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Coins className="h-5 w-5 text-emerald-400" />} label="Committees" value={`${committees.length}`} accent="brand" />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-sky-400" />} label="Active" value={`${active.length}`} accent="sapphire" />
          <StatCard icon={<Users className="h-5 w-5 text-amber-400" />} label="Organizing" value={`${organized.length}`} accent="saffron" />
          <StatCard icon={<Wallet className="h-5 w-5 text-indigo-400" />} label="Contributed" value={formatINRShort(totalContributed)} accent="brand" />
        </div>
      </div>

      {/* Actions & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-150 pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">My ROSCA Committees</h2>
          <p className="text-xs text-ink-500 mt-0.5">Manage your active savings circles, contributions, and distributions.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="btn-secondary btn-sm rounded-full" onClick={() => window.location.reload()}>
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button className="btn-primary btn-sm rounded-full shadow-soft" onClick={() => navigate({ name: 'create' })}>
            <Plus className="h-4 w-4" /> New Committee
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card h-56 animate-pulse p-5 bg-ink-50" />)}
        </div>
      ) : committees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Sparkles className="h-7 w-7 text-brand-500" />}
            title="No committees joined yet"
            description="Start your first rotating savings committee or browse live ones on the explore marketplace."
            action={
              <div className="flex gap-2.5">
                <button className="btn-primary btn-sm rounded-full shadow-soft" onClick={() => navigate({ name: 'create' })}>
                  <Plus className="h-4 w-4" /> Create Committee
                </button>
                <button className="btn-secondary btn-sm rounded-full" onClick={() => navigate({ name: 'explore' })}>
                  Explore Marketplace <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <Section title="Active Committees" count={active.length}>
              {active.map((c) => (
                <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} isOrganizer={c.organizer_wallet === identity.publicKey} />
              ))}
            </Section>
          )}
          {forming.length > 0 && (
            <Section title="Forming Committees" count={forming.length}>
              {forming.map((c) => (
                <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} isOrganizer={c.organizer_wallet === identity.publicKey} />
              ))}
            </Section>
          )}
          {completed.length > 0 && (
            <Section title="Completed Committees" count={completed.length}>
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
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
        {title} <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 font-extrabold">{count}</span>
      </h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
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
