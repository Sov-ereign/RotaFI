import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { WalletBar } from './WalletBar';

export function Header() {
  const { route, navigate, identity } = useApp();

  const navItems: { label: string; route: Parameters<typeof navigate>[0]; show: boolean }[] = [
    { label: 'Explore', route: { name: 'explore' }, show: true },
    { label: 'Dashboard', route: { name: 'dashboard' }, show: !!identity },
    { label: 'Create', route: { name: 'create' }, show: !!identity },
  ];

  const isActive = (name: string) => route.name === name;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-ink-50/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate({ name: 'landing' })} className="transition hover:opacity-80">
          <Logo />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.filter((n) => n.show).map((n) => (
            <button
              key={n.label}
              onClick={() => navigate(n.route)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive(n.route.name)
                  ? 'bg-white text-ink-900 shadow-soft ring-1 ring-ink-200'
                  : 'text-ink-500 hover:bg-ink-100/70 hover:text-ink-800'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WalletBar />
        </div>
      </div>
    </header>
  );
}
