// Freighter wallet integration for RotaFi.
// Replaces the old keypair-based system — Freighter owns the private key and
// signs all transactions. We only store the display name locally.

import type { Identity } from './types';

const NAME_KEY = 'rotafi.display_names.v2';

// ── Freighter detection ──────────────────────────────────────────────────────

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    // @stellar/freighter-api injects window.freighter
    const { isConnected } = await import('@stellar/freighter-api');
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function isFreighterAllowed(): Promise<boolean> {
  try {
    const { isAllowed } = await import('@stellar/freighter-api');
    const result = await isAllowed();
    return result.isAllowed;
  } catch {
    return false;
  }
}

// ── Connection ───────────────────────────────────────────────────────────────

/** Request Freighter access and return an Identity (no secret key stored). */
export async function connectFreighter(): Promise<Identity> {
  const { requestAccess, getNetwork } = await import('@stellar/freighter-api');

  const accessResult = await requestAccess();
  if ('error' in accessResult && accessResult.error) {
    throw new Error(accessResult.error);
  }

  const address = (accessResult as { address: string }).address;
  if (!address) throw new Error('Freighter did not return an address.');

  const networkResult = await getNetwork();
  const network = 'networkPassphrase' in networkResult
    ? networkResult.network ?? 'TESTNET'
    : 'TESTNET';

  const name = loadDisplayName(address) || shortAddress(address);

  const identity: Identity = {
    name,
    publicKey: address,
    network,
    createdAt: new Date().toISOString(),
  };
  return identity;
}

/** Get the currently connected Freighter address without requesting access. */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { getAddress } = await import('@stellar/freighter-api');
    const result = await getAddress();
    if ('error' in result) return null;
    return (result as { address: string }).address || null;
  } catch {
    return null;
  }
}

/** Restore a previously connected identity from Freighter (non-interactive). */
export async function loadIdentity(): Promise<Identity | null> {
  try {
    const address = await getConnectedAddress();
    if (!address) return null;
    const name = loadDisplayName(address) || shortAddress(address);
    return { name, publicKey: address, network: 'TESTNET', createdAt: '' };
  } catch {
    return null;
  }
}

// ── Signing ──────────────────────────────────────────────────────────────────

/** Sign a Stellar transaction XDR with Freighter. Returns signed XDR. */
export async function signTx(
  xdr: string,
  network: string = 'TESTNET',
): Promise<string> {
  const { signTransaction } = await import('@stellar/freighter-api');
  const result = await signTransaction(xdr, {
    network,
    networkPassphrase: network === 'TESTNET'
      ? 'Test SDF Network ; September 2015'
      : 'Public Global Stellar Network ; September 2015',
  });
  if ('error' in result && result.error) throw new Error(result.error as string);
  return (result as { signedTxXdr: string }).signedTxXdr;
}

// ── Display name management ───────────────────────────────────────────────────

export function saveDisplayName(publicKey: string, name: string): void {
  const map = _loadNameMap();
  map[publicKey] = name.trim().slice(0, 40) || shortAddress(publicKey);
  localStorage.setItem(NAME_KEY, JSON.stringify(map));
}

export function loadDisplayName(publicKey: string): string | null {
  return _loadNameMap()[publicKey] || null;
}

function _loadNameMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NAME_KEY) || '{}');
  } catch {
    return {};
  }
}

// ── Address helpers ───────────────────────────────────────────────────────────

export function shortAddress(pk: string, head = 6, tail = 5): string {
  if (!pk || pk.length < head + tail) return pk;
  return `${pk.slice(0, head)}…${pk.slice(-tail)}`;
}

/** Deterministic avatar gradient from a public key. */
export function avatarGradient(pk: string): string {
  let h = 0;
  for (let i = 0; i < pk.length; i++) h = (h * 31 + pk.charCodeAt(i)) % 360;
  const h2 = (h + 48) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${h2} 72% 52%))`;
}

/** First letter(s) of a name for avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
