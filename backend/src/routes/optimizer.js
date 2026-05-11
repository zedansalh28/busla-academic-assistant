const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const db = require('../db/queries');
const { track } = require('../services/behaviorTracker');
const predictionEngine = require('../services/predictionEngine');
const memoryEngine = require('../services/memoryEngine');

const router = express.Router();

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const DIFFICULTY_WEIGHT = { easy: 1, medium: 1.5, hard: 2.5, 'very hard': 3.5 };

// Core scheduling algorithm
function generateSchedule(inputs) {
  const {
    courses = [],
    available_hours_per_week = 15,
    preferred_days = DAYS,
    weak_subjects = [],
    academic_stage = '2nd',
    exam_dates = [],
    deadlines = [],
  } = inputs;

  const warnings = [];
  const blocks = [];
  const reasons = {};

  if (!courses.length) {
    return { blocks: [], warnings: ['No courses provided. Add courses to generate a schedule.'], summary: '', total_hours: 0 };
  }

  // ── Step 1: score each course ────────────────────────────────────────────
  const now = Date.now();
  const scoredCourses = courses.map(c => {
    const diffWeight = DIFFICULTY_WEIGHT[c.difficulty] || 1.5;
    const weakBonus = weak_subjects.includes(c.name) ? 1.5 : 1;

    // Urgency: exam within 7 days → 2×, within 14 days → 1.5×
    let urgency = 1;
    const courseExam = exam_dates.find(e => e.course === c.name);
    if (courseExam) {
      const daysUntil = Math.max(0, (new Date(courseExam.date) - now) / 86400000);
      if (daysUntil <= 7) urgency = 2.2;
      else if (daysUntil <= 14) urgency = 1.6;
      else if (daysUntil <= 21) urgency = 1.2;
    }

    const score = diffWeight * weakBonus * urgency;
    return { ...c, score, urgency, diffWeight, weakBonus };
  });

  // Sort by score descending
  scoredCourses.sort((a, b) => b.score - a.score);

  // ── Step 2: allocate hours per course ────────────────────────────────────
  const totalScore = scoredCourses.reduce((s, c) => s + c.score, 0);
  const courseHours = scoredCourses.map(c => ({
    ...c,
    hours: Math.max(1, Math.round((c.score / totalScore) * available_hours_per_week)),
  }));

  // Total hours check
  const allocatedTotal = courseHours.reduce((s, c) => s + c.hours, 0);
  if (allocatedTotal > available_hours_per_week * 1.1) {
    warnings.push(`Your workload is heavy (${allocatedTotal}h/week needed). Consider reducing courses or increasing study hours.`);
  }
  if (available_hours_per_week < 8 && courses.length >= 3) {
    warnings.push('Only ' + available_hours_per_week + ' hours/week for ' + courses.length + ' courses. Risk of academic overload is high.');
  }

  // ── Step 3: distribute blocks across preferred days ─────────────────────
  const activeDays = preferred_days.length ? preferred_days : DAYS;
  const blockDuration = 90; // minutes per block

  // Track hard-subject count per day to avoid clustering
  const dayHardCount = {};
  activeDays.forEach(d => { dayHardCount[d] = 0; });

  const startHours = [16, 17, 18]; // default evening slots
  let dayIndex = 0;
  let slotIndex = 0;

  for (const course of courseHours) {
    let remainingMinutes = course.hours * 60;
    let reason = `${course.name} needs ~${course.hours}h/week`;
    if (course.weakBonus > 1) reason += ' (identified as a weak subject)';
    if (course.urgency > 1.5) reason += ' (exam coming soon — high priority)';
    else if (course.diffWeight >= 2.5) reason += ' (high difficulty course)';

    reasons[course.name] = reason;

    while (remainingMinutes > 0) {
      let day = activeDays[dayIndex % activeDays.length];
      // Avoid too many hard courses on same day
      if ((course.difficulty === 'hard' || course.difficulty === 'very hard') && dayHardCount[day] >= 2) {
        dayIndex++;
        day = activeDays[dayIndex % activeDays.length];
      }

      const startH = startHours[slotIndex % startHours.length];
      const durationMins = Math.min(blockDuration, remainingMinutes);
      const endH = startH + Math.ceil(durationMins / 60);

      blocks.push({
        course_name: course.name,
        day,
        start_time: `${String(startH).padStart(2, '0')}:00`,
        end_time: `${String(endH).padStart(2, '0')}:${durationMins % 60 === 0 ? '00' : '30'}`,
        block_type: course.urgency > 1.5 ? 'exam_prep' : (course.weakBonus > 1 ? 'weak_subject' : 'study'),
        priority: Math.round(course.score),
        reason: reasons[course.name],
      });

      if (course.difficulty === 'hard' || course.difficulty === 'very hard') {
        dayHardCount[day] = (dayHardCount[day] || 0) + 1;
      }

      remainingMinutes -= durationMins;
      dayIndex++;
      slotIndex++;
    }
  }

  // Sort blocks: by day then time
  const dayOrder = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  blocks.sort((a, b) => (dayOrder[a.day] - dayOrder[b.day]) || a.start_time.localeCompare(b.start_time));

  // ── Step 4: deadline warnings ─────────────────────────────────────────────
  for (const d of deadlines) {
    const daysLeft = Math.max(0, (new Date(d.date) - now) / 86400000);
    if (daysLeft <= 3) warnings.push(`URGENT: "${d.title}" deadline in ${Math.ceil(daysLeft)} day(s).`);
    else if (daysLeft <= 7) warnings.push(`"${d.title}" deadline in ${Math.ceil(daysLeft)} days — plan ahead.`);
  }
  for (const e of exam_dates) {
    const daysLeft = Math.max(0, (new Date(e.date) - now) / 86400000);
    if (daysLeft <= 5) warnings.push(`EXAM: ${e.course} exam in ${Math.ceil(daysLeft)} day(s) — increase study time.`);
  }

  const summary = buildSummary(courseHours, available_hours_per_week, warnings, academic_stage);

  return { blocks, warnings, summary, total_hours: allocatedTotal, course_breakdown: courseHours.map(c => ({ name: c.name, hours: c.hours, reason: reasons[c.name] })) };
}

function buildSummary(courseHours, totalHours, warnings, stage) {
  const top = courseHours.slice(0, 2).map(c => c.name).join(' and ');
  let s = `Your schedule uses ${totalHours} study hours/week. `;
  s += `Focus most on ${top}. `;
  if (stage === 'Preparatory' || stage === '1st') s += 'As an early-stage student, build strong foundations in math and programming first. ';
  if (stage === '4th' || stage === 'Final Project') s += 'Final-year students should dedicate milestone blocks to their final project each week. ';
  if (warnings.length) s += `There are ${warnings.length} warning(s) — review them carefully.`;
  return s;
}

// POST /api/optimizer/generate
router.post('/generate', asyncHandler(async (req, res) => {
  const { user_id, ...inputs } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  // Merge with user's existing courses if no courses provided
  if (!inputs.courses || !inputs.courses.length) {
    const userCourses = db.getUserCourses(user_id);
    inputs.courses = userCourses.map(c => ({ name: c.name, difficulty: 'medium' }));
  }

  // Merge profile data
  const profile = db.getProfile(user_id);
  if (profile) {
    if (!inputs.academic_stage) inputs.academic_stage = profile.year;
    if (!inputs.weak_subjects?.length && profile.subjects_of_interest) {
      // no defaults for weak subjects — leave empty unless user provided
    }
  }

  // Enrich with behavioral pattern data (weak subjects + burnout detection)
  const patterns = db.getUserPatterns(user_id);
  const patternWeakSubjects = patterns
    .filter(p => p.pattern_type === 'weak_subject' && p.value > 35)
    .map(p => p.subject)
    .filter(Boolean);
  inputs.weak_subjects = [...new Set([...(inputs.weak_subjects || []), ...patternWeakSubjects])];

  // Enrich weak_subjects with memory-tracked low-mastery concepts (< 50)
  try {
    const memoryConcepts = db.getLearningMemory(user_id);
    const lowMasterySubjects = memoryConcepts
      .filter(c => c.mastery_score < 50 && c.subject)
      .map(c => c.subject)
      .filter(Boolean);
    inputs.weak_subjects = [...new Set([...inputs.weak_subjects, ...lowMasterySubjects])];

    // Add forgetting alerts as warnings
    const forgettingAlerts = memoryEngine.getForgettingAlerts(user_id);
    if (forgettingAlerts.length > 0) {
      const names = forgettingAlerts.slice(0, 3).map(a => a.concept).join(', ');
      inputs._forgetting_warning = `${forgettingAlerts.length} concept(s) need revision (forgetting detected): ${names}`;
    }
  } catch (_) {}

  const burnoutPattern = patterns.find(p => p.pattern_type === 'burnout_risk');
  if (burnoutPattern && burnoutPattern.value > 60) {
    inputs.available_hours_per_week = Math.max(5, Math.round((inputs.available_hours_per_week || 15) * 0.75));
    inputs._recovery_mode = true;
  }

  const result = generateSchedule(inputs);

  // Add recovery note to summary if burnout mode was activated
  if (inputs._recovery_mode) {
    result.warnings.unshift('Recovery mode: weekly hours reduced by 25% — burnout risk detected from your recent activity patterns.');
  }
  if (inputs._forgetting_warning) {
    result.warnings.push(`🧠 ${inputs._forgetting_warning}. Use the Learning Brain to schedule targeted revision.`);
  }

  // Add failure risk warnings from prediction engine
  const prediction = predictionEngine.computeAndSave(user_id);
  if (prediction.failureRisk >= 65) {
    result.warnings.unshift(`⚠️ Critical failure risk (${prediction.failureRisk}%): Your generated schedule is in emergency mode. Visit the Predictions dashboard for a full recovery plan.`);
  } else if (prediction.failureRisk >= 40) {
    result.warnings.push(`📊 Failure risk is elevated at ${prediction.failureRisk}%. Follow this schedule consistently — missing blocks will increase risk further.`);
  }
  if (prediction.examFailureRisk >= 60) {
    result.warnings.push(`📝 Exam failure risk is high (${prediction.examFailureRisk}%). Exam-prep blocks have been prioritized automatically.`);
  }

  // Track behavior event
  track.optimizerUsed(user_id);

  // Persist schedule
  const weekStart = Date.now();
  const scheduleId = db.saveGeneratedSchedule(user_id, 'Weekly Study Schedule', weekStart, inputs, result.blocks);

  res.json({ schedule_id: scheduleId, ...result });
}));

// GET /api/optimizer/user/:userId
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const schedule = db.getLatestSchedule(req.params.userId);
  if (!schedule) return res.status(404).json({ error: 'No schedule found' });
  res.json(schedule);
}));

// POST /api/optimizer/save-to-planner
router.post('/save-to-planner', asyncHandler(async (req, res) => {
  const { user_id, blocks } = req.body;
  if (!user_id || !blocks?.length) return res.status(400).json({ error: 'user_id and blocks are required' });

  // Group blocks by course and create one plan per course
  const byCourse = {};
  for (const block of blocks) {
    if (!byCourse[block.course_name]) byCourse[block.course_name] = [];
    byCourse[block.course_name].push(block);
  }

  const created = [];
  for (const [course, courseBlocks] of Object.entries(byCourse)) {
    const plan = db.createStudyPlan(user_id, {
      title: `Study Plan: ${course}`,
      subject: course,
      deadline: null,
      milestones: [],
    });
    for (const block of courseBlocks) {
      db.createTask(plan.id, {
        title: `${block.day} ${block.start_time}–${block.end_time}: ${block.block_type.replace(/_/g, ' ')}`,
        description: block.reason || '',
        due_date: null,
      });
    }
    created.push(plan.id);
  }

  res.json({ created_plans: created.length, plan_ids: created });
}));

module.exports = router;
