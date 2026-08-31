import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { WalletBar } from './WalletBar';
import { Compass, LayoutDashboard, PlusCircle, MessageSquare, Menu, X, Sun, Moon, Calculator } from 'lucide-react';
import { useState } from 'react';
import { YieldCalculatorModal } from './YieldCalculatorModal';

export function Header() {
  const { route, navigate, identity, theme, toggleTheme } = useApp();
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
    <>
      {/* Floating Pill Navigation: Fixed, Centered, Fully Rounded */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-max max-w-[96vw]">
        <div className={`flex items-center gap-2 sm:gap-2.5 rounded-full backdrop-blur-2xl px-3 py-1.5 transition-all duration-300 shadow-2xl ${
          theme === 'dark'
            ? 'bg-slate-900/90 border border-white/15 text-white backdrop-blur-2xl'
            : 'bg-white/95 border border-slate-200/90 text-slate-900 backdrop-blur-2xl'
        }`}>

          {/* Compact Logo Mark */}
          <button
            onClick={() => navigate({ name: 'landing' })}
            className="flex items-center transition hover:scale-105 focus:outline-none shrink-0"
          >
            <Logo />
          </button>

          {/* Vertical Divider */}
          <div className={`h-4 w-px shrink-0 ${theme === 'dark' ? 'bg-white/20' : 'bg-slate-200'}`} />

          {/* Center Links (hidden below md) */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navItems.filter((n) => n.show).map((n) => {
              const active = isActive(n.route.name);
              return (
                <button
                  key={n.label}
                  onClick={() => navigate(n.route)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 ${
                    active
                      ? theme === 'dark' ? 'bg-white text-black font-bold shadow-md' : 'bg-slate-900 text-white font-bold shadow-sm'
                      : theme === 'dark' ? 'text-slate-300 font-semibold hover:bg-white/10 hover:text-white' : 'text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {n.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster & Dark CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Wallet Bar */}
            <WalletBar />

            {/* Responsive Circle CTA Button */}
            <button
              onClick={() => navigate(identity ? { name: 'create' } : { name: 'explore' })}
              className="inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
              title={identity ? 'Start a Committee' : 'Explore Circles'}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{identity ? 'Circle' : 'Explore'}</span>
            </button>

            {/* Sun / Moon Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`grid h-7 w-7 place-items-center rounded-full transition-all hover:scale-110 active:scale-95 shrink-0 ${
                theme === 'dark'
                  ? 'bg-white/10 text-amber-300 hover:bg-white/20'
                  : 'bg-slate-100 text-amber-600 hover:bg-slate-200'
              }`}
              title={theme === 'dark' ? 'Switch to Classic Light Theme (Sun ☀️)' : 'Switch to Aura Dark Theme (Moon 🌙)'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5 fill-amber-300/20 text-amber-300" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white md:hidden hover:bg-white/20 transition shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-white/15 bg-slate-950/95 p-3 backdrop-blur-2xl md:hidden shadow-2xl animate-fade-in space-y-1 w-[90vw] mx-auto text-white">
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
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {n.label}
                </button>
              );
            })}
            <button
              onClick={() => { setYieldModalOpen(true); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition"
            >
              <Calculator className="h-4 w-4 text-amber-500" />
              Yield & APY Calculator
            </button>
          </div>
        )}
      </header>

      {/* Yield & APY Calculator Modal */}
      <YieldCalculatorModal open={yieldModalOpen} onClose={() => setYieldModalOpen(false)} />
    </>
  );
}
