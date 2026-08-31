import { ArrowUp, Github, ExternalLink, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { navigate, theme } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (theme === 'light') {
    return (
      <footer className="relative bg-slate-100 text-slate-900 border-t border-slate-200/80 overflow-hidden pt-10 sm:pt-12">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          {/* Compact Top Row: 3 Link Groups + Back to Top (Responsive Grid) */}
          <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-slate-200">
            {/* Group 1: Navigation */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                <li>
                  <button onClick={() => navigate({ name: 'landing' })} className="hover:text-emerald-600 transition text-left">
                    Home Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate({ name: 'explore' })} className="hover:text-emerald-600 transition text-left">
                    Explore Circles
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate({ name: 'dashboard' })} className="hover:text-emerald-600 transition text-left">
                    Member Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate({ name: 'create' })} className="hover:text-emerald-600 transition text-left">
                    Start Committee
                  </button>
                </li>
              </ul>
            </div>

            {/* Group 2: Ecosystem */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ecosystem</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                <li>
                  <a
                    href="https://stellar.org"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
                  >
                    Stellar Network <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://stellar.expert/explorer/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
                  >
                    Soroban Contract <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
                <li>
                  <button onClick={() => navigate({ name: 'feedback' })} className="hover:text-emerald-600 transition text-left">
                    Community Reviews
                  </button>
                </li>
              </ul>
            </div>

            {/* Group 3: Resources */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resources</h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                <li>
                  <a
                    href="https://github.com/Sov-ereign/RotaFI"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
                  >
                    <Github className="h-3.5 w-3.5" /> GitHub Source
                  </a>
                </li>
                <li>
                  <a
                    href="/pitch_deck.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
                  >
                    Pitch Deck Presentation <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
                <li className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 pt-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Soroban Verified
                </li>
              </ul>
            </div>

            {/* Back to Top Link (Full Width on Mobile) */}
            <div className="col-span-2 sm:col-span-1 flex sm:justify-end items-start pt-2 sm:pt-0">
              <button
                onClick={scrollToTop}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm border border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-300 group"
              >
                <span>Back to top</span>
                <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Small Legal Line Above Wordmark */}
          <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs font-medium text-slate-500">
            <p>© 2026 RotaFi Protocol · Open-source ROSCA Smart Contracts on Stellar Testnet.</p>
            <p className="font-mono text-[10px] text-slate-400">Contract: CATIMLHB…N4D</p>
          </div>

          {/* Fully Visible Enormous Brand Wordmark */}
          <div className="pt-4 pb-8 sm:pb-12 text-center select-none pointer-events-none">
            <div className="font-display text-[12vw] sm:text-[14vw] font-black tracking-tighter leading-none text-slate-900/90 uppercase">
              ROTAFI
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative overflow-hidden pt-10 sm:pt-12 bg-slate-950 text-white border-t border-white/10 transition-colors duration-300">
      {/* Background Animated Ambient Halos */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* Compact Top Row: 3 Link Groups + Back to Top (Responsive Grid) */}
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-white/10">
          {/* Group 1: Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
              <li>
                <button onClick={() => navigate({ name: 'landing' })} className="hover:text-emerald-400 hover:translate-x-1 transition-all inline-block text-left">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ name: 'explore' })} className="hover:text-emerald-400 hover:translate-x-1 transition-all inline-block text-left">
                  Explore Circles
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ name: 'dashboard' })} className="hover:text-emerald-400 hover:translate-x-1 transition-all inline-block text-left">
                  Member Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ name: 'create' })} className="hover:text-emerald-400 hover:translate-x-1 transition-all inline-block text-left">
                  Start Committee
                </button>
              </li>
            </ul>
          </div>

          {/* Group 2: Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ecosystem</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
              <li>
                <a
                  href="https://stellar.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 hover:translate-x-1 transition-all"
                >
                  Stellar Network <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://stellar.expert/explorer/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 hover:translate-x-1 transition-all"
                >
                  Soroban Contract <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <button onClick={() => navigate({ name: 'feedback' })} className="hover:text-emerald-400 hover:translate-x-1 transition-all inline-block text-left">
                  Community Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Group 3: Resources */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
              <li>
                <a
                  href="https://github.com/Sov-ereign/RotaFI"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 hover:translate-x-1 transition-all"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub Source
                </a>
              </li>
              <li>
                <a
                  href="/pitch_deck.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 hover:translate-x-1 transition-all"
                >
                  Pitch Deck Presentation <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <ShieldCheck className="h-3.5 w-3.5" /> Soroban Verified
              </li>
            </ul>
          </div>

          {/* Back to Top Link (Full Width on Mobile) */}
          <div className="col-span-2 sm:col-span-1 flex sm:justify-end items-start pt-2 sm:pt-0">
            <button
              onClick={scrollToTop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold text-white shadow-sm border border-white/20 hover:bg-white hover:text-black transition-all duration-300 group hover:scale-105 active:scale-95"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-1" />
            </button>
          </div>
        </div>

        {/* Small Legal Line Above Wordmark */}
        <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs font-medium text-slate-400">
          <p>© 2026 RotaFi Protocol · Open-source ROSCA Smart Contracts on Stellar Testnet.</p>
          <p className="font-mono text-[10px] text-slate-500">Contract: CATIMLHB…N4D</p>
        </div>

        {/* Fully Visible Enormous Brand Wordmark with Shiny Gradient Effect */}
        <div className="pt-4 pb-8 sm:pb-12 text-center select-none pointer-events-none">
          <div
            className="font-display text-[12vw] sm:text-[14vw] font-black tracking-tighter leading-none uppercase animate-shiny"
            style={{
              backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #10b981 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: 'url(#c3-noise)',
            }}
          >
            ROTAFI
          </div>
        </div>
      </div>
    </footer>
  );
}
