const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'busla_jwt_secret_change_in_production';
const JWT_EXPIRES = '7d';

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /api/auth/signup
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password, display_name, major, year, learning_style, difficulty_level, subjects_of_interest } = req.body;

  if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'Email, password, and display name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = db.createAuthUser(email, passwordHash, display_name);

  // Create session
  const sessionId = db.createSession(userId);

  // Create profile if academic info provided
  if (major) {
    db.createOrUpdateProfile(userId, {
      major, year: year || '1st', learning_style: learning_style || 'Visual',
      difficulty_level: difficulty_level || 'intermediate',
      subjects_of_interest: subjects_of_interest || [],
    });
  }

  const profile = db.getProfile(userId);
  const token = signToken(userId);

  res.status(201).json({
    token,
    user: { id: userId, email, display_name },
    session_id: sessionId,
    profile: profile || null,
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Get or create session
  let sessionId = db.createSession(user.id);
  const profile = db.getProfile(user.id);
  const token = signToken(user.id);

  res.json({
    token,
    user: { id: user.id, email: user.email, display_name: user.display_name },
    session_id: sessionId,
    profile: profile || null,
  });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = db.getUser(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = db.getProfile(req.userId);
  res.json({
    user: { id: user.id, email: user.email, display_name: user.display_name },
    profile: profile || null,
  });
}));

// PUT /api/auth/profile  (update display name)
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const { display_name } = req.body;
  if (display_name) db.updateUserAuth(req.userId, { display_name });
  const user = db.getUser(req.userId);
  res.json({ id: user.id, email: user.email, display_name: user.display_name });
}));

module.exports = router;
module.exports.authMiddleware = authMiddleware;
