import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { WalletBar } from './WalletBar';
import { Compass, LayoutDashboard, PlusCircle, MessageSquare, ExternalLink, Menu, X, Calculator, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { YieldCalculatorModal } from './YieldCalculatorModal';

export function Header() {
  const { route, navigate, identity } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yieldModalOpen, setYieldModalOpen] = useState(false);

  const navItems: { label: string; route: Parameters<typeof navigate>[0]; show: boolean; icon: any }[] = [
    { label: 'Explore',   route: { name: 'explore'   }, show: true,       icon: Compass },
    { label: 'Dashboard', route: { name: 'dashboard' }, show: !!identity, icon: LayoutDashboard },
    { label: 'Create',    route: { name: 'create'    }, show: !!identity, icon: PlusCircle },
    { label: 'Feedback',  route: { name: 'feedback'  }, show: true,       icon: MessageSquare },
  ];

  const isActive = (name: string) => route.name === name;

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 2px 30px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
    >
      <div className="mx-auto flex h-[62px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">

        {/* Brand Logo */}
        <button
          onClick={() => navigate({ name: 'landing' })}
          className="transition-all duration-200 hover:scale-[1.03] hover:opacity-90 focus:outline-none"
        >
          <Logo />
        </button>

        {/* Center Desktop Navigation Pills */}
        <nav
          className="hidden items-center gap-1 md:flex rounded-full p-1.5"
          style={{
            background: 'rgba(241,245,249,0.8)',
            border: '1px solid rgba(0,0,0,0.06)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {navItems.filter((n) => n.show).map((n) => {
            const Icon = n.icon;
            const active = isActive(n.route.name);
            return (
              <button
                key={n.label}
                onClick={() => navigate(n.route)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'text-emerald-700 font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
                style={active ? {
                  background: 'white',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                } : {}}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Yield Calculator Button */}
          <button
            onClick={() => setYieldModalOpen(true)}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(16,185,129,0.12) 100%)',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#78350f',
            }}
          >
            <Calculator className="h-3.5 w-3.5 text-amber-500" />
            Yield Calculator
          </button>

          {/* Stellar Live indicator */}
          <a
            href="https://stellar.org/testnet"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#065f46',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Testnet
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>

          <WalletBar />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 md:hidden hover:bg-slate-200 transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden animate-slide-up space-y-1">
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
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                {n.label}
              </button>
            );
          })}
          {/* Mobile yield calculator */}
          <button
            onClick={() => { setYieldModalOpen(true); setMobileMenuOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
          >
            <Calculator className="h-4 w-4 text-amber-500" />
            Yield Calculator
          </button>
        </div>
      )}

      {/* Yield & APY Calculator Modal */}
      <YieldCalculatorModal open={yieldModalOpen} onClose={() => setYieldModalOpen(false)} />
    </header>
  );
}
