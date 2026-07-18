/*
# ChitFund Schema — committees, members, contributions, payouts, activity

Data model for a Stellar-based rotating-savings-group (chit fund / committee)
platform. Each committee has members, a monthly cycle, a fixed contribution
amount, and a payout rule (turn order or bidding). Members contribute each
cycle; when all contributions for a cycle are in, the pool is released to the
scheduled recipient and the cycle advances.

## Design notes
- Single-tenant: no sign-in screen in the MVP. A local identity (display name +
  randomly generated Stellar testnet keypair) is generated in-browser and
  persisted in localStorage; the public key is stored as members.wallet_address.
  RLS uses TO anon, authenticated so the anon-key client can read/write shared data.
- Money represented by a Stellar testnet asset standing in for INR; amounts
  stored as bigint in paise (1 INR = 100 paise) to avoid float money.
- cycle_index is 0-based.
- committee.status: forming | active | completed | cancelled.
- payout_rule: 'turn_order' | 'bidding' (bidding deferred to v2).
- contribution.status: pending | paid | defaulted | excused.
- payout.status: scheduled | released | forfeited.

## 1. New Tables
### committees — id, name, description, contribution_amount (paise),
  cycle_length_days, member_count, payout_rule, organizer_wallet,
  organizer_name, current_cycle, status, asset_code, asset_issuer,
  penalty_strategy, penalty_amount, started_at, completed_at, created_at
### members — id, committee_id (fk cascade), wallet_address, display_name,
  payout_position, has_received_payout, joined_at; UNIQUE(committee, wallet)
### contributions — id, committee_id (fk cascade), member_id (fk cascade),
  cycle_index, amount, status, tx_hash, paid_at, created_at
### payouts — id, committee_id (fk cascade), cycle_index, recipient_member_id
  (fk cascade), amount, status, tx_hash, released_at, created_at;
  UNIQUE(committee, cycle)
### activity_log — id, committee_id (fk cascade), event_type, actor_wallet,
  summary, metadata (jsonb), created_at

## 2. Security
- RLS enabled on all tables.
- Single-tenant shared data: TO anon, authenticated with USING(true)/
  WITH CHECK(true) — documented exception because the MVP has no sign-in and
  committee data is intentionally shared among participants.
*/

CREATE TABLE IF NOT EXISTS committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  contribution_amount bigint NOT NULL,
  cycle_length_days int NOT NULL DEFAULT 30,
  member_count int NOT NULL,
  payout_rule text NOT NULL DEFAULT 'turn_order',
  organizer_wallet text NOT NULL,
  organizer_name text NOT NULL,
  current_cycle int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'forming',
  asset_code text NOT NULL DEFAULT 'TESTINR',
  asset_issuer text,
  penalty_strategy text NOT NULL DEFAULT 'delay',
  penalty_amount bigint NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  display_name text NOT NULL,
  payout_position int,
  has_received_payout boolean NOT NULL DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE (committee_id, wallet_address)
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  cycle_index int NOT NULL,
  amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  cycle_index int NOT NULL,
  recipient_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  tx_hash text,
  released_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (committee_id, cycle_index)
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_wallet text,
  summary text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Committees policies (single-tenant, shared)
DROP POLICY IF EXISTS "anon_select_committees" ON committees;
CREATE POLICY "anon_select_committees" ON committees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_committees" ON committees;
CREATE POLICY "anon_insert_committees" ON committees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_committees" ON committees;
CREATE POLICY "anon_update_committees" ON committees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_committees" ON committees;
CREATE POLICY "anon_delete_committees" ON committees FOR DELETE
  TO anon, authenticated USING (true);

-- Members policies
DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE
  TO anon, authenticated USING (true);

-- Contributions policies
DROP POLICY IF EXISTS "anon_select_contributions" ON contributions;
CREATE POLICY "anon_select_contributions" ON contributions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contributions" ON contributions;
CREATE POLICY "anon_insert_contributions" ON contributions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contributions" ON contributions;
CREATE POLICY "anon_update_contributions" ON contributions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contributions" ON contributions;
CREATE POLICY "anon_delete_contributions" ON contributions FOR DELETE
  TO anon, authenticated USING (true);

-- Payouts policies
DROP POLICY IF EXISTS "anon_select_payouts" ON payouts;
CREATE POLICY "anon_select_payouts" ON payouts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payouts" ON payouts;
CREATE POLICY "anon_insert_payouts" ON payouts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payouts" ON payouts;
CREATE POLICY "anon_update_payouts" ON payouts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payouts" ON payouts;
CREATE POLICY "anon_delete_payouts" ON payouts FOR DELETE
  TO anon, authenticated USING (true);

-- Activity log policies
DROP POLICY IF EXISTS "anon_select_activity" ON activity_log;
CREATE POLICY "anon_select_activity" ON activity_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity" ON activity_log;
CREATE POLICY "anon_insert_activity" ON activity_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activity" ON activity_log;
CREATE POLICY "anon_update_activity" ON activity_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity" ON activity_log;
CREATE POLICY "anon_delete_activity" ON activity_log FOR DELETE
  TO anon, authenticated USING (true);

-- Helpful indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_members_committee ON members(committee_id);
CREATE INDEX IF NOT EXISTS idx_contrib_committee_cycle ON contributions(committee_id, cycle_index);
CREATE INDEX IF NOT EXISTS idx_contrib_member ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_payouts_committee_cycle ON payouts(committee_id, cycle_index);
CREATE INDEX IF NOT EXISTS idx_activity_committee_created ON activity_log(committee_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_committees_organizer ON committees(organizer_wallet);
CREATE INDEX IF NOT EXISTS idx_members_wallet ON members(wallet_address);
