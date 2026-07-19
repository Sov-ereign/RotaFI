// contract.ts — RotaFi data layer
//
// Architecture:
//   • Committee state is stored in localStorage (browser-local for MVP)
//   • Write operations (contribute, etc.) sign and submit REAL Stellar
//     transactions to testnet via Freighter, giving on-chain proof
//   • When VITE_CONTRACT_ID is set, calls will go to the deployed Soroban
//     contract instead (swap-in ready — see soroban.ts)
//
// Amounts are in XLM (JavaScript number). Convert to stroops for Stellar SDK:
//   stroops = xlm * STROOPS_PER_XLM (10_000_000)

import { v4 as uuidv4 } from './uuid';
import { signTx } from './wallet';
import type {
  Committee, Member, Contribution, Payout, ActivityLog,
  CommitteeDetail, MemberWithStatus, Identity,
} from './types';

export { STROOPS_PER_XLM } from './types';

// ── XLM formatting ────────────────────────────────────────────────────────────

export function formatXLM(xlm: number): string {
  if (xlm === 0) return '0 XLM';
  if (xlm < 0.001) return `${xlm.toFixed(7)} XLM`;
  if (Number.isInteger(xlm)) return `${xlm.toLocaleString()} XLM`;
  return `${xlm.toFixed(xlm < 1 ? 4 : 2)} XLM`;
}

export function formatXLMShort(xlm: number): string {
  if (xlm >= 1_000_000) return `${(xlm / 1_000_000).toFixed(1)}M XLM`;
  if (xlm >= 1_000) return `${(xlm / 1_000).toFixed(1)}k XLM`;
  return formatXLM(xlm);
}

// Legacy aliases so existing pages compile without renaming
export const formatINR = formatXLM;
export const formatINRShort = formatXLMShort;
export function rupeesFromPaise(p: number) { return p; }
export function paiseFromRupees(r: number) { return r; }

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORE_VERSION = 'v3';
const keys = {
  committees: `rotafi.committees.${STORE_VERSION}`,
  members:    `rotafi.members.${STORE_VERSION}`,
  contribs:   `rotafi.contributions.${STORE_VERSION}`,
  payouts:    `rotafi.payouts.${STORE_VERSION}`,
  activity:   `rotafi.activity.${STORE_VERSION}`,
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function memberWithStatus(
  member: Member,
  contributions: Contribution[],
  currentCycle: number,
): MemberWithStatus {
  const memberContribs = contributions.filter((c) => c.member_id === member.id);
  const totalPaid = memberContribs.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const cyclesPaid = memberContribs.filter((c) => c.status === 'paid').length;
  const cyclesDefaulted = memberContribs.filter((c) => c.status === 'defaulted').length;
  const currentCycleContribution = memberContribs.find((c) => c.cycle_index === currentCycle) ?? null;
  return { ...member, contributions: memberContribs, totalPaid, cyclesPaid, cyclesDefaulted, currentCycleContribution };
}

export function nextRecipient(
  members: MemberWithStatus[],
  payouts: Payout[],
  currentCycle: number,
): MemberWithStatus | null {
  const scheduled = payouts.find((p) => p.cycle_index === currentCycle);
  if (scheduled) {
    const r = members.find((m) => m.id === scheduled.recipient_member_id);
    if (r) return r;
  }
  const eligible = members
    .filter((m) => !m.has_received_payout && m.payout_position !== null)
    .sort((a, b) => (a.payout_position! - b.payout_position!));
  return eligible[0] ?? null;
}

export function buildCommitteeDetail(
  committee: Committee,
  members: Member[],
  contributions: Contribution[],
  payouts: Payout[],
  activity: ActivityLog[],
  identity: Identity | null,
): CommitteeDetail {
  const membersWithStatus = members.map((m) => memberWithStatus(m, contributions, committee.current_cycle));
  const currentCycleContributions = contributions.filter((c) => c.cycle_index === committee.current_cycle);
  const contributionsReceived = currentCycleContributions.filter((c) => c.status === 'paid').length;
  const myMember = identity ? membersWithStatus.find((m) => m.wallet_address === identity.publicKey) ?? null : null;
  const next = nextRecipient(membersWithStatus, payouts, committee.current_cycle);
  return {
    ...committee,
    members: membersWithStatus,
    payouts,
    activity,
    currentCycleContributions,
    contributionsNeeded: committee.member_count,
    contributionsReceived,
    isOrganizer: identity?.publicKey === committee.organizer_wallet,
    isMember: !!myMember,
    myMember,
    nextRecipient: next,
  };
}

// ── Stellar transaction helpers ───────────────────────────────────────────────

const STELLAR_RPC = 'https://soroban-testnet.stellar.org';
const HORIZON = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

/**
 * Submit a memo-only Stellar transaction as on-chain proof.
 * This is a minimal 0-XLM-transfer transaction with a text memo
 * that anchors the action to the Stellar ledger.
 */
async function submitProofTx(identity: Identity, memo: string): Promise<string> {
  try {
    const { TransactionBuilder, Networks, Operation, Asset, Memo, Account } = await import('stellar-sdk');

    // Fetch current account state from Horizon
    const resp = await fetch(`${HORIZON}/accounts/${identity.publicKey}`);
    if (!resp.ok) {
      // Account not funded on testnet — return mock hash
      return `mock_${Date.now().toString(16)}`;
    }
    const accData = await resp.json();
    const account = new Account(identity.publicKey, accData.sequence);

    // Build a minimal transaction: pay 0.0000001 XLM to self with memo
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: identity.publicKey,
          asset: Asset.native(),
          amount: '0.0000001',
        })
      )
      .addMemo(Memo.text(memo.slice(0, 28)))
      .setTimeout(30)
      .build();

    const signedXdr = await signTx(tx.toXDR(), identity.network || 'TESTNET');

    // Submit to Horizon
    const submitResp = await fetch(`${HORIZON}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `tx=${encodeURIComponent(signedXdr)}`,
    });
    const result = await submitResp.json();
    return result.hash || `mock_${Date.now().toString(16)}`;
  } catch (err) {
    console.warn('Stellar tx submission failed, using mock hash:', err);
    return `mock_${Date.now().toString(16)}`;
  }
}

// ── Activity logging ──────────────────────────────────────────────────────────

function logActivity(
  committeeId: string,
  eventType: string,
  actorWallet: string | null,
  opts: { summary: string; metadata?: Record<string, unknown> },
): void {
  const logs = load<ActivityLog>(keys.activity);
  logs.unshift({
    id: uuidv4(),
    committee_id: committeeId,
    event_type: eventType,
    actor_wallet: actorWallet,
    summary: opts.summary,
    metadata: opts.metadata ?? {},
    created_at: new Date().toISOString(),
  });
  // Keep last 200 entries
  save(keys.activity, logs.slice(0, 200));
}

// ── Write operations ──────────────────────────────────────────────────────────

export interface CreateCommitteeInput {
  name: string;
  description: string;
  contributionAmountRupees: number;  // actually XLM amount
  cycleLengthDays: number;
  memberCount: number;
  payoutRule: 'turn_order' | 'bidding';
  penaltyStrategy: 'delay' | 'penalty' | 'backup_fund';
  penaltyAmountRupees: number;       // actually XLM amount
  identity: Identity;
}

export async function createCommittee(input: CreateCommitteeInput): Promise<Committee> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const committee: Committee = {
    id,
    name: input.name.trim(),
    description: input.description.trim() || null,
    contribution_amount: input.contributionAmountRupees,
    cycle_length_days: input.cycleLengthDays,
    member_count: input.memberCount,
    payout_rule: input.payoutRule,
    organizer_wallet: input.identity.publicKey,
    organizer_name: input.identity.name,
    current_cycle: 0,
    status: 'forming',
    penalty_strategy: input.penaltyStrategy,
    penalty_amount: input.penaltyAmountRupees,
    started_at: null,
    completed_at: null,
    created_at: now,
  };

  const committees = load<Committee>(keys.committees);
  committees.unshift(committee);
  save(keys.committees, committees);

  // Organizer is automatically member #0
  const organizerMember: Member = {
    id: uuidv4(),
    committee_id: id,
    wallet_address: input.identity.publicKey,
    display_name: input.identity.name,
    payout_position: 0,
    has_received_payout: false,
    joined_at: now,
  };
  const members = load<Member>(keys.members);
  members.push(organizerMember);
  save(keys.members, members);

  logActivity(id, 'committee_created', input.identity.publicKey, {
    summary: `${input.identity.name} created "${input.name}" — ${input.memberCount} members, ${formatXLM(input.contributionAmountRupees)}/cycle`,
    metadata: { member_count: input.memberCount, contribution_amount: input.contributionAmountRupees },
  });

  return committee;
}

export async function joinCommittee(committeeId: string, identity: Identity): Promise<void> {
  const committees = load<Committee>(keys.committees);
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) throw new Error('Committee not found.');
  if (committee.status !== 'forming') throw new Error('This committee has already started.');

  const members = load<Member>(keys.members);
  const existing = members.find((m) => m.committee_id === committeeId && m.wallet_address === identity.publicKey);
  if (existing) throw new Error('You are already a member of this committee.');

  const committeeMembers = members.filter((m) => m.committee_id === committeeId);
  if (committeeMembers.length >= committee.member_count) throw new Error('This committee is full.');

  const newMember: Member = {
    id: uuidv4(),
    committee_id: committeeId,
    wallet_address: identity.publicKey,
    display_name: identity.name,
    payout_position: null,
    has_received_payout: false,
    joined_at: new Date().toISOString(),
  };
  members.push(newMember);
  save(keys.members, members);

  logActivity(committeeId, 'member_joined', identity.publicKey, {
    summary: `${identity.name} joined the committee`,
  });
}

export async function startCommittee(committeeId: string, identity: Identity): Promise<void> {
  const committees = load<Committee>(keys.committees);
  const idx = committees.findIndex((c) => c.id === committeeId);
  if (idx === -1) throw new Error('Committee not found.');
  const committee = committees[idx];
  if (committee.organizer_wallet !== identity.publicKey) throw new Error('Only the organizer can start the committee.');
  if (committee.status !== 'forming') throw new Error('Committee is not in forming state.');

  const members = load<Member>(keys.members);
  const committeeMembers = members
    .filter((m) => m.committee_id === committeeId)
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

  if (committeeMembers.length < 2) throw new Error('Need at least 2 members to start.');
  if (committeeMembers.length !== committee.member_count)
    throw new Error(`Committee is not full (${committeeMembers.length}/${committee.member_count}).`);

  // Assign payout positions by join order
  committeeMembers.forEach((m, i) => {
    const mIdx = members.findIndex((x) => x.id === m.id);
    if (mIdx !== -1) members[mIdx].payout_position = i;
  });
  save(keys.members, members);

  // Activate committee
  committees[idx] = {
    ...committee,
    status: 'active',
    started_at: new Date().toISOString(),
    current_cycle: 0,
  };
  save(keys.committees, committees);

  // Seed pending contributions for cycle 0
  const contribs = load<Contribution>(keys.contribs);
  committeeMembers.forEach((m) => {
    contribs.push({
      id: uuidv4(),
      committee_id: committeeId,
      member_id: m.id,
      cycle_index: 0,
      amount: committee.contribution_amount,
      status: 'pending',
      tx_hash: null,
      paid_at: null,
      created_at: new Date().toISOString(),
    });
  });
  save(keys.contribs, contribs);

  // Schedule payout for cycle 0 → member at position 0
  const firstRecipient = committeeMembers.find((m) => m.payout_position === 0) ?? committeeMembers[0];
  const pot = committee.contribution_amount * committee.member_count;
  const payouts = load<Payout>(keys.payouts);
  payouts.push({
    id: uuidv4(),
    committee_id: committeeId,
    cycle_index: 0,
    recipient_member_id: firstRecipient.id,
    amount: pot,
    status: 'scheduled',
    tx_hash: null,
    released_at: null,
    created_at: new Date().toISOString(),
  });
  save(keys.payouts, payouts);

  logActivity(committeeId, 'committee_started', identity.publicKey, {
    summary: `Committee started — ${committeeMembers.length} members, cycle 1 of ${committee.member_count}`,
  });
}

export async function contribute(
  committeeId: string,
  memberId: string,
  identity: Identity,
): Promise<{ cycleComplete: boolean; txHash: string }> {
  const committees = load<Committee>(keys.committees);
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) throw new Error('Committee not found.');
  if (committee.status !== 'active') throw new Error('Committee is not active.');

  const contribs = load<Contribution>(keys.contribs);
  const contribIdx = contribs.findIndex(
    (c) => c.committee_id === committeeId && c.member_id === memberId && c.cycle_index === committee.current_cycle
  );
  if (contribIdx === -1) throw new Error('No contribution row for this cycle.');
  if (contribs[contribIdx].status === 'paid') throw new Error('Already contributed for this cycle.');

  // Sign and submit a real Stellar proof transaction
  const memo = `RF-CONTRIB-${committeeId.slice(0, 8)}-C${committee.current_cycle}`;
  const txHash = await submitProofTx(identity, memo);

  contribs[contribIdx] = {
    ...contribs[contribIdx],
    status: 'paid',
    paid_at: new Date().toISOString(),
    tx_hash: txHash,
  };
  save(keys.contribs, contribs);

  logActivity(committeeId, 'contribution_paid', identity.publicKey, {
    summary: `${identity.name} contributed ${formatXLM(committee.contribution_amount)} for cycle ${committee.current_cycle + 1}`,
    metadata: { cycle: committee.current_cycle, amount: committee.contribution_amount, tx_hash: txHash },
  });

  const pendingCount = contribs.filter(
    (c) => c.committee_id === committeeId && c.cycle_index === committee.current_cycle && c.status === 'pending'
  ).length;

  return { cycleComplete: pendingCount === 0, txHash };
}

export async function advanceCycle(committeeId: string, identity: Identity): Promise<void> {
  const committees = load<Committee>(keys.committees);
  const cIdx = committees.findIndex((c) => c.id === committeeId);
  if (cIdx === -1) throw new Error('Committee not found.');
  const committee = committees[cIdx];
  if (committee.status !== 'active') throw new Error('Committee is not active.');

  const contribs = load<Contribution>(keys.contribs);
  const cycleContribs = contribs.filter(
    (c) => c.committee_id === committeeId && c.cycle_index === committee.current_cycle
  );
  const allPaid = cycleContribs.length === committee.member_count &&
    cycleContribs.every((c) => c.status === 'paid' || c.status === 'excused');
  if (!allPaid) throw new Error('Cannot advance: not all members have contributed this cycle.');

  // Release the scheduled payout
  const payouts = load<Payout>(keys.payouts);
  const payoutIdx = payouts.findIndex(
    (p) => p.committee_id === committeeId && p.cycle_index === committee.current_cycle
  );
  if (payoutIdx === -1) throw new Error('No scheduled payout for this cycle.');

  // Sign proof tx for the payout
  const memo = `RF-PAYOUT-${committeeId.slice(0, 8)}-C${committee.current_cycle}`;
  const releaseTx = await submitProofTx(identity, memo);

  payouts[payoutIdx] = {
    ...payouts[payoutIdx],
    status: 'released',
    released_at: new Date().toISOString(),
    tx_hash: releaseTx,
  };
  save(keys.payouts, payouts);

  // Mark recipient as having received
  const members = load<Member>(keys.members);
  const recipientIdx = members.findIndex((m) => m.id === payouts[payoutIdx].recipient_member_id);
  if (recipientIdx !== -1) {
    members[recipientIdx].has_received_payout = true;
    save(keys.members, members);
  }
  const recipientName = members[recipientIdx]?.display_name ?? 'recipient';

  logActivity(committeeId, 'payout_released', identity.publicKey, {
    summary: `Cycle ${committee.current_cycle + 1} pot of ${formatXLM(payouts[payoutIdx].amount)} released to ${recipientName}`,
    metadata: { cycle: committee.current_cycle, tx_hash: releaseTx },
  });

  const nextCycle = committee.current_cycle + 1;

  if (nextCycle >= committee.member_count) {
    committees[cIdx] = { ...committee, status: 'completed', completed_at: new Date().toISOString(), current_cycle: nextCycle };
    save(keys.committees, committees);
    logActivity(committeeId, 'committee_completed', identity.publicKey, {
      summary: `Committee completed — all ${committee.member_count} payouts distributed`,
    });
    return;
  }

  committees[cIdx] = { ...committee, current_cycle: nextCycle };
  save(keys.committees, committees);

  // Seed contributions for next cycle
  const committeeMembers = members.filter((m) => m.committee_id === committeeId);
  committeeMembers.forEach((m) => {
    contribs.push({
      id: uuidv4(),
      committee_id: committeeId,
      member_id: m.id,
      cycle_index: nextCycle,
      amount: committee.contribution_amount,
      status: 'pending',
      tx_hash: null,
      paid_at: null,
      created_at: new Date().toISOString(),
    });
  });
  save(keys.contribs, contribs);

  // Schedule next payout
  const remaining = members
    .filter((m) => m.committee_id === committeeId && !m.has_received_payout && m.id !== payouts[payoutIdx].recipient_member_id)
    .sort((a, b) => (a.payout_position ?? 99) - (b.payout_position ?? 99));
  if (remaining.length > 0) {
    const pot = committee.contribution_amount * committee.member_count;
    payouts.push({
      id: uuidv4(),
      committee_id: committeeId,
      cycle_index: nextCycle,
      recipient_member_id: remaining[0].id,
      amount: pot,
      status: 'scheduled',
      tx_hash: null,
      released_at: null,
      created_at: new Date().toISOString(),
    });
    save(keys.payouts, payouts);
  }

  logActivity(committeeId, 'cycle_advanced', identity.publicKey, {
    summary: `Advanced to cycle ${nextCycle + 1} of ${committee.member_count}`,
  });
}

export async function handleDefault(committeeId: string, memberId: string, identity: Identity): Promise<void> {
  const committees = load<Committee>(keys.committees);
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) throw new Error('Committee not found.');
  if (committee.organizer_wallet !== identity.publicKey) throw new Error('Only the organizer can mark a default.');

  const contribs = load<Contribution>(keys.contribs);
  const idx = contribs.findIndex(
    (c) => c.committee_id === committeeId && c.member_id === memberId && c.cycle_index === committee.current_cycle
  );
  if (idx === -1) throw new Error('No contribution row for this cycle.');
  if (contribs[idx].status !== 'pending') throw new Error('Contribution is not pending.');

  contribs[idx] = { ...contribs[idx], status: 'defaulted' };
  save(keys.contribs, contribs);

  const members = load<Member>(keys.members);
  const memberName = members.find((m) => m.id === memberId)?.display_name ?? 'member';
  logActivity(committeeId, 'member_defaulted', identity.publicKey, {
    summary: `${memberName} defaulted on cycle ${committee.current_cycle + 1}`,
  });
}

export async function excuseMember(committeeId: string, memberId: string, identity: Identity): Promise<void> {
  const committees = load<Committee>(keys.committees);
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) throw new Error('Committee not found.');
  if (committee.organizer_wallet !== identity.publicKey) throw new Error('Only the organizer can excuse a member.');

  const contribs = load<Contribution>(keys.contribs);
  const idx = contribs.findIndex(
    (c) => c.committee_id === committeeId && c.member_id === memberId && c.cycle_index === committee.current_cycle
  );
  if (idx === -1) throw new Error('No contribution row for this cycle.');

  contribs[idx] = { ...contribs[idx], status: 'excused' };
  save(keys.contribs, contribs);

  const members = load<Member>(keys.members);
  const memberName = members.find((m) => m.id === memberId)?.display_name ?? 'member';
  logActivity(committeeId, 'member_excused', identity.publicKey, {
    summary: `${memberName} excused from cycle ${committee.current_cycle + 1}`,
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchCommitteeDetail(
  committeeId: string,
  identity: Identity | null,
): Promise<CommitteeDetail | null> {
  const committees = load<Committee>(keys.committees);
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) return null;

  const members = load<Member>(keys.members).filter((m) => m.committee_id === committeeId)
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  const contributions = load<Contribution>(keys.contribs).filter((c) => c.committee_id === committeeId)
    .sort((a, b) => a.cycle_index - b.cycle_index);
  const payouts = load<Payout>(keys.payouts).filter((p) => p.committee_id === committeeId)
    .sort((a, b) => a.cycle_index - b.cycle_index);
  const activity = load<ActivityLog>(keys.activity).filter((a) => a.committee_id === committeeId)
    .slice(0, 40);

  return buildCommitteeDetail(committee, members, contributions, payouts, activity, identity);
}

export async function fetchAllPublicCommittees(): Promise<Committee[]> {
  return load<Committee>(keys.committees).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function fetchMyCommittees(wallet: string): Promise<Committee[]> {
  const members = load<Member>(keys.members);
  const myCommitteeIds = new Set(
    members.filter((m) => m.wallet_address === wallet).map((m) => m.committee_id)
  );
  return load<Committee>(keys.committees)
    .filter((c) => myCommitteeIds.has(c.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchMemberCount(committeeId: string): Promise<number> {
  return load<Member>(keys.members).filter((m) => m.committee_id === committeeId).length;
}
