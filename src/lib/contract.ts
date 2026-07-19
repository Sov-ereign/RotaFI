// contract.ts — RotaFi data layer (MongoDB via Express API)
// All write operations also sign a real Stellar proof TX via Freighter when possible.

import { apiGet, apiPost, getStoredToken } from './api';
import { signTx } from './wallet';
import type {
  Committee, CommitteeDetail, Identity,
} from './types';

// ── XLM formatting ─────────────────────────────────────────────────────────────

export function formatXLM(xlm: number): string {
  if (xlm === 0) return '0 XLM';
  if (Number.isInteger(xlm)) return `${xlm.toLocaleString()} XLM`;
  return `${xlm.toFixed(2)} XLM`;
}
export function formatXLMShort(xlm: number): string {
  if (xlm >= 1_000_000) return `${(xlm / 1_000_000).toFixed(1)}M XLM`;
  if (xlm >= 1_000) return `${(xlm / 1_000).toFixed(1)}k XLM`;
  return formatXLM(xlm);
}
// Legacy aliases used by existing pages
export const formatINR = formatXLM;
export const formatINRShort = formatXLMShort;
export function rupeesFromPaise(p: number) { return p; }
export function paiseFromRupees(r: number) { return r; }

// ── Stellar proof TX ───────────────────────────────────────────────────────────

const HORIZON = 'https://horizon-testnet.stellar.org';

async function submitProofTx(identity: Identity, memo: string): Promise<string> {
  if (!identity.publicKey) return `no_wallet_${Date.now()}`;
  try {
    const { TransactionBuilder, Networks, Operation, Asset, Memo, Account } = await import('stellar-sdk');
    const resp = await fetch(`${HORIZON}/accounts/${identity.publicKey}`);
    if (!resp.ok) return `unfunded_${Date.now()}`;
    const accData = await resp.json();
    const account = new Account(identity.publicKey, accData.sequence);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination: identity.publicKey, asset: Asset.native(), amount: '0.0000001' }))
      .addMemo(Memo.text(memo.slice(0, 28)))
      .setTimeout(30)
      .build();
    const signedXdr = await signTx(tx.toXDR(), identity.network || 'TESTNET');
    const submitResp = await fetch(`${HORIZON}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `tx=${encodeURIComponent(signedXdr)}`,
    });
    const result = await submitResp.json();
    return result.hash || `submitted_${Date.now()}`;
  } catch (err) {
    console.warn('Proof TX failed:', err);
    return `mock_${Date.now().toString(16)}`;
  }
}

// ── Write operations ───────────────────────────────────────────────────────────

export interface CreateCommitteeInput {
  name: string;
  description: string;
  contributionAmountRupees: number;  // actually XLM amount
  cycleLengthDays: number;
  memberCount: number;
  payoutRule: 'turn_order' | 'bidding';
  penaltyStrategy: 'delay' | 'penalty' | 'backup_fund';
  penaltyAmountRupees: number;
  identity: Identity;
}

export async function createCommittee(input: CreateCommitteeInput): Promise<Committee> {
  return apiPost<Committee>('/committees', {
    name: input.name,
    description: input.description,
    contributionAmountXLM: input.contributionAmountRupees,
    cycleLengthDays: input.cycleLengthDays,
    memberCount: input.memberCount,
    payoutRule: input.payoutRule,
    penaltyStrategy: input.penaltyStrategy,
    penaltyAmountXLM: input.penaltyAmountRupees,
  });
}

export async function joinCommittee(committeeId: string, _identity: Identity): Promise<void> {
  await apiPost(`/committees/${committeeId}/join`);
}

export async function startCommittee(committeeId: string, _identity: Identity): Promise<void> {
  await apiPost(`/committees/${committeeId}/start`);
}

export async function contribute(
  committeeId: string,
  _memberId: string,
  identity: Identity,
): Promise<{ cycleComplete: boolean; txHash: string }> {
  const memo = `RF-CONTRIB-${committeeId.slice(0, 8)}`;
  const txHash = await submitProofTx(identity, memo);
  return apiPost<{ cycleComplete: boolean; txHash: string }>(`/committees/${committeeId}/contribute`, { txHash });
}

export async function advanceCycle(committeeId: string, identity: Identity): Promise<void> {
  const memo = `RF-PAYOUT-${committeeId.slice(0, 8)}`;
  const txHash = await submitProofTx(identity, memo);
  await apiPost(`/committees/${committeeId}/advance`, { txHash });
}

export async function handleDefault(committeeId: string, memberId: string, _identity: Identity): Promise<void> {
  await apiPost(`/committees/${committeeId}/default/${memberId}`);
}

export async function excuseMember(committeeId: string, memberId: string, _identity: Identity): Promise<void> {
  await apiPost(`/committees/${committeeId}/excuse/${memberId}`);
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function fetchCommitteeDetail(
  committeeId: string,
  _identity: Identity | null,
): Promise<CommitteeDetail | null> {
  try {
    return await apiGet<CommitteeDetail>(`/committees/${committeeId}`);
  } catch {
    return null;
  }
}

export async function fetchAllPublicCommittees(): Promise<Committee[]> {
  return apiGet<Committee[]>('/committees');
}

export async function fetchMyCommittees(_wallet: string): Promise<Committee[]> {
  const token = getStoredToken();
  if (!token) return [];
  return apiGet<Committee[]>('/users/my-committees');
}

export async function fetchMemberCount(committeeId: string): Promise<number> {
  try {
    const c = await apiGet<Committee & { current_member_count?: number }>(`/committees/${committeeId}`);
    return c.current_member_count ?? 0;
  } catch {
    return 0;
  }
}

export { STROOPS_PER_XLM } from './types';
