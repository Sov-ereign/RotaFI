import express from 'express';
import { User, Committee, Member, AnchorTx } from '../models.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [asOrganizer, asMember] = await Promise.all([
      Committee.countDocuments({ organizer_id: req.user.id }),
      Member.countDocuments({ user_id: req.user.id }),
    ]);

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      bio: user.bio,
      credit_score: user.credit_score || 650,
      createdAt: user.createdAt,
      stats: {
        committeesCreated: asOrganizer,
        committeesJoined: asMember,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/users/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim().slice(0, 40) || undefined;
    if (bio !== undefined) updates.bio = bio.slice(0, 280);

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/users/my-committees
router.get('/my-committees', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const walletAddress = user.walletAddress;

    // Find committees the user is a member of OR organizer of
    const memberDocs = walletAddress
      ? await Member.find({ wallet_address: walletAddress }).select('committee_id')
      : [];
    const memberIds = memberDocs.map(m => m.committee_id.toString());

    const orgIds = (await Committee.find({ organizer_id: req.user.id }).select('_id'))
      .map(c => c._id.toString());

    const allIds = [...new Set([...memberIds, ...orgIds])];

    const committees = await Committee.find({ _id: { $in: allIds } }).sort({ created_at: -1 });
    res.json(committees.map(c => c.toJSON()));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/users/anchor-tx — simulated transactions list
router.get('/anchor-tx', requireAuth, async (req, res) => {
  try {
    const txs = await AnchorTx.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(txs.map(t => t.toJSON()));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/users/anchor-tx — simulated deposit/withdrawal
router.post('/anchor-tx', requireAuth, async (req, res) => {
  try {
    const { tx_type, amount_inr, amount_xlm, bank_details } = req.body;
    if (!tx_type || !amount_inr || !amount_xlm) {
      return res.status(400).json({ message: 'Missing required transaction fields' });
    }

    const tx = await AnchorTx.create({
      user_id: req.user.id,
      tx_type,
      amount_inr,
      amount_xlm,
      bank_details: bank_details || 'UPI Payment Direct',
      status: 'completed',
    });

    // Reward deposit with credit score boost!
    if (tx_type === 'deposit') {
      const user = await User.findById(req.user.id);
      if (user) {
        user.credit_score = Math.min(900, (user.credit_score || 650) + 10);
        await user.save();
      }
    }

    res.status(201).json(tx.toJSON());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
