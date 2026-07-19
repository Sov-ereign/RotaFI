//! RotaFi — Rotating Savings on Stellar
//!
//! A trustless ROSCA (Rotating Savings and Credit Association) smart contract.
//! Members pool XLM each cycle; one member receives the full pot per cycle in
//! turn-order rotation. The contract enforces:
//!   - Contribution of exactly `contribution_stroops` per member per cycle
//!   - Automatic payout release when all members have contributed
//!   - Immutable payout order (set on `start`)
//!   - No organizer can redirect or withhold funds
//!
//! # Amounts
//! All monetary values are in **stroops** (1 XLM = 10_000_000 stroops) as i128.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec, Map,
    token,
};

// ── Storage keys ────────────────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Global committee counter (u32)
    CommCount,
    /// CommitteeState for a given id
    Comm(u32),
    /// Ordered Vec<Address> of members (joined order)
    CommMembers(u32),
    /// MemberState per (committee_id, address)
    CommMember(u32, Address),
    /// Contributions for (committee_id, cycle_index) → Map<Address, bool>
    CommContribs(u32, u32),
    /// PayoutState per (committee_id, cycle_index)
    CommPayout(u32, u32),
    /// Vec<ActivityEntry> per committee (last 50, ring-buffer)
    CommActivity(u32),
    /// Native XLM SAC address (set on init)
    NativeToken,
}

// ── Data types ───────────────────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub struct CommitteeState {
    pub id: u32,
    pub name: String,
    pub description: String,
    pub organizer: Address,
    pub contribution_stroops: i128,
    pub member_count: u32,
    pub cycle_days: u32,
    pub current_cycle: u32,
    /// 0 = forming, 1 = active, 2 = completed
    pub status: u32,
    pub created_at: u64,
    pub started_at: u64,
    pub completed_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct MemberState {
    pub address: Address,
    pub display_name: String,
    /// Position in the payout rotation (assigned on start)
    pub payout_position: u32,
    pub has_received_payout: bool,
    pub joined_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct PayoutState {
    pub cycle_index: u32,
    pub recipient: Address,
    pub amount_stroops: i128,
    pub released: bool,
    pub released_at: u64,
    pub tx_hash: String,
}

#[derive(Clone)]
#[contracttype]
pub struct ActivityEntry {
    pub event_type: String,
    pub actor: Address,
    pub summary: String,
    pub timestamp: u64,
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct RotaFiContract;

#[contractimpl]
impl RotaFiContract {
    // ── Initialisation ─────────────────────────────────────────────────────

    /// Initialise the contract with the native XLM SAC address.
    /// On Stellar testnet the native SAC is deployed at a deterministic address;
    /// call `stellar contract id asset --asset native --network testnet` to get it.
    pub fn init(env: Env, native_token: Address) {
        if env.storage().instance().has(&DataKey::NativeToken) {
            panic!("already initialised");
        }
        env.storage().instance().set(&DataKey::NativeToken, &native_token);
        env.storage().instance().set(&DataKey::CommCount, &0u32);
    }

    // ── Committee lifecycle ────────────────────────────────────────────────

    /// Create a new committee. The caller becomes the organiser and the first member.
    /// Returns the new committee's id.
    pub fn create_committee(
        env: Env,
        organizer: Address,
        name: String,
        description: String,
        contribution_stroops: i128,
        member_count: u32,
        cycle_days: u32,
    ) -> u32 {
        organizer.require_auth();

        assert!(contribution_stroops > 0, "contribution must be > 0");
        assert!(member_count >= 2, "need at least 2 members");
        assert!(member_count <= 50, "max 50 members");
        assert!(cycle_days >= 1, "cycle must be at least 1 day");

        let id: u32 = env.storage().instance().get(&DataKey::CommCount).unwrap_or(0);
        let next_id = id + 1;

        let now = env.ledger().timestamp();

        let committee = CommitteeState {
            id: next_id,
            name: name.clone(),
            description,
            organizer: organizer.clone(),
            contribution_stroops,
            member_count,
            cycle_days,
            current_cycle: 0,
            status: 0,
            created_at: now,
            started_at: 0,
            completed_at: 0,
        };

        env.storage().persistent().set(&DataKey::Comm(next_id), &committee);
        env.storage().instance().set(&DataKey::CommCount, &next_id);

        // Organizer is automatically member #0
        let organizer_member = MemberState {
            address: organizer.clone(),
            display_name: String::from_str(&env, "Organizer"),
            payout_position: 0,
            has_received_payout: false,
            joined_at: now,
        };
        let mut members: Vec<Address> = Vec::new(&env);
        members.push_back(organizer.clone());
        env.storage().persistent().set(&DataKey::CommMembers(next_id), &members);
        env.storage().persistent().set(&DataKey::CommMember(next_id, organizer.clone()), &organizer_member);

        Self::_log_activity(&env, next_id, organizer.clone(),
            String::from_str(&env, "committee_created"),
            String::from_str(&env, "Committee created"),
        );

        next_id
    }

    /// Join an existing committee (must be in `forming` status and not full).
    pub fn join(env: Env, joiner: Address, committee_id: u32, display_name: String) {
        joiner.require_auth();

        let mut committee: CommitteeState = env.storage().persistent()
            .get(&DataKey::Comm(committee_id))
            .expect("committee not found");
        assert_eq!(committee.status, 0, "committee is not forming");

        let mut members: Vec<Address> = env.storage().persistent()
            .get(&DataKey::CommMembers(committee_id))
            .unwrap_or_else(|| Vec::new(&env));

        assert!(!members.contains(&joiner), "already a member");
        assert!((members.len() as u32) < committee.member_count, "committee is full");

        let now = env.ledger().timestamp();
        let member = MemberState {
            address: joiner.clone(),
            display_name,
            payout_position: members.len() as u32,
            has_received_payout: false,
            joined_at: now,
        };
        members.push_back(joiner.clone());
        env.storage().persistent().set(&DataKey::CommMembers(committee_id), &members);
        env.storage().persistent().set(&DataKey::CommMember(committee_id, joiner.clone()), &member);

        // Update member count snapshot in committee state
        committee.member_count = committee.member_count; // unchanged — this is the target
        env.storage().persistent().set(&DataKey::Comm(committee_id), &committee);

        Self::_log_activity(&env, committee_id, joiner,
            String::from_str(&env, "member_joined"),
            String::from_str(&env, "Member joined"),
        );
    }

    /// Organiser starts the committee once all slots are filled.
    pub fn start(env: Env, organizer: Address, committee_id: u32) {
        organizer.require_auth();

        let mut committee: CommitteeState = env.storage().persistent()
            .get(&DataKey::Comm(committee_id))
            .expect("committee not found");
        assert_eq!(committee.organizer, organizer, "not the organizer");
        assert_eq!(committee.status, 0, "committee not in forming state");

        let members: Vec<Address> = env.storage().persistent()
            .get(&DataKey::CommMembers(committee_id))
            .unwrap_or_else(|| Vec::new(&env));
        assert_eq!(members.len() as u32, committee.member_count, "committee not full");

        let now = env.ledger().timestamp();
        committee.status = 1;
        committee.started_at = now;
        env.storage().persistent().set(&DataKey::Comm(committee_id), &committee);

        // Schedule payout for cycle 0 → member at payout_position 0 (organizer)
        let first_member_addr = members.get(0).unwrap();
        let pot = committee.contribution_stroops * (committee.member_count as i128);
        let payout = PayoutState {
            cycle_index: 0,
            recipient: first_member_addr,
            amount_stroops: pot,
            released: false,
            released_at: 0,
            tx_hash: String::from_str(&env, ""),
        };
        env.storage().persistent().set(&DataKey::CommPayout(committee_id, 0), &payout);

        Self::_log_activity(&env, committee_id, organizer,
            String::from_str(&env, "committee_started"),
            String::from_str(&env, "Committee started"),
        );
    }

    // ── Contributions & payouts ────────────────────────────────────────────

    /// Contribute for the current cycle. Transfers `contribution_stroops` XLM
    /// from the caller to the contract. If this completes the cycle, the pot is
    /// automatically released to the scheduled recipient.
    pub fn contribute(env: Env, contributor: Address, committee_id: u32) {
        contributor.require_auth();

        let mut committee: CommitteeState = env.storage().persistent()
            .get(&DataKey::Comm(committee_id))
            .expect("committee not found");
        assert_eq!(committee.status, 1, "committee not active");

        // Check membership
        assert!(
            env.storage().persistent().has(&DataKey::CommMember(committee_id, contributor.clone())),
            "not a member"
        );

        let cycle = committee.current_cycle;

        // Check not already contributed
        let mut contribs: Map<Address, bool> = env.storage().persistent()
            .get(&DataKey::CommContribs(committee_id, cycle))
            .unwrap_or_else(|| Map::new(&env));
        assert!(!contribs.contains_key(contributor.clone()), "already contributed this cycle");

        // Transfer XLM from contributor to contract
        let native_token: Address = env.storage().instance().get(&DataKey::NativeToken).unwrap();
        let token_client = token::Client::new(&env, &native_token);
        token_client.transfer(
            &contributor,
            &env.current_contract_address(),
            &committee.contribution_stroops,
        );

        // Mark as contributed
        contribs.set(contributor.clone(), true);
        env.storage().persistent().set(&DataKey::CommContribs(committee_id, cycle), &contribs);

        Self::_log_activity(&env, committee_id, contributor,
            String::from_str(&env, "contribution_paid"),
            String::from_str(&env, "Contribution received"),
        );

        // If all members have contributed, auto-release payout
        if contribs.len() as u32 == committee.member_count {
            Self::_release_payout(&env, &mut committee, committee_id, native_token);
        }
    }

    // ── Queries ────────────────────────────────────────────────────────────

    pub fn get_committee(env: Env, committee_id: u32) -> CommitteeState {
        env.storage().persistent()
            .get(&DataKey::Comm(committee_id))
            .expect("committee not found")
    }

    pub fn get_committee_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::CommCount).unwrap_or(0)
    }

    pub fn get_members(env: Env, committee_id: u32) -> Vec<MemberState> {
        let addrs: Vec<Address> = env.storage().persistent()
            .get(&DataKey::CommMembers(committee_id))
            .unwrap_or_else(|| Vec::new(&env));
        let mut out: Vec<MemberState> = Vec::new(&env);
        for addr in addrs.iter() {
            if let Some(m) = env.storage().persistent().get::<DataKey, MemberState>(
                &DataKey::CommMember(committee_id, addr.clone())
            ) {
                out.push_back(m);
            }
        }
        out
    }

    pub fn get_member(env: Env, committee_id: u32, member: Address) -> MemberState {
        env.storage().persistent()
            .get(&DataKey::CommMember(committee_id, member))
            .expect("member not found")
    }

    pub fn get_contributions(env: Env, committee_id: u32, cycle: u32) -> Map<Address, bool> {
        env.storage().persistent()
            .get(&DataKey::CommContribs(committee_id, cycle))
            .unwrap_or_else(|| Map::new(&env))
    }

    pub fn get_payout(env: Env, committee_id: u32, cycle: u32) -> PayoutState {
        env.storage().persistent()
            .get(&DataKey::CommPayout(committee_id, cycle))
            .expect("no payout for this cycle")
    }

    pub fn get_activity(env: Env, committee_id: u32) -> Vec<ActivityEntry> {
        env.storage().persistent()
            .get(&DataKey::CommActivity(committee_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    // ── Internal helpers ───────────────────────────────────────────────────

    fn _release_payout(
        env: &Env,
        committee: &mut CommitteeState,
        committee_id: u32,
        native_token: Address,
    ) {
        let cycle = committee.current_cycle;
        let mut payout: PayoutState = env.storage().persistent()
            .get(&DataKey::CommPayout(committee_id, cycle))
            .expect("no payout scheduled");

        let now = env.ledger().timestamp();

        // Transfer pot from contract to recipient
        let token_client = token::Client::new(env, &native_token);
        token_client.transfer(
            &env.current_contract_address(),
            &payout.recipient,
            &payout.amount_stroops,
        );

        payout.released = true;
        payout.released_at = now;
        env.storage().persistent().set(&DataKey::CommPayout(committee_id, cycle), &payout);

        // Mark recipient as having received payout
        let mut member: MemberState = env.storage().persistent()
            .get(&DataKey::CommMember(committee_id, payout.recipient.clone()))
            .expect("recipient member not found");
        member.has_received_payout = true;
        env.storage().persistent().set(
            &DataKey::CommMember(committee_id, payout.recipient.clone()),
            &member,
        );

        let next_cycle = cycle + 1;

        if next_cycle >= committee.member_count {
            // All cycles done — committee completed
            committee.status = 2;
            committee.completed_at = now;
            committee.current_cycle = next_cycle;
            env.storage().persistent().set(&DataKey::Comm(committee_id), committee);
            return;
        }

        // Advance to next cycle
        committee.current_cycle = next_cycle;
        env.storage().persistent().set(&DataKey::Comm(committee_id), committee);

        // Schedule next payout — next member by payout_position
        let members: Vec<Address> = env.storage().persistent()
            .get(&DataKey::CommMembers(committee_id))
            .unwrap_or_else(|| Vec::new(env));

        // Find the member with payout_position == next_cycle
        let mut next_recipient_addr: Option<Address> = None;
        for addr in members.iter() {
            if let Some(m) = env.storage().persistent().get::<DataKey, MemberState>(
                &DataKey::CommMember(committee_id, addr.clone())
            ) {
                if m.payout_position == next_cycle {
                    next_recipient_addr = Some(addr.clone());
                    break;
                }
            }
        }

        if let Some(recipient) = next_recipient_addr {
            let pot = committee.contribution_stroops * (committee.member_count as i128);
            let next_payout = PayoutState {
                cycle_index: next_cycle,
                recipient,
                amount_stroops: pot,
                released: false,
                released_at: 0,
                tx_hash: String::from_str(env, ""),
            };
            env.storage().persistent().set(
                &DataKey::CommPayout(committee_id, next_cycle),
                &next_payout,
            );
        }
    }

    fn _log_activity(
        env: &Env,
        committee_id: u32,
        actor: Address,
        event_type: String,
        summary: String,
    ) {
        let mut log: Vec<ActivityEntry> = env.storage().persistent()
            .get(&DataKey::CommActivity(committee_id))
            .unwrap_or_else(|| Vec::new(env));

        let entry = ActivityEntry {
            event_type,
            actor,
            summary,
            timestamp: env.ledger().timestamp(),
        };

        log.push_back(entry);

        // Keep only the last 50 entries
        while log.len() > 50 {
            log.pop_front();
        }

        env.storage().persistent().set(&DataKey::CommActivity(committee_id), &log);
    }
}
