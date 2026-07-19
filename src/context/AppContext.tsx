import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Identity } from '../lib/types';
import { apiGet, apiPost, apiPut, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api';
import { isFreighterInstalled, connectFreighter } from '../lib/wallet';

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'create' }
  | { name: 'committee'; id: string }
  | { name: 'explore' }
  | { name: 'profile' };

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
  freighterChecking: boolean;
  // auth
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  linkWallet: () => Promise<void>;
  unlinkWallet: () => Promise<void>;
  updateProfile: (updates: { name?: string; bio?: string }) => Promise<void>;
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
  if (seg === 'profile') return { name: 'profile' };
  if (seg === 'committee' && id) return { name: 'committee', id };
  return { name: 'landing' };
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case 'landing': return '#/';
    case 'dashboard': return '#/dashboard';
    case 'create': return '#/create';
    case 'explore': return '#/explore';
    case 'profile': return '#/profile';
    case 'committee': return `#/committee/${route.id}`;
  }
}

interface ApiAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
    bio: string;
    createdAt: string;
  };
}

function userToIdentity(token: string, u: ApiAuthResponse['user']): Identity {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    publicKey: u.walletAddress ?? null,
    bio: u.bio ?? '',
    network: 'TESTNET',
    token,
    createdAt: u.createdAt,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);
  const [freighterChecking, setFreighterChecking] = useState(true);
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // On mount: restore session from stored JWT + check Freighter
  useEffect(() => {
    const token = getStoredToken();
    const restoreSession = token
      ? apiGet<ApiAuthResponse['user']>('/auth/me', token)
          .then(u => setIdentity(userToIdentity(token, u)))
          .catch(() => clearStoredToken())
      : Promise.resolve();

    const checkFreighter = isFreighterInstalled().then(ok => {
      setFreighterInstalled(ok);
      setFreighterChecking(false);
    });

    Promise.all([restoreSession, checkFreighter]).finally(() => setReady(true));
  }, []);

  // Re-check Freighter when window gains focus (user may have installed it)
  useEffect(() => {
    const onFocus = () => {
      isFreighterInstalled().then(ok => {
        setFreighterInstalled(ok);
        setFreighterChecking(false);
      });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next);
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(next);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await apiPost<ApiAuthResponse>('/auth/register', { name, email, password });
    setStoredToken(token);
    setIdentity(userToIdentity(token, user));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiPost<ApiAuthResponse>('/auth/login', { email, password });
    setStoredToken(token);
    setIdentity(userToIdentity(token, user));
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setIdentity(null);
    navigate({ name: 'landing' });
  }, [navigate]);

  const linkWallet = useCallback(async () => {
    const address = await connectFreighter();
    const user = await apiPost<ApiAuthResponse['user']>('/auth/link-wallet', { walletAddress: address });
    setIdentity(prev => prev ? { ...prev, publicKey: user.walletAddress ?? null } : prev);
  }, []);

  const unlinkWallet = useCallback(async () => {
    await apiPost<ApiAuthResponse['user']>('/auth/unlink-wallet');
    setIdentity(prev => prev ? { ...prev, publicKey: null } : prev);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; bio?: string }) => {
    const user = await apiPut<ApiAuthResponse['user']>('/users/profile', updates);
    setIdentity(prev => prev ? { ...prev, name: user.name, bio: user.bio } : prev);
  }, []);

  // ── Toasts ──────────────────────────────────────────────────────────────────

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      identity, ready, freighterInstalled, freighterChecking,
      register, login, logout, linkWallet, unlinkWallet, updateProfile,
      route, navigate, toasts, toast, dismissToast,
    }),
    [identity, ready, freighterInstalled, freighterChecking,
     register, login, logout, linkWallet, unlinkWallet, updateProfile,
     route, navigate, toasts, toast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
