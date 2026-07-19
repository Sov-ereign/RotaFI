// Shared domain types for the RotaFi platform.
// Amounts are in XLM (JavaScript number, e.g. 5.0 = 5 XLM).

export const STROOPS_PER_XLM = 10_000_000;

export type PayoutRule = 'turn_order' | 'bidding';
export type CommitteeStatus = 'forming' | 'active' | 'completed' | 'cancelled';
export type ContributionStatus = 'pending' | 'paid' | 'defaulted' | 'excused';
export type PayoutStatus = 'scheduled' | 'released' | 'forfeited';
export type PenaltyStrategy = 'delay' | 'penalty' | 'backup_fund';

// ── Auth / User ───────────────────────────────────────────────────────────────

/** The currently authenticated user — stored in context after login/register. */
export interface Identity {
  id: string;                   // MongoDB _id
  name: string;
  email: string;
  publicKey: string | null;     // Freighter wallet address (optional link)
  bio: string;
  credit_score?: number;        // credit/trust score
  network: string;
  token: string;                // JWT for API requests
  createdAt: string;
}

// ── Committee ─────────────────────────────────────────────────────────────────

export interface Committee {
  id: string;
  name: string;
  description: string | null;
  /** Contribution amount in XLM */
  contribution_amount: number;
  cycle_length_days: number;
  member_count: number;
  payout_rule: PayoutRule;
  organizer_wallet: string;
  organizer_name: string;
  current_cycle: number;
  status: CommitteeStatus;
  penalty_strategy: PenaltyStrategy;
  penalty_amount: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  current_member_count?: number; // returned by the list endpoint
}

export interface Member {
  id: string;
  committee_id: string;
  wallet_address: string;
  display_name: string;
  payout_position: number | null;
  has_received_payout: boolean;
  credit_score?: number;        // credit score of the user associated
  joined_at: string;
}

export interface Contribution {
  id: string;
  committee_id: string;
  member_id: string;
  cycle_index: number;
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

// ── Bid (Bidding Payout Variant) ──────────────────────────────────────────────
export interface Bid {
  id: string;
  committee_id: string;
  user_id: string;
  member_id: string;
  cycle_index: number;
  discount_amount: number; // in XLM
  created_at: string;
}

// ── AnchorTx (Simulated Fiat Anchor) ──────────────────────────────────────────
export interface AnchorTx {
  id: string;
  user_id: string;
  tx_type: 'deposit' | 'withdrawal';
  amount_inr: number;
  amount_xlm: number;
  status: 'completed' | 'failed';
  bank_details: string;
  created_at: string;
}

// ── Joined shapes ─────────────────────────────────────────────────────────────

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
  bids?: Bid[];
}
