import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

function Toast({
  kind,
  title,
  description,
  onDismiss,
}: {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  onDismiss: () => void;
}) {
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Info;
  const color =
    kind === 'success'
      ? 'text-success-600 bg-success-50 ring-success-200'
      : kind === 'error'
        ? 'text-danger-600 bg-danger-50 ring-danger-200'
        : 'text-sapphire-600 bg-sapphire-50 ring-sapphire-200';
  return (
    <div className="animate-slide-up card flex items-start gap-3 p-3.5 pr-2.5 shadow-lift">
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        {description && <div className="mt-0.5 text-xs text-ink-500">{description}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
