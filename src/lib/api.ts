// HTTP client for the RotaFi backend API (MongoDB/Express on port 3001)

const BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL
  || 'http://localhost:3001/api';

const TOKEN_KEY = 'rotafi.jwt.v2';

// ── Token management ──────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch ────────────────────────────────────────────────────────────────

function headers(token?: string | null): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  const t = token ?? getStoredToken();
  if (t) (h as Record<string, string>)['Authorization'] = `Bearer ${t}`;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(token) });
  return parse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res);
}

export async function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers(token) });
  return parse<T>(res);
}
