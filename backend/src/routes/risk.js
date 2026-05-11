const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');
const { track } = require('../services/behaviorTracker');

const router = express.Router();

function calculateRisk(inputs) {
  const {
    active_courses = [],
    available_hours = 15,
    upcoming_exams = 0,
    days_until_nearest_exam = 30,
    missed_tasks = 0,
    total_tasks = 0,
    self_stress_level = 3,   // 1–5
    has_final_project = false,
    academic_stage = '2nd',
    planner_completion_rate = 100, // 0–100
  } = inputs;

  let score = 0;
  const factors = [];
  const recommendations = [];

  const hardCourses = active_courses.filter(c => c.difficulty === 'hard' || c.difficulty === 'very hard').length;
  const totalCourses = active_courses.length;

  // ── Scoring rules ───────────────────────────────────────────────────────

  // 1. Number of hard courses
  if (hardCourses >= 3) { score += 20; factors.push({ label: `${hardCourses} hard/very-hard courses this semester`, weight: 20 }); }
  else if (hardCourses === 2) { score += 12; factors.push({ label: '2 hard courses this semester', weight: 12 }); }
  else if (hardCourses === 1) { score += 5; factors.push({ label: '1 hard course this semester', weight: 5 }); }

  // 2. Total course load
  if (totalCourses >= 6) { score += 15; factors.push({ label: `${totalCourses} active courses (heavy load)`, weight: 15 }); }
  else if (totalCourses >= 4) { score += 7; factors.push({ label: `${totalCourses} active courses`, weight: 7 }); }

  // 3. Available study hours
  if (available_hours < 6) { score += 20; factors.push({ label: `Only ${available_hours}h/week available for study`, weight: 20 }); }
  else if (available_hours < 10) { score += 12; factors.push({ label: `Limited study time: ${available_hours}h/week`, weight: 12 }); }
  else if (available_hours < 15) { score += 5; factors.push({ label: `Moderate study time: ${available_hours}h/week`, weight: 5 }); }

  // 4. Upcoming exams proximity
  if (upcoming_exams >= 2 && days_until_nearest_exam <= 7) { score += 20; factors.push({ label: `${upcoming_exams} exams within 7 days`, weight: 20 }); }
  else if (upcoming_exams >= 1 && days_until_nearest_exam <= 7) { score += 12; factors.push({ label: 'Exam within 7 days', weight: 12 }); }
  else if (upcoming_exams >= 1 && days_until_nearest_exam <= 14) { score += 6; factors.push({ label: 'Exam within 2 weeks', weight: 6 }); }

  // 5. Missed / overdue tasks
  if (total_tasks > 0) {
    const missedRate = missed_tasks / total_tasks;
    if (missedRate >= 0.5) { score += 15; factors.push({ label: `${Math.round(missedRate * 100)}% of tasks overdue`, weight: 15 }); }
    else if (missedRate >= 0.25) { score += 8; factors.push({ label: `${Math.round(missedRate * 100)}% of tasks overdue`, weight: 8 }); }
  }

  // 6. Planner completion rate
  if (planner_completion_rate < 30) { score += 10; factors.push({ label: `Low planner completion: ${planner_completion_rate}%`, weight: 10 }); }
  else if (planner_completion_rate < 60) { score += 5; factors.push({ label: `Moderate planner completion: ${planner_completion_rate}%`, weight: 5 }); }

  // 7. Self-reported stress
  if (self_stress_level >= 5) { score += 10; factors.push({ label: 'High self-reported stress level', weight: 10 }); }
  else if (self_stress_level >= 4) { score += 5; factors.push({ label: 'Moderate-high stress level', weight: 5 }); }

  // 8. Final project without milestone tracking
  if (has_final_project && planner_completion_rate < 50) {
    score += 8; factors.push({ label: 'Final project active but low task completion', weight: 8 });
  }

  // 9. Academic stage — preparatory students have extra foundation pressure
  if ((academic_stage === 'Preparatory' || academic_stage === '1st') && hardCourses >= 2) {
    score += 5; factors.push({ label: 'Early-stage student with multiple hard courses', weight: 5 });
  }

  score = Math.min(100, Math.max(0, score));
  const level = score <= 35 ? 'low' : score <= 65 ? 'medium' : 'high';

  // ── Recommendations ─────────────────────────────────────────────────────
  if (level === 'high') {
    recommendations.push('Immediate action recommended — create a focused 7-day study plan.');
    recommendations.push('Consider using the Study Schedule Optimizer to redistribute your workload.');
    if (hardCourses >= 2) recommendations.push(`Prioritize your hardest courses: ${active_courses.filter(c => c.difficulty === 'hard' || c.difficulty === 'very hard').map(c => c.name).join(', ')}.`);
    if (available_hours < 10) recommendations.push('Try to free up at least 2–3 extra hours this week by reducing non-academic activities.');
    recommendations.push('Talk to your lecturer or academic advisor — they can help with exam focus areas.');
  } else if (level === 'medium') {
    recommendations.push('Your workload is manageable but needs attention. Stay consistent this week.');
    if (missed_tasks > 0) recommendations.push(`Complete ${missed_tasks} overdue task(s) before taking on new work.`);
    if (upcoming_exams > 0) recommendations.push('Start exam preparation now — use spaced repetition for difficult topics.');
    recommendations.push('Use the Study Schedule Optimizer to build a structured plan.');
  } else {
    recommendations.push('Academic load looks balanced. Keep up the good work!');
    recommendations.push('Continue completing planner tasks on schedule.');
    if (upcoming_exams > 0) recommendations.push('Stay ahead of upcoming exams with regular review sessions.');
  }

  if (has_final_project && (academic_stage === '4th' || academic_stage === 'Final Project')) {
    recommendations.push('Dedicate at least 2 milestone blocks per week to your final project.');
  }

  // Sort factors by weight descending
  factors.sort((a, b) => b.weight - a.weight);

  return { score, level, factors, recommendations };
}

// POST /api/risk/analyze
router.post('/analyze', asyncHandler(async (req, res) => {
  const { user_id, ...inputs } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  // Auto-populate from existing planner data if available
  const plans = db.getUserPlans(user_id);
  let totalTasks = 0, missedTasks = 0, completedTasks = 0;
  for (const plan of plans) {
    const tasks = db.getPlanTasks(plan.id);
    totalTasks += tasks.length;
    completedTasks += tasks.filter(t => t.status === 'completed').length;
    missedTasks += tasks.filter(t => t.status === 'pending' && t.due_date && t.due_date < Date.now()).length;
  }
  const plannerCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const enriched = {
    ...inputs,
    total_tasks: inputs.total_tasks ?? totalTasks,
    missed_tasks: inputs.missed_tasks ?? missedTasks,
    planner_completion_rate: inputs.planner_completion_rate ?? plannerCompletion,
  };

  // Add user courses if not provided
  if (!inputs.active_courses?.length) {
    const courses = db.getUserCourses(user_id);
    enriched.active_courses = courses.map(c => ({ name: c.name, difficulty: 'medium' }));
  }

  const result = calculateRisk(enriched);

  db.saveRiskAssessment(user_id, result.score, result.level, result.factors, result.recommendations);
  track.riskChecked(user_id, result.level);

  res.json({ ...result, inputs_used: enriched });
}));

// GET /api/risk/user/:userId/latest
router.get('/user/:userId/latest', asyncHandler(async (req, res) => {
  const assessment = db.getLatestRiskAssessment(req.params.userId);
  if (!assessment) return res.status(404).json({ error: 'No risk assessment found' });
  res.json(assessment);
}));

// POST /api/risk/recovery-plan  — returns actionable recovery steps
router.post('/recovery-plan', asyncHandler(async (req, res) => {
  const { user_id, score, level, factors } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const topFactors = (factors || []).slice(0, 3).map(f => f.label);
  const plan = {
    title: 'Your 7-Day Recovery Plan',
    steps: [],
  };

  if (level === 'high' || score >= 66) {
    plan.steps = [
      { day: 'Today', action: 'List all pending tasks and rank by deadline. Cancel anything non-urgent.' },
      { day: 'Day 2', action: 'Open the Study Optimizer and generate a new schedule with your current courses.' },
      { day: 'Day 3–4', action: `Focus study sessions on your top risk areas: ${topFactors[0] || 'hard courses'}.` },
      { day: 'Day 5', action: 'Schedule a meeting with your lecturer or advisor about upcoming exams.' },
      { day: 'Day 6–7', action: 'Complete at least 3 overdue planner tasks and review progress.' },
    ];
  } else if (level === 'medium') {
    plan.steps = [
      { day: 'Today', action: 'Review your planner and mark overdue tasks. Reschedule instead of skipping.' },
      { day: 'Day 2–3', action: 'Generate a study schedule using the Optimizer for structured time allocation.' },
      { day: 'Day 4–5', action: `Spend extra sessions on: ${topFactors[0] || 'your hardest subject'}.` },
      { day: 'Day 6–7', action: 'Check off completed tasks and do a mini-review of what you studied.' },
    ];
  } else {
    plan.steps = [
      { day: 'This week', action: 'Maintain your current pace. Review upcoming deadlines and exams.' },
      { day: 'Mid-week', action: 'Add new planner tasks for the coming weeks to stay ahead.' },
      { day: 'Weekend', action: 'Do a light review of challenging topics to reinforce memory.' },
    ];
  }

  res.json(plan);
}));

module.exports = router;
