import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Coins, Users, CalendarClock, ShieldAlert,
  Sparkles, Loader2, ListOrdered, Gavel, Info, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createCommittee, formatXLM } from '../lib/contract';
import type { PenaltyStrategy, PayoutRule } from '../lib/types';

const PRESET_AMOUNTS = [1, 5, 10, 25]; // XLM
const PRESET_MEMBERS = [5, 10, 12, 20];
const PRESET_CYCLES = [30, 60, 90];

export function CreateCommitteePage() {
  const { identity, navigate, toast, theme } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(5); // XLM
  const [cycleDays, setCycleDays] = useState(30);
  const [memberCount, setMemberCount] = useState(10);
  const [payoutRule, setPayoutRule] = useState<PayoutRule>('turn_order');
  const [penaltyStrategy, setPenaltyStrategy] = useState<PenaltyStrategy>('delay');
  const [penaltyAmount, setPenaltyAmount] = useState(0.5); // XLM

  if (!identity) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className={`font-display text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-ink-900'}`}>Connect your wallet</h2>
        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-ink-600'}`}>Create a wallet identity to start a committee.</p>
      </div>
    );
  }

  const steps = ['Basics', 'Contributions', 'Rules', 'Review'];
  const potXLM = amount * memberCount;

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return amount > 0 && memberCount >= 2 && cycleDays > 0;
    if (step === 2) return !!penaltyStrategy;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const committee = await createCommittee({
        name,
        description,
        contributionAmountRupees: amount,
        cycleLengthDays: cycleDays,
        memberCount,
        payoutRule,
        penaltyStrategy,
        penaltyAmountRupees: penaltyAmount,
        identity,
      });
      toast({ kind: 'success', title: 'Committee created', description: `"${name}" is live and accepting members.` });
      navigate({ name: 'committee', id: committee.id });
    } catch (e) {
      toast({ kind: 'error', title: 'Creation failed', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPot = amount * memberCount;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 space-y-6 animate-page-enter">
      <button
        onClick={() => navigate({ name: 'dashboard' })}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
          theme === 'dark'
            ? 'bg-slate-900/80 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <div>
        <h1 className={`font-display text-3xl font-black tracking-tight ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>Create a ROSCA Committee</h1>
        <p className={`mt-1 text-sm ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>Configure a transparent rotating savings group enforced by Soroban smart contract logic.</p>
      </div>

      {/* Stepper */}
      <div className={`flex items-center gap-2 rounded-2xl p-4 shadow-md border backdrop-blur-xl ${
        theme === 'dark'
          ? 'liquid-glass bg-slate-900/80 border-white/10 text-white'
          : 'bg-white border-slate-200/80 text-slate-900 ring-1 ring-slate-200/80'
      }`}>
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition ${
                i < step
                  ? 'bg-emerald-500 text-black shadow-md'
                  : i === step
                    ? theme === 'dark' ? 'bg-white text-black ring-4 ring-white/20' : 'bg-slate-900 text-white ring-4 ring-slate-900/10'
                    : theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
            </div>
            <span className={`hidden text-xs font-semibold sm:block ${
              i === step
                ? theme === 'dark' ? 'text-white font-black' : 'text-slate-900 font-bold'
                : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>{s}</span>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${
                i < step
                  ? 'bg-emerald-500'
                  : theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-soft'
        }`}>
        {step === 0 && (
          <div className="animate-fade-in space-y-5">
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>Committee name</label>
              <input
                type="text"
                placeholder="e.g. Family Circle, Office Committee"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 text-white border-white/10 placeholder-slate-500'
                    : 'bg-white text-slate-900 border-slate-200 placeholder-slate-400'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>Description <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea
                placeholder="What is this committee for? Who is it for?"
                value={description}
                maxLength={240}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full min-h-[96px] resize-none rounded-xl px-4 py-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 text-white border-white/10 placeholder-slate-500'
                    : 'bg-white text-slate-900 border-slate-200 placeholder-slate-400'
                }`}
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{description.length}/240</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}><Coins className="h-4 w-4 text-emerald-400" /> Contribution per cycle (XLM)</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <PresetChip key={a} active={amount === a} onClick={() => setAmount(a)} theme={theme}>{a} XLM</PresetChip>
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  className={`w-full rounded-xl px-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                    theme === 'dark'
                      ? 'bg-slate-950/80 text-white border-white/10'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                />
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>/cycle</span>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}><Users className="h-4 w-4 text-sky-400" /> Number of members</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_MEMBERS.map((m) => (
                  <PresetChip key={m} active={memberCount === m} onClick={() => setMemberCount(m)} theme={theme}>{m}</PresetChip>
                ))}
              </div>
              <input
                type="number"
                min={2}
                max={50}
                value={memberCount}
                onChange={(e) => setMemberCount(Math.max(2, Math.min(50, Number(e.target.value))))}
                className={`w-full rounded-xl px-4 py-2 mt-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 text-white border-white/10'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              />
              <p className={`mt-1 text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Each member receives the pot exactly once — so there are {memberCount} cycles.</p>
            </div>

            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}><CalendarClock className="h-4 w-4 text-amber-400" /> Cycle length</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_CYCLES.map((d) => (
                  <PresetChip key={d} active={cycleDays === d} onClick={() => setCycleDays(d)} theme={theme}>{d} days</PresetChip>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={cycleDays}
                onChange={(e) => setCycleDays(Math.max(1, Number(e.target.value)))}
                className={`w-full rounded-xl px-4 py-2 mt-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 text-white border-white/10'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              />
            </div>

            <div className={`rounded-2xl p-4 border transition ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                : 'bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Pot per cycle</span>
                <span className={`font-display text-2xl font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-900'}`}>{formatXLM(potXLM)}</span>
              </div>
              <p className={`mt-1 text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{formatXLM(amount)} × {memberCount} members</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>Payout rule</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  active={payoutRule === 'turn_order'}
                  onClick={() => setPayoutRule('turn_order')}
                  icon={<ListOrdered className="h-5 w-5" />}
                  title="Turn order"
                  desc="Fixed schedule — each member gets the pot in a set order. Simplest and most common."
                  theme={theme}
                />
                <OptionCard
                  active={payoutRule === 'bidding'}
                  onClick={() => setPayoutRule('bidding')}
                  icon={<Gavel className="h-5 w-5" />}
                  title="Bidding (v2)"
                  desc="Members bid to receive the pot earlier at a discount. Lowest bid wins."
                  disabled
                  theme={theme}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}><ShieldAlert className="h-4 w-4 text-red-400" /> Default handling</label>
              <p className={`mb-3 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>What happens when a member misses a contribution? Enforced by Soroban logic.</p>
              <div className="grid gap-3">
                <OptionCard
                  active={penaltyStrategy === 'delay'}
                  onClick={() => setPenaltyStrategy('delay')}
                  icon={<CalendarClock className="h-5 w-5" />}
                  title="Delay cycle"
                  desc="The cycle is held until the member pays or is excused by the organizer."
                  theme={theme}
                />
                <OptionCard
                  active={penaltyStrategy === 'penalty'}
                  onClick={() => setPenaltyStrategy('penalty')}
                  icon={<ShieldAlert className="h-5 w-5" />}
                  title="Penalty fee"
                  desc="The defaulted contribution is marked and a penalty is recorded against the member."
                  theme={theme}
                />
                <OptionCard
                  active={penaltyStrategy === 'backup_fund'}
                  onClick={() => setPenaltyStrategy('backup_fund')}
                  icon={<Coins className="h-5 w-5" />}
                  title="Backup fund"
                  desc="The cycle can still advance; shortfall covered by a backup fund or later make-up."
                  theme={theme}
                />
              </div>
            </div>

            {penaltyStrategy === 'penalty' && (
              <div>
                <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>Penalty amount (XLM)</label>
                <input
                  type="number"
                  min={0}
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(Math.max(0, Number(e.target.value)))}
                  className={`w-full rounded-xl px-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition ${
                    theme === 'dark'
                      ? 'bg-slate-950/80 text-white border-white/10'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-4">
            <div className={`rounded-xl p-4 border ${
              theme === 'dark'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-white'
                : 'bg-sky-50 border-sky-200/80 text-slate-900'
            }`}>
              <div className={`flex items-center gap-2 text-sm font-bold ${
                theme === 'dark' ? 'text-emerald-300' : 'text-sky-900'
              }`}>
                <Info className="h-4 w-4 text-emerald-400" /> Review & deploy
              </div>
              <p className={`mt-1.5 text-xs leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-sky-800'
              }`}>
                This will create the committee on-chain with you as organizer and member #1
                (first payout recipient). You can invite members to join before starting the cycles.
              </p>
            </div>
            <ReviewRow label="Name" value={name} theme={theme} />
            {description && <ReviewRow label="Description" value={description} theme={theme} />}
            <ReviewRow label="Contribution" value={`${formatXLM(amount)} / cycle`} theme={theme} />
            <ReviewRow label="Members" value={`${memberCount} members · ${memberCount} cycles`} theme={theme} />
            <ReviewRow label="Cycle length" value={`${cycleDays} days`} theme={theme} />
            <ReviewRow label="Payout rule" value={payoutRule === 'turn_order' ? 'Turn order' : 'Bidding (v2)'} theme={theme} />
            <ReviewRow label="Default handling" value={penaltyStrategy.replace('_', ' ')} theme={theme} />
            {penaltyStrategy === 'penalty' && <ReviewRow label="Penalty" value={formatXLM(penaltyAmount)} theme={theme} />}
            <ReviewRow label="Pot per cycle" value={formatXLM(potXLM)} highlight theme={theme} />
            <ReviewRow label="Organizer" value={`${identity.name} (you)`} theme={theme} />
          </div>
        )}

        {/* Nav buttons */}
        <div className={`mt-8 flex items-center justify-between pt-5 border-t ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-200'
        }`}>
          <button
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => (step === 0 ? navigate({ name: 'dashboard' }) : setStep((s) => s - 1))}
          >
            <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < steps.length - 1 ? (
            <button
              className={`rounded-xl px-6 py-2.5 text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              className={`rounded-xl px-6 py-2.5 text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                  : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying on Soroban…</> : <><Sparkles className="h-4 w-4" /> Deploy Committee Contract</>}
            </button>
          )}
        </div>
      </div>

      {/* Live Pot Preview Sidebar */}
      <div className="space-y-4">
        <div className={`rounded-3xl p-6 shadow-2xl border backdrop-blur-2xl relative overflow-hidden ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/90 border-white/10 text-white'
            : 'bg-slate-950 text-white border-slate-800'
        }`}>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl" />
          <div className="space-y-4 relative z-10">
            <span className="inline-block rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 text-[10px] uppercase font-bold tracking-wider">
              Live Pot Preview
            </span>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Total Pool Vault per Cycle</div>
              <div className="font-display text-3xl font-black text-white mt-0.5">
                ₹{(totalPot * 10).toLocaleString()} INR
              </div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5">({totalPot.toLocaleString()} XLM)</div>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Members</span>
                <span className="font-bold text-white">{memberCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Cycle Length</span>
                <span className="font-bold text-white">{cycleDays} Days</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Payout Rule</span>
                <span className="font-bold text-amber-400 uppercase text-[10px]">{payoutRule.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 text-[11px] text-slate-400 leading-relaxed border border-white/10">
              <ShieldCheck className="h-4 w-4 text-emerald-400 inline mr-1" />
              Soroban smart contract automatically collects contributions and releases funds each cycle.
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function PresetChip({ active, onClick, children, theme }: { active: boolean; onClick: () => void; children: React.ReactNode; theme: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
        active
          ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-slate-900 text-white shadow-md'
          : theme === 'dark' ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function OptionCard({ active, onClick, icon, title, desc, disabled, theme }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; disabled?: boolean; theme: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
        active
          ? theme === 'dark' ? 'border-emerald-500/50 bg-emerald-500/15 text-white ring-2 ring-emerald-500/30' : 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
          : theme === 'dark' ? 'border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/5' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
        active
          ? theme === 'dark' ? 'bg-emerald-500 text-black font-extrabold' : 'bg-slate-900 text-white'
          : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
      }`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</span>
        <span className={`mt-0.5 block text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</span>
      </span>
    </button>
  );
}

function ReviewRow({ label, value, highlight, theme }: { label: string; value: string; highlight?: boolean; theme: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b pb-2.5 last:border-0 ${
      theme === 'dark' ? 'border-white/10' : 'border-slate-100'
    }`}>
      <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm font-semibold text-right ${
        highlight
          ? theme === 'dark' ? 'font-display text-base font-black text-emerald-400' : 'font-display text-base font-black text-emerald-600'
          : theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>{value}</span>
    </div>
  );
}


