// Freighter wallet helpers — detection, connect, sign.
// Authentication is now handled by the backend (JWT). Freighter is an optional
// wallet link that allows on-chain TX signing.

/** Check if Freighter is installed. Retries several times to handle extension injection delay. */
export async function isFreighterInstalled(): Promise<boolean> {
  // Direct check first — Freighter injects window.freighter synchronously at extension load
  if (typeof (window as Record<string, unknown>)['freighter'] !== 'undefined') return true;

  // Extension takes up to ~800ms to inject after page load — poll with backoff
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 150 + i * 200));
    if (typeof (window as Record<string, unknown>)['freighter'] !== 'undefined') return true;
  }

  // Try the API as final fallback
  try {
    const { isConnected } = await import('@stellar/freighter-api');
    const result = await (isConnected as () => Promise<{ isConnected: boolean }>)();
    return !!result.isConnected;
  } catch {
    return false;
  }
}

/** Non-blocking check — just reads window.freighter without retrying. */
export function isFreighterSync(): boolean {
  return typeof (window as Record<string, unknown>)['freighter'] !== 'undefined';
}

/** Request access from Freighter and return the public key. */
export async function connectFreighter(): Promise<string> {
  const { requestAccess } = await import('@stellar/freighter-api');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (requestAccess as () => Promise<any>)();
  const address: string | undefined = result?.address ?? result;
  if (!address || typeof address !== 'string')
    throw new Error(result?.error || 'Freighter did not return an address');
  return address;
}

/** Get currently active Freighter address without requesting access. */
export async function getFreighterAddress(): Promise<string | null> {
  try {
    const { getAddress } = await import('@stellar/freighter-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (getAddress as () => Promise<any>)();
    const address: string | undefined = result?.address ?? result;
    return typeof address === 'string' && address ? address : null;
  } catch {
    return null;
  }
}

/** Sign a Stellar transaction XDR via Freighter. Returns signed XDR. */
export async function signTx(xdr: string, network = 'TESTNET'): Promise<string> {
  const { signTransaction } = await import('@stellar/freighter-api');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (signTransaction as (xdr: string, opts: Record<string, unknown>) => Promise<any>)(xdr, {
    network,
    networkPassphrase: network === 'TESTNET'
      ? 'Test SDF Network ; September 2015'
      : 'Public Global Stellar Network ; September 2015',
  });
  const signedXdr: string | undefined = result?.signedTxXdr ?? result;
  if (!signedXdr || typeof signedXdr !== 'string')
    throw new Error(result?.error || 'Signing failed');
  return signedXdr;
}

// ── Address display helpers ────────────────────────────────────────────────────

export function shortAddress(pk: string, head = 6, tail = 5): string {
  if (!pk || pk.length < head + tail) return pk;
  return `${pk.slice(0, head)}…${pk.slice(-tail)}`;
}

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + 48) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${h2} 72% 52%))`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
