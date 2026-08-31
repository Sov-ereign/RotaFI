import { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Users, Coins, CalendarClock, Layers, Zap, Globe,
  ScrollText, AlertTriangle, Lock, Sparkles, CheckCircle2, Quote, Star, MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAllPublicCommittees, fetchMemberCount, fetchFeedbackList } from '../lib/contract';
import type { Committee, FeedbackItem } from '../lib/types';
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
      <Testimonials />
      <FAQ />
      <CTA identity={!!identity} onStart={() => navigate(identity ? { name: 'create' } : { name: 'landing' })} />
    </div>
  );
}

function Hero() {
  const { navigate, identity } = useApp();
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Rich background layers */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[700px] w-[700px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full bg-sky-500/8 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* ── Left copy ── */}
          <div className="animate-slide-up">
            {/* Neon status pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-700 backdrop-blur-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live on Stellar Soroban Testnet · 50+ Members
            </div>

            <h1 className="mt-6 font-display text-4xl font-black leading-[1.06] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.75rem]">
              Rotating savings,
              <span className="block mt-1 gradient-text-brand">
                without the trust problem.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">
              Chit funds and committees keep millions afloat across South Asia — but they run on
              paper, WhatsApp, and trust in an organizer who can vanish with the pot. RotaFi puts
              the rotation logic in a <strong className="text-ink-900 font-semibold">Soroban smart contract</strong>, so funds release automatically,
              every contribution is on-chain, and every member is protected.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                className="btn-primary btn-lg gap-2.5 rounded-2xl text-base"
                onClick={() => navigate(identity ? { name: 'create' } : { name: 'explore' })}
              >
                {identity ? 'Start a committee' : 'Explore live committees'}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                className="btn-secondary btn-lg rounded-2xl text-base"
                onClick={() => navigate({ name: 'explore' })}
              >
                See how it works
              </button>
            </div>

            {/* Trust micro-copy */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ink-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Testnet — no real money</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No signup required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% open source</span>
            </div>

            {/* Floating stats row */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { value: '₹5L+', label: 'Testnet TVL' },
                { value: '50+', label: 'Active members' },
                { value: '4.8%', label: 'Yield APY' },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-2xl px-4 py-3 text-center border border-white/60">
                  <div className="font-display text-xl font-black text-ink-900">{s.value}</div>
                  <div className="text-[11px] font-medium text-ink-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right visual ── */}
          <div className="animate-fade-in lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const members = [
    { name: 'Priya', pos: 1, paid: true,  recv: false, color: 'from-emerald-400 to-emerald-600' },
    { name: 'Arjun', pos: 2, paid: true,  recv: false, color: 'from-sky-400 to-sky-600' },
    { name: 'Meena', pos: 3, paid: true,  recv: true,  color: 'from-amber-400 to-amber-600' },
    { name: 'Ravi',  pos: 4, paid: false, recv: false, color: 'from-indigo-400 to-indigo-600' },
    { name: 'Divya', pos: 5, paid: true,  recv: false, color: 'from-rose-400 to-rose-600' },
  ];
  return (
    <div className="relative animate-float">
      {/* Outer glow halo */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-indigo-500/20 blur-2xl animate-pulse-glow pointer-events-none" />
      {/* Animated gradient border */}
      <div className="absolute -inset-[1.5px] rounded-[1.6rem] bg-gradient-to-br from-emerald-500/60 via-sky-500/40 to-indigo-500/60 blur-sm pointer-events-none" />

      <div className="relative z-10 overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"
             style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(2,20,40,0.98) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-white">Bharat Savings Guild</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Cycle 3 of 5 · ₹2,000 / cycle</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300 ring-1 ring-emerald-500/30">
            <Lock className="h-3 w-3" /> Soroban Verified
          </span>
        </div>

        {/* Pot vault block */}
        <div className="px-5 pt-5">
          <div className="relative overflow-hidden rounded-2xl p-4 border border-emerald-500/20"
               style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(14,165,233,0.08) 100%)' }}>
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Active Pot Vault</div>
                <div className="font-display text-3xl font-black text-white">₹10,000
                  <span className="text-sm font-normal text-slate-400 ml-1.5">(1,000 XLM)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Releases To</div>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[11px] font-black text-white shadow-md">M</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">Meena</div>
                    <div className="text-[10px] text-amber-400">Winning bid</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Member list */}
        <div className="px-5 py-4 space-y-1.5">
          {members.map((m) => (
            <div key={m.pos}
                 className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                   m.recv ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : 'hover:bg-white/5'
                 }`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${m.color} text-xs font-black text-white shadow-sm`}>
                {m.name[0]}
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-200">{m.name}</span>
              {m.recv ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30">
                  ★ Winner
                </span>
              ) : m.paid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/25">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-400 ring-1 ring-slate-700">
                  Pending
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Progress footer */}
        <div className="px-5 pb-5">
          <div className="mb-2 flex justify-between text-[11px] font-semibold">
            <span className="text-slate-400">Cycle Progress</span>
            <span className="text-emerald-400">4 of 5 contributed</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-4/5 rounded-full gradient-brand shadow-sm transition-all duration-700" />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
            <span className="font-mono text-[10px] text-slate-500">c3 · tx 0x4a…f2e1</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <Lock className="h-3 w-3" /> Smart Contract Verified
            </span>
          </div>
        </div>
      </div>
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
    <section style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.9) 100%)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-100">
            ⚠ The Problem
          </span>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            A parallel financial system<br className="hidden sm:block" /> running on trust alone
          </h2>
          <p className="mt-4 text-pretty text-ink-600 leading-relaxed">
            In India and across South Asia, rotating savings groups — chit funds, committees, kitty
            parties — are how millions save for large purchases. The structure is sound. The trust layer is not.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
              <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
                  <p.icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
              </div>
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
          ⚡ How it works
        </span>
        <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
          A four-step trust loop
        </h2>
        <p className="mt-4 text-ink-600 leading-relaxed">The rotation logic that organizers used to do by hand — now deterministic, transparent, and enforceable on Stellar.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.n} className="group relative overflow-hidden rounded-2xl p-6 bg-white ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-2"
               style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}>
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition" />
            <span className="absolute right-5 top-5 font-display text-4xl font-black text-slate-100 select-none">{s.n}</span>
            <div className="relative z-10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-md">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.text}</p>
            </div>
            {/* Connector arrow */}
            {i < 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 z-20">
              <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
            </div>}
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
      <div className="relative mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Why Stellar</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Not payments tacked onto a chain — the structural fix
          </h2>
          <p className="mt-4 text-pretty text-ink-300">
            The trust and transparency problem chit funds have is structurally the problem smart
            contracts solve. This is not a payments app with a chain sticker on it.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Live on testnet</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Recently created committees</h2>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate({ name: 'explore' })}>
          Explore all <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
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
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
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

function Testimonials() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetchFeedbackList()
      .then(fbs => setFeedbacks(fbs.slice(0, 6)))
      .catch(() => {});
  }, []);

  if (feedbacks.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
          <MessageSquare className="h-3 w-3 mr-1" /> Community Reviews
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          What our members are saying
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          Real feedback submitted by ROSCA participants and committee organizers across India.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feedbacks.map((fb) => (
          <div key={fb.id} className="card p-5 space-y-3 bg-white flex flex-col justify-between hover:shadow-lift transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`}
                    />
                  ))}
                </div>
                <span className="badge text-[10px] font-bold bg-ink-100 text-ink-600">
                  {fb.category}
                </span>
              </div>
              <p className="text-xs text-ink-700 leading-relaxed italic">"{fb.comment}"</p>
            </div>
            <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
              <span className="font-semibold text-xs text-ink-900">{fb.user_name}</span>
              <span className="text-[10px] text-ink-400">Verified Member</span>
            </div>
          </div>
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
