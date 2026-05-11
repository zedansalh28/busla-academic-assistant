#!/usr/bin/env node
/**
 * Busla Intelligence Demo Seeder
 *
 * Populates a realistic SCE student profile with full intelligence data:
 * - Study plans + tasks
 * - 40+ behavior events
 * - Learning memory (27 concepts at varied mastery)
 * - Forgetting alerts (old interactions)
 * - Knowledge gaps
 * - Analytics patterns + adaptive prefs
 * - Prediction history
 * - Risk assessments
 *
 * Usage: node scripts/seed-demo.js [userId]
 *   - With no args: creates a new user and prints the ID
 *   - With userId: seeds into an existing user (e.g. demo user from /api/demo/load/0)
 */

require('dotenv').config();
const db = require('../src/db/queries');
const rawDb = require('../src/db/connection');
const { initializeDatabase } = require('../src/db/schema');
const memoryEngine = require('../src/services/memoryEngine');
const patternEngine = require('../src/services/patternEngine');
const adaptiveEngine = require('../src/services/adaptiveEngine');
const predictionEngine = require('../src/services/predictionEngine');
const interventionEngine = require('../src/services/interventionEngine');

initializeDatabase();

const DAY = 86400000;
const HOUR = 3600000;
const now = Date.now();

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(d) { return now - d * DAY; }
function hoursAgo(h) { return now - h * HOUR; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function insertEvent(userId, eventType, subject, metadata = {}, daysBack = 0) {
  const ts = daysAgo(daysBack) + rand(0, HOUR * 8);
  rawDb.prepare(`
    INSERT INTO behavior_events (id, user_id, event_type, subject, metadata_json, session_hour, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(require('uuid').v4(), userId, eventType, subject || null, JSON.stringify(metadata), rand(9, 22), ts);
}

// ── Main seeder ───────────────────────────────────────────────────────────────

function seedUser(userId) {
  console.log(`\nSeeding intelligence data for user: ${userId}`);

  // ── 1. Study Plans ──────────────────────────────────────────────────────────
  console.log('  Creating study plans...');

  const plan1 = db.createStudyPlan(userId, { title: 'Calculus 2 — Final Exam Prep', subject: 'Calculus 2', deadline: daysAgo(-7) });
  const plan1Id = plan1.id;
  rawDb.prepare('UPDATE study_plans SET progress=?, updated_at=? WHERE id=?').run(65, now, plan1Id);
  const tasks1 = [
    { title: 'Review integration techniques (u-sub, IBP)', status: 'completed', due: daysAgo(5) },
    { title: 'Practice series convergence tests', status: 'completed', due: daysAgo(3) },
    { title: 'Fourier Series introduction', status: 'in-progress', due: daysAgo(-2) },
    { title: 'Complete past exam paper 2023', status: 'pending', due: daysAgo(-4) },
    { title: 'Taylor series approximations', status: 'pending', due: daysAgo(-6) },
  ];
  for (const t of tasks1) {
    rawDb.prepare(`INSERT INTO study_tasks (id, plan_id, title, status, due_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(require('uuid').v4(), plan1Id, t.title, t.status, t.due, daysAgo(10), now);
  }

  const plan2 = db.createStudyPlan(userId, { title: 'Data Structures Midterm', subject: 'Data Structures', deadline: daysAgo(-3) });
  const plan2Id = plan2.id;
  rawDb.prepare('UPDATE study_plans SET progress=?, updated_at=? WHERE id=?').run(30, now, plan2Id);
  const tasks2 = [
    { title: 'Binary trees — insertion and traversal', status: 'completed', due: daysAgo(2) },
    { title: 'Hash tables and collision resolution', status: 'in-progress', due: daysAgo(-1) },
    { title: 'Graphs — BFS and DFS', status: 'pending', due: daysAgo(-3) },
    { title: 'Dynamic programming intro', status: 'pending', due: daysAgo(-5) },
  ];
  for (const t of tasks2) {
    rawDb.prepare(`INSERT INTO study_tasks (id, plan_id, title, status, due_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(require('uuid').v4(), plan2Id, t.title, t.status, t.due, daysAgo(8), now);
  }

  const plan3 = db.createStudyPlan(userId, { title: 'Linear Algebra — Recovery Plan', subject: 'Linear Algebra', deadline: daysAgo(2) });
  const plan3Id = plan3.id;
  rawDb.prepare('UPDATE study_plans SET progress=?, updated_at=? WHERE id=?').run(10, now, plan3Id);
  for (const t of [
    { title: 'Matrix multiplication fundamentals', status: 'in-progress', due: daysAgo(-1) },
    { title: 'Eigenvalues and eigenvectors', status: 'pending', due: daysAgo(-4) },
    { title: 'Linear transformations practice', status: 'pending', due: daysAgo(-7) },
  ]) {
    rawDb.prepare(`INSERT INTO study_tasks (id, plan_id, title, status, due_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(require('uuid').v4(), plan3Id, t.title, t.status, t.due, daysAgo(3), now);
  }

  // ── 2. Behavior Events ──────────────────────────────────────────────────────
  console.log('  Creating behavior events...');

  // Chat messages over 3 weeks
  const chatTopics = [
    ['calculus', 'Calculus 2'], ['derivatives', 'Calculus 2'], ['integrals', 'Calculus 2'],
    ['recursion', 'Programming'], ['sorting', 'Programming'], ['sorting', 'Programming'],
    ['linked list', 'Data Structures'], ['binary tree', 'Data Structures'],
    ['matrix', 'Linear Algebra'], ['eigenvalue', 'Linear Algebra'], ['eigenvalue', 'Linear Algebra'],
    ['oop', 'Programming'], ['sql', 'Databases'],
    ['dynamic programming', 'Programming'], ['dynamic programming', 'Programming'],
    ['recursion', 'Programming'],
  ];
  chatTopics.forEach(([topic, subj], i) => insertEvent(userId, 'chat_message', subj, { topic }, rand(1, 14)));

  // Page views
  ['dashboard', 'analytics', 'predictions', 'optimizer', 'learning_brain', 'planner', 'chat']
    .forEach((page, i) => insertEvent(userId, 'page_view', null, { page }, rand(0, 7)));

  // Task events
  for (let i = 0; i < 8; i++) insertEvent(userId, 'task_created', 'Calculus 2', {}, rand(3, 10));
  for (let i = 0; i < 4; i++) insertEvent(userId, 'task_completed', 'Calculus 2', {}, rand(0, 5));
  for (let i = 0; i < 3; i++) insertEvent(userId, 'task_created', 'Data Structures', {}, rand(1, 8));

  // Late-night study sessions (burnout signal)
  for (let i = 0; i < 5; i++) {
    const ts = daysAgo(rand(1, 10)) + (22 + rand(0, 2)) * HOUR;
    rawDb.prepare(`INSERT INTO behavior_events (id, user_id, event_type, subject, metadata_json, session_hour, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(require('uuid').v4(), userId, 'chat_message', 'Calculus 2', '{}', 23, ts);
  }

  // ── 3. Weak Topics ──────────────────────────────────────────────────────────
  console.log('  Creating weak topics...');
  const weakTopicEntries = [
    ['Eigenvalues', 'Linear Algebra', 3],
    ['Dynamic Programming', 'Programming', 4],
    ['Fourier Series', 'Calculus 2', 2],
    ['Recursion', 'Programming', 2],
  ];
  for (const [topic, course, count] of weakTopicEntries) {
    for (let i = 0; i < count; i++) db.upsertWeakTopic(userId, topic, course);
  }

  // ── 4. AI Interaction Metrics ───────────────────────────────────────────────
  console.log('  Creating AI interaction metrics...');
  const aiInteractions = [
    ['Dynamic Programming', true, 'confused'],
    ['Eigenvalues', true, 'confused'],
    ['Fourier Series', false, 'unknown'],
    ['Recursion', false, 'understood'],
    ['OOP', false, 'understood'],
    ['SQL Basics', false, 'unknown'],
    ['Dynamic Programming', true, 'confused'],
    ['Eigenvalues', false, 'unknown'],
  ];
  for (const [topic, isRepeat, level] of aiInteractions) {
    db.addAIInteraction(userId, topic, isRepeat, level);
  }

  // ── 5. Learning Memory — Concept Mastery ────────────────────────────────────
  console.log('  Creating learning memory (concept mastery)...');

  const concepts = [
    // Well-mastered
    { concept: 'OOP', subject: 'Programming', mastery: 78, confidence: 80, struggles: 0, days: 2 },
    { concept: 'Recursion', subject: 'Programming', mastery: 68, confidence: 65, struggles: 1, days: 4 },
    { concept: 'DC Circuits', subject: 'Electrical Engineering', mastery: 72, confidence: 70, struggles: 0, days: 6 },
    { concept: 'Derivatives', subject: 'Calculus', mastery: 71, confidence: 68, struggles: 0, days: 3 },
    { concept: 'SQL Basics', subject: 'Databases', mastery: 70, confidence: 75, struggles: 0, days: 5 },
    // Moderate
    { concept: 'Integrals', subject: 'Calculus', mastery: 55, confidence: 50, struggles: 2, days: 7 },
    { concept: 'Data Structures', subject: 'Programming', mastery: 53, confidence: 55, struggles: 1, days: 3 },
    { concept: 'Sorting Algorithms', subject: 'Programming', mastery: 58, confidence: 52, struggles: 2, days: 8 },
    // Struggling
    { concept: 'Linear Algebra', subject: 'Mathematics', mastery: 34, confidence: 28, struggles: 5, days: 1 },
    { concept: 'Differential Equations', subject: 'Mathematics', mastery: 27, confidence: 22, struggles: 6, days: 2 },
    { concept: 'Dynamic Programming', subject: 'Programming', mastery: 32, confidence: 25, struggles: 7, days: 1 },
    { concept: 'Series & Sequences', subject: 'Calculus', mastery: 38, confidence: 35, struggles: 4, days: 2 },
    // Forgetting (old last_interaction)
    { concept: 'Graph Algorithms', subject: 'Programming', mastery: 60, confidence: 55, struggles: 1, days: 22 },
    { concept: 'Pointers', subject: 'Programming', mastery: 64, confidence: 60, struggles: 0, days: 18 },
    { concept: 'Limits', subject: 'Calculus', mastery: 65, confidence: 62, struggles: 0, days: 25 },
    { concept: 'Probability', subject: 'Mathematics', mastery: 55, confidence: 52, struggles: 1, days: 20 },
  ];

  for (const c of concepts) {
    const lastInteraction = daysAgo(c.days);
    const firstSeen = daysAgo(c.days + rand(10, 30));
    const retention = Math.round(memoryEngine.computeRetention(c.mastery, lastInteraction));
    rawDb.prepare(`
      INSERT OR REPLACE INTO learning_memory
        (id, user_id, concept, subject, mastery_score, confidence_score, retention_score,
         struggle_count, revision_count, interaction_count, last_interaction, first_seen, explanation_type_preferred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      require('uuid').v4(), userId, c.concept, c.subject,
      c.mastery, c.confidence, retention,
      c.struggles, rand(2, 8), rand(3, 12),
      lastInteraction, firstSeen, 'example_based'
    );

    // Log a mastery event
    rawDb.prepare(`
      INSERT INTO concept_mastery_log (id, user_id, concept, subject, mastery_before, mastery_after, event_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(require('uuid').v4(), userId, c.concept, c.subject,
      Math.max(10, c.mastery - rand(5, 15)), c.mastery, 'chat_interaction', lastInteraction);
  }

  // ── 6. Knowledge Gaps ───────────────────────────────────────────────────────
  console.log('  Creating knowledge gaps...');
  const gaps = [
    { weak: 'Dynamic Programming', prereq: 'Recursion', subject: 'Programming', severity: 75 },
    { weak: 'Differential Equations', prereq: 'Integrals', subject: 'Mathematics', severity: 68 },
    { weak: 'Dynamic Programming', prereq: 'Sorting Algorithms', subject: 'Programming', severity: 55 },
    { weak: 'Graph Algorithms', prereq: 'Data Structures', subject: 'Programming', severity: 45 },
  ];
  for (const g of gaps) {
    rawDb.prepare(`
      INSERT OR IGNORE INTO knowledge_gaps
        (id, user_id, weak_concept, missing_prerequisite, subject, gap_severity, is_resolved, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(require('uuid').v4(), userId, g.weak, g.prereq, g.subject, g.severity, daysAgo(rand(1, 7)));
  }

  // ── 7. Explanation Effectiveness ────────────────────────────────────────────
  console.log('  Creating explanation effectiveness...');
  const explTypes = [
    { type: 'example_based', success: 8, fail: 2 },
    { type: 'step_by_step', success: 5, fail: 3 },
    { type: 'theoretical', success: 2, fail: 4 },
    { type: 'practice', success: 3, fail: 1 },
  ];
  for (const e of explTypes) {
    const score = Math.round((e.success / (e.success + e.fail)) * 100);
    rawDb.prepare(`
      INSERT OR REPLACE INTO explanation_effectiveness
        (id, user_id, explanation_type, success_count, fail_count, effectiveness_score, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(require('uuid').v4(), userId, e.type, e.success, e.fail, score, now);
  }

  // ── 8. Memory Snapshots (7-day history) ─────────────────────────────────────
  console.log('  Creating memory evolution snapshots...');
  const snapshotData = [
    { days: 14, mastery: 38, concepts: 8, improving: 2, declining: 1, forgetting: 0 },
    { days: 10, mastery: 40, concepts: 10, improving: 3, declining: 2, forgetting: 0 },
    { days: 7, mastery: 43, concepts: 12, improving: 3, declining: 2, forgetting: 1 },
    { days: 5, mastery: 47, concepts: 14, improving: 4, declining: 1, forgetting: 2 },
    { days: 3, mastery: 50, concepts: 15, improving: 5, declining: 2, forgetting: 3 },
    { days: 1, mastery: 53, concepts: 16, improving: 5, declining: 3, forgetting: 4 },
  ];
  for (const s of snapshotData) {
    rawDb.prepare(`
      INSERT OR REPLACE INTO memory_snapshots
        (id, user_id, snapshot_date, overall_mastery, concept_count, improving_count, declining_count, forgetting_count, snapshot_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?)
    `).run(require('uuid').v4(), userId, daysAgo(s.days), s.mastery, s.concepts, s.improving, s.declining, s.forgetting, daysAgo(s.days));
  }

  // ── 9. Risk Assessments ─────────────────────────────────────────────────────
  console.log('  Creating risk assessment history...');
  const riskFactors = JSON.stringify([
    { label: '2 hard courses this semester', weight: 12, severity: 'high' },
    { label: 'Average plan progress low: 35%', weight: 12, severity: 'high' },
    { label: '3 upcoming exams within 14 days', weight: 15, severity: 'critical' },
  ]);
  const riskRecs = JSON.stringify([
    'Reduce social commitments for the next 2 weeks',
    'Use the Schedule Optimizer to redistribute workload',
    'Focus on one subject per day instead of switching',
  ]);
  rawDb.prepare(`
    INSERT INTO risk_assessments (id, user_id, score, level, factors_json, recommendations_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(require('uuid').v4(), userId, 62, 'high', riskFactors, riskRecs, daysAgo(1));

  // ── 10. Run Pattern + Adaptive + Prediction Engines ─────────────────────────
  console.log('  Running intelligence engines...');

  const patterns = patternEngine.computeAndSave(userId);
  console.log('    Pattern engine:', patterns.length, 'patterns');

  const adaptPrefs = adaptiveEngine.computeAndSave(userId, patterns);
  console.log('    Adaptive engine:', adaptPrefs ? 'prefs saved' : 'no prefs (expected)');

  memoryEngine.computeAndSaveProfile(userId);
  console.log('    Memory profile: computed');

  const prediction = predictionEngine.computeAndSave(userId, true);
  console.log('    Prediction engine: health=' + prediction.overallHealth + ', examRisk=' + prediction.examFailureRisk);

  const interventions = interventionEngine.generateInterventions(prediction);
  db.saveInterventions(userId, interventions);
  console.log('    Interventions:', interventions.length, 'generated');

  // ── 11. Weekly performance history ──────────────────────────────────────────
  for (let w = 4; w >= 0; w--) {
    const weekStart = daysAgo(w * 7 + 6);
    db.recordWeeklyPerformance(userId, weekStart, {
      tasks_completed: rand(2, 6),
      tasks_total: rand(6, 10),
      study_events: rand(5, 15),
      chat_sessions: rand(3, 8),
      risk_score: rand(40, 75),
      productivity_score: rand(40, 75),
    });
  }

  console.log(`\n✓ Seed complete for user: ${userId}`);
  console.log(`  Plans: 3 | Concepts: ${concepts.length} | Events: 40+ | Gaps: ${gaps.length} | Interventions: ${interventions.length}`);
  return userId;
}

// ── CLI Entry ─────────────────────────────────────────────────────────────────

const argUserId = process.argv[2];

if (argUserId) {
  // Seed into existing user
  const exists = rawDb.prepare('SELECT id FROM users WHERE id = ?').get(argUserId);
  if (!exists) {
    console.error(`User ${argUserId} not found`);
    process.exit(1);
  }
  seedUser(argUserId);
} else {
  // Create new demo user
  const userId = db.createUser();
  const profile = {
    major: 'Software Engineering',
    year: '2nd',
    learning_style: 'Visual',
    difficulty_level: 'intermediate',
    subjects_of_interest: ['Data Structures', 'Calculus 2', 'Linear Algebra', 'Programming'],
    language_preference: 'en',
  };
  db.createOrUpdateProfile(userId, profile);
  const sessionId = db.createSession(userId);
  seedUser(userId);
  console.log(`\n→ userId: ${userId}`);
  console.log(`→ sessionId: ${sessionId}`);
  console.log(`\nSet in localStorage to use in browser:`);
  console.log(`  localStorage.setItem('busla_user_id', '${userId}')`);
  console.log(`  localStorage.setItem('busla_session_id', '${sessionId}')`);
}

process.exit(0);
