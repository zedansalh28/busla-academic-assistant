const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');
const knowledgeBase = require('../utils/knowledgeBase');

const router = express.Router();

const formatDbRec = (rec) => ({
  id: rec.id,
  topic: rec.topic,
  type: rec.recommendation_type,
  recommendation_type: rec.recommendation_type,
  title: rec.content?.title || rec.topic,
  description: rec.content?.description || '',
  difficulty: rec.content?.difficulty || 'intermediate',
});

const formatKbItem = (item) => ({
  id: item.id,
  topic: item.category,
  type: item.category,
  recommendation_type: 'resource',
  title: item.title,
  description: item.description,
  difficulty: item.difficulty || 'intermediate',
});

// Get recommendations for user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const dbRecs = db.getUserRecommendations(req.params.userId, limit);

  if (dbRecs.length > 0) {
    return res.json({
      user_id: req.params.userId,
      recommendations: dbRecs.map(formatDbRec),
    });
  }

  // Fall back to knowledge base items personalized by profile
  const profile = db.getProfile(req.params.userId);
  let kbItems = profile?.major
    ? knowledgeBase.getForMajor(profile.major)
    : [];

  if (kbItems.length < limit) {
    const tips = knowledgeBase.getByCategory('study_tips');
    const seen = new Set(kbItems.map((i) => i.id));
    kbItems = [...kbItems, ...tips.filter((i) => !seen.has(i.id))];
  }

  res.json({
    user_id: req.params.userId,
    recommendations: kbItems.slice(0, limit).map(formatKbItem),
  });
}));

// Get saved recommendations for user (returns same as regular for now)
router.get('/user/:userId/saved', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const dbRecs = db.getUserRecommendations(req.params.userId, limit);

  if (dbRecs.length > 0) {
    return res.json({
      user_id: req.params.userId,
      recommendations: dbRecs.map(formatDbRec),
    });
  }

  const tips = knowledgeBase.getByCategory('study_tips').slice(0, limit);
  res.json({
    user_id: req.params.userId,
    recommendations: tips.map(formatKbItem),
  });
}));

module.exports = router;
