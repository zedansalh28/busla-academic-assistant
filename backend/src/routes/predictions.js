const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');
const predictionEngine = require('../services/predictionEngine');
const interventionEngine = require('../services/interventionEngine');
const { track } = require('../services/behaviorTracker');

const router = express.Router();

// GET /api/predictions/:userId — compute (or return cached) predictions
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const prediction = predictionEngine.computeAndSave(userId);
  const interventions = interventionEngine.generateInterventions(prediction);
  const recoveryPlan = interventionEngine.generateRecoveryPlan(prediction);

  // Persist interventions
  db.saveInterventions(userId, interventions);

  // Track behavior event
  track.pageView(userId, 'predictions');

  res.json({
    ...prediction,
    interventions,
    recovery_plan: recoveryPlan,
  });
}));

// POST /api/predictions/compute/:userId — force recompute
router.post('/compute/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const prediction = predictionEngine.computeAndSave(userId, true);
  const interventions = interventionEngine.generateInterventions(prediction);
  const recoveryPlan = interventionEngine.generateRecoveryPlan(prediction);

  db.saveInterventions(userId, interventions);

  res.json({
    recomputed: true,
    computed_at: Date.now(),
    overall_health: prediction.overallHealth,
    overall_score: prediction.overallScore,
    failure_risk: prediction.failureRisk,
    interventions_generated: interventions.length,
    interventions,
    recovery_plan: recoveryPlan,
    ...prediction,
  });
}));

// GET /api/predictions/timeline/:userId — 8-week prediction history
router.get('/timeline/:userId', asyncHandler(async (req, res) => {
  const timeline = predictionEngine.buildPredictionTimeline(req.params.userId);
  res.json({ timeline });
}));

// GET /api/predictions/interventions/:userId — current active interventions
router.get('/interventions/:userId', asyncHandler(async (req, res) => {
  const storedInterventions = db.getInterventions(req.params.userId);
  if (storedInterventions.length > 0) {
    return res.json({ interventions: storedInterventions });
  }
  // Recompute if none stored
  const prediction = predictionEngine.computeAndSave(req.params.userId);
  const interventions = interventionEngine.generateInterventions(prediction);
  db.saveInterventions(req.params.userId, interventions);
  res.json({ interventions });
}));

// POST /api/predictions/interventions/:id/acknowledge
router.post('/interventions/:id/acknowledge', asyncHandler(async (req, res) => {
  db.acknowledgeIntervention(req.params.id);
  res.json({ acknowledged: true });
}));

// GET /api/predictions/recovery-plan/:userId — standalone recovery plan
router.get('/recovery-plan/:userId', asyncHandler(async (req, res) => {
  const prediction = predictionEngine.computeAndSave(req.params.userId);
  const plan = interventionEngine.generateRecoveryPlan(prediction);
  res.json({
    plan,
    overall_health: prediction.overallHealth,
    failure_risk: prediction.failureRisk,
  });
}));

module.exports = router;
