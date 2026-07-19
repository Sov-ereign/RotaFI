import express from 'express';
import { Committee, Member, Contribution, Payout, ActivityLog } from '../models.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

async function logActivity(committeeId, eventType, actorWallet, summary, metadata = {}) {
  await ActivityLog.create({ committee_id: committeeId, event_type: eventType, actor_wallet: actorWallet, summary, metadata });
}

function buildDetail(committee, members, contributions, payouts, activity, userId, walletAddress) {
  const membersWithStatus = members.map(m => {
    const mc = contributions.filter(c => c.member_id.toString() === m._id.toString());
    const cur = mc.find(c => c.cycle_index === committee.current_cycle) ?? null;
    return {
      ...m.toJSON(),
      contributions: mc.map(c => c.toJSON()),
      totalPaid: mc.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
      cyclesPaid: mc.filter(c => c.status === 'paid').length,
      cyclesDefaulted: mc.filter(c => c.status === 'defaulted').length,
      currentCycleContribution: cur ? cur.toJSON() : null,
    };
  });

  const currentCycleContribs = contributions.filter(c => c.cycle_index === committee.current_cycle);
  const contributionsReceived = currentCycleContribs.filter(c => c.status === 'paid').length;

  const scheduledPayout = payouts.find(p => p.cycle_index === committee.current_cycle && p.status === 'scheduled');
  let nextRecipient = null;
  if (scheduledPayout) {
    nextRecipient = membersWithStatus.find(m => m.id === scheduledPayout.recipient_member_id.toString()) ?? null;
  }

  const myMember = walletAddress
    ? membersWithStatus.find(m => m.wallet_address === walletAddress) ?? null
    : null;

  return {
    ...committee.toJSON(),
    members: membersWithStatus,
    payouts: payouts.map(p => p.toJSON()),
    activity: activity.map(a => a.toJSON()),
    currentCycleContributions: currentCycleContribs.map(c => c.toJSON()),
    contributionsNeeded: committee.member_count,
    contributionsReceived,
    isOrganizer: walletAddress === committee.organizer_wallet,
    isMember: !!myMember,
    myMember,
    nextRecipient,
  };
}

// ── GET /api/committees ────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const committees = await Committee.find().sort({ created_at: -1 });
    // Attach current member count
    const withCounts = await Promise.all(committees.map(async c => {
      const count = await Member.countDocuments({ committee_id: c._id });
      return { ...c.toJSON(), current_member_count: count };
    }));
    res.json(withCounts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET /api/committees/:id ────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) return res.status(404).json({ message: 'Committee not found' });

    const [members, contributions, payouts, activity] = await Promise.all([
      Member.find({ committee_id: committee._id }).sort({ joined_at: 1 }),
      Contribution.find({ committee_id: committee._id }).sort({ cycle_index: 1 }),
      Payout.find({ committee_id: committee._id }).sort({ cycle_index: 1 }),
      ActivityLog.find({ committee_id: committee._id }).sort({ created_at: -1 }).limit(40),
    ]);

    // Attach wallet from user if authenticated
    let walletAddress = committee.organizer_wallet; // fallback
    if (req.user) {
      const { User } = await import('../models.js');
      const u = await User.findById(req.user.id).select('walletAddress');
      walletAddress = u?.walletAddress ?? null;
    } else {
      walletAddress = null;
    }

    res.json(buildDetail(committee, members, contributions, payouts, activity, req.user?.id, walletAddress));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees ───────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);
    if (!user?.walletAddress) return res.status(400).json({ message: 'Connect your Freighter wallet before creating a committee' });

    const { name, description, contributionAmountXLM, cycleLengthDays, memberCount, payoutRule, penaltyStrategy, penaltyAmountXLM } = req.body;
    if (!name || !contributionAmountXLM || !cycleLengthDays || !memberCount)
      return res.status(400).json({ message: 'Missing required fields' });

    const committee = await Committee.create({
      name: name.trim(),
      description: description?.trim() ?? '',
      contribution_amount: contributionAmountXLM,
      cycle_length_days: cycleLengthDays,
      member_count: memberCount,
      payout_rule: payoutRule ?? 'turn_order',
      organizer_wallet: user.walletAddress,
      organizer_name: user.name,
      organizer_id: user._id,
      penalty_strategy: penaltyStrategy ?? 'delay',
      penalty_amount: penaltyAmountXLM ?? 0,
    });

    // Organizer is member #0
    await Member.create({
      committee_id: committee._id,
      user_id: user._id,
      wallet_address: user.walletAddress,
      display_name: user.name,
      payout_position: 0,
    });

    await logActivity(committee._id, 'committee_created', user.walletAddress,
      `${user.name} created "${name}" — ${memberCount} members, ${contributionAmountXLM} XLM/cycle`);

    res.status(201).json(committee.toJSON());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/join ──────────────────────────────────────────────
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);
    if (!user?.walletAddress) return res.status(400).json({ message: 'Connect your Freighter wallet before joining' });

    const committee = await Committee.findById(req.params.id);
    if (!committee) return res.status(404).json({ message: 'Committee not found' });
    if (committee.status !== 'forming') return res.status(400).json({ message: 'Committee is not accepting new members' });

    const existing = await Member.findOne({ committee_id: committee._id, wallet_address: user.walletAddress });
    if (existing) return res.status(409).json({ message: 'Already a member' });

    const currentCount = await Member.countDocuments({ committee_id: committee._id });
    if (currentCount >= committee.member_count) return res.status(400).json({ message: 'Committee is full' });

    await Member.create({
      committee_id: committee._id,
      user_id: user._id,
      wallet_address: user.walletAddress,
      display_name: user.name,
    });

    await logActivity(committee._id, 'member_joined', user.walletAddress, `${user.name} joined the committee`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/start ────────────────────────────────────────────
router.post('/:id/start', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);

    const committee = await Committee.findById(req.params.id);
    if (!committee) return res.status(404).json({ message: 'Committee not found' });
    if (committee.organizer_wallet !== user?.walletAddress)
      return res.status(403).json({ message: 'Only the organizer can start' });
    if (committee.status !== 'forming') return res.status(400).json({ message: 'Already started' });

    const members = await Member.find({ committee_id: committee._id }).sort({ joined_at: 1 });
    if (members.length < 2) return res.status(400).json({ message: 'Need at least 2 members' });
    if (members.length !== committee.member_count)
      return res.status(400).json({ message: `Committee is not full (${members.length}/${committee.member_count})` });

    // Assign payout positions
    await Promise.all(members.map((m, i) => Member.findByIdAndUpdate(m._id, { payout_position: i })));

    committee.status = 'active';
    committee.started_at = new Date();
    committee.current_cycle = 0;
    await committee.save();

    // Seed contributions for cycle 0
    await Contribution.insertMany(members.map(m => ({
      committee_id: committee._id,
      member_id: m._id,
      cycle_index: 0,
      amount: committee.contribution_amount,
    })));

    // Schedule payout for cycle 0
    const firstRecipient = members.find(m => m.payout_position === 0) ?? members[0];
    await Payout.create({
      committee_id: committee._id,
      cycle_index: 0,
      recipient_member_id: firstRecipient._id,
      amount: committee.contribution_amount * committee.member_count,
    });

    await logActivity(committee._id, 'committee_started', user.walletAddress,
      `Committee started — ${members.length} members, cycle 1 of ${committee.member_count}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/contribute ───────────────────────────────────────
router.post('/:id/contribute', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);

    const committee = await Committee.findById(req.params.id);
    if (!committee) return res.status(404).json({ message: 'Committee not found' });
    if (committee.status !== 'active') return res.status(400).json({ message: 'Committee not active' });

    const member = await Member.findOne({ committee_id: committee._id, wallet_address: user?.walletAddress });
    if (!member) return res.status(403).json({ message: 'Not a member' });

    const contrib = await Contribution.findOne({
      committee_id: committee._id,
      member_id: member._id,
      cycle_index: committee.current_cycle,
    });
    if (!contrib) return res.status(400).json({ message: 'No contribution row for this cycle' });
    if (contrib.status === 'paid') return res.status(400).json({ message: 'Already contributed this cycle' });

    const { txHash } = req.body;
    await Contribution.findByIdAndUpdate(contrib._id, {
      status: 'paid',
      paid_at: new Date(),
      tx_hash: txHash || null,
    });

    await logActivity(committee._id, 'contribution_paid', user.walletAddress,
      `${user.name} contributed ${committee.contribution_amount} XLM for cycle ${committee.current_cycle + 1}`,
      { cycle: committee.current_cycle, amount: committee.contribution_amount, tx_hash: txHash });

    // Check if all members have contributed
    const pending = await Contribution.countDocuments({
      committee_id: committee._id,
      cycle_index: committee.current_cycle,
      status: 'pending',
    });

    res.json({ ok: true, cycleComplete: pending === 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/advance ─────────────────────────────────────────
router.post('/:id/advance', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);

    const committee = await Committee.findById(req.params.id);
    if (!committee) return res.status(404).json({ message: 'Committee not found' });
    if (committee.organizer_wallet !== user?.walletAddress)
      return res.status(403).json({ message: 'Only the organizer can advance' });
    if (committee.status !== 'active') return res.status(400).json({ message: 'Committee not active' });

    const cycleContribs = await Contribution.find({
      committee_id: committee._id,
      cycle_index: committee.current_cycle,
    });
    const allDone = cycleContribs.every(c => c.status === 'paid' || c.status === 'excused');
    if (!allDone) return res.status(400).json({ message: 'Not all members have contributed' });

    const payout = await Payout.findOne({ committee_id: committee._id, cycle_index: committee.current_cycle });
    if (!payout) return res.status(400).json({ message: 'No scheduled payout' });

    const { txHash } = req.body;
    await Payout.findByIdAndUpdate(payout._id, { status: 'released', released_at: new Date(), tx_hash: txHash || null });
    await Member.findByIdAndUpdate(payout.recipient_member_id, { has_received_payout: true });

    const recipient = await Member.findById(payout.recipient_member_id);
    await logActivity(committee._id, 'payout_released', user.walletAddress,
      `Cycle ${committee.current_cycle + 1} pot of ${payout.amount} XLM released to ${recipient?.display_name ?? 'recipient'}`,
      { cycle: committee.current_cycle, tx_hash: txHash });

    const nextCycle = committee.current_cycle + 1;

    if (nextCycle >= committee.member_count) {
      committee.status = 'completed';
      committee.completed_at = new Date();
      committee.current_cycle = nextCycle;
      await committee.save();
      await logActivity(committee._id, 'committee_completed', user.walletAddress,
        `Committee completed — all ${committee.member_count} payouts distributed`);
      return res.json({ ok: true, completed: true });
    }

    committee.current_cycle = nextCycle;
    await committee.save();

    const members = await Member.find({ committee_id: committee._id });
    await Contribution.insertMany(members.map(m => ({
      committee_id: committee._id,
      member_id: m._id,
      cycle_index: nextCycle,
      amount: committee.contribution_amount,
    })));

    const remaining = members
      .filter(m => !m.has_received_payout && m._id.toString() !== payout.recipient_member_id.toString())
      .sort((a, b) => (a.payout_position ?? 99) - (b.payout_position ?? 99));

    if (remaining.length > 0) {
      await Payout.create({
        committee_id: committee._id,
        cycle_index: nextCycle,
        recipient_member_id: remaining[0]._id,
        amount: committee.contribution_amount * committee.member_count,
      });
    }

    await logActivity(committee._id, 'cycle_advanced', user.walletAddress,
      `Advanced to cycle ${nextCycle + 1} of ${committee.member_count}`,
      { cycle: nextCycle });

    res.json({ ok: true, completed: false });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/default/:memberId ────────────────────────────────
router.post('/:id/default/:memberId', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);
    const committee = await Committee.findById(req.params.id);
    if (!committee || committee.organizer_wallet !== user?.walletAddress)
      return res.status(403).json({ message: 'Organizer only' });

    const contrib = await Contribution.findOne({
      committee_id: committee._id,
      member_id: req.params.memberId,
      cycle_index: committee.current_cycle,
      status: 'pending',
    });
    if (!contrib) return res.status(404).json({ message: 'Pending contribution not found' });

    await Contribution.findByIdAndUpdate(contrib._id, { status: 'defaulted' });
    const member = await Member.findById(req.params.memberId);
    await logActivity(committee._id, 'member_defaulted', user.walletAddress,
      `${member?.display_name ?? 'Member'} defaulted on cycle ${committee.current_cycle + 1}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/committees/:id/excuse/:memberId ─────────────────────────────────
router.post('/:id/excuse/:memberId', requireAuth, async (req, res) => {
  try {
    const { User } = await import('../models.js');
    const user = await User.findById(req.user.id);
    const committee = await Committee.findById(req.params.id);
    if (!committee || committee.organizer_wallet !== user?.walletAddress)
      return res.status(403).json({ message: 'Organizer only' });

    const contrib = await Contribution.findOne({
      committee_id: committee._id,
      member_id: req.params.memberId,
      cycle_index: committee.current_cycle,
    });
    if (!contrib) return res.status(404).json({ message: 'Contribution not found' });

    await Contribution.findByIdAndUpdate(contrib._id, { status: 'excused' });
    const member = await Member.findById(req.params.memberId);
    await logActivity(committee._id, 'member_excused', user.walletAddress,
      `${member?.display_name ?? 'Member'} excused from cycle ${committee.current_cycle + 1}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
