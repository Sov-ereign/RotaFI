import { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Users, Coins, CalendarClock, Layers, Zap, Globe,
  ScrollText, AlertTriangle, Lock, Sparkles, CheckCircle2, Quote, Star, MessageSquare,
  ChevronDown, HelpCircle, HeartHandshake,
} from 'lucide-react';
import { avatarGradient, initials } from '../lib/wallet';
import { useApp } from '../context/AppContext';
import { fetchAllPublicCommittees, fetchMemberCount, fetchFeedbackList } from '../lib/contract';
import type { Committee, FeedbackItem } from '../lib/types';
import { CommitteeCard } from '../components/CommitteeCard';

import { StatsBar } from '../components/StatsBar';
import { ScrollReveal } from '../components/ScrollReveal';

export function LandingPage() {
  const { theme } = useApp();
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

  if (theme === 'dark') {
    return <LandingPageDark committees={committees} counts={counts} />;
  }

  return <LandingPageLight committees={committees} counts={counts} />;
}

/* ==========================================================================
   SUN THEME (CLASSIC LIGHT - 100% VERBATIM FROM COMMIT b43a82e)
   ========================================================================== */

function LandingPageLight({ committees, counts }: { committees: Committee[]; counts: Record<string, number> }) {
  const { navigate, identity } = useApp();

  return (
    <div className="gradient-hero overflow-hidden text-slate-900">
      <HeroLight />
      <ScrollReveal><StatsBar /></ScrollReveal>
      <ScrollReveal><TrustProblemLight /></ScrollReveal>
      <ScrollReveal><HowItWorksLight /></ScrollReveal>
      <ScrollReveal><StellarRationaleLight /></ScrollReveal>
      {committees.length > 0 && <ScrollReveal><LiveCommitteesLight committees={committees} counts={counts} /></ScrollReveal>}
      <ScrollReveal><ForWhomLight /></ScrollReveal>
      <ScrollReveal><TestimonialsLight /></ScrollReveal>
      <ScrollReveal><FAQLight /></ScrollReveal>
      <ScrollReveal><CTALight identity={!!identity} onStart={() => navigate(identity ? { name: 'create' } : { name: 'landing' })} /></ScrollReveal>
    </div>
  );
}

function HeroLight() {
  const { navigate, identity } = useApp();
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Optimized background aura layers */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
      <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" style={{ transform: 'translateZ(0)' }} />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl" style={{ transform: 'translateZ(0)' }} />

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
            <HeroVisualLight />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisualLight() {
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

      <div className="relative z-10 overflow-hidden rounded-[1.5rem] bg-slate-950 text-white shadow-2xl">
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

function TrustProblemLight() {
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

function HowItWorksLight() {
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

function StellarRationaleLight() {
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

function LiveCommitteesLight({ committees, counts }: { committees: Committee[]; counts: Record<string, number> }) {
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
            <Sparkles className="h-3.5 w-3.5" /> Live Soroban Contracts
          </span>
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Recently Created Committees
          </h2>
          <p className="text-sm text-slate-600 max-w-xl">
            Active savings circles deployed on Stellar Testnet — join an open group or explore live cycle rotation progress.
          </p>
        </div>

        <button
          onClick={() => navigate({ name: 'explore' })}
          className="btn-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition shrink-0 self-start md:self-auto"
        >
          Explore All Circles <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {committees.map((c) => (
          <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} />
        ))}
      </div>
    </section>
  );
}

function ForWhomLight() {
  const groups = [
    {
      title: 'Friend & Family Circles',
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      text: 'Committees already running offline that want 100% on-chain transparency without losing the social, flexible nature of traditional ROSCAs.',
    },
    {
      title: 'Self-Help Groups & Collectives',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      text: 'SHGs & kitty parties common across South Asia that currently rely entirely on paper ledgers and blind trust in a single organizer.',
    },
    {
      title: 'Diaspora & Remote Groups',
      icon: Globe,
      color: 'from-indigo-500 to-purple-600',
      text: 'Friends split across different cities or countries who can no longer run savings circles in person and need a cryptographic trust layer.',
    },
  ];
  return (
    <section style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700 ring-1 ring-sky-100">
            👥 Target Audience
          </span>
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Built for the people already doing this
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Replacing paper ledgers and WhatsApp trust with deterministic Soroban smart contract logic.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {groups.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.title}
                className="group relative overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${g.color} text-white shadow-md mb-5`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {g.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{g.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQLight() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is this real money?',
      a: 'No. This MVP runs on the Stellar Testnet using a simulated TESTINR asset standing in for Indian Rupees. On mainnet, a real Stellar anchor converts fiat INR to native XLM instantly via UPI bank rails.',
    },
    {
      q: 'Do I need to install anything?',
      a: 'No. You can instantly test the app in your browser with our generated Testnet wallet keypair. Alternatively, you can connect your Freighter wallet browser extension with a single click on your profile.',
    },
    {
      q: 'What happens if someone doesn\'t pay?',
      a: 'The Soroban contract enforces configurable default rules: delay the cycle, apply a penalty, or draw from an emergency collateral reserve fund. The rules are executed deterministically by code, not by organizer discretion.',
    },
    {
      q: 'Can the organizer run off with the pool?',
      a: 'No! The smart contract — not the organizer — holds and releases all funds. Once all cycle contributions are locked in, the pool auto-releases directly to the winner. The organizer has zero control over payout destinations.',
    },
    {
      q: 'What\'s the long-term differentiator?',
      a: 'A portable on-chain Reputation Credit Score (300–900). On-time ROSCA contributions, bidding wins, and fiat anchor deposits build a verifiable credit rating that users carry between committees.',
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <div className="text-center space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
          <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
        </span>
        <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Common Questions & Answers
        </h2>
        <p className="text-slate-600 text-sm">Everything you need to know about RotaFi's ROSCA smart contract mechanics.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={f.q}
              className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-white shadow-lg ring-2 ring-emerald-500/40'
                  : 'bg-white/80 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold text-slate-900 text-sm sm:text-base focus:outline-none"
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black transition-colors ${
                    isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    0{i + 1}
                  </span>
                  {f.q}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsLight() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetchFeedbackList()
      .then(fbs => setFeedbacks(fbs.slice(0, 6)))
      .catch(() => {});
  }, []);

  if (feedbacks.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
      {/* Centered Heading & Muted Subline */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
          <MessageSquare className="h-3.5 w-3.5" /> Community Reviews
        </span>
        <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          What Our Onboarded Savers Say
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-pretty">
          Real feedback submitted by ROSCA participants, committee organizers, and informal savers across South Asia.
        </p>
      </div>

      {/* Masonry Testimonial Wall using CSS Columns */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {feedbacks.map((fb, index) => {
          const isDark = index % 2 === 1; // Alternates between light glass and dark glass cards
          return (
            <div
              key={fb.id}
              className={`break-inside-avoid group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 ${
                isDark
                  ? 'bg-slate-950 text-white border border-slate-800 shadow-xl'
                  : 'bg-white/95 text-slate-900 border border-slate-200/90 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Top Accent Line */}
              <div
                className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                  isDark
                    ? 'from-emerald-400 via-sky-400 to-amber-400'
                    : 'from-emerald-500 via-sky-500 to-indigo-500'
                } opacity-80 group-hover:opacity-100 transition`}
              />

              {/* Rating & Category */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= fb.rating
                          ? 'fill-amber-400 text-amber-400'
                          : isDark ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {fb.category}
                </span>
              </div>

              {/* Quote Body */}
              <p className={`text-sm sm:text-base leading-relaxed font-medium mb-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                "{fb.comment}"
              </p>

              {/* Author Row */}
              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white shadow-md ring-2 ring-white/20"
                    style={{ background: avatarGradient(fb.user_name) }}
                  >
                    {initials(fb.user_name)}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {fb.user_name}
                    </h4>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ROSCA Member
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTALight({ identity, onStart }: { identity: boolean; onStart: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-2xl sm:p-12 border border-slate-800">
        {/* Glow Halos */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" style={{ transform: 'translateZ(0)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" style={{ transform: 'translateZ(0)' }} />

        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
              ⚡ Soroban Testnet Live
            </span>
            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Run your next committee on-chain
            </h2>
            <p className="text-slate-300 text-base leading-relaxed text-pretty">
              Start a rotating savings circle with your friends in minutes. The smart contract executes rotation, bidding auctions, and pot payouts deterministically — you keep total trust.
            </p>
          </div>

          <button
            onClick={onStart}
            className="btn-primary btn-lg shrink-0 rounded-2xl px-8 py-4 text-base font-bold shadow-xl hover:scale-105 transition-all"
          >
            {identity ? 'Create a Committee' : 'Get Started Now'}
            <ArrowRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   MOON THEME (AURA DARK LIQUID GLASS)
   ========================================================================== */

function LandingPageDark({ committees, counts }: { committees: Committee[]; counts: Record<string, number> }) {
  const { navigate, identity } = useApp();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* Fixed Fullscreen Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-20"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
      </div>

      {/* Vertical Guide Lines */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* SVG Noise Filter */}
      <svg className="pointer-events-none absolute w-0 h-0" aria-hidden="true">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10 space-y-12">
        <HeroDark />
        <MacOsStatusBarDark />
        <ScrollReveal><StatsBar /></ScrollReveal>
        <ScrollReveal><TrustProblemDark /></ScrollReveal>
        <ScrollReveal><HowItWorksDark /></ScrollReveal>
        <ScrollReveal><StellarRationaleDark /></ScrollReveal>
        {committees.length > 0 && <ScrollReveal><LiveCommitteesDark committees={committees} counts={counts} /></ScrollReveal>}
        <ScrollReveal><ForWhomDark /></ScrollReveal>
        <ScrollReveal><TestimonialsDark /></ScrollReveal>
        <ScrollReveal><FAQDark /></ScrollReveal>
        <ScrollReveal><CTADark identity={!!identity} onStart={() => navigate(identity ? { name: 'create' } : { name: 'landing' })} /></ScrollReveal>
      </div>
    </div>
  );
}

function MacOsStatusBarDark() {
  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-t border-b border-white/10 text-xs py-2.5 px-6 shadow-2xl relative z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-slate-300">
        <div className="flex items-center gap-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-bold text-white font-sans">RotaFi Soroban OS</span>
          <div className="hidden md:flex items-center gap-6 text-slate-400 text-xs">
            <span className="hover:text-white transition">Soroban Engine</span>
            <span className="hover:text-white transition">Auction Bidding</span>
            <span className="hover:text-white transition">Credit Score (300–900)</span>
            <span className="hover:text-white transition">SEP-0024 Gateway</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <span className="text-emerald-400 font-bold">Stellar Testnet Live</span>
          <span>·</span>
          <span>4.8s Finality</span>
        </div>
      </div>
    </div>
  );
}

function HeroDark() {
  const { navigate, identity } = useApp();
  return (
    <section className="relative overflow-hidden pt-24 md:pt-32 pb-12 flex items-center">
      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 backdrop-blur-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live on Stellar Soroban Testnet · 50+ Verified Savers
            </div>

            <h1 className="mt-6 font-display text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[4rem]">
              Rotating savings.
              <span
                className="block mt-2 animate-shiny font-black"
                style={{
                  backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #10b981 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  filter: 'url(#c3-noise)',
                }}
              >
                Revitalized on Soroban.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
              Chit funds and committees keep millions afloat across South Asia — but they run on
              paper, WhatsApp, and trust in an organizer who can vanish with the pot. RotaFi puts
              the rotation logic in a <strong className="text-white font-bold">Soroban smart contract</strong>, so funds release automatically,
              every contribution is on-chain, and every member is protected.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-sm px-7 py-3.5 transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
                onClick={() => navigate(identity ? { name: 'create' } : { name: 'explore' })}
              >
                {identity ? 'Start a Committee' : 'Explore Live Committees'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 text-white font-bold text-sm px-6 py-3.5 hover:bg-white/10 transition-all"
                onClick={() => navigate({ name: 'explore' })}
              >
                See How It Works
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Testnet — Zero risk</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant wallet linking</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% open source</span>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { value: '₹5L+', label: 'Testnet TVL' },
                { value: '50+', label: 'Active members' },
                { value: '4.8%', label: 'Yield APY' },
              ].map((s) => (
                <div key={s.label} className="liquid-glass rounded-2xl px-4 py-3 text-center border border-white/10 bg-slate-900/60 backdrop-blur-md">
                  <div className="font-mono text-xl font-black text-white">{s.value}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in lg:pl-4">
            <HeroVisualLight />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustProblemDark() {
  const problems = [
    { icon: AlertTriangle, title: 'Organizer can disappear', text: 'Unlicensed organizers holding the pool is a well-documented, recurring fraud pattern. A contract can not run off with funds.' },
    { icon: ScrollText, title: 'No transparent record', text: 'Contributions tracked on paper and WhatsApp. Disputes over who paid and whose turn it is are endemic.' },
    { icon: Globe, title: 'No portability or history', text: 'A clean repayment record in one group is invisible to the next. No credit history is ever built.' },
  ];
  return (
    <section className="border-y border-white/10 bg-slate-950/70 backdrop-blur-xl text-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30">
            ⚠ The Problem
          </span>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            A parallel financial system<br className="hidden sm:block" /> running on trust alone
          </h2>
          <p className="mt-4 text-pretty text-slate-300 leading-relaxed">
            In India and across South Asia, rotating savings groups — chit funds, committees, kitty
            parties — are how millions save for large purchases. The structure is sound. The trust layer is not.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 liquid-glass bg-slate-900/80 border border-white/10">
              <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/15 border border-red-500/30">
                  <p.icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksDark() {
  const steps = [
    { n: '01', icon: Users, title: 'Create a committee', text: 'Set the contribution amount, cycle length, member count, and payout rule (turn order or bidding). The contract is instantiated with these parameters.' },
    { n: '02', icon: Coins, title: 'Members contribute', text: 'Each cycle, every member contributes via anchor-bridged fiat to a Stellar asset, locked in the contract. Contributions are recorded on-chain.' },
    { n: '03', icon: CalendarClock, title: 'The pool releases itself', text: 'Once all contributions are in, the contract auto-releases the full pot to that cycle\'s scheduled recipient. No organizer approval needed.' },
    { n: '04', icon: ShieldCheck, title: 'Defaults handled fairly', text: 'Missed contributions trigger deterministic penalty, delay, or backup-fund logic — decided by the contract, not a person mid-dispute.' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 text-white">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
          ⚡ How it works
        </span>
        <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
          A four-step trust loop
        </h2>
        <p className="mt-4 text-slate-300 leading-relaxed">The rotation logic that organizers used to do by hand — now deterministic, transparent, and enforceable on Stellar.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.n} className="group relative overflow-hidden rounded-2xl p-6 liquid-glass bg-slate-900/80 border border-white/10 transition-all duration-300 hover:-translate-y-2">
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition" />
            <span className="absolute right-5 top-5 font-mono text-4xl font-black text-white/10 select-none">{s.n}</span>
            <div className="relative z-10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.text}</p>
            </div>
            {i < 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-emerald-400 border border-white/20 shadow-md z-20">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function StellarRationaleDark() {
  const points = [
    { icon: Zap, title: 'Low fees, fast settlement', text: 'Monthly micro-contributions of ₹500–2000 need to be cheap and instant. Stellar transaction costs make this viable at real chit-fund scale.' },
    { icon: Globe, title: 'Anchors for INR on/off-ramp', text: 'Real committees run in fiat. Stellar anchors are the exact mechanism to move INR in and tokenized value out — no custom banking rails.' },
    { icon: Layers, title: 'Soroban smart contracts', text: 'The rotation, turn order, and default handling are deterministic logic — exactly what removes the organizer\'s discretion to disappear.' },
    { icon: Coins, title: 'Transparent asset issuance', text: 'Each committee is an on-chain record, giving participants a portable, verifiable contribution history for the first time.' },
  ];
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-slate-950/90 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-noise" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">Why Stellar</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Not payments tacked onto a chain — the structural fix
          </h2>
          <p className="mt-4 text-pretty text-slate-300 leading-relaxed">
            The trust and transparency problem chit funds have is structurally the problem smart
            contracts solve. This is not a payments app with a chain sticker on it.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="liquid-glass rounded-2xl bg-slate-900/60 p-6 border border-white/10 backdrop-blur-md transition hover:bg-slate-900/90">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <p.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveCommitteesDark({ committees, counts }: { committees: Committee[]; counts: Record<string, number> }) {
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" /> Live Soroban Contracts
          </span>
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Recently Created Committees
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Active savings circles deployed on Stellar Testnet — join an open group or explore live cycle rotation progress.
          </p>
        </div>

        <button
          onClick={() => navigate({ name: 'explore' })}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-xs px-6 py-3 transition-all hover:bg-white/90 shrink-0 self-start md:self-auto shadow-xl"
        >
          Explore All Circles <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {committees.map((c) => (
          <CommitteeCard key={c.id} committee={c} memberCount={counts[c.id]} />
        ))}
      </div>
    </section>
  );
}

function ForWhomDark() {
  const groups = [
    {
      title: 'Friend & Family Circles',
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      text: 'Committees already running offline that want 100% on-chain transparency without losing the social, flexible nature of traditional ROSCAs.',
    },
    {
      title: 'Self-Help Groups & Collectives',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      text: 'SHGs & kitty parties common across South Asia that currently rely entirely on paper ledgers and blind trust in a single organizer.',
    },
    {
      title: 'Diaspora & Remote Groups',
      icon: Globe,
      color: 'from-indigo-500 to-purple-600',
      text: 'Friends split across different cities or countries who can no longer run savings circles in person and need a cryptographic trust layer.',
    },
  ];
  return (
    <section className="border-y border-white/10 bg-slate-950/80 backdrop-blur-xl text-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 ring-1 ring-sky-500/30">
            👥 Target Audience
          </span>
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Built for the people already doing this
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Replacing paper ledgers and WhatsApp trust with deterministic Soroban smart contract logic.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {groups.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.title}
                className="group relative overflow-hidden rounded-2xl liquid-glass bg-slate-900/70 p-7 border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:bg-slate-900/90"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${g.color} text-white shadow-md mb-5`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {g.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{g.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQDark() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is this real money?',
      a: 'No. This MVP runs on the Stellar Testnet using a simulated TESTINR asset standing in for Indian Rupees. On mainnet, a real Stellar anchor converts fiat INR to native XLM instantly via UPI bank rails.',
    },
    {
      q: 'Do I need to install anything?',
      a: 'No. You can instantly test the app in your browser with our generated Testnet wallet keypair. Alternatively, you can connect your Freighter wallet browser extension with a single click on your profile.',
    },
    {
      q: 'What happens if someone doesn\'t pay?',
      a: 'The Soroban contract enforces configurable default rules: delay the cycle, apply a penalty, or draw from an emergency collateral reserve fund. The rules are executed deterministically by code, not by organizer discretion.',
    },
    {
      q: 'Can the organizer run off with the pool?',
      a: 'No! The smart contract — not the organizer — holds and releases all funds. Once all cycle contributions are locked in, the pool auto-releases directly to the winner. The organizer has zero control over payout destinations.',
    },
    {
      q: 'What\'s the long-term differentiator?',
      a: 'A portable on-chain Reputation Credit Score (300–900). On-time ROSCA contributions, bidding wins, and fiat anchor deposits build a verifiable credit rating that users carry between committees.',
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24 text-white">
      <div className="text-center space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
          <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
        </span>
        <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
          Common Questions & Answers
        </h2>
        <p className="text-slate-300 text-sm">Everything you need to know about RotaFi's ROSCA smart contract mechanics.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={f.q}
              className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'liquid-glass bg-slate-900/90 shadow-xl ring-2 ring-emerald-500/40 border border-emerald-500/30'
                  : 'liquid-glass bg-slate-900/60 border border-white/10 hover:bg-slate-900/80 hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold text-white text-sm sm:text-base focus:outline-none"
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black transition-colors ${
                    isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{i + 1}
                  </span>
                  {f.q}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/10 animate-fade-in">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsDark() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetchFeedbackList()
      .then(fbs => setFeedbacks(fbs.slice(0, 6)))
      .catch(() => {});
  }, []);

  if (feedbacks.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 text-white">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
          <MessageSquare className="h-3.5 w-3.5" /> Community Reviews
        </span>
        <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
          What Our Onboarded Savers Say
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
          Real feedback submitted by ROSCA participants, committee organizers, and informal savers across South Asia.
        </p>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {feedbacks.map((fb) => {
          return (
            <div
              key={fb.id}
              className="break-inside-avoid group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 liquid-glass bg-slate-900/80 text-white border border-white/10 shadow-xl"
            >
              <div
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 opacity-80 group-hover:opacity-100 transition"
              />

              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= fb.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                >
                  {fb.category}
                </span>
              </div>

              <p className="text-sm sm:text-base leading-relaxed font-medium mb-6 text-slate-200">
                "{fb.comment}"
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white shadow-md ring-2 ring-white/20"
                    style={{ background: avatarGradient(fb.user_name) }}
                  >
                    {initials(fb.user_name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {fb.user_name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      ROSCA Member
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTADark({ identity, onStart }: { identity: boolean; onStart: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl liquid-glass bg-slate-950 p-8 text-white shadow-2xl sm:p-12 border border-white/15">
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" style={{ transform: 'translateZ(0)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" style={{ transform: 'translateZ(0)' }} />

        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
              ⚡ Soroban Testnet Live
            </span>
            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Run your next committee on-chain
            </h2>
            <p className="text-slate-300 text-base leading-relaxed text-pretty">
              Start a rotating savings circle with your friends in minutes. The smart contract executes rotation, bidding auctions, and pot payouts deterministically — you keep total trust.
            </p>
          </div>

          <button
            onClick={onStart}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-sm px-8 py-4 shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all shrink-0"
          >
            {identity ? 'Create a Committee' : 'Get Started Now'}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
