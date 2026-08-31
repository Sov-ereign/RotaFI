import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { NetworkTicker } from './components/NetworkTicker';
import { Toaster } from './components/Toaster';
import { Logo } from './components/Logo';
import { LandingPage } from './pages/LandingPage';
import { lazy, Suspense } from 'react';
import { Github } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

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
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const FeedbackPage = lazy(() =>
  import('./pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })),
);

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
    </div>
  );
}

import { Footer } from './components/Footer';

function Router() {
  const { route, ready, theme } = useApp();
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
    case 'profile': page = <Suspense fallback={<PageFallback />}><ProfilePage /></Suspense>; break;
    case 'feedback': page = <Suspense fallback={<PageFallback />}><FeedbackPage /></Suspense>; break;
    default: page = <LandingPage />;
  }

  const isLanding = route.name === 'landing';

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0c0c0c] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {theme === 'dark' && (
        <>
          {/* Fixed Fullscreen Background Video (Moon Theme) */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none opacity-20"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
            />
          </div>

          {/* Vertical Guide Lines */}
          <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
          <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

          {/* SVG Noise Filter */}
          <svg className="pointer-events-none absolute w-0 h-0" aria-hidden="true">
            <filter id="c3-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
              <feComposite in2="SourceGraphic" operator="in" result="noise" />
              <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
            </filter>
          </svg>
        </>
      )}

      <Header />
      <main key={route.name} className={`relative z-10 flex-1 animate-page-enter ${isLanding ? 'pt-0' : 'pt-16'}`}>
        {page}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
      <Toaster />
      <Analytics />
    </AppProvider>
  );
}
