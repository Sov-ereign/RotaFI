import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Identity } from '../lib/types';
import {
  connectFreighter,
  isFreighterInstalled,
  isFreighterAllowed,
  loadIdentity,
  saveDisplayName,
} from '../lib/wallet';

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'create' }
  | { name: 'committee'; id: string }
  | { name: 'explore' };

interface ToastMessage {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface AppContextValue {
  identity: Identity | null;
  ready: boolean;
  freighterInstalled: boolean;
  // identity actions
  connect: () => Promise<void>;
  setDisplayName: (name: string) => void;
  signOut: () => void;
  // routing
  route: Route;
  navigate: (route: Route) => void;
  // toasts
  toasts: ToastMessage[];
  toast: (t: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return { name: 'landing' };
  const [seg, id] = h.split('/');
  if (seg === 'dashboard') return { name: 'dashboard' };
  if (seg === 'create') return { name: 'create' };
  if (seg === 'explore') return { name: 'explore' };
  if (seg === 'committee' && id) return { name: 'committee', id };
  return { name: 'landing' };
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case 'landing': return '#/';
    case 'dashboard': return '#/dashboard';
    case 'create': return '#/create';
    case 'explore': return '#/explore';
    case 'committee': return `#/committee/${route.id}`;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // On mount: check Freighter and restore session
  useEffect(() => {
    (async () => {
      const installed = await isFreighterInstalled();
      setFreighterInstalled(installed);

      if (installed) {
        const allowed = await isFreighterAllowed();
        if (allowed) {
          const id = await loadIdentity();
          if (id) setIdentity(id);
        }
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const connect = useCallback(async () => {
    const id = await connectFreighter();
    setIdentity(id);
  }, []);

  const setDisplayName = useCallback((name: string) => {
    if (!identity) return;
    saveDisplayName(identity.publicKey, name);
    setIdentity((prev) => prev ? { ...prev, name } : prev);
  }, [identity]);

  const signOut = useCallback(() => {
    setIdentity(null);
    navigate({ name: 'landing' });
  }, [navigate]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ identity, ready, freighterInstalled, connect, setDisplayName, signOut, route, navigate, toasts, toast, dismissToast }),
    [identity, ready, freighterInstalled, connect, setDisplayName, signOut, route, navigate, toasts, toast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
