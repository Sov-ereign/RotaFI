import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Toaster } from './components/Toaster';
import { Logo } from './components/Logo';
import { LandingPage } from './pages/LandingPage';
import { lazy, Suspense } from 'react';
import { Github } from 'lucide-react';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })),
);
const CreateCommitteePage = lazy(() =>
  import('./pages/CreateCommitteePage').then((m) => ({ default: m.CreateCommitteePage })),
);
const CommitteeDetailPage = lazy(() =>
  import('./pages/CommitteeDetailPage').then((m) => ({ default: m.CommitteeDetailPage })),
);

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
    </div>
  );
}

function Footer() {
  const { navigate } = useApp();
  return (
    <footer className="border-t border-ink-200/70 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Logo />
            <p className="max-w-xs text-center text-xs leading-relaxed text-ink-400 sm:text-left">
              Transparent rotating savings groups on Stellar. MVP runs on testnet — no real money is at stake.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-ink-500">
            <button onClick={() => navigate({ name: 'landing' })} className="transition hover:text-ink-900">Home</button>
            <button onClick={() => navigate({ name: 'explore' })} className="transition hover:text-ink-900">Explore</button>
            <button onClick={() => navigate({ name: 'dashboard' })} className="transition hover:text-ink-900">Dashboard</button>
            <button onClick={() => navigate({ name: 'create' })} className="transition hover:text-ink-900">Create</button>
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>Built for the Stellar ecosystem · Soroban smart contracts</p>
          <div className="flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            <span>Open-source MVP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Router() {
  const { route, ready } = useApp();
  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      </div>
    );
  }

  let page: React.ReactNode;
  switch (route.name) {
    case 'landing': page = <LandingPage />; break;
    case 'dashboard': page = <Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>; break;
    case 'explore': page = <Suspense fallback={<PageFallback />}><ExplorePage /></Suspense>; break;
    case 'create': page = <Suspense fallback={<PageFallback />}><CreateCommitteePage /></Suspense>; break;
    case 'committee': page = <Suspense fallback={<PageFallback />}><CommitteeDetailPage committeeId={route.id} /></Suspense>; break;
    default: page = <LandingPage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
      <Toaster />
    </AppProvider>
  );
}
