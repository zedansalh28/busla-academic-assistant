const db = require('./connection');

const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      major TEXT,
      year TEXT,
      learning_style TEXT,
      subjects_of_interest TEXT,
      language_preference TEXT DEFAULT 'en',
      difficulty_level TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_activity INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      topic TEXT,
      turn_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      deadline INTEGER,
      milestones TEXT,
      progress INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      due_date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      recommendation_type TEXT,
      content TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      rating INTEGER,
      feedback_text TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_materials (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      material_type TEXT NOT NULL,
      content TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // ── New tables for advanced features ──────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      level TEXT NOT NULL,
      factors_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      week_start INTEGER NOT NULL,
      inputs_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_blocks (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      block_type TEXT NOT NULL,
      priority INTEGER DEFAULT 1,
      reason TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (schedule_id) REFERENCES generated_schedules(id) ON DELETE CASCADE
    )
  `);

  // ── Adaptive Learning Intelligence Engine tables ──────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS behavior_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      subject TEXT,
      metadata_json TEXT DEFAULT '{}',
      session_hour INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_patterns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pattern_type TEXT NOT NULL,
      subject TEXT,
      value REAL NOT NULL,
      explanation TEXT,
      computed_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS adaptive_preferences (
      user_id TEXT PRIMARY KEY,
      explanation_depth TEXT DEFAULT 'standard',
      session_length TEXT DEFAULT 'medium',
      focus_subjects_json TEXT DEFAULT '[]',
      recovery_mode INTEGER DEFAULT 0,
      example_frequency TEXT DEFAULT 'medium',
      productivity_score INTEGER DEFAULT 50,
      burnout_score INTEGER DEFAULT 0,
      consistency_score INTEGER DEFAULT 50,
      ai_dependency_level TEXT DEFAULT 'normal',
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS weak_topics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      course TEXT,
      question_count INTEGER DEFAULT 1,
      last_asked INTEGER NOT NULL,
      confidence_trend TEXT DEFAULT 'unknown',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_type TEXT DEFAULT 'study',
      subject TEXT,
      duration_minutes INTEGER DEFAULT 0,
      productivity_rating INTEGER,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_interaction_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      is_repeat INTEGER DEFAULT 0,
      understanding_level TEXT DEFAULT 'unknown',
      follow_up_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start INTEGER NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      tasks_total INTEGER DEFAULT 0,
      study_events INTEGER DEFAULT 0,
      chat_sessions INTEGER DEFAULT 0,
      risk_score INTEGER DEFAULT 0,
      productivity_score INTEGER DEFAULT 50,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── AI Predictive Academic Performance Engine tables ──────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS academic_predictions (
      user_id TEXT PRIMARY KEY,
      failure_risk INTEGER NOT NULL DEFAULT 0,
      burnout_probability INTEGER NOT NULL DEFAULT 0,
      schedule_collapse_risk INTEGER NOT NULL DEFAULT 0,
      exam_failure_risk INTEGER NOT NULL DEFAULT 0,
      productivity_decline_risk INTEGER NOT NULL DEFAULT 0,
      recovery_potential INTEGER NOT NULL DEFAULT 80,
      confidence_score INTEGER NOT NULL DEFAULT 0,
      overall_score INTEGER NOT NULL DEFAULT 0,
      overall_health TEXT NOT NULL DEFAULT 'healthy',
      factors_json TEXT NOT NULL DEFAULT '{}',
      data_points_json TEXT NOT NULL DEFAULT '{}',
      computed_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS prediction_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start INTEGER NOT NULL,
      failure_risk INTEGER NOT NULL DEFAULT 0,
      burnout_probability INTEGER NOT NULL DEFAULT 0,
      schedule_collapse_risk INTEGER NOT NULL DEFAULT 0,
      exam_failure_risk INTEGER NOT NULL DEFAULT 0,
      productivity_decline_risk INTEGER NOT NULL DEFAULT 0,
      recovery_potential INTEGER NOT NULL DEFAULT 80,
      overall_score INTEGER NOT NULL DEFAULT 0,
      overall_health TEXT NOT NULL DEFAULT 'healthy',
      confidence_score INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS intervention_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      intervention_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_type TEXT NOT NULL,
      urgency INTEGER NOT NULL DEFAULT 3,
      reason TEXT,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      was_effective INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS student_trends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start INTEGER NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      tasks_created INTEGER DEFAULT 0,
      study_events INTEGER DEFAULT 0,
      burnout_trend INTEGER DEFAULT 0,
      consistency_trend INTEGER DEFAULT 50,
      avg_risk_score INTEGER DEFAULT 0,
      trend_direction TEXT DEFAULT 'stable',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_pressure_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_count INTEGER DEFAULT 0,
      days_until_nearest INTEGER DEFAULT 30,
      pressure_score INTEGER DEFAULT 0,
      recorded_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS productivity_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      snapshot_date INTEGER NOT NULL,
      tasks_done INTEGER DEFAULT 0,
      study_minutes INTEGER DEFAULT 0,
      chat_count INTEGER DEFAULT 0,
      productivity_score INTEGER DEFAULT 50,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS adaptive_recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 3,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── AI Academic Memory & Learning Brain tables ────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_memory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      subject TEXT,
      mastery_score INTEGER DEFAULT 40,
      confidence_score INTEGER DEFAULT 50,
      retention_score REAL DEFAULT 100,
      struggle_count INTEGER DEFAULT 0,
      revision_count INTEGER DEFAULT 0,
      interaction_count INTEGER DEFAULT 0,
      last_interaction INTEGER NOT NULL,
      first_seen INTEGER NOT NULL,
      explanation_type_preferred TEXT DEFAULT 'example_based',
      UNIQUE(user_id, concept),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS concept_mastery_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      subject TEXT,
      mastery_before INTEGER,
      mastery_after INTEGER,
      event_type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS student_learning_profile (
      user_id TEXT PRIMARY KEY,
      preferred_explanation TEXT DEFAULT 'example_based',
      preferred_depth TEXT DEFAULT 'standard',
      avg_session_focus TEXT DEFAULT 'medium',
      learning_velocity REAL DEFAULT 0,
      burnout_tendency INTEGER DEFAULT 0,
      procrastination_index INTEGER DEFAULT 0,
      ai_dependency_trend TEXT DEFAULT 'normal',
      strongest_subject TEXT,
      weakest_subject TEXT,
      active_struggles_json TEXT DEFAULT '[]',
      total_concepts_tracked INTEGER DEFAULT 0,
      avg_mastery INTEGER DEFAULT 0,
      last_computed INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS explanation_effectiveness (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      explanation_type TEXT NOT NULL,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      effectiveness_score REAL DEFAULT 50,
      last_updated INTEGER NOT NULL,
      UNIQUE(user_id, explanation_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      snapshot_date INTEGER NOT NULL,
      overall_mastery INTEGER DEFAULT 0,
      concept_count INTEGER DEFAULT 0,
      improving_count INTEGER DEFAULT 0,
      declining_count INTEGER DEFAULT 0,
      forgetting_count INTEGER DEFAULT 0,
      snapshot_json TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_gaps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      weak_concept TEXT NOT NULL,
      missing_prerequisite TEXT NOT NULL,
      subject TEXT,
      gap_severity INTEGER DEFAULT 50,
      is_resolved INTEGER DEFAULT 0,
      detected_at INTEGER NOT NULL,
      resolved_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS revision_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      subject TEXT,
      revision_type TEXT DEFAULT 'chat_review',
      mastery_before INTEGER,
      mastery_after INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS topic_confidence (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      subject TEXT,
      confidence_score INTEGER NOT NULL,
      recorded_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cognitive_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      subject TEXT,
      event_type TEXT NOT NULL,
      signal_strength REAL DEFAULT 1.0,
      metadata_json TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_preferences_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      trigger_reason TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── Idempotent migrations ──────────────────────────────────────────────────

  const messagesCols = db.prepare("PRAGMA table_info(messages)").all().map(c => c.name);
  if (!messagesCols.includes('context_type')) {
    db.exec(`ALTER TABLE messages ADD COLUMN context_type TEXT DEFAULT 'general'`);
  }
  if (!messagesCols.includes('course_id')) {
    db.exec(`ALTER TABLE messages ADD COLUMN course_id TEXT DEFAULT NULL`);
  }

  const usersCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!usersCols.includes('email')) {
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
  }
  if (!usersCols.includes('password_hash')) {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  }
  if (!usersCols.includes('display_name')) {
    db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT`);
  }

  console.log('✓ Database initialized successfully');
};

module.exports = { initializeDatabase };
