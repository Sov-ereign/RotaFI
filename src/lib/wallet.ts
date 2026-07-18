import type { Identity } from './types';

const STORAGE_KEY = 'rotafi.identity.v1';

// Load/persist/clear the local identity. These never touch stellar-sdk, so the
// heavy crypto dependency is only dynamically imported in createIdentity().
export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    if (!parsed.publicKey || !parsed.secretKey || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Generate a fresh Stellar testnet keypair. stellar-sdk is dynamically imported
// here so the ~940 kB crypto library only loads when a wallet is actually being
// created — the landing page never pays that cost.
export async function createIdentity(name: string): Promise<Identity> {
  const { Keypair } = await import('stellar-sdk');
  const kp = Keypair.random();
  const identity: Identity = {
    name: name.trim().slice(0, 40) || 'Member',
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
    createdAt: new Date().toISOString(),
  };
  saveIdentity(identity);
  return identity;
}

// Short, human-friendly display of a public key: GABC...XYZ
export function shortAddress(pk: string, head = 6, tail = 5): string {
  if (!pk || pk.length < head + tail) return pk;
  return `${pk.slice(0, head)}…${pk.slice(-tail)}`;
}

// Deterministic, soft pastel avatar gradient from a public key.
export function avatarGradient(pk: string): string {
  let h = 0;
  for (let i = 0; i < pk.length; i++) h = (h * 31 + pk.charCodeAt(i)) % 360;
  const h2 = (h + 48) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${h2} 72% 52%))`;
}

// First letter(s) of a name for avatar fallback.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
