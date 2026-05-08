const db = require('./connection');

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
};
