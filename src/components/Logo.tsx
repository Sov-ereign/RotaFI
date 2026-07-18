import { Coins } from 'lucide-react';

export function Logo({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft">
        <Coins className="h-5 w-5" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-saffron-400 ring-2 ring-white" />
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-extrabold tracking-tight text-ink-900">
            RotaFi
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            on Stellar
          </div>
        </div>
      )}
    </div>
  );
}
