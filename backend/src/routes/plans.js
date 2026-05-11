const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validators');
const db = require('../db/queries');
const knowledgeBase = require('../utils/knowledgeBase');
const { track } = require('../services/behaviorTracker');

const router = express.Router();

// ==================== PLANS ====================

// Create plan
router.post('/', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['user_id', 'title', 'subject']);
  const plan = db.createStudyPlan(req.body.user_id, req.body);
  track.planCreated(req.body.user_id);
  res.status(201).json(plan);
}));

// Get all plans for user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const plans = db.getUserPlans(req.params.userId);
  res.json({ plans });
}));

// Update task (must be before /:planId to avoid route conflict)
router.put('/tasks/:taskId', asyncHandler(async (req, res) => {
  const task = db.updateTask(req.params.taskId, req.body);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.recalculatePlanProgress(task.plan_id);
  if (req.body.status === 'completed') {
    const plan = db.getPlan(task.plan_id);
    track.taskCompleted(plan?.user_id, plan?.subject);
  }
  res.json(task);
}));

// Delete task
router.delete('/tasks/:taskId', asyncHandler(async (req, res) => {
  const task = db.getTask(req.params.taskId);
  db.deleteTask(req.params.taskId);
  if (task) db.recalculatePlanProgress(task.plan_id);
  res.json({ status: 'deleted', taskId: req.params.taskId });
}));

// Get recommendations for a plan
router.get('/:planId/recommendations', asyncHandler(async (req, res) => {
  const plan = db.getPlan(req.params.planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  let kbItems = knowledgeBase.search(plan.subject || '', null).slice(0, 5);

  if (kbItems.length === 0) {
    kbItems = knowledgeBase.getForMajor(plan.subject).slice(0, 5);
  }

  if (kbItems.length === 0) {
    kbItems = knowledgeBase.getByCategory('study_tips').slice(0, 5);
  }

  const recommendations = kbItems.map((item) => ({
    id: item.id,
    topic: item.category,
    type: item.category,
    recommendation_type: 'resource',
    title: item.title,
    description: item.description,
    difficulty: item.difficulty || 'intermediate',
  }));

  res.json({ plan_id: req.params.planId, recommendations });
}));

// Get specific plan
router.get('/:planId', asyncHandler(async (req, res) => {
  const plan = db.getPlan(req.params.planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  res.json(plan);
}));

// Update plan
router.put('/:planId', asyncHandler(async (req, res) => {
  const plan = db.updateStudyPlan(req.params.planId, req.body);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  res.json(plan);
}));

// Delete plan
router.delete('/:planId', asyncHandler(async (req, res) => {
  db.deletePlan(req.params.planId);
  res.json({ status: 'deleted', planId: req.params.planId });
}));

// ==================== TASKS ====================

// Add task to plan
router.post('/:planId/tasks', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['title']);
  const task = db.createTask(req.params.planId, req.body);
  db.recalculatePlanProgress(req.params.planId);
  res.status(201).json(task);
}));

// Get tasks for plan
router.get('/:planId/tasks', asyncHandler(async (req, res) => {
  const tasks = db.getPlanTasks(req.params.planId);
  res.json({ tasks });
}));

module.exports = router;
