const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const memoryEngine = require('../services/memoryEngine');
const { track } = require('../services/behaviorTracker');

const router = express.Router();

// GET /api/memory/dashboard/:userId — full dashboard data for frontend
router.get('/dashboard/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const dashboard = memoryEngine.getDashboard(userId);
  track.pageView(userId, 'learning_brain');
  res.json(dashboard);
}));

// GET /api/memory/profile/:userId — student learning profile
router.get('/profile/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const profile = memoryEngine.computeAndSaveProfile(userId);
  res.json(profile);
}));

// GET /api/memory/concepts/:userId — all tracked concepts with retention
router.get('/concepts/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = require('../db/queries');
  const concepts = db.getLearningMemory(userId);
  const now = Date.now();
  const enriched = concepts.map(c => ({
    ...c,
    retention_score: memoryEngine.computeRetention(c.mastery_score, c.last_interaction),
    days_since: Math.floor((now - c.last_interaction) / 86400000),
  }));
  res.json({ concepts: enriched });
}));

// GET /api/memory/gaps/:userId — open knowledge gaps
router.get('/gaps/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = require('../db/queries');
  const gaps = db.getKnowledgeGaps(userId);
  res.json({ gaps });
}));

// GET /api/memory/revision/:userId — spaced repetition priorities
router.get('/revision/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const priorities = memoryEngine.getRevisionPriorities(userId);
  res.json({ revision_queue: priorities });
}));

// POST /api/memory/compute/:userId — force profile recompute
router.post('/compute/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = require('../db/queries');
  // Invalidate cache by zeroing last_computed
  try {
    db.upsertStudentLearningProfile(userId, { last_computed: 0 });
  } catch (_) {}
  const profile = memoryEngine.computeAndSaveProfile(userId);
  const forgetting = memoryEngine.getForgettingAlerts(userId);
  const gaps = db.getKnowledgeGaps(userId);
  res.json({
    recomputed: true,
    computed_at: Date.now(),
    profile,
    forgetting_alerts: forgetting.length,
    gap_count: gaps.length,
  });
}));

module.exports = router;
