import { Coins } from 'lucide-react';

export function Logo({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative h-9 w-9 shrink-0 transition-transform duration-300 hover:scale-105">
        <img src="/logo.svg" alt="RotaFi" className="h-full w-full object-contain filter drop-shadow-md" />
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-display text-[18px] font-extrabold tracking-tight text-ink-900 flex items-center gap-1">
            Rota<span className="text-brand-600">Fi</span>
          </div>
          <div className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-ink-500 mt-0.5">
            On Stellar
          </div>
        </div>
      )}
    </div>
  );
}
