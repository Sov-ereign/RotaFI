// Shared domain types for the RotaFi platform.
// Amounts are in XLM (as JavaScript number, e.g. 5.0 = 5 XLM).
// When interacting with Soroban, multiply by STROOPS_PER_XLM.

export const STROOPS_PER_XLM = 10_000_000;

export type PayoutRule = 'turn_order' | 'bidding';
export type CommitteeStatus = 'forming' | 'active' | 'completed' | 'cancelled';
export type ContributionStatus = 'pending' | 'paid' | 'defaulted' | 'excused';
export type PayoutStatus = 'scheduled' | 'released' | 'forfeited';
export type PenaltyStrategy = 'delay' | 'penalty' | 'backup_fund';

export interface Committee {
  id: string;
  name: string;
  description: string | null;
  /** Contribution amount in XLM (e.g. 5.0 = 5 XLM) */
  contribution_amount: number;
  cycle_length_days: number;
  member_count: number;
  payout_rule: PayoutRule;
  organizer_wallet: string;
  organizer_name: string;
  current_cycle: number;
  status: CommitteeStatus;
  penalty_strategy: PenaltyStrategy;
  penalty_amount: number; // XLM
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  committee_id: string;
  wallet_address: string;
  display_name: string;
  payout_position: number | null;
  has_received_payout: boolean;
  joined_at: string;
}

export interface Contribution {
  id: string;
  committee_id: string;
  member_id: string;
  cycle_index: number;
  /** Amount in XLM */
  amount: number;
  status: ContributionStatus;
  tx_hash: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  committee_id: string;
  cycle_index: number;
  recipient_member_id: string;
  /** Amount in XLM */
  amount: number;
  status: PayoutStatus;
  tx_hash: string | null;
  released_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  committee_id: string;
  event_type: string;
  actor_wallet: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Joined / derived shapes used by the UI.
export interface MemberWithStatus extends Member {
  contributions: Contribution[];
  totalPaid: number;
  cyclesPaid: number;
  cyclesDefaulted: number;
  currentCycleContribution: Contribution | null;
}

export interface CommitteeDetail extends Committee {
  members: MemberWithStatus[];
  payouts: Payout[];
  activity: ActivityLog[];
  currentCycleContributions: Contribution[];
  contributionsNeeded: number;
  contributionsReceived: number;
  isOrganizer: boolean;
  isMember: boolean;
  myMember: MemberWithStatus | null;
  nextRecipient: MemberWithStatus | null;
}

export interface Identity {
  name: string;
  publicKey: string;
  /** Network the wallet is connected to */
  network: string;
  createdAt: string;
}
