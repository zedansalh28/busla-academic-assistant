const db = require('../db/queries');

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // recompute if patterns older than 1 hour

function computePatterns(userId) {
  const now = Date.now();
  const events = db.getUserEvents(userId, 30);
  const allTasks = _getAllUserTasks(userId);
  const aiMetrics = db.getUserAIMetrics(userId, 30);

  const patterns = [];

  // ── 1. STUDY CONSISTENCY (0-100) ──────────────────────────────────────────
  // How many of the last 28 days had at least one activity event?
  const last28Events = events.filter(e => e.created_at > now - 28 * DAY_MS);
  const activeDayBuckets = new Set(last28Events.map(e => Math.floor(e.created_at / DAY_MS)));
  const consistencyScore = Math.round((activeDayBuckets.size / 28) * 100);
  patterns.push({
    type: 'consistency',
    subject: null,
    value: consistencyScore,
    explanation: `Active on ${activeDayBuckets.size} of the last 28 days`,
  });

  // ── 2. PROCRASTINATION SCORE (0-100) ──────────────────────────────────────
  // Percentage of tasks completed within 24h of (or after) their due date
  const completedWithDue = allTasks.filter(t => t.status === 'completed' && t.due_date && t.updated_at);
  const lastMinute = completedWithDue.filter(t => t.updated_at >= t.due_date - DAY_MS);
  const procrastScore = completedWithDue.length > 0
    ? Math.round((lastMinute.length / completedWithDue.length) * 100)
    : 0;
  patterns.push({
    type: 'procrastination',
    subject: null,
    value: procrastScore,
    explanation: `${lastMinute.length} of ${completedWithDue.length} tasks completed last-minute`,
  });

  // ── 3. BURNOUT RISK (0-100) ───────────────────────────────────────────────
  // Compare activity this week vs last week — sharp decline = burnout risk
  const thisWeekCount = events.filter(e => e.created_at > now - WEEK_MS).length;
  const lastWeekCount = events.filter(e => e.created_at > now - 2 * WEEK_MS && e.created_at <= now - WEEK_MS).length;
  let burnoutScore = 0;
  if (lastWeekCount > 0) {
    const decline = (lastWeekCount - thisWeekCount) / lastWeekCount;
    if (decline >= 0.6) burnoutScore = 85;
    else if (decline >= 0.4) burnoutScore = 65;
    else if (decline >= 0.2) burnoutScore = 35;
    else if (decline >= 0) burnoutScore = 15;
    else burnoutScore = 5; // activity increased
  } else if (thisWeekCount === 0) {
    burnoutScore = 50; // no data = moderate concern
  }
  patterns.push({
    type: 'burnout_risk',
    subject: null,
    value: burnoutScore,
    explanation: `${thisWeekCount} events this week vs ${lastWeekCount} last week`,
  });

  // ── 4. AI DEPENDENCY (0-100) ──────────────────────────────────────────────
  // Ratio of chat messages to task completions — high ratio = high dependency
  const chatCount = events.filter(e => e.event_type === 'chat_message').length;
  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const depRatio = completedCount > 0 ? chatCount / (completedCount + 1) : chatCount > 0 ? 5 : 0;
  const dependencyScore = Math.min(100, Math.round(depRatio * 20));
  patterns.push({
    type: 'ai_dependency',
    subject: null,
    value: dependencyScore,
    explanation: `${chatCount} chat messages for ${completedCount} completed tasks`,
  });

  // ── 5. TASK COMPLETION TREND ──────────────────────────────────────────────
  // Compare completion rate: last 2 weeks vs previous 2 weeks
  const recent = allTasks.filter(t => t.created_at > now - 2 * WEEK_MS);
  const older = allTasks.filter(t => t.created_at > now - 4 * WEEK_MS && t.created_at <= now - 2 * WEEK_MS);
  const recentRate = recent.length > 0 ? recent.filter(t => t.status === 'completed').length / recent.length : null;
  const olderRate = older.length > 0 ? older.filter(t => t.status === 'completed').length / older.length : null;
  let trendValue = recentRate !== null ? Math.round(recentRate * 100) : 50;
  let trendLabel = 'stable';
  if (recentRate !== null && olderRate !== null) {
    if (recentRate > olderRate + 0.1) trendLabel = 'improving';
    else if (recentRate < olderRate - 0.1) trendLabel = 'declining';
  }
  patterns.push({
    type: 'completion_trend',
    subject: null,
    value: trendValue,
    explanation: `Task completion trend: ${trendLabel} (${trendValue}% recent)`,
  });

  // ── 6. WEAK SUBJECTS (per topic from AI interactions) ─────────────────────
  // Topics with high question count are weak areas
  for (const metric of aiMetrics.slice(0, 8)) {
    const weakScore = Math.min(100, Math.round(metric.count * 12));
    const repeatRatio = metric.count > 0 ? Math.round((metric.repeat_count / metric.count) * 100) : 0;
    patterns.push({
      type: 'weak_subject',
      subject: metric.topic,
      value: weakScore,
      explanation: `Asked ${metric.count} questions about ${metric.topic} (${repeatRatio}% repeated)`,
    });
  }

  // ── 7. PREFERRED STUDY TIME ───────────────────────────────────────────────
  const hourDist = db.getHourlyEventDistribution(userId, 30);
  if (hourDist.length > 0) {
    const topSlot = hourDist.sort((a, b) => b.count - a.count)[0];
    const hour = topSlot.session_hour;
    const period = hour < 6 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    patterns.push({
      type: 'preferred_study_time',
      subject: null,
      value: hour,
      explanation: `Most active during ${period} hours (around ${hour}:00)`,
    });
  }

  // ── 8. OVERDUE TASK RATIO ─────────────────────────────────────────────────
  const now2 = Date.now();
  const overdue = allTasks.filter(t => t.status === 'pending' && t.due_date && t.due_date < now2);
  const overdueRatio = allTasks.length > 0 ? Math.round((overdue.length / allTasks.length) * 100) : 0;
  patterns.push({
    type: 'overdue_ratio',
    subject: null,
    value: overdueRatio,
    explanation: `${overdue.length} of ${allTasks.length} tasks currently overdue`,
  });

  return patterns;
}

function computeAndSave(userId) {
  // Skip if patterns were computed recently
  const lastComputed = db.getPatternsUpdatedAt(userId);
  if (Date.now() - lastComputed < STALE_THRESHOLD_MS) {
    return db.getUserPatterns(userId);
  }

  const patterns = computePatterns(userId);
  db.clearUserPatterns(userId);
  for (const p of patterns) {
    db.savePattern(userId, p.type, p.subject, p.value, p.explanation);
  }
  return db.getUserPatterns(userId);
}

// Build heatmap data: last 28 days with event counts per day
function buildHeatmapData(userId) {
  const now = Date.now();
  const dailyCounts = db.getDailyEventCounts(userId, 28);
  const countMap = {};
  for (const row of dailyCounts) {
    countMap[row.day_bucket] = row.count;
  }

  const result = [];
  for (let i = 27; i >= 0; i--) {
    const ts = now - i * DAY_MS;
    const bucket = Math.floor(ts / DAY_MS);
    const date = new Date(ts);
    result.push({
      date: date.toISOString().slice(0, 10),
      count: countMap[bucket] ?? 0,
      dayOfWeek: date.getDay(),
    });
  }
  return result;
}

// Build weekly trends: last 6 weeks of task completion + study events
function buildWeeklyTrends(userId) {
  const now = Date.now();
  const allTasks = _getAllUserTasks(userId);
  const events = db.getUserEvents(userId, 42);
  const perfHistory = db.getPerformanceHistory(userId, 6);

  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = now - (i + 1) * WEEK_MS;
    const weekEnd = now - i * WEEK_MS;
    const label = `W-${i === 0 ? 'now' : i}`;

    // Try performance history first
    const hist = perfHistory.find(p => Math.abs(p.week_start - weekStart) < WEEK_MS);
    if (hist) {
      const rate = hist.tasks_total > 0 ? Math.round((hist.tasks_completed / hist.tasks_total) * 100) : null;
      weeks.push({ label, completionRate: rate, studyEvents: hist.study_events, chatSessions: hist.chat_sessions });
      continue;
    }

    // Compute from live data
    const weekTasks = allTasks.filter(t => t.created_at >= weekStart && t.created_at < weekEnd);
    const weekEvents = events.filter(e => e.created_at >= weekStart && e.created_at < weekEnd);
    const completionRate = weekTasks.length > 0
      ? Math.round((weekTasks.filter(t => t.status === 'completed').length / weekTasks.length) * 100)
      : null;
    weeks.push({
      label,
      completionRate,
      studyEvents: weekEvents.length,
      chatSessions: weekEvents.filter(e => e.event_type === 'chat_message').length,
    });
  }
  return weeks;
}

function _getAllUserTasks(userId) {
  try {
    const plans = db.getUserPlans(userId);
    const tasks = [];
    for (const plan of plans) {
      const t = db.getPlanTasks(plan.id);
      tasks.push(...t);
    }
    return tasks;
  } catch (_) {
    return [];
  }
}

module.exports = { computeAndSave, computePatterns, buildHeatmapData, buildWeeklyTrends };
