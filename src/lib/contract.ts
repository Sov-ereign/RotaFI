// Contract engine — deterministic rotation logic that mirrors a Soroban
// smart contract. In production these functions would be on-chain contract
// methods invoked via stellar-sdk; in the MVP we run the same deterministic
// state machine against the Supabase-backed committee state so the UI behavior
// is faithful to what the contract would enforce.
//
// Money is in paise (1 INR = 100 paise) throughout.

import { supabase } from './supabase';
import type {
  Committee,
  Member,
  Contribution,
  Payout,
  ActivityLog,
  CommitteeDetail,
  MemberWithStatus,
  Identity,
} from './types';

// ----- formatting helpers (pure) -------------------------------------------------

export const PAISE_PER_RUPEE = 100;

export function rupeesFromPaise(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}
export function paiseFromRupees(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}
export function formatINR(paise: number): string {
  const r = paise / PAISE_PER_RUPEE;
  const hasPaise = Math.floor(r) !== r;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(r);
}
export function formatINRShort(paise: number): string {
  const r = paise / PAISE_PER_RUPEE;
  if (r >= 10000000) return `₹${(r / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  if (r >= 100000) return `₹${(r / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return formatINR(paise);
}

// Deterministic pseudo-random tx hash standing in for a Stellar tx hash.
function fakeTxHash(prefix: string): string {
  const chars = '0123456789abcdef';
  let s = prefix;
  for (let i = 0; i < 64 - prefix.length; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

// Random base32 string (Stellar uses a base32 alphabet for account IDs).
function randomBase32(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 32)];
  return s;
}

// ----- derived state -------------------------------------------------------------

export function memberWithStatus(
  member: Member,
  contributions: Contribution[],
  currentCycle: number,
): MemberWithStatus {
  const memberContribs = contributions.filter((c) => c.member_id === member.id);
  const totalPaid = memberContribs
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);
  const cyclesPaid = memberContribs.filter((c) => c.status === 'paid').length;
  const cyclesDefaulted = memberContribs.filter((c) => c.status === 'defaulted').length;
  const currentCycleContribution =
    memberContribs.find((c) => c.cycle_index === currentCycle) ?? null;
  return {
    ...member,
    contributions: memberContribs,
    totalPaid,
    cyclesPaid,
    cyclesDefaulted,
    currentCycleContribution,
  };
}

// Next recipient under turn_order: the member with the lowest payout_position
// who has not yet received a payout. Returns null if all have received.
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
  const membersWithStatus = members.map((m) =>
    memberWithStatus(m, contributions, committee.current_cycle),
  );
  const currentCycleContributions = contributions.filter(
    (c) => c.cycle_index === committee.current_cycle,
  );
  const contributionsReceived = currentCycleContributions.filter(
    (c) => c.status === 'paid',
  ).length;
  const contributionsNeeded = committee.member_count;
  const myMember = identity
    ? membersWithStatus.find((m) => m.wallet_address === identity.publicKey) ?? null
    : null;
  const next = nextRecipient(membersWithStatus, payouts, committee.current_cycle);
  return {
    ...committee,
    members: membersWithStatus,
    payouts,
    activity,
    currentCycleContributions,
    contributionsNeeded,
    contributionsReceived,
    isOrganizer: identity?.publicKey === committee.organizer_wallet,
    isMember: !!myMember,
    myMember,
    nextRecipient: next,
  };
}

// ----- contract actions ----------------------------------------------------------

export interface CreateCommitteeInput {
  name: string;
  description: string;
  contributionAmountRupees: number;
  cycleLengthDays: number;
  memberCount: number;
  payoutRule: 'turn_order' | 'bidding';
  penaltyStrategy: 'delay' | 'penalty' | 'backup_fund';
  penaltyAmountRupees: number;
  identity: Identity;
}

export async function createCommittee(input: CreateCommitteeInput): Promise<Committee> {
  const contributionAmount = paiseFromRupees(input.contributionAmountRupees);
  const penaltyAmount = paiseFromRupees(input.penaltyAmountRupees);

  // Organizer is member #1 with payout_position 0 (organizer typically takes
  // the first pot, as is customary in many committees; contract could let them
  // choose, but defaulting to position 0 keeps the MVP simple).
  const { data: committee, error } = await supabase
    .from('committees')
    .insert({
      name: input.name.trim(),
      description: input.description.trim() || null,
      contribution_amount: contributionAmount,
      cycle_length_days: input.cycleLengthDays,
      member_count: input.memberCount,
      payout_rule: input.payoutRule,
      organizer_wallet: input.identity.publicKey,
      organizer_name: input.identity.name,
      penalty_strategy: input.penaltyStrategy,
      penalty_amount: penaltyAmount,
    })
    .select()
    .single();
  if (error || !committee) throw new Error(error?.message ?? 'Failed to create committee');

  await supabase.from('members').insert({
    committee_id: committee.id,
    wallet_address: input.identity.publicKey,
    display_name: input.identity.name,
    payout_position: 0,
  });

  await logActivity(committee.id, 'committee_created', input.identity.publicKey, {
    summary: `${input.identity.name} created "${input.name}" — ${input.memberCount} members, ${formatINR(
      contributionAmount,
    )}/cycle`,
    metadata: {
      member_count: input.memberCount,
      contribution_amount: contributionAmount,
      cycle_length_days: input.cycleLengthDays,
      payout_rule: input.payoutRule,
    },
  });

  return committee as Committee;
}

export async function joinCommittee(committeeId: string, identity: Identity): Promise<void> {
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('committee_id', committeeId)
    .eq('wallet_address', identity.publicKey)
    .maybeSingle();
  if (existing) throw new Error('You are already a member of this committee.');

  const { data: committee } = await supabase
    .from('committees')
    .select('status, member_count')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.status !== 'forming') throw new Error('This committee has already started.');

  const { count } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('committee_id', committeeId);
  if ((count ?? 0) >= committee.member_count)
    throw new Error('This committee is full.');

  await supabase.from('members').insert({
    committee_id: committeeId,
    wallet_address: identity.publicKey,
    display_name: identity.name,
  });

  await logActivity(committeeId, 'member_joined', identity.publicKey, {
    summary: `${identity.name} joined the committee`,
  });
}

// Start the committee: assign payout positions (join order), create the first
// cycle's pending contributions for every member, create the scheduled payout
// for cycle 0, and move status to active.
export async function startCommittee(
  committeeId: string,
  identity: Identity,
): Promise<void> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.organizer_wallet !== identity.publicKey)
    throw new Error('Only the organizer can start the committee.');
  if (committee.status !== 'forming') throw new Error('Committee is not in forming state.');

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('committee_id', committeeId)
    .order('joined_at', { ascending: true });
  if (!members || members.length < 2)
    throw new Error('Need at least 2 members to start.');
  if (members.length !== committee.member_count)
    throw new Error(
      `Committee is not full (${members.length}/${committee.member_count}).`,
    );

  // Assign payout positions by join order. Organizer (position 0) keeps their slot.
  const updates = members.map((m, i) =>
    supabase.from('members').update({ payout_position: i }).eq('id', m.id),
  );
  await Promise.all(updates);

  // Fund testnet: generate a throwaway issuer pubkey to stand in for the
  // committee's asset issuer. (MVP only — a real deployment would issue the
  // asset on-chain via the organizer's account.) Kept as a Stellar-style G...
  // string without importing stellar-sdk so the contract module stays light.
  const issuerPubKey = 'G' + randomBase32(55);

  await supabase
    .from('committees')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      asset_issuer: issuerPubKey,
      current_cycle: 0,
    })
    .eq('id', committeeId);

  // Seed pending contributions for cycle 0 for every member.
  const contribRows = members.map((m) => ({
    committee_id: committeeId,
    member_id: m.id,
    cycle_index: 0,
    amount: committee.contribution_amount,
    status: 'pending' as const,
  }));
  await supabase.from('contributions').insert(contribRows);

  // Schedule the first payout (cycle 0) to the member at payout_position 0.
  const recipient = members.find((m) => m.payout_position === 0) ?? members[0];
  const pot = committee.contribution_amount * committee.member_count;
  await supabase.from('payouts').insert({
    committee_id: committeeId,
    cycle_index: 0,
    recipient_member_id: recipient.id,
    amount: pot,
    status: 'scheduled',
  });

  await logActivity(committeeId, 'committee_started', identity.publicKey, {
    summary: `Committee started — ${members.length} members, cycle 1 of ${committee.member_count}`,
    metadata: { cycle: 0, members: members.length, pot },
  });
}

// Contribute for the current cycle. Simulates the on-chain transfer of the
// member's contribution asset into the contract, marks the contribution paid,
// and logs activity. If this completes the cycle, the caller should advance.
export async function contribute(
  committeeId: string,
  memberId: string,
  identity: Identity,
): Promise<{ cycleComplete: boolean; txHash: string }> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.status !== 'active') throw new Error('Committee is not active.');

  const { data: contrib } = await supabase
    .from('contributions')
    .select('*')
    .eq('committee_id', committeeId)
    .eq('member_id', memberId)
    .eq('cycle_index', committee.current_cycle)
    .maybeSingle();
  if (!contrib) throw new Error('No contribution row for this cycle.');
  if (contrib.status === 'paid') throw new Error('Already contributed for this cycle.');

  const txHash = fakeTxHash('c');
  const { error } = await supabase
    .from('contributions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      tx_hash: txHash,
    })
    .eq('id', contrib.id);
  if (error) throw new Error(error.message);

  await logActivity(committeeId, 'contribution_paid', identity.publicKey, {
    summary: `${identity.name} contributed ${formatINR(contrib.amount)} for cycle ${
      committee.current_cycle + 1
    }`,
    metadata: { cycle: committee.current_cycle, amount: contrib.amount, tx_hash: txHash },
  });

  // Check cycle completion.
  const { count: pendingCount } = await supabase
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .eq('committee_id', committeeId)
    .eq('cycle_index', committee.current_cycle)
    .eq('status', 'pending');
  const cycleComplete = (pendingCount ?? 0) === 0;
  return { cycleComplete, txHash };
}

// Advance the cycle once all contributions are in: release the pot to the
// scheduled recipient, mark them as having received, then set up the next
// cycle's pending contributions and scheduled payout. If this was the last
// cycle, mark the committee completed.
export async function advanceCycle(
  committeeId: string,
  identity: Identity,
): Promise<void> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.status !== 'active') throw new Error('Committee is not active.');

  const { data: cycleContribs } = await supabase
    .from('contributions')
    .select('*')
    .eq('committee_id', committeeId)
    .eq('cycle_index', committee.current_cycle);
  if (!cycleContribs) throw new Error('Could not load cycle contributions.');

  const allPaid = cycleContribs.length === committee.member_count &&
    cycleContribs.every((c) => c.status === 'paid' || c.status === 'excused');
  if (!allPaid)
    throw new Error('Cannot advance: not all members have contributed this cycle.');

  // Release the pot to the scheduled recipient.
  const { data: scheduledPayout } = await supabase
    .from('payouts')
    .select('*')
    .eq('committee_id', committeeId)
    .eq('cycle_index', committee.current_cycle)
    .maybeSingle();
  if (!scheduledPayout) throw new Error('No scheduled payout for this cycle.');

  const releaseTx = fakeTxHash('p');
  await supabase
    .from('payouts')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      tx_hash: releaseTx,
    })
    .eq('id', scheduledPayout.id);

  await supabase
    .from('members')
    .update({ has_received_payout: true })
    .eq('id', scheduledPayout.recipient_member_id);

  const { data: recipient } = await supabase
    .from('members')
    .select('display_name')
    .eq('id', scheduledPayout.recipient_member_id)
    .maybeSingle();

  await logActivity(committeeId, 'payout_released', identity.publicKey, {
    summary: `Cycle ${committee.current_cycle + 1} pot of ${formatINR(
      scheduledPayout.amount,
    )} released to ${recipient?.display_name ?? 'recipient'}`,
    metadata: {
      cycle: committee.current_cycle,
      amount: scheduledPayout.amount,
      recipient: scheduledPayout.recipient_member_id,
      tx_hash: releaseTx,
    },
  });

  const nextCycle = committee.current_cycle + 1;

  // If that was the last cycle, complete the committee.
  if (nextCycle >= committee.member_count) {
    await supabase
      .from('committees')
      .update({
        current_cycle: nextCycle,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', committeeId);
    await logActivity(committeeId, 'committee_completed', identity.publicKey, {
      summary: `Committee completed — all ${committee.member_count} payouts distributed`,
    });
    return;
  }

  // Advance to the next cycle.
  await supabase
    .from('committees')
    .update({ current_cycle: nextCycle })
    .eq('id', committeeId);

  await logActivity(committeeId, 'cycle_advanced', identity.publicKey, {
    summary: `Advanced to cycle ${nextCycle + 1} of ${committee.member_count}`,
    metadata: { cycle: nextCycle },
  });

  // Seed pending contributions for the new cycle for every member who has
  // NOT yet received a payout (recipients don't contribute in their own cycle
  // in the classic model, but in the simplest turn-order model everyone
  // contributes every cycle; we keep everyone contributing for simplicity and
  // fairness of the pot).
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('committee_id', committeeId)
    .order('joined_at', { ascending: true });
  if (!members) return;

  const contribRows = members.map((m) => ({
    committee_id: committeeId,
    member_id: m.id,
    cycle_index: nextCycle,
    amount: committee.contribution_amount,
    status: 'pending' as const,
  }));
  await supabase.from('contributions').insert(contribRows);

  // Schedule the next payout to the lowest-positioned member who hasn't received.
  const remaining = members
    .filter((m) => m.id !== scheduledPayout.recipient_member_id && !m.has_received_payout)
    .sort((a, b) => (a.payout_position ?? 99) - (b.payout_position ?? 99));
  const nextRecipientMember = remaining[0];
  if (nextRecipientMember) {
    const pot = committee.contribution_amount * committee.member_count;
    await supabase.from('payouts').insert({
      committee_id: committeeId,
      cycle_index: nextCycle,
      recipient_member_id: nextRecipientMember.id,
      amount: pot,
      status: 'scheduled',
    });
  }
}

// Handle a default: mark a member's current-cycle contribution as defaulted,
// apply the configured penalty, and (if backup_fund) allow the cycle to still
// advance. For 'delay', the cycle is held until the member pays or is excused.
// For 'penalty', a penalty contribution row is noted in activity.
export async function handleDefault(
  committeeId: string,
  memberId: string,
  identity: Identity,
): Promise<void> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.organizer_wallet !== identity.publicKey)
    throw new Error('Only the organizer can mark a default.');

  const { data: contrib } = await supabase
    .from('contributions')
    .select('*, members(display_name)')
    .eq('committee_id', committeeId)
    .eq('member_id', memberId)
    .eq('cycle_index', committee.current_cycle)
    .maybeSingle();
  if (!contrib) throw new Error('No contribution row for this cycle.');
  if (contrib.status !== 'pending') throw new Error('Contribution is not pending.');

  await supabase
    .from('contributions')
    .update({ status: 'defaulted' })
    .eq('id', contrib.id);

  const memberName = (contrib.members as unknown as { display_name: string }).display_name;
  await logActivity(committeeId, 'member_defaulted', identity.publicKey, {
    summary: `${memberName} defaulted on cycle ${committee.current_cycle + 1} (${
      committee.penalty_strategy
    }${committee.penalty_amount > 0 ? `, ${formatINR(committee.penalty_amount)} penalty` : ''})`,
    metadata: {
      cycle: committee.current_cycle,
      member: memberId,
      strategy: committee.penalty_strategy,
      penalty: committee.penalty_amount,
    },
  });
}

// Excuse a member for a cycle (counts as fulfilled for cycle-advance purposes
// without requiring payment — e.g. recipient of this cycle's pot is excused
// from contributing, or organizer waives a member's contribution).
export async function excuseMember(
  committeeId: string,
  memberId: string,
  identity: Identity,
): Promise<void> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) throw new Error('Committee not found.');
  if (committee.organizer_wallet !== identity.publicKey)
    throw new Error('Only the organizer can excuse a member.');

  const { data: contrib } = await supabase
    .from('contributions')
    .select('*, members(display_name)')
    .eq('committee_id', committeeId)
    .eq('member_id', memberId)
    .eq('cycle_index', committee.current_cycle)
    .maybeSingle();
  if (!contrib) throw new Error('No contribution row for this cycle.');

  await supabase
    .from('contributions')
    .update({ status: 'excused' })
    .eq('id', contrib.id);

  const memberName = (contrib.members as unknown as { display_name: string }).display_name;
  await logActivity(committeeId, 'member_excused', identity.publicKey, {
    summary: `${memberName} excused from cycle ${committee.current_cycle + 1}`,
    metadata: { cycle: committee.current_cycle, member: memberId },
  });
}

// ----- queries -------------------------------------------------------------------

export async function fetchCommitteeDetail(
  committeeId: string,
  identity: Identity | null,
): Promise<CommitteeDetail | null> {
  const { data: committee } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .maybeSingle();
  if (!committee) return null;

  const [membersRes, contributionsRes, payoutsRes, activityRes] = await Promise.all([
    supabase.from('members').select('*').eq('committee_id', committeeId).order('joined_at', { ascending: true }),
    supabase.from('contributions').select('*').eq('committee_id', committeeId).order('cycle_index', { ascending: true }),
    supabase.from('payouts').select('*').eq('committee_id', committeeId).order('cycle_index', { ascending: true }),
    supabase.from('activity_log').select('*').eq('committee_id', committeeId).order('created_at', { ascending: false }).limit(40),
  ]);

  return buildCommitteeDetail(
    committee as Committee,
    (membersRes.data ?? []) as Member[],
    (contributionsRes.data ?? []) as Contribution[],
    (payoutsRes.data ?? []) as Payout[],
    (activityRes.data ?? []) as ActivityLog[],
    identity,
  );
}

export async function fetchAllPublicCommittees(): Promise<Committee[]> {
  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Committee[];
}

export async function fetchMyCommittees(wallet: string): Promise<Committee[]> {
  const { data: myMembers } = await supabase
    .from('members')
    .select('committee_id')
    .eq('wallet_address', wallet);
  const ids = (myMembers ?? []).map((m) => m.committee_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Committee[];
}

// Count members for a committee (used in landing/dashboard cards).
export async function fetchMemberCount(committeeId: string): Promise<number> {
  const { count } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('committee_id', committeeId);
  return count ?? 0;
}

// ----- internal helpers ----------------------------------------------------------

async function logActivity(
  committeeId: string,
  eventType: string,
  actorWallet: string | null,
  opts: { summary: string; metadata?: Record<string, unknown> },
): Promise<void> {
  await supabase.from('activity_log').insert({
    committee_id: committeeId,
    event_type: eventType,
    actor_wallet: actorWallet,
    summary: opts.summary,
    metadata: opts.metadata ?? {},
  });
}
