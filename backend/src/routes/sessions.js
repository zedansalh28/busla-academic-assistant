const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { generateSessionId } = require('../utils/validators');
const db = require('../db/queries');

const router = express.Router();

// Create new session
router.post('/create', asyncHandler(async (req, res) => {
  const userId = db.createUser();
  const sessionId = db.createSession(userId);

  res.json({
    user_id: userId,
    session_id: sessionId,
  });
}));

// Get session info
router.get('/:sessionId', asyncHandler(async (req, res) => {
  const session = db.getSession(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
}));

module.exports = router;
