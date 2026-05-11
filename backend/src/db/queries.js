const db = require('./connection');
const { v4: uuidv4 } = require('uuid');

// ==================== USERS ====================

const createUser = () => {
  const userId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO users (id, created_at, updated_at)
    VALUES (?, ?, ?)
  `);

  stmt.run(userId, now, now);
  return userId;
};

const getUser = (userId) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
};

const deleteUser = (userId) => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(userId);
};

// ==================== USER PROFILES ====================

const createOrUpdateProfile = (userId, profileData) => {
  const now = Date.now();
  const existing = db.prepare('SELECT id FROM user_profiles WHERE id = ?').get(userId);

  if (existing) {
    const stmt = db.prepare(`
      UPDATE user_profiles
      SET major = ?, year = ?, learning_style = ?, 
          subjects_of_interest = ?, language_preference = ?, 
          difficulty_level = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      profileData.major,
      profileData.year,
      profileData.learning_style,
      JSON.stringify(profileData.subjects_of_interest || []),
      profileData.language_preference || 'en',
      profileData.difficulty_level,
      now,
      userId
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO user_profiles 
      (id, major, year, learning_style, subjects_of_interest, language_preference, difficulty_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      profileData.major,
      profileData.year,
      profileData.learning_style,
      JSON.stringify(profileData.subjects_of_interest || []),
      profileData.language_preference || 'en',
      profileData.difficulty_level,
      now,
      now
    );
  }

  return getProfile(userId);
};

const getProfile = (userId) => {
  const stmt = db.prepare('SELECT * FROM user_profiles WHERE id = ?');
  const profile = stmt.get(userId);

  if (profile && profile.subjects_of_interest) {
    profile.subjects_of_interest = JSON.parse(profile.subjects_of_interest);
  }

  return profile;
};

// ==================== SESSIONS ====================

const createSession = (userId) => {
  const sessionId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, last_activity)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(sessionId, userId, now, now);
  return sessionId;
};

const getSession = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(sessionId);
};

const updateSessionActivity = (sessionId) => {
  const stmt = db.prepare('UPDATE sessions SET last_activity = ? WHERE id = ?');
  return stmt.run(Date.now(), sessionId);
};

// ==================== MESSAGES ====================

const addMessage = (sessionId, role, content, contextType = 'general', courseId = null) => {
  const messageId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, context_type, course_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(messageId, sessionId, role, content, contextType, courseId, now);
  return messageId;
};

const getConversationHistory = (sessionId, contextType = 'general', courseId = null) => {
  if (courseId) {
    const stmt = db.prepare(`
      SELECT role, content, created_at FROM messages
      WHERE session_id = ? AND course_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(sessionId, courseId);
  }
  const stmt = db.prepare(`
    SELECT role, content, created_at FROM messages
    WHERE session_id = ? AND (context_type = ? OR context_type IS NULL)
    ORDER BY created_at ASC
  `);
  return stmt.all(sessionId, contextType);
};

const clearConversationHistory = (sessionId, contextType = 'general', courseId = null) => {
  if (courseId) {
    const stmt = db.prepare('DELETE FROM messages WHERE session_id = ? AND course_id = ?');
    return stmt.run(sessionId, courseId);
  }
  const stmt = db.prepare('DELETE FROM messages WHERE session_id = ? AND (context_type = ? OR context_type IS NULL)');
  return stmt.run(sessionId, contextType);
};

// ==================== CONVERSATIONS ====================

const createConversation = (sessionId, userId) => {
  const conversationId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO conversations (id, session_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(conversationId, sessionId, userId, now);
  return conversationId;
};

const updateConversationMetadata = (conversationId, topic, turnCount) => {
  const stmt = db.prepare(`
    UPDATE conversations 
    SET topic = ?, turn_count = ?
    WHERE id = ?
  `);

  return stmt.run(topic, turnCount, conversationId);
};

// ==================== STUDY PLANS ====================

const createStudyPlan = (userId, planData) => {
  const planId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO study_plans 
    (id, user_id, title, subject, deadline, milestones, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    planId,
    userId,
    planData.title,
    planData.subject,
    planData.deadline || null,
    JSON.stringify(planData.milestones || []),
    now,
    now
  );

  return getPlan(planId);
};

const getPlan = (planId) => {
  const stmt = db.prepare('SELECT * FROM study_plans WHERE id = ?');
  const plan = stmt.get(planId);

  if (plan && plan.milestones) {
    plan.milestones = JSON.parse(plan.milestones);
  }

  return plan;
};

const getUserPlans = (userId) => {
  const stmt = db.prepare('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC');
  const plans = stmt.all(userId);

  return plans.map(plan => {
    if (plan.milestones) {
      plan.milestones = JSON.parse(plan.milestones);
    }
    return plan;
  });
};

const updateStudyPlan = (planId, updateData) => {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE study_plans
    SET title = COALESCE(?, title),
        subject = COALESCE(?, subject),
        deadline = COALESCE(?, deadline),
        milestones = COALESCE(?, milestones),
        progress = COALESCE(?, progress),
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updateData.title || null,
    updateData.subject || null,
    updateData.deadline || null,
    updateData.milestones ? JSON.stringify(updateData.milestones) : null,
    updateData.progress || null,
    now,
    planId
  );

  return getPlan(planId);
};

const deletePlan = (planId) => {
  const stmt = db.prepare('DELETE FROM study_plans WHERE id = ?');
  return stmt.run(planId);
};

// ==================== STUDY TASKS ====================

const createTask = (planId, taskData) => {
  const taskId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO study_tasks
    (id, plan_id, title, description, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    taskId,
    planId,
    taskData.title,
    taskData.description || null,
    taskData.due_date || null,
    now,
    now
  );

  return getTask(taskId);
};

const getTask = (taskId) => {
  const stmt = db.prepare('SELECT * FROM study_tasks WHERE id = ?');
  return stmt.get(taskId);
};

const getPlanTasks = (planId) => {
  const stmt = db.prepare('SELECT * FROM study_tasks WHERE plan_id = ? ORDER BY due_date ASC, created_at DESC');
  return stmt.all(planId);
};

const updateTask = (taskId, updateData) => {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE study_tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        due_date = COALESCE(?, due_date),
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updateData.title || null,
    updateData.description || null,
    updateData.status || null,
    updateData.due_date || null,
    now,
    taskId
  );

  return getTask(taskId);
};

const deleteTask = (taskId) => {
  const stmt = db.prepare('DELETE FROM study_tasks WHERE id = ?');
  return stmt.run(taskId);
};

const recalculatePlanProgress = (planId) => {
  const tasks = getPlanTasks(planId);
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  db.prepare('UPDATE study_plans SET progress = ?, updated_at = ? WHERE id = ?')
    .run(progress, Date.now(), planId);
};

// ==================== RECOMMENDATIONS ====================

const addRecommendation = (userId, recommendationData) => {
  const recId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO recommendations
    (id, user_id, topic, recommendation_type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    recId,
    userId,
    recommendationData.topic,
    recommendationData.recommendation_type,
    JSON.stringify(recommendationData.content),
    now
  );

  return getRecommendation(recId);
};

const getRecommendation = (recId) => {
  const stmt = db.prepare('SELECT * FROM recommendations WHERE id = ?');
  const rec = stmt.get(recId);

  if (rec && rec.content) {
    rec.content = JSON.parse(rec.content);
  }

  return rec;
};

const getUserRecommendations = (userId, limit = 10) => {
  const stmt = db.prepare(`
    SELECT * FROM recommendations 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);

  const recs = stmt.all(userId, limit);

  return recs.map(rec => {
    if (rec.content) {
      rec.content = JSON.parse(rec.content);
    }
    return rec;
  });
};

// ==================== COURSES ====================

const createCourse = (userId, courseData, isDemo = false) => {
  const courseId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO courses (id, user_id, name, code, description, is_demo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    courseId,
    userId,
    courseData.name,
    courseData.code || null,
    courseData.description || null,
    isDemo ? 1 : 0,
    now,
    now
  );

  return getCourse(courseId);
};

const getCourse = (courseId) => {
  const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
  return stmt.get(courseId);
};

const getUserCourses = (userId) => {
  const stmt = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
};

const deleteCourse = (courseId) => {
  const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
  return stmt.run(courseId);
};

const demoCoursesExist = (userId) => {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM courses WHERE user_id = ? AND is_demo = 1');
  const row = stmt.get(userId);
  return row.count > 0;
};

// ==================== COURSE MATERIALS ====================

const createCourseMaterial = (courseId, materialData) => {
  const materialId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO course_materials (id, course_id, title, material_type, content, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    materialId,
    courseId,
    materialData.title,
    materialData.material_type || 'text',
    materialData.content,
    materialData.file_size || 0,
    now
  );

  return getCourseMaterial(materialId);
};

const getCourseMaterial = (materialId) => {
  const stmt = db.prepare('SELECT * FROM course_materials WHERE id = ?');
  return stmt.get(materialId);
};

const getCourseMaterials = (courseId) => {
  const stmt = db.prepare('SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC');
  return stmt.all(courseId);
};

const deleteCourseMaterial = (materialId) => {
  const stmt = db.prepare('DELETE FROM course_materials WHERE id = ?');
  return stmt.run(materialId);
};

const getCourseWithMaterials = (courseId) => {
  const course = getCourse(courseId);
  if (!course) return null;
  course.materials = getCourseMaterials(courseId);
  return course;
};

// ==================== AUTH USERS ====================

const createAuthUser = (email, passwordHash, displayName) => {
  const userId = require('uuid').v4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, email.toLowerCase().trim(), passwordHash, displayName, now, now);
  return userId;
};

const getUserByEmail = (email) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
};

const updateUserAuth = (userId, fields) => {
  const now = Date.now();
  if (fields.display_name !== undefined) {
    db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?')
      .run(fields.display_name, now, userId);
  }
};

// ==================== RISK ASSESSMENTS ====================

const saveRiskAssessment = (userId, score, level, factors, recommendations) => {
  const id = require('uuid').v4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO risk_assessments (id, user_id, score, level, factors_json, recommendations_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, score, level, JSON.stringify(factors), JSON.stringify(recommendations), now);
  return id;
};

const getLatestRiskAssessment = (userId) => {
  const row = db.prepare(`
    SELECT * FROM risk_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId);
  if (!row) return null;
  row.factors = JSON.parse(row.factors_json);
  row.recommendations = JSON.parse(row.recommendations_json);
  return row;
};

// ==================== SCHEDULES ====================

const saveGeneratedSchedule = (userId, title, weekStart, inputs, blocks) => {
  const scheduleId = require('uuid').v4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO generated_schedules (id, user_id, title, week_start, inputs_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(scheduleId, userId, title, weekStart, JSON.stringify(inputs), now);

  for (const block of blocks) {
    const blockId = require('uuid').v4();
    db.prepare(`
      INSERT INTO schedule_blocks (id, schedule_id, user_id, course_name, day, start_time, end_time, block_type, priority, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(blockId, scheduleId, userId, block.course_name, block.day, block.start_time, block.end_time, block.block_type, block.priority || 1, block.reason || '', now);
  }
  return scheduleId;
};

const getLatestSchedule = (userId) => {
  const schedule = db.prepare(`
    SELECT * FROM generated_schedules WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId);
  if (!schedule) return null;
  schedule.inputs = JSON.parse(schedule.inputs_json);
  schedule.blocks = db.prepare('SELECT * FROM schedule_blocks WHERE schedule_id = ? ORDER BY day, start_time').all(schedule.id);
  return schedule;
};

// ==================== FEEDBACK ====================

const addFeedback = (sessionId, rating, feedbackText) => {
  const feedbackId = require('uuid').v4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO feedback (id, session_id, rating, feedback_text, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(feedbackId, sessionId, rating, feedbackText, now);
  return feedbackId;
};

// ==================== BEHAVIOR EVENTS ====================

const addBehaviorEvent = (userId, eventType, subject = null, metadata = {}) => {
  const now = Date.now();
  const hour = new Date(now).getHours();
  db.prepare(`
    INSERT INTO behavior_events (id, user_id, event_type, subject, metadata_json, session_hour, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, eventType, subject, JSON.stringify(metadata), hour, now);
};

const getUserEvents = (userId, days = 30) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT * FROM behavior_events WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC
  `).all(userId, since);
};

const getEventCountByType = (userId, eventType, days = 30) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT COUNT(*) as count FROM behavior_events WHERE user_id = ? AND event_type = ? AND created_at > ?
  `).get(userId, eventType, since)?.count ?? 0;
};

const getHourlyEventDistribution = (userId, days = 30) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT session_hour, COUNT(*) as count FROM behavior_events
    WHERE user_id = ? AND created_at > ? AND session_hour IS NOT NULL
    GROUP BY session_hour ORDER BY session_hour
  `).all(userId, since);
};

const getDailyEventCounts = (userId, days = 28) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT CAST(created_at / 86400000 AS INTEGER) as day_bucket, COUNT(*) as count
    FROM behavior_events WHERE user_id = ? AND created_at > ?
    GROUP BY day_bucket ORDER BY day_bucket
  `).all(userId, since);
};

// ==================== LEARNING PATTERNS ====================

const savePattern = (userId, patternType, subject, value, explanation) => {
  const now = Date.now();
  db.prepare(`
    INSERT INTO learning_patterns (id, user_id, pattern_type, subject, value, explanation, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, patternType, subject, value, explanation, now);
};

const clearUserPatterns = (userId) => {
  db.prepare('DELETE FROM learning_patterns WHERE user_id = ?').run(userId);
};

const getUserPatterns = (userId) => {
  return db.prepare('SELECT * FROM learning_patterns WHERE user_id = ? ORDER BY computed_at DESC').all(userId);
};

const getPatternsUpdatedAt = (userId) => {
  const row = db.prepare('SELECT MAX(computed_at) as ts FROM learning_patterns WHERE user_id = ?').get(userId);
  return row?.ts ?? 0;
};

// ==================== ADAPTIVE PREFERENCES ====================

const saveAdaptivePrefs = (userId, prefs) => {
  const now = Date.now();
  db.prepare(`
    INSERT INTO adaptive_preferences (user_id, explanation_depth, session_length, focus_subjects_json,
      recovery_mode, example_frequency, productivity_score, burnout_score, consistency_score,
      ai_dependency_level, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      explanation_depth = excluded.explanation_depth,
      session_length = excluded.session_length,
      focus_subjects_json = excluded.focus_subjects_json,
      recovery_mode = excluded.recovery_mode,
      example_frequency = excluded.example_frequency,
      productivity_score = excluded.productivity_score,
      burnout_score = excluded.burnout_score,
      consistency_score = excluded.consistency_score,
      ai_dependency_level = excluded.ai_dependency_level,
      updated_at = excluded.updated_at
  `).run(
    userId,
    prefs.explanationDepth ?? 'standard',
    prefs.sessionLength ?? 'medium',
    JSON.stringify(prefs.focusSubjects ?? []),
    prefs.recoveryMode ? 1 : 0,
    prefs.exampleFrequency ?? 'medium',
    prefs.productivityScore ?? 50,
    prefs.burnoutScore ?? 0,
    prefs.consistencyScore ?? 50,
    prefs.aiDependencyLevel ?? 'normal',
    now
  );
};

const getAdaptivePrefs = (userId) => {
  const row = db.prepare('SELECT * FROM adaptive_preferences WHERE user_id = ?').get(userId);
  if (!row) return null;
  return {
    ...row,
    focusSubjects: JSON.parse(row.focus_subjects_json || '[]'),
    recoveryMode: row.recovery_mode === 1,
  };
};

// ==================== WEAK TOPICS ====================

const upsertWeakTopic = (userId, topic, course = null) => {
  const now = Date.now();
  const existing = db.prepare('SELECT id, question_count FROM weak_topics WHERE user_id = ? AND topic = ?').get(userId, topic);
  if (existing) {
    db.prepare('UPDATE weak_topics SET question_count = ?, last_asked = ? WHERE id = ?')
      .run(existing.question_count + 1, now, existing.id);
  } else {
    db.prepare('INSERT INTO weak_topics (id, user_id, topic, course, question_count, last_asked) VALUES (?, ?, ?, ?, 1, ?)')
      .run(uuidv4(), userId, topic, course, now);
  }
};

const getUserWeakTopics = (userId, limit = 10) => {
  return db.prepare(`
    SELECT * FROM weak_topics WHERE user_id = ? ORDER BY question_count DESC, last_asked DESC LIMIT ?
  `).all(userId, limit);
};

// ==================== AI INTERACTION METRICS ====================

const addAIInteraction = (userId, topic, isRepeat = false, understandingLevel = 'unknown') => {
  db.prepare(`
    INSERT INTO ai_interaction_metrics (id, user_id, topic, is_repeat, understanding_level, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, topic, isRepeat ? 1 : 0, understandingLevel, Date.now());
};

const getUserAIMetrics = (userId, days = 30) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT topic, COUNT(*) as count, SUM(is_repeat) as repeat_count
    FROM ai_interaction_metrics WHERE user_id = ? AND created_at > ?
    GROUP BY topic ORDER BY count DESC
  `).all(userId, since);
};

// ==================== PERFORMANCE HISTORY ====================

const recordWeeklyPerformance = (userId, weekStart, data) => {
  const existing = db.prepare('SELECT id FROM performance_history WHERE user_id = ? AND week_start = ?').get(userId, weekStart);
  if (existing) {
    db.prepare(`
      UPDATE performance_history SET tasks_completed=?, tasks_total=?, study_events=?,
      chat_sessions=?, risk_score=?, productivity_score=? WHERE id=?
    `).run(data.tasksCompleted, data.tasksTotal, data.studyEvents, data.chatSessions,
           data.riskScore, data.productivityScore, existing.id);
  } else {
    db.prepare(`
      INSERT INTO performance_history (id, user_id, week_start, tasks_completed, tasks_total,
        study_events, chat_sessions, risk_score, productivity_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, weekStart, data.tasksCompleted, data.tasksTotal,
           data.studyEvents, data.chatSessions, data.riskScore, data.productivityScore);
  }
};

const getPerformanceHistory = (userId, weeks = 8) => {
  const since = Date.now() - weeks * 7 * 86400000;
  return db.prepare(`
    SELECT * FROM performance_history WHERE user_id = ? AND week_start > ? ORDER BY week_start ASC
  `).all(userId, since);
};

// ==================== ACADEMIC PREDICTIONS ====================

const saveAcademicPrediction = (userId, prediction) => {
  const now = Date.now();
  db.prepare(`
    INSERT INTO academic_predictions (user_id, failure_risk, burnout_probability, schedule_collapse_risk,
      exam_failure_risk, productivity_decline_risk, recovery_potential, confidence_score,
      overall_score, overall_health, factors_json, data_points_json, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      failure_risk = excluded.failure_risk,
      burnout_probability = excluded.burnout_probability,
      schedule_collapse_risk = excluded.schedule_collapse_risk,
      exam_failure_risk = excluded.exam_failure_risk,
      productivity_decline_risk = excluded.productivity_decline_risk,
      recovery_potential = excluded.recovery_potential,
      confidence_score = excluded.confidence_score,
      overall_score = excluded.overall_score,
      overall_health = excluded.overall_health,
      factors_json = excluded.factors_json,
      data_points_json = excluded.data_points_json,
      computed_at = excluded.computed_at
  `).run(
    userId,
    prediction.failureRisk, prediction.burnoutProbability, prediction.scheduleCollapseRisk,
    prediction.examFailureRisk, prediction.productivityDeclineRisk, prediction.recoveryPotential,
    prediction.confidenceScore, prediction.overallScore, prediction.overallHealth,
    JSON.stringify(prediction.factors || {}),
    JSON.stringify(prediction.dataPoints || {}),
    now
  );
};

const getAcademicPrediction = (userId) => {
  const row = db.prepare('SELECT * FROM academic_predictions WHERE user_id = ?').get(userId);
  if (!row) return null;
  return {
    ...row,
    factors: JSON.parse(row.factors_json || '{}'),
    dataPoints: JSON.parse(row.data_points_json || '{}'),
  };
};

const savePredictionHistory = (userId, weekStart, prediction) => {
  const existing = db.prepare('SELECT id FROM prediction_history WHERE user_id = ? AND week_start = ?').get(userId, weekStart);
  if (existing) {
    db.prepare(`
      UPDATE prediction_history SET failure_risk=?, burnout_probability=?, schedule_collapse_risk=?,
      exam_failure_risk=?, productivity_decline_risk=?, recovery_potential=?,
      overall_score=?, overall_health=?, confidence_score=? WHERE id=?
    `).run(
      prediction.failureRisk, prediction.burnoutProbability, prediction.scheduleCollapseRisk,
      prediction.examFailureRisk, prediction.productivityDeclineRisk, prediction.recoveryPotential,
      prediction.overallScore, prediction.overallHealth, prediction.confidenceScore, existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO prediction_history (id, user_id, week_start, failure_risk, burnout_probability,
        schedule_collapse_risk, exam_failure_risk, productivity_decline_risk, recovery_potential,
        overall_score, overall_health, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, weekStart,
      prediction.failureRisk, prediction.burnoutProbability, prediction.scheduleCollapseRisk,
      prediction.examFailureRisk, prediction.productivityDeclineRisk, prediction.recoveryPotential,
      prediction.overallScore, prediction.overallHealth, prediction.confidenceScore, Date.now()
    );
  }
};

const getPredictionHistory = (userId, weeks = 8) => {
  const since = Date.now() - weeks * 7 * 86400000;
  return db.prepare(`
    SELECT * FROM prediction_history WHERE user_id = ? AND week_start > ? ORDER BY week_start ASC
  `).all(userId, since);
};

const saveInterventions = (userId, interventions) => {
  db.prepare('DELETE FROM intervention_logs WHERE user_id = ? AND acknowledged = 0').run(userId);
  const now = Date.now();
  for (const iv of interventions) {
    db.prepare(`
      INSERT INTO intervention_logs (id, user_id, intervention_type, title, message, action_type,
        urgency, reason, acknowledged, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(uuidv4(), userId, iv.type, iv.title, iv.message, iv.action_type, iv.urgency, iv.reason || '', now);
  }
};

const getInterventions = (userId) => {
  return db.prepare(`
    SELECT * FROM intervention_logs WHERE user_id = ? ORDER BY urgency DESC, created_at DESC LIMIT 10
  `).all(userId);
};

const acknowledgeIntervention = (interventionId) => {
  db.prepare('UPDATE intervention_logs SET acknowledged = 1 WHERE id = ?').run(interventionId);
};

const saveStudentTrend = (userId, weekStart, data) => {
  const existing = db.prepare('SELECT id FROM student_trends WHERE user_id = ? AND week_start = ?').get(userId, weekStart);
  const now = Date.now();
  if (existing) {
    db.prepare(`UPDATE student_trends SET tasks_completed=?, tasks_created=?, study_events=?,
      burnout_trend=?, consistency_trend=?, avg_risk_score=?, trend_direction=? WHERE id=?`
    ).run(data.tasksCompleted, data.tasksCreated, data.studyEvents, data.burnoutTrend,
          data.consistencyTrend, data.avgRiskScore, data.trendDirection, existing.id);
  } else {
    db.prepare(`INSERT INTO student_trends (id, user_id, week_start, tasks_completed, tasks_created,
      study_events, burnout_trend, consistency_trend, avg_risk_score, trend_direction, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), userId, weekStart, data.tasksCompleted, data.tasksCreated, data.studyEvents,
          data.burnoutTrend, data.consistencyTrend, data.avgRiskScore, data.trendDirection, now);
  }
};

const getStudentTrends = (userId, weeks = 8) => {
  const since = Date.now() - weeks * 7 * 86400000;
  return db.prepare('SELECT * FROM student_trends WHERE user_id = ? AND week_start > ? ORDER BY week_start ASC').all(userId, since);
};

const saveProductivitySnapshot = (userId, snapshotDate, data) => {
  const existing = db.prepare('SELECT id FROM productivity_snapshots WHERE user_id = ? AND snapshot_date = ?').get(userId, snapshotDate);
  if (existing) {
    db.prepare('UPDATE productivity_snapshots SET tasks_done=?, study_minutes=?, chat_count=?, productivity_score=? WHERE id=?')
      .run(data.tasksDone, data.studyMinutes, data.chatCount, data.productivityScore, existing.id);
  } else {
    db.prepare(`INSERT INTO productivity_snapshots (id, user_id, snapshot_date, tasks_done, study_minutes, chat_count, productivity_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), userId, snapshotDate, data.tasksDone, data.studyMinutes, data.chatCount, data.productivityScore, Date.now());
  }
};

const getProductivitySnapshots = (userId, weeks = 8) => {
  const since = Date.now() - weeks * 7 * 86400000;
  return db.prepare('SELECT * FROM productivity_snapshots WHERE user_id = ? AND snapshot_date > ? ORDER BY snapshot_date ASC').all(userId, since);
};

// ==================== LEARNING MEMORY ====================

const upsertLearningMemory = (userId, concept, subject, updates) => {
  const now = Date.now();
  const existing = db.prepare('SELECT * FROM learning_memory WHERE user_id = ? AND concept = ?').get(userId, concept);
  if (existing) {
    db.prepare(`
      UPDATE learning_memory SET
        subject = COALESCE(?, subject),
        mastery_score = ?,
        confidence_score = ?,
        retention_score = ?,
        struggle_count = ?,
        revision_count = ?,
        interaction_count = ?,
        last_interaction = ?,
        explanation_type_preferred = COALESCE(?, explanation_type_preferred)
      WHERE user_id = ? AND concept = ?
    `).run(
      subject ?? existing.subject,
      updates.mastery_score ?? existing.mastery_score,
      updates.confidence_score ?? existing.confidence_score,
      updates.retention_score ?? existing.retention_score,
      updates.struggle_count ?? existing.struggle_count,
      updates.revision_count ?? existing.revision_count,
      updates.interaction_count ?? existing.interaction_count,
      updates.last_interaction ?? existing.last_interaction,
      updates.explanation_type_preferred ?? null,
      userId, concept
    );
  } else {
    db.prepare(`
      INSERT INTO learning_memory
        (id, user_id, concept, subject, mastery_score, confidence_score, retention_score,
         struggle_count, revision_count, interaction_count, last_interaction, first_seen, explanation_type_preferred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, concept, subject ?? null,
      updates.mastery_score ?? 40,
      updates.confidence_score ?? 50,
      updates.retention_score ?? 100,
      updates.struggle_count ?? 0,
      updates.revision_count ?? 0,
      updates.interaction_count ?? 1,
      updates.last_interaction ?? now,
      now,
      updates.explanation_type_preferred ?? 'example_based'
    );
  }
};

const getLearningMemory = (userId) =>
  db.prepare('SELECT * FROM learning_memory WHERE user_id = ? ORDER BY mastery_score ASC').all(userId);

const getConceptMemory = (userId, concept) =>
  db.prepare('SELECT * FROM learning_memory WHERE user_id = ? AND concept = ?').get(userId, concept);

const logMasteryEvent = (userId, concept, subject, eventType, before, after) => {
  db.prepare(`
    INSERT INTO concept_mastery_log (id, user_id, concept, subject, mastery_before, mastery_after, event_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, concept, subject, before, after, eventType, Date.now());
};

const getMasteryLog = (userId, concept, days = 60) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT * FROM concept_mastery_log WHERE user_id = ? AND concept = ? AND created_at > ?
    ORDER BY created_at ASC
  `).all(userId, concept, since);
};

// ==================== STUDENT LEARNING PROFILE ====================

const upsertStudentLearningProfile = (userId, data) => {
  const now = Date.now();
  db.prepare(`
    INSERT INTO student_learning_profile
      (user_id, preferred_explanation, preferred_depth, avg_session_focus, learning_velocity,
       burnout_tendency, procrastination_index, ai_dependency_trend, strongest_subject,
       weakest_subject, active_struggles_json, total_concepts_tracked, avg_mastery, last_computed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      preferred_explanation    = excluded.preferred_explanation,
      preferred_depth          = excluded.preferred_depth,
      avg_session_focus        = excluded.avg_session_focus,
      learning_velocity        = excluded.learning_velocity,
      burnout_tendency         = excluded.burnout_tendency,
      procrastination_index    = excluded.procrastination_index,
      ai_dependency_trend      = excluded.ai_dependency_trend,
      strongest_subject        = excluded.strongest_subject,
      weakest_subject          = excluded.weakest_subject,
      active_struggles_json    = excluded.active_struggles_json,
      total_concepts_tracked   = excluded.total_concepts_tracked,
      avg_mastery              = excluded.avg_mastery,
      last_computed            = excluded.last_computed
  `).run(
    userId,
    data.preferred_explanation ?? 'example_based',
    data.preferred_depth ?? 'standard',
    data.avg_session_focus ?? 'medium',
    data.learning_velocity ?? 0,
    data.burnout_tendency ?? 0,
    data.procrastination_index ?? 0,
    data.ai_dependency_trend ?? 'normal',
    data.strongest_subject ?? null,
    data.weakest_subject ?? null,
    JSON.stringify(data.active_struggles ?? []),
    data.total_concepts_tracked ?? 0,
    data.avg_mastery ?? 0,
    now
  );
};

const getStudentLearningProfile = (userId) => {
  const row = db.prepare('SELECT * FROM student_learning_profile WHERE user_id = ?').get(userId);
  if (!row) return null;
  return { ...row, active_struggles: JSON.parse(row.active_struggles_json || '[]') };
};

// ==================== EXPLANATION EFFECTIVENESS ====================

const upsertExplanationEffectiveness = (userId, explanationType, isSuccess) => {
  const now = Date.now();
  const existing = db.prepare('SELECT * FROM explanation_effectiveness WHERE user_id = ? AND explanation_type = ?').get(userId, explanationType);
  if (existing) {
    const success = existing.success_count + (isSuccess ? 1 : 0);
    const fail = existing.fail_count + (isSuccess ? 0 : 1);
    const total = success + fail;
    const score = total > 0 ? Math.round((success / total) * 100) : 50;
    db.prepare(`
      UPDATE explanation_effectiveness SET success_count=?, fail_count=?, effectiveness_score=?, last_updated=?
      WHERE user_id=? AND explanation_type=?
    `).run(success, fail, score, now, userId, explanationType);
  } else {
    const score = isSuccess ? 75 : 25;
    db.prepare(`
      INSERT INTO explanation_effectiveness (id, user_id, explanation_type, success_count, fail_count, effectiveness_score, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, explanationType, isSuccess ? 1 : 0, isSuccess ? 0 : 1, score, now);
  }
};

const getExplanationEffectiveness = (userId) =>
  db.prepare('SELECT * FROM explanation_effectiveness WHERE user_id = ? ORDER BY effectiveness_score DESC').all(userId);

// ==================== MEMORY SNAPSHOTS ====================

const saveMemorySnapshot = (userId, data) => {
  const now = Date.now();
  const today = Math.floor(now / 86400000) * 86400000;
  const existing = db.prepare('SELECT id FROM memory_snapshots WHERE user_id = ? AND snapshot_date = ?').get(userId, today);
  if (existing) {
    db.prepare(`
      UPDATE memory_snapshots SET overall_mastery=?, concept_count=?, improving_count=?,
      declining_count=?, forgetting_count=?, snapshot_json=? WHERE id=?
    `).run(data.overallMastery, data.conceptCount, data.improvingCount,
           data.decliningCount, data.forgettingCount, JSON.stringify(data), existing.id);
  } else {
    db.prepare(`
      INSERT INTO memory_snapshots (id, user_id, snapshot_date, overall_mastery, concept_count,
        improving_count, declining_count, forgetting_count, snapshot_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, today, data.overallMastery, data.conceptCount,
           data.improvingCount, data.decliningCount, data.forgettingCount,
           JSON.stringify(data), now);
  }
};

const getMemorySnapshots = (userId, limit = 30) =>
  db.prepare(`
    SELECT * FROM memory_snapshots WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT ?
  `).all(userId, limit).map(s => ({ ...s, data: JSON.parse(s.snapshot_json || '{}') }));

// ==================== KNOWLEDGE GAPS ====================

const saveKnowledgeGap = (userId, weakConcept, prerequisite, subject, severity) => {
  const existing = db.prepare(`
    SELECT id FROM knowledge_gaps WHERE user_id=? AND weak_concept=? AND missing_prerequisite=? AND is_resolved=0
  `).get(userId, weakConcept, prerequisite);
  if (!existing) {
    db.prepare(`
      INSERT INTO knowledge_gaps (id, user_id, weak_concept, missing_prerequisite, subject, gap_severity, is_resolved, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(uuidv4(), userId, weakConcept, prerequisite, subject, severity, Date.now());
  } else {
    db.prepare('UPDATE knowledge_gaps SET gap_severity=? WHERE id=?').run(severity, existing.id);
  }
};

const getKnowledgeGaps = (userId) =>
  db.prepare('SELECT * FROM knowledge_gaps WHERE user_id=? AND is_resolved=0 ORDER BY gap_severity DESC').all(userId);

const resolveKnowledgeGap = (gapId) =>
  db.prepare('UPDATE knowledge_gaps SET is_resolved=1, resolved_at=? WHERE id=?').run(Date.now(), gapId);

// ==================== REVISION HISTORY ====================

const recordRevision = (userId, concept, subject, revisionType, before, after) => {
  db.prepare(`
    INSERT INTO revision_history (id, user_id, concept, subject, revision_type, mastery_before, mastery_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, concept, subject, revisionType, before, after, Date.now());
};

const getRevisionHistory = (userId, limit = 20) =>
  db.prepare('SELECT * FROM revision_history WHERE user_id=? ORDER BY created_at DESC LIMIT ?').all(userId, limit);

// ==================== TOPIC CONFIDENCE ====================

const recordTopicConfidence = (userId, concept, subject, score) => {
  db.prepare(`
    INSERT INTO topic_confidence (id, user_id, concept, subject, confidence_score, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, concept, subject, score, Date.now());
};

const getTopicConfidenceHistory = (userId, concept, days = 60) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT * FROM topic_confidence WHERE user_id=? AND concept=? AND recorded_at>? ORDER BY recorded_at ASC
  `).all(userId, concept, since);
};

// ==================== COGNITIVE EVENTS ====================

const saveCognitiveEvent = (userId, concept, subject, eventType, strength, metadata = {}) => {
  db.prepare(`
    INSERT INTO cognitive_events (id, user_id, concept, subject, event_type, signal_strength, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, concept, subject, eventType, strength, JSON.stringify(metadata), Date.now());
};

const getCognitiveEvents = (userId, concept, days = 30) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT * FROM cognitive_events WHERE user_id=? AND concept=? AND created_at>? ORDER BY created_at DESC
  `).all(userId, concept, since);
};

const getRecentCognitiveEvents = (userId, days = 7) => {
  const since = Date.now() - days * 86400000;
  return db.prepare(`
    SELECT concept, subject, event_type, SUM(signal_strength) as total_strength, COUNT(*) as count
    FROM cognitive_events WHERE user_id=? AND created_at>?
    GROUP BY concept, event_type ORDER BY total_strength DESC
  `).all(userId, since);
};

// ==================== LEARNING PREFERENCES HISTORY ====================

const recordPreferenceChange = (userId, changeType, oldValue, newValue, reason) => {
  db.prepare(`
    INSERT INTO learning_preferences_history (id, user_id, change_type, old_value, new_value, trigger_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, changeType, oldValue, newValue, reason, Date.now());
};

module.exports = {
  createUser,
  getUser,
  deleteUser,
  createOrUpdateProfile,
  getProfile,
  createSession,
  getSession,
  updateSessionActivity,
  addMessage,
  getConversationHistory,
  clearConversationHistory,
  createConversation,
  updateConversationMetadata,
  createStudyPlan,
  getPlan,
  getUserPlans,
  updateStudyPlan,
  deletePlan,
  createTask,
  getTask,
  getPlanTasks,
  updateTask,
  deleteTask,
  recalculatePlanProgress,
  addRecommendation,
  getRecommendation,
  getUserRecommendations,
  addFeedback,
  createCourse,
  getCourse,
  getUserCourses,
  deleteCourse,
  demoCoursesExist,
  createCourseMaterial,
  getCourseMaterial,
  getCourseMaterials,
  deleteCourseMaterial,
  getCourseWithMaterials,
  createAuthUser,
  getUserByEmail,
  updateUserAuth,
  saveRiskAssessment,
  getLatestRiskAssessment,
  saveGeneratedSchedule,
  getLatestSchedule,
  addBehaviorEvent,
  getUserEvents,
  getEventCountByType,
  getHourlyEventDistribution,
  getDailyEventCounts,
  savePattern,
  clearUserPatterns,
  getUserPatterns,
  getPatternsUpdatedAt,
  saveAdaptivePrefs,
  getAdaptivePrefs,
  upsertWeakTopic,
  getUserWeakTopics,
  addAIInteraction,
  getUserAIMetrics,
  recordWeeklyPerformance,
  getPerformanceHistory,
  saveAcademicPrediction,
  getAcademicPrediction,
  savePredictionHistory,
  getPredictionHistory,
  saveInterventions,
  getInterventions,
  acknowledgeIntervention,
  saveStudentTrend,
  getStudentTrends,
  saveProductivitySnapshot,
  getProductivitySnapshots,
  // ── Learning Memory Engine ──
  upsertLearningMemory,
  getLearningMemory,
  getConceptMemory,
  logMasteryEvent,
  getMasteryLog,
  upsertStudentLearningProfile,
  getStudentLearningProfile,
  upsertExplanationEffectiveness,
  getExplanationEffectiveness,
  saveMemorySnapshot,
  getMemorySnapshots,
  saveKnowledgeGap,
  getKnowledgeGaps,
  resolveKnowledgeGap,
  recordRevision,
  getRevisionHistory,
  recordTopicConfidence,
  getTopicConfidenceHistory,
  saveCognitiveEvent,
  getCognitiveEvents,
  getRecentCognitiveEvents,
  recordPreferenceChange,
};

