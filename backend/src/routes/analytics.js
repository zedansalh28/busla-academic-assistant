const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');
const patternEngine = require('../services/patternEngine');
const adaptiveEngine = require('../services/adaptiveEngine');
const { track } = require('../services/behaviorTracker');

const router = express.Router();

// POST /api/analytics/event — record a behavior event from the frontend
router.post('/event', asyncHandler(async (req, res) => {
  const { user_id, event_type, subject, metadata } = req.body;
  if (!user_id || !event_type) return res.status(400).json({ error: 'user_id and event_type required' });
  db.addBehaviorEvent(user_id, event_type, subject || null, metadata || {});
  res.json({ recorded: true });
}));

// POST /api/analytics/compute/:userId — trigger full pattern recompute
router.post('/compute/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // Force recompute by clearing stale check — clear and recompute
  db.clearUserPatterns(userId);
  const patterns = patternEngine.computePatterns(userId);
  for (const p of patterns) {
    db.savePattern(userId, p.type, p.subject, p.value, p.explanation);
  }
  const savedPatterns = db.getUserPatterns(userId);
  const prefs = adaptiveEngine.computeAndSave(userId, savedPatterns);
  res.json({ patterns_computed: savedPatterns.length, adaptive_prefs: prefs });
}));

// GET /api/analytics/patterns/:userId — get latest patterns (recompute if stale)
router.get('/patterns/:userId', asyncHandler(async (req, res) => {
  const patterns = patternEngine.computeAndSave(req.params.userId);
  res.json({ patterns });
}));

// GET /api/analytics/preferences/:userId — get adaptive preferences
router.get('/preferences/:userId', asyncHandler(async (req, res) => {
  // Ensure patterns are fresh before returning prefs
  const patterns = patternEngine.computeAndSave(req.params.userId);
  const prefs = adaptiveEngine.computeAndSave(req.params.userId, patterns);
  res.json(prefs);
}));

// GET /api/analytics/dashboard/:userId — full analytics snapshot
router.get('/dashboard/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Compute (or load cached) patterns
  const patterns = patternEngine.computeAndSave(userId);

  // Generate adaptive preferences from latest patterns
  const prefs = adaptiveEngine.computeAndSave(userId, patterns);

  // Heatmap: 28-day activity grid
  const heatmapData = patternEngine.buildHeatmapData(userId);

  // Weekly trends: 6 weeks of completion rate + study events
  const weeklyTrends = patternEngine.buildWeeklyTrends(userId);

  // Subject analysis from weak_subject patterns
  const subjectAnalysis = patterns
    .filter(p => p.pattern_type === 'weak_subject')
    .sort((a, b) => b.value - a.value)
    .map(p => ({
      subject: p.subject,
      weakness_score: p.value,
      explanation: p.explanation,
      strength_score: Math.max(0, 100 - p.value),
    }));

  // Top AI topics from interaction metrics
  const topTopics = db.getUserAIMetrics(userId, 30).slice(0, 8).map(m => ({
    topic: m.topic,
    count: m.count,
    repeat_count: m.repeat_count || 0,
    is_repeat_heavy: (m.repeat_count || 0) / m.count > 0.5,
  }));

  // Weak topics (deduplicated from weak_topics table)
  const weakTopics = db.getUserWeakTopics(userId, 8);

  // Pattern-driven recommendations
  const recommendations = _buildRecommendations(patterns, prefs);

  // Record weekly performance snapshot
  _snapshotWeeklyPerformance(userId, patterns);

  res.json({
    productivity_score: prefs.productivityScore,
    consistency_score: prefs.consistencyScore,
    burnout_score: prefs.burnoutScore,
    ai_dependency_level: prefs.aiDependencyLevel,
    adaptive_prefs: {
      explanation_depth: prefs.explanationDepth,
      session_length: prefs.sessionLength,
      focus_subjects: prefs.focusSubjects,
      recovery_mode: prefs.recoveryMode,
      example_frequency: prefs.exampleFrequency,
    },
    patterns: patterns.map(p => ({
      type: p.pattern_type,
      subject: p.subject,
      value: p.value,
      explanation: p.explanation,
      computed_at: p.computed_at,
    })),
    heatmap_data: heatmapData,
    weekly_trends: weeklyTrends,
    subject_analysis: subjectAnalysis,
    top_topics: topTopics,
    weak_topics: weakTopics,
    recommendations,
  });
}));

function _buildRecommendations(patterns, prefs) {
  const recs = [];
  const get = (type) => patterns.find(p => p.pattern_type === type);

  const burnout = get('burnout_risk')?.value ?? 0;
  const consistency = get('consistency')?.value ?? 50;
  const procrastination = get('procrastination')?.value ?? 0;
  const dependency = get('ai_dependency')?.value ?? 50;
  const completion = get('completion_trend')?.value ?? 50;
  const overdue = get('overdue_ratio')?.value ?? 0;
  const weakSubjects = patterns.filter(p => p.pattern_type === 'weak_subject' && p.value > 40);
  const preferredTime = get('preferred_study_time');

  if (burnout > 60) {
    recs.push({ priority: 'high', icon: 'alert', text: 'Burnout risk detected — your activity dropped significantly this week. Take a recovery day and then use the Schedule Optimizer to reduce your weekly load.' });
  }

  if (consistency < 40) {
    recs.push({ priority: 'high', icon: 'calendar', text: `Study consistency is low (${consistency}%). Try to log at least one focused study session every day — even 30 minutes counts.` });
  } else if (consistency >= 75) {
    recs.push({ priority: 'positive', icon: 'star', text: `Excellent consistency! You have been active on ${Math.round(consistency * 0.28)} of the last 28 days. Keep it up.` });
  }

  if (procrastination > 60) {
    recs.push({ priority: 'medium', icon: 'clock', text: `${procrastination}% of your tasks are completed last-minute. Try the 2-day rule: start any task at least 2 days before its deadline.` });
  }

  if (weakSubjects.length > 0) {
    const top = weakSubjects[0];
    recs.push({ priority: 'medium', icon: 'book', text: `${top.subject} appears to be a challenging area (${top.question_count || top.value} questions asked). Schedule extra review sessions and consider asking your lecturer for worked examples.` });
  }

  if (dependency > 65) {
    recs.push({ priority: 'medium', icon: 'brain', text: 'High AI chat usage detected. Try solving problems independently first, then use the AI to verify your reasoning — this builds stronger retention.' });
  }

  if (overdue > 30) {
    recs.push({ priority: 'high', icon: 'warning', text: `${overdue}% of your tasks are overdue. Prioritize clearing the backlog before creating new plans.` });
  }

  if (completion < 40) {
    recs.push({ priority: 'medium', icon: 'target', text: 'Planner completion rate is low. Consider breaking plans into smaller, 30-minute tasks to make them feel achievable.' });
  }

  if (preferredTime) {
    const hour = preferredTime.value;
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    recs.push({ priority: 'info', icon: 'clock', text: `Your peak activity is during ${period} hours. The Schedule Optimizer will automatically place your hardest subjects in this time slot.` });
  }

  if (prefs.recoveryMode) {
    recs.push({ priority: 'high', icon: 'heart', text: 'Recovery mode active: focus on completing 1-2 tasks per day rather than overwhelming yourself. Your schedule has been automatically lightened.' });
  }

  // Always include a positive reinforcement if doing well overall
  if (recs.filter(r => r.priority === 'high').length === 0 && prefs.productivityScore >= 65) {
    recs.push({ priority: 'positive', icon: 'trophy', text: `Productivity score: ${prefs.productivityScore}/100. Your academic performance indicators look strong. Stay consistent!` });
  }

  return recs;
}

function _snapshotWeeklyPerformance(userId, patterns) {
  try {
    const now = Date.now();
    const WEEK_MS = 7 * 86400000;
    const weekStart = now - (now % WEEK_MS); // floor to week boundary
    const consistency = patterns.find(p => p.pattern_type === 'consistency')?.value ?? 50;
    const completion = patterns.find(p => p.pattern_type === 'completion_trend')?.value ?? 50;
    const burnout = patterns.find(p => p.pattern_type === 'burnout_risk')?.value ?? 0;
    const chatCount = db.getEventCountByType(userId, 'chat_message', 7);
    const studyEvents = db.getUserEvents(userId, 7).length;

    db.recordWeeklyPerformance(userId, weekStart, {
      tasksCompleted: 0,
      tasksTotal: 0,
      studyEvents,
      chatSessions: chatCount,
      riskScore: Math.round(burnout),
      productivityScore: Math.round(consistency * 0.5 + completion * 0.5),
    });
  } catch (_) {}
}

module.exports = router;
