import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Coins, Users, CalendarClock, ShieldAlert,
  Sparkles, Loader2, ListOrdered, Gavel, Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createCommittee, formatXLM } from '../lib/contract';
import type { PenaltyStrategy, PayoutRule } from '../lib/types';

const PRESET_AMOUNTS = [1, 5, 10, 25]; // XLM
const PRESET_MEMBERS = [5, 10, 12, 20];
const PRESET_CYCLES = [30, 60, 90];

export function CreateCommitteePage() {
  const { identity, navigate, toast } = useApp();
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
        <h2 className="font-display text-2xl font-bold text-ink-900">Connect your wallet</h2>
        <p className="mt-2 text-ink-600">Create a wallet identity to start a committee.</p>
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate({ name: 'dashboard' })} className="btn-ghost btn-sm mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <h1 className="font-display text-2xl font-bold text-ink-900">Create a committee</h1>
      <p className="mt-1 text-sm text-ink-500">Set up a transparent rotating savings group on Stellar.</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                i < step
                  ? 'bg-brand-600 text-white'
                  : i === step
                    ? 'bg-ink-900 text-white ring-4 ring-ink-900/10'
                    : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-xs font-semibold sm:block ${i === step ? 'text-ink-900' : 'text-ink-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? 'bg-brand-500' : 'bg-ink-200'}`} />}
          </div>
        ))}
      </div>

      <div className="mt-6 card p-6">
        {step === 0 && (
          <div className="animate-fade-in space-y-5">
            <div>
              <label className="label">Committee name</label>
              <input className="input" placeholder="e.g. Family Circle, Office Committee" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Description <span className="font-normal text-ink-400">(optional)</span></label>
              <textarea className="input min-h-[88px] resize-none" placeholder="What is this committee for? Who is it for?" value={description} maxLength={240} onChange={(e) => setDescription(e.target.value)} />
              <p className="mt-1 text-right text-[11px] text-ink-400">{description.length}/240</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <label className="label flex items-center gap-1.5"><Coins className="h-4 w-4 text-brand-500" /> Contribution per cycle (XLM)</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <PresetChip key={a} active={amount === a} onClick={() => setAmount(a)}>{a} XLM</PresetChip>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input type="number" min={1} className="input" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))} />
                <span className="text-xs text-ink-400">/cycle</span>
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Users className="h-4 w-4 text-sapphire-500" /> Number of members</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_MEMBERS.map((m) => (
                  <PresetChip key={m} active={memberCount === m} onClick={() => setMemberCount(m)}>{m}</PresetChip>
                ))}
              </div>
              <input type="number" min={2} max={50} className="input mt-2" value={memberCount} onChange={(e) => setMemberCount(Math.max(2, Math.min(50, Number(e.target.value))))} />
              <p className="mt-1 text-[11px] text-ink-400">Each member receives the pot exactly once — so there are {memberCount} cycles.</p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-saffron-500" /> Cycle length</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_CYCLES.map((d) => (
                  <PresetChip key={d} active={cycleDays === d} onClick={() => setCycleDays(d)}>{d} days</PresetChip>
                ))}
              </div>
              <input type="number" min={1} className="input mt-2" value={cycleDays} onChange={(e) => setCycleDays(Math.max(1, Number(e.target.value)))} />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-sapphire-50 p-4 ring-1 ring-brand-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-600">Pot per cycle</span>
                <span className="font-display text-2xl font-extrabold text-ink-900">{formatXLM(potXLM)}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">{formatXLM(amount)} × {memberCount} members</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <label className="label">Payout rule</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  active={payoutRule === 'turn_order'}
                  onClick={() => setPayoutRule('turn_order')}
                  icon={<ListOrdered className="h-5 w-5" />}
                  title="Turn order"
                  desc="Fixed schedule — each member gets the pot in a set order. Simplest and most common."
                />
                <OptionCard
                  active={payoutRule === 'bidding'}
                  onClick={() => setPayoutRule('bidding')}
                  icon={<Gavel className="h-5 w-5" />}
                  title="Bidding (v2)"
                  desc="Members bid to receive the pot earlier at a discount. Lowest bid wins."
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-danger-500" /> Default handling</label>
              <p className="mb-3 text-xs text-ink-500">What happens when a member misses a contribution? This is set at creation and applied by the contract.</p>
              <div className="grid gap-3">
                <OptionCard
                  active={penaltyStrategy === 'delay'}
                  onClick={() => setPenaltyStrategy('delay')}
                  icon={<CalendarClock className="h-5 w-5" />}
                  title="Delay cycle"
                  desc="The cycle is held until the member pays or is excused by the organizer."
                />
                <OptionCard
                  active={penaltyStrategy === 'penalty'}
                  onClick={() => setPenaltyStrategy('penalty')}
                  icon={<ShieldAlert className="h-5 w-5" />}
                  title="Penalty fee"
                  desc="The defaulted contribution is marked and a penalty is recorded against the member."
                />
                <OptionCard
                  active={penaltyStrategy === 'backup_fund'}
                  onClick={() => setPenaltyStrategy('backup_fund')}
                  icon={<Coins className="h-5 w-5" />}
                  title="Backup fund"
                  desc="The cycle can still advance; shortfall covered by a backup fund or later make-up."
                />
              </div>
            </div>

            {penaltyStrategy === 'penalty' && (
              <div>
                <label className="label">Penalty amount (XLM)</label>
                <input type="number" min={0} className="input" value={penaltyAmount} onChange={(e) => setPenaltyAmount(Math.max(0, Number(e.target.value)))} />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-4">
            <div className="rounded-xl bg-sapphire-50 p-4 ring-1 ring-sapphire-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-sapphire-800">
                <Info className="h-4 w-4" /> Review & deploy
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-sapphire-800/80">
                This will create the committee on-chain with you as organizer and member #1
                (first payout recipient). You can invite members to join before starting the cycles.
              </p>
            </div>
            <ReviewRow label="Name" value={name} />
            {description && <ReviewRow label="Description" value={description} />}
            <ReviewRow label="Contribution" value={`${formatXLM(amount)} / cycle`} />
            <ReviewRow label="Members" value={`${memberCount} members · ${memberCount} cycles`} />
            <ReviewRow label="Cycle length" value={`${cycleDays} days`} />
            <ReviewRow label="Payout rule" value={payoutRule === 'turn_order' ? 'Turn order' : 'Bidding (v2)'} />
            <ReviewRow label="Default handling" value={penaltyStrategy.replace('_', ' ')} />
            {penaltyStrategy === 'penalty' && <ReviewRow label="Penalty" value={formatXLM(penaltyAmount)} />}
            <ReviewRow label="Pot per cycle" value={formatXLM(potXLM)} highlight />
            <ReviewRow label="Organizer" value={`${identity.name} (you)`} />
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-5 flex items-center justify-between">
        <button
          className="btn-ghost btn-sm"
          onClick={() => (step === 0 ? navigate({ name: 'dashboard' }) : setStep((s) => s - 1))}
        >
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < steps.length - 1 ? (
          <button className="btn-primary btn-sm" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="btn-primary btn-sm" disabled={submitting} onClick={submit}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying…</> : <><Sparkles className="h-4 w-4" /> Create committee</>}
          </button>
        )}
      </div>
    </div>
  );
}

function PresetChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-brand-600 text-white shadow-soft' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
      }`}
    >
      {children}
    </button>
  );
}

function OptionCard({ active, onClick, icon, title, desc, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-200'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{desc}</span>
      </span>
    </button>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 pb-2.5 last:border-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'font-display text-base font-extrabold text-brand-700' : 'text-ink-900'}`}>{value}</span>
    </div>
  );
}


