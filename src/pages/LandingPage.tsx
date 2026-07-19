import { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Users, Coins, CalendarClock, Layers, Zap, Globe,
  ScrollText, AlertTriangle, Lock, Sparkles, CheckCircle2, Quote,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllPublicCommittees, fetchMemberCount } from '../lib/contract';
import type { Committee } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';

export function LandingPage() {
  const { navigate, identity } = useApp();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchAllPublicCommittees()
      .then(async (cs) => {
        setCommittees(cs.slice(0, 6));
        const entries = await Promise.all(
          cs.slice(0, 6).map(async (c) => [c.id, await fetchMemberCount(c.id)] as const),
        );
        setCounts(Object.fromEntries(entries));
      })
      .catch(() => setCommittees([]));
  }, []);

  return (
    <div className="gradient-hero">
      <Hero />
      <TrustProblem />
      <HowItWorks />
      <StellarRationale />
      {committees.length > 0 && <LiveCommittees committees={committees} counts={counts} />}
      <ForWhom />
      <FAQ />
      <CTA identity={!!identity} onStart={() => navigate(identity ? { name: 'create' } : { name: 'landing' })} />
    </div>
  );
}

function Hero() {
  const { navigate, identity } = useApp();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Stellar Soroban smart contracts
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.07] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Rotating savings,
              <span className="block bg-gradient-to-r from-brand-600 to-sapphire-600 bg-clip-text text-transparent">
                without the trust problem.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">
              Chit funds and committees keep millions afloat across South Asia — but they run on
              paper, WhatsApp, and trust in an organizer who can vanish with the pot. RotaFi
              puts the rotation logic in a smart contract, so the funds release themselves and
              every contribution is on-chain, portable, and verifiable.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button className="btn-primary btn-lg" onClick={() => navigate(identity ? { name: 'create' } : { name: 'explore' })}>
                {identity ? 'Start a committee' : 'Explore live committees'}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <button className="btn-secondary btn-lg" onClick={() => navigate({ name: 'explore' })}>
                See how it works
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ink-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-500" /> Testnet — no real money</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-500" /> No signup required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-500" /> Open & transparent</span>
            </div>
          </div>

          <div className="animate-fade-in lg:pl-6">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const members = [
    { name: 'Priya', pos: 1, paid: true, recv: false, color: 'from-brand-400 to-brand-600' },
    { name: 'Arjun', pos: 2, paid: true, recv: false, color: 'from-sapphire-400 to-sapphire-600' },
    { name: 'Meena', pos: 3, paid: true, recv: true, color: 'from-saffron-400 to-saffron-600' },
    { name: 'Ravi', pos: 4, paid: false, recv: false, color: 'from-danger-400 to-danger-600' },
    { name: 'Divya', pos: 5, paid: true, recv: false, color: 'from-brand-500 to-sapphire-500' },
  ];
  return (
    <div className="relative">
      <div className="card overflow-hidden p-0 shadow-lift">
        <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-5 py-3.5">
          <div>
            <div className="font-display text-sm font-bold text-ink-900">Family Circle Committee</div>
            <div className="text-[11px] text-ink-400">Cycle 3 of 5 · ₹2,000/cycle</div>
          </div>
          <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" /> Active
          </span>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-br from-brand-50 to-sapphire-50 p-4 ring-1 ring-brand-100">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand-700">This cycle's pot</div>
              <div className="font-display text-2xl font-extrabold text-ink-900">₹10,000</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Releases to</div>
              <div className="flex items-center gap-1.5 font-semibold text-ink-900">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 text-[10px] text-white">M</span>
                Meena
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.pos} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-ink-50">
                <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${m.color} text-xs font-bold text-white`}>
                  {m.name[0]}
                </span>
                <span className="flex-1 text-sm font-medium text-ink-800">{m.name}</span>
                {m.recv ? (
                  <span className="badge bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200">Recipient</span>
                ) : m.paid ? (
                  <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                ) : (
                  <span className="badge bg-ink-100 text-ink-500 ring-1 ring-ink-200">Pending</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[11px] font-medium text-ink-400">
              <span>Cycle progress</span><span>4 / 5 contributed</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div className="h-full w-4/5 rounded-full gradient-brand transition-all duration-700" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/60 px-5 py-3">
          <span className="font-mono text-[11px] text-ink-400">c3 · tx 0x4a…f2e1</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-600">
            <Lock className="h-3 w-3" /> Contract-enforced
          </span>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-xl2 bg-gradient-to-br from-brand-200/40 to-sapphire-200/30 blur-2xl" />
    </div>
  );
}

function TrustProblem() {
  const problems = [
    { icon: AlertTriangle, title: 'Organizer can disappear', text: 'Unlicensed organizers holding the pool is a well-documented, recurring fraud pattern. A contract can not run off with funds.' },
    { icon: ScrollText, title: 'No transparent record', text: 'Contributions tracked on paper and WhatsApp. Disputes over who paid and whose turn it is are endemic.' },
    { icon: Globe, title: 'No portability or history', text: 'A clean repayment record in one group is invisible to the next. No credit history is ever built.' },
  ];
  return (
    <section className="border-y border-ink-200/70 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-danger-600">The problem</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            A parallel financial system running on trust alone
          </h2>
          <p className="mt-4 text-pretty text-ink-600">
            In India and across South Asia, rotating savings groups — chit funds, committees, kitty
            parties — are how millions save for large purchases and emergencies where formal banking
            is out of reach. The structure is sound. The trust layer is not.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-danger-50 text-danger-600 ring-1 ring-danger-100">
                <p.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', icon: Users, title: 'Create a committee', text: 'Set the contribution amount, cycle length, member count, and payout rule (turn order or bidding). The contract is instantiated with these parameters.' },
    { n: '02', icon: Coins, title: 'Members contribute', text: 'Each cycle, every member contributes via anchor-bridged fiat to a Stellar asset, locked in the contract. Contributions are recorded on-chain.' },
    { n: '03', icon: CalendarClock, title: 'The pool releases itself', text: 'Once all contributions are in, the contract auto-releases the full pot to that cycle\'s scheduled recipient. No organizer approval needed.' },
    { n: '04', icon: ShieldCheck, title: 'Defaults handled fairly', text: 'Missed contributions trigger deterministic penalty, delay, or backup-fund logic — decided by the contract, not a person mid-dispute.' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">How it works</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          A four-cycle trust loop
        </h2>
        <p className="mt-4 text-ink-600">The rotation logic that organizers used to do by hand — now deterministic, transparent, and enforceable.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="card-hover group relative p-6">
            <span className="absolute right-5 top-5 font-display text-3xl font-extrabold text-ink-100 transition group-hover:text-brand-100">{s.n}</span>
            <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
              <s.icon className="h-5.5 w-5.5" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StellarRationale() {
  const points = [
    { icon: Zap, title: 'Low fees, fast settlement', text: 'Monthly micro-contributions of ₹500–2000 need to be cheap and instant. Stellar transaction costs make this viable at real chit-fund scale.' },
    { icon: Globe, title: 'Anchors for INR on/off-ramp', text: 'Real committees run in fiat. Stellar anchors are the exact mechanism to move INR in and tokenized value out — no custom banking rails.' },
    { icon: Layers, title: 'Soroban smart contracts', text: 'The rotation, turn order, and default handling are deterministic logic — exactly what removes the organizer\'s discretion to disappear.' },
    { icon: Coins, title: 'Transparent asset issuance', text: 'Each committee is an on-chain record, giving participants a portable, verifiable contribution history for the first time.' },
  ];
  return (
    <section className="relative overflow-hidden border-y border-ink-200/70 bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-noise" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sapphire-500/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Why Stellar</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Not payments

            ed onto a chain — the structural fix
          </h2>
          <p className="mt-4 text-pretty text-ink-300">
            The trust and transparency problem chit funds have is structurally the problem smart
            contracts solve. This is not a payments app with a chain sticker on it.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {points.map((p) => (
            <div key={p.title} className="rounded-xl2 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20">
                <p.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveCommittees({ committees, counts }: { committees: Committee[]; counts: Record<string, number> }) {
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Live on testnet</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Recently created committees</h2>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate({ name: 'explore' })}>
          Explore all <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {committees.map((c) => (
          <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} />
        ))}
      </div>
    </section>
  );
}

function ForWhom() {
  const groups = [
    { title: 'Friend & family circles', text: 'Committees already running offline that want transparency without losing the social, flexible nature of the system.' },
    { title: 'Self-help groups & women\'s collectives', text: 'SHGs common across India that currently rely entirely on a trusted organizer and paper ledgers.' },
    { title: 'Diaspora & remote groups', text: 'Friends split across cities who can no longer run this in person and need a digital trust layer.' },
  ];
  return (
    <section className="border-t border-ink-200/70 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-sapphire-600">Who it's for</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Built for the people already doing this</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="card-hover p-6">
              <Quote className="h-6 w-6 text-brand-400" />
              <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{g.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: 'Is this real money?', a: 'No. This MVP runs on the Stellar testnet using a TESTINR asset standing in for INR. The mainnet vision integrates a real Stellar anchor for INR on/off-ramping.' },
    { q: 'Do I need to install anything?', a: 'No. The MVP generates a Stellar keypair in your browser as a stand-in for Freighter wallet connection. On mainnet the same flow connects to your installed Freighter extension.' },
    { q: 'What happens if someone doesn\'t pay?', a: 'The contract has configurable default handling: delay the cycle, charge a penalty, or draw from a backup fund. The organizer marks the default, but the rule is set at creation and applied deterministically.' },
    { q: 'Can the organizer run off with the pool?', a: 'No. The contract — not the organizer — holds and releases funds. Once all contributions are in, the pool auto-releases to the scheduled recipient. The organizer cannot redirect it.' },
    { q: 'What\'s the long-term differentiator?', a: 'A portable on-chain contribution history — a lightweight trust score members carry between committees. Today no such history exists; your clean record in one group is invisible to the next.' },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">FAQ</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Common questions</h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card group p-5 transition-open">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
              {f.q}
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500 transition group-open:rotate-45 group-open:bg-brand-100 group-open:text-brand-600">
                <span className="text-lg leading-none">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA({ identity, onStart }: { identity: boolean; onStart: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl2 gradient-brand p-8 text-white shadow-lift sm:p-12">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Run your next committee on-chain
            </h2>
            <p className="mt-3 text-pretty text-brand-50/90">
              Start a committee with your circle in minutes. The contract handles the rotation —
              you keep the trust.
            </p>
          </div>
          <button
            onClick={onStart}
            className="btn-lg shrink-0 rounded-xl bg-white text-brand-700 shadow-lift transition hover:bg-brand-50 active:scale-[0.98]"
          >
            {identity ? 'Create a committee' : 'Get started'}
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
