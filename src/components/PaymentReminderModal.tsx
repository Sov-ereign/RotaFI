import { useState } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';

export function PaymentReminderModal({
  isOpen,
  onClose,
  committeeName,
  cycleIndex,
  amountXlm,
  dueDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  committeeName: string;
  cycleIndex: number;
  amountXlm: number;
  dueDate: string;
}) {
  const { toast } = useApp();
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | '24h_before' | '1h_before'>('24h_before');
  const [notifyMethod, setNotifyMethod] = useState<'email' | 'push' | 'both'>('both');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        kind: 'success',
        title: 'Payment Reminders Enabled! 🔔',
        description: `You will be notified ${reminderFrequency.replace('_', ' ')} before Cycle ${cycleIndex} deadline.`,
      });
      onClose();
    }, 600);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900">
              Contribution Deadline Reminders
            </h3>
            <p className="text-xs text-ink-500">
              Set automated notifications for <span className="font-semibold text-ink-700">{committeeName}</span>
            </p>
          </div>
        </div>

        {/* Due Date Info Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs space-y-1.5 text-amber-900">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" /> Cycle {cycleIndex} Contribution Due:
            </span>
            <span className="font-mono font-bold text-amber-950">{dueDate}</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Amount Required: <span className="font-bold">{amountXlm} XLM</span> (₹{amountXlm * 10} INR). On-time payments maintain your +15 Credit Score boost!
          </p>
        </div>

        <form onSubmit={handleSaveReminders} className="space-y-4 text-xs">
          {/* Reminder Timing */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ink-800 block">Notification Schedule</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Daily Digest' },
                { id: '24h_before', label: '24 Hours Before' },
                { id: '1h_before', label: '1 Hour Before' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminderFrequency(opt.id as any)}
                  className={`rounded-lg p-2.5 text-center font-medium border transition ${
                    reminderFrequency === opt.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-200'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ink-800 block">Delivery Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'both', label: 'Email + In-App' },
                { id: 'email', label: 'Email Only' },
                { id: 'push', label: 'In-App Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNotifyMethod(opt.id as any)}
                  className={`rounded-lg p-2.5 text-center font-medium border transition ${
                    notifyMethod === opt.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-200'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving...' : 'Enable Reminders'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
