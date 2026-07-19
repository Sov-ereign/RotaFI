import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

function sanitize(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed });

    res.status(201).json({ token: makeToken(user), user: sanitize(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: makeToken(user), user: sanitize(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(sanitize(user));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/link-wallet — attach Freighter address to account
router.post('/link-wallet', requireAuth, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ message: 'walletAddress required' });

    // Check no other account already owns this wallet
    const conflict = await User.findOne({ walletAddress, _id: { $ne: req.user.id } });
    if (conflict) return res.status(409).json({ message: 'This wallet is already linked to another account' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true },
    );
    res.json(sanitize(user));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/unlink-wallet
router.post('/unlink-wallet', requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { walletAddress: null }, { new: true });
    res.json(sanitize(user));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
