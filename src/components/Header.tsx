import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { WalletBar } from './WalletBar';
import { Compass, LayoutDashboard, PlusCircle, MessageSquare, ExternalLink, Menu, X, Calculator } from 'lucide-react';
import { useState } from 'react';
import { YieldCalculatorModal } from './YieldCalculatorModal';

export function Header() {
  const { route, navigate, identity } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yieldModalOpen, setYieldModalOpen] = useState(false);

  const navItems: { label: string; route: Parameters<typeof navigate>[0]; show: boolean; icon: any }[] = [
    { label: 'Explore', route: { name: 'explore' }, show: true, icon: Compass },
    { label: 'Dashboard', route: { name: 'dashboard' }, show: !!identity, icon: LayoutDashboard },
    { label: 'Create', route: { name: 'create' }, show: !!identity, icon: PlusCircle },
    { label: 'Feedback', route: { name: 'feedback' }, show: true, icon: MessageSquare },
  ];

  const isActive = (name: string) => route.name === name;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/80 backdrop-blur-xl shadow-soft">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
        
        {/* Brand Logo */}
        <button onClick={() => navigate({ name: 'landing' })} className="transition-transform duration-200 hover:scale-[1.02] focus:outline-none">
          <Logo />
        </button>

        {/* Center Desktop Navigation Pills */}
        <nav className="hidden items-center gap-1.5 md:flex rounded-full bg-ink-100/70 p-1.5 ring-1 ring-ink-200/60 backdrop-blur-md">
          {navItems.filter((n) => n.show).map((n) => {
            const Icon = n.icon;
            const active = isActive(n.route.name);
            return (
              <button
                key={n.label}
                onClick={() => navigate(n.route)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-white text-brand-700 shadow-soft ring-1 ring-ink-200/80 font-bold'
                    : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand-600' : 'text-ink-400'}`} />
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Yield Calculator Button */}
          <button
            onClick={() => setYieldModalOpen(true)}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-emerald-50 px-3 py-1 text-[11px] font-bold text-ink-900 ring-1 ring-amber-200/80 transition hover:scale-105 shadow-sm"
          >
            <Calculator className="h-3.5 w-3.5 text-amber-500" />
            Yield Calculator
          </button>

          {/* Stellar Testnet Pill */}
          <a
            href="https://stellar.org/testnet"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/80 transition hover:bg-emerald-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Stellar Testnet
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>

          <WalletBar />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-ink-100 text-ink-700 md:hidden hover:bg-ink-200 transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-ink-200 bg-white/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden animate-slide-up space-y-1">
          {navItems.filter((n) => n.show).map((n) => {
            const Icon = n.icon;
            const active = isActive(n.route.name);
            return (
              <button
                key={n.label}
                onClick={() => {
                  navigate(n.route);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-ink-400'}`} />
                {n.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Yield & APY Calculator Modal */}
      <YieldCalculatorModal open={yieldModalOpen} onClose={() => setYieldModalOpen(false)} />
    </header>
  );
}
