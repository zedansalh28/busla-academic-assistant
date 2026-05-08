const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validators');
const db = require('../db/queries');

const router = express.Router();

// Create or update profile
router.post('/', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['major', 'year', 'learning_style']);
  const userId = req.body.userId || require('uuid').v4();
  const profile = db.createOrUpdateProfile(userId, req.body);
  res.status(201).json(profile);
}));

// Get profile
router.get('/:userId', asyncHandler(async (req, res) => {
  const profile = db.getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

// Update profile
router.put('/:userId', asyncHandler(async (req, res) => {
  const profile = db.createOrUpdateProfile(req.params.userId, req.body);
  res.json(profile);
}));

// Delete profile and user
router.delete('/:userId', asyncHandler(async (req, res) => {
  db.deleteUser(req.params.userId);
  res.json({ status: 'deleted', userId: req.params.userId });
}));

module.exports = router;
