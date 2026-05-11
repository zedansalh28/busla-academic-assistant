/**
 * AI Predictive Academic Performance Engine
 *
 * Computes 7 prediction scores from real behavioral data:
 *   1. Failure Risk           — weighted composite of overdue rate, hard courses, consistency, burnout
 *   2. Burnout Probability    — activity decline + late-night ratio + stress signals
 *   3. Schedule Collapse Risk — tasks due soon + overload warnings + procrastination
 *   4. Exam Failure Risk      — weak subjects + repeated questions + low consistency
 *   5. Productivity Decline   — week-over-week activity drop + completion trend
 *   6. Recovery Potential     — inverse of combined risk factors + positive indicators
 *   7. Confidence Score       — data availability score (more events = higher confidence)
 *
 * Every score is accompanied by a factors[] array explaining exactly WHY it was computed.
 * Nothing is random or hardcoded.
 */

const db = require('../db/queries');
const memoryEngine = require('./memoryEngine');

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
const STALE_MS = 30 * 60 * 1000; // recompute if older than 30 minutes

// ── Public API ────────────────────────────────────────────────────────────────

function computeAndSave(userId, force = false) {
  if (!force) {
    const existing = db.getAcademicPrediction(userId);
    if (existing && Date.now() - existing.computed_at < STALE_MS) {
      return _normalizePrediction(existing);
    }
  }
  const result = computePredictions(userId);
  result.computed_at = Date.now();
  db.saveAcademicPrediction(userId, result);

  // Persist weekly snapshot for trend tracking
  const weekStart = _weekStart(result.computed_at);
  db.savePredictionHistory(userId, weekStart, result);

  return result;
}

function _normalizePrediction(row) {
  return {
    failureRisk:             row.failure_risk             ?? row.failureRisk             ?? 0,
    burnoutProbability:      row.burnout_probability      ?? row.burnoutProbability      ?? 0,
    scheduleCollapseRisk:    row.schedule_collapse_risk   ?? row.scheduleCollapseRisk    ?? 0,
    examFailureRisk:         row.exam_failure_risk        ?? row.examFailureRisk         ?? 0,
    productivityDeclineRisk: row.productivity_decline_risk ?? row.productivityDeclineRisk ?? 0,
    recoveryPotential:       row.recovery_potential       ?? row.recoveryPotential       ?? 80,
    confidenceScore:         row.confidence_score         ?? row.confidenceScore         ?? 0,
    overallScore:            row.overall_score            ?? row.overallScore            ?? 0,
    overallHealth:           row.overall_health           ?? row.overallHealth           ?? 'healthy',
    trendDirection:          row.trendDirection ?? 'stable',
    factors:                 row.factors  || {},
    dataPoints:              row.dataPoints || {},
    computed_at:             row.computed_at,
  };
}

function computePredictions(userId) {
  const now = Date.now();

  // ── Load all raw data ─────────────────────────────────────────────────────
  const events       = db.getUserEvents(userId, 30);
  const patterns     = db.getUserPatterns(userId);
  const allTasks     = _getAllTasks(userId);
  const plans        = db.getUserPlans(userId);
  const latestRisk   = db.getLatestRiskAssessment(userId);
  const adaptPrefs   = db.getAdaptivePrefs(userId);
  const weakTopics   = db.getUserWeakTopics(userId, 15);
  const latestSched  = db.getLatestSchedule(userId);
  const hourlyDist   = db.getHourlyEventDistribution(userId, 30);
  const aiMetrics    = db.getUserAIMetrics(userId, 30);
  const memoryProfile = db.getStudentLearningProfile(userId);
  const forgettingAlerts = memoryEngine.getForgettingAlerts(userId);
  const knowledgeGaps = db.getKnowledgeGaps(userId);

  // ── Derived base metrics ──────────────────────────────────────────────────
  const totalTasks     = allTasks.length;
  const overdueTasks   = allTasks.filter(t => t.status === 'pending' && t.due_date && t.due_date < now).length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const overdueRate    = totalTasks > 0 ? overdueTasks / totalTasks : 0;
  const avgPlanProgress = plans.length > 0
    ? plans.reduce((s, p) => s + (p.progress || 0), 0) / plans.length : 0;

  const getP = (type) => patterns.find(p => p.pattern_type === type)?.value ?? null;
  const consistencyScore    = getP('consistency') ?? 50;
  const burnoutPattern      = getP('burnout_risk') ?? 0;
  const procrastination     = getP('procrastination') ?? 0;
  const aiDependency        = getP('ai_dependency') ?? 0;
  const completionTrend     = getP('completion_trend') ?? 50;
  const overdueRatioPattern = getP('overdue_ratio') ?? Math.round(overdueRate * 100);

  // Late-night studying ratio (22:00–05:00)
  const lateNightTotal = hourlyDist
    .filter(h => h.session_hour >= 22 || h.session_hour < 5)
    .reduce((s, h) => s + h.count, 0);
  const allHourTotal = hourlyDist.reduce((s, h) => s + h.count, 0);
  const lateNightRatio = allHourTotal > 0 ? lateNightTotal / allHourTotal : 0;

  // Week-over-week activity change
  const thisWeek = events.filter(e => e.created_at > now - WEEK_MS).length;
  const lastWeek = events.filter(e => e.created_at > now - 2 * WEEK_MS && e.created_at <= now - WEEK_MS).length;
  const activityDecline = lastWeek > 0 ? (lastWeek - thisWeek) / lastWeek : 0;

  // Tasks due within the next 7 days (not yet completed)
  const tasksDueSoon = allTasks.filter(t =>
    t.status !== 'completed' && t.due_date && t.due_date > now && t.due_date <= now + WEEK_MS
  ).length;

  // Hard course proxy: exam_prep blocks in latest schedule
  let hardCourseCount = 0;
  const scheduleWarnings = latestSched?.warnings ?? [];
  if (latestSched?.blocks) {
    const uniqueExamCourses = new Set(
      latestSched.blocks.filter(b => b.block_type === 'exam_prep').map(b => b.course_name)
    );
    hardCourseCount = uniqueExamCourses.size;
  }
  if (latestRisk) {
    const rf = JSON.parse(latestRisk.factors_json || '[]');
    const hf = rf.find(f => f.label?.toLowerCase().includes('hard'));
    if (hf) hardCourseCount = Math.max(hardCourseCount, parseInt(hf.label?.match(/\d+/)?.[0] ?? '0'));
  }

  // Repeated AI questions (high repeat ratio = struggling)
  const repeatHeavy = aiMetrics.filter(m => m.count >= 2 && (m.repeat_count || 0) / m.count > 0.4);
  const criticalWeak = weakTopics.filter(t => t.question_count >= 3);

  // ── 1. FAILURE RISK SCORE ─────────────────────────────────────────────────
  const failureFactors = [];
  let failureRisk = 0;

  if (overdueRate >= 0.5)      { failureRisk += 25; failureFactors.push({ label: `${Math.round(overdueRate*100)}% of tasks overdue`, weight: 25, severity: 'critical' }); }
  else if (overdueRate >= 0.25){ failureRisk += 15; failureFactors.push({ label: `${Math.round(overdueRate*100)}% of tasks overdue`, weight: 15, severity: 'high' }); }
  else if (overdueRate >= 0.1) { failureRisk += 7;  failureFactors.push({ label: `${Math.round(overdueRate*100)}% of tasks overdue`, weight: 7, severity: 'medium' }); }

  if (hardCourseCount >= 3)    { failureRisk += 20; failureFactors.push({ label: `${hardCourseCount} hard/exam-prep courses this semester`, weight: 20, severity: 'critical' }); }
  else if (hardCourseCount === 2){ failureRisk += 12; failureFactors.push({ label: '2 hard courses this semester', weight: 12, severity: 'high' }); }
  else if (hardCourseCount === 1){ failureRisk += 5;  failureFactors.push({ label: '1 hard course this semester', weight: 5, severity: 'low' }); }

  if (avgPlanProgress < 25)    { failureRisk += 20; failureFactors.push({ label: `Average plan progress critically low: ${Math.round(avgPlanProgress)}%`, weight: 20, severity: 'critical' }); }
  else if (avgPlanProgress < 50){ failureRisk += 12; failureFactors.push({ label: `Average plan progress low: ${Math.round(avgPlanProgress)}%`, weight: 12, severity: 'high' }); }
  else if (avgPlanProgress < 70){ failureRisk += 5;  failureFactors.push({ label: `Average plan progress moderate: ${Math.round(avgPlanProgress)}%`, weight: 5, severity: 'medium' }); }

  if (consistencyScore < 30)   { failureRisk += 20; failureFactors.push({ label: `Very low study consistency: ${Math.round(consistencyScore)}%`, weight: 20, severity: 'critical' }); }
  else if (consistencyScore < 50){ failureRisk += 10; failureFactors.push({ label: `Low study consistency: ${Math.round(consistencyScore)}%`, weight: 10, severity: 'high' }); }
  else if (consistencyScore < 65){ failureRisk += 5;  failureFactors.push({ label: `Moderate study consistency: ${Math.round(consistencyScore)}%`, weight: 5, severity: 'medium' }); }

  if (burnoutPattern >= 70)    { failureRisk += 15; failureFactors.push({ label: 'High burnout risk detected from activity patterns', weight: 15, severity: 'critical' }); }
  else if (burnoutPattern >= 50){ failureRisk += 8;  failureFactors.push({ label: 'Moderate burnout risk', weight: 8, severity: 'high' }); }

  if (aiDependency >= 70)      { failureRisk += 8;  failureFactors.push({ label: `High AI dependency (${Math.round(aiDependency)}%) — limited independent practice`, weight: 8, severity: 'medium' }); }

  failureRisk = Math.min(100, failureRisk);

  // ── 2. BURNOUT PROBABILITY ────────────────────────────────────────────────
  const burnoutFactors = [];
  let burnoutProb = Math.round(burnoutPattern * 0.5);

  if (lateNightRatio > 0.3)    { burnoutProb += 22; burnoutFactors.push({ label: `${Math.round(lateNightRatio*100)}% of sessions are after 22:00`, weight: 22, severity: 'critical' }); }
  else if (lateNightRatio > 0.15){ burnoutProb += 12; burnoutFactors.push({ label: `${Math.round(lateNightRatio*100)}% late-night study sessions`, weight: 12, severity: 'high' }); }

  if (activityDecline > 0.5)   { burnoutProb += 25; burnoutFactors.push({ label: `${Math.round(activityDecline*100)}% activity collapse this week vs last week`, weight: 25, severity: 'critical' }); }
  else if (activityDecline > 0.3){ burnoutProb += 15; burnoutFactors.push({ label: `${Math.round(activityDecline*100)}% drop in weekly activity`, weight: 15, severity: 'high' }); }
  else if (activityDecline > 0.1){ burnoutProb += 8;  burnoutFactors.push({ label: `${Math.round(activityDecline*100)}% slight activity decline`, weight: 8, severity: 'medium' }); }

  if (procrastination > 70)    { burnoutProb += 12; burnoutFactors.push({ label: `Severe procrastination pattern: ${Math.round(procrastination)}%`, weight: 12, severity: 'high' }); }
  else if (procrastination > 50){ burnoutProb += 6;  burnoutFactors.push({ label: `Moderate procrastination: ${Math.round(procrastination)}%`, weight: 6, severity: 'medium' }); }

  if (latestRisk?.level === 'high'){ burnoutProb += 10; burnoutFactors.push({ label: 'High academic load risk recorded in last assessment', weight: 10, severity: 'high' }); }

  if (thisWeek === 0 && lastWeek > 0){ burnoutProb += 15; burnoutFactors.push({ label: 'Zero activity this week after previous activity — possible disengagement', weight: 15, severity: 'critical' }); }

  burnoutProb = Math.min(100, burnoutProb);

  // ── 3. SCHEDULE COLLAPSE RISK ─────────────────────────────────────────────
  const scheduleFactors = [];
  let scheduleCollapse = 0;

  if (tasksDueSoon >= 6)       { scheduleCollapse += 30; scheduleFactors.push({ label: `${tasksDueSoon} tasks due within 7 days`, weight: 30, severity: 'critical' }); }
  else if (tasksDueSoon >= 3)  { scheduleCollapse += 18; scheduleFactors.push({ label: `${tasksDueSoon} tasks due within 7 days`, weight: 18, severity: 'high' }); }
  else if (tasksDueSoon >= 1)  { scheduleCollapse += 8;  scheduleFactors.push({ label: `${tasksDueSoon} task(s) due within 7 days`, weight: 8, severity: 'medium' }); }

  if (scheduleWarnings.length >= 3)  { scheduleCollapse += 25; scheduleFactors.push({ label: `${scheduleWarnings.length} schedule overload warnings`, weight: 25, severity: 'critical' }); }
  else if (scheduleWarnings.length >= 1){ scheduleCollapse += 12; scheduleFactors.push({ label: `${scheduleWarnings.length} schedule warning(s)`, weight: 12, severity: 'high' }); }

  if (overdueRate >= 0.4 && totalTasks >= 5){ scheduleCollapse += 20; scheduleFactors.push({ label: `Accumulating backlog (${overdueTasks} overdue) will overwhelm upcoming schedule`, weight: 20, severity: 'critical' }); }

  if (procrastination > 60 && tasksDueSoon > 2){ scheduleCollapse += 15; scheduleFactors.push({ label: `High procrastination (${Math.round(procrastination)}%) combined with ${tasksDueSoon} approaching deadlines`, weight: 15, severity: 'high' }); }

  scheduleCollapse = Math.min(100, scheduleCollapse);

  // ── 4. EXAM FAILURE RISK ──────────────────────────────────────────────────
  const examFactors = [];
  let examRisk = 0;

  if (latestRisk) {
    const rf = JSON.parse(latestRisk.factors_json || '[]');
    const examF = rf.find(f => f.label?.toLowerCase().includes('exam'));
    if (examF) { examRisk += Math.round(examF.weight * 1.5); examFactors.push({ label: examF.label, weight: Math.round(examF.weight * 1.5), severity: 'critical' }); }
  }

  if (criticalWeak.length >= 3){ examRisk += 28; examFactors.push({ label: `${criticalWeak.length} subjects with repeated difficulty: ${criticalWeak.slice(0,3).map(t=>t.topic).join(', ')}`, weight: 28, severity: 'critical' }); }
  else if (criticalWeak.length === 2){ examRisk += 18; examFactors.push({ label: `2 recurring struggle topics: ${criticalWeak.map(t=>t.topic).join(', ')}`, weight: 18, severity: 'high' }); }
  else if (criticalWeak.length === 1){ examRisk += 10; examFactors.push({ label: `Recurring difficulty with "${criticalWeak[0].topic}"`, weight: 10, severity: 'medium' }); }

  if (repeatHeavy.length >= 2){ examRisk += 15; examFactors.push({ label: `Repeatedly re-asking about: ${repeatHeavy.slice(0,2).map(m=>m.topic).join(', ')}`, weight: 15, severity: 'high' }); }
  else if (repeatHeavy.length === 1){ examRisk += 8; examFactors.push({ label: `Struggling to retain: "${repeatHeavy[0].topic}"`, weight: 8, severity: 'medium' }); }

  if (consistencyScore < 40)   { examRisk += 12; examFactors.push({ label: `Low study consistency (${Math.round(consistencyScore)}%) reduces exam readiness`, weight: 12, severity: 'high' }); }

  // Memory-driven exam risk: low avg mastery, forgetting alerts, unresolved gaps
  if (memoryProfile && memoryProfile.avg_mastery > 0) {
    if (memoryProfile.avg_mastery < 35)      { examRisk += 20; examFactors.push({ label: `Critical average concept mastery: ${memoryProfile.avg_mastery}%`, weight: 20, severity: 'critical' }); }
    else if (memoryProfile.avg_mastery < 50) { examRisk += 12; examFactors.push({ label: `Low average concept mastery: ${memoryProfile.avg_mastery}%`, weight: 12, severity: 'high' }); }
    else if (memoryProfile.avg_mastery < 65) { examRisk += 6;  examFactors.push({ label: `Moderate concept mastery: ${memoryProfile.avg_mastery}%`, weight: 6, severity: 'medium' }); }
  }
  if (forgettingAlerts.length >= 3)          { examRisk += 15; examFactors.push({ label: `${forgettingAlerts.length} concepts forgetting due to inactivity`, weight: 15, severity: 'high' }); }
  else if (forgettingAlerts.length >= 1)     { examRisk += 7;  examFactors.push({ label: `${forgettingAlerts.length} concept(s) losing retention (needs revision)`, weight: 7, severity: 'medium' }); }
  if (knowledgeGaps.length >= 3)             { examRisk += 12; examFactors.push({ label: `${knowledgeGaps.length} unresolved prerequisite knowledge gaps`, weight: 12, severity: 'high' }); }
  else if (knowledgeGaps.length >= 1)        { examRisk += 5;  examFactors.push({ label: `${knowledgeGaps.length} knowledge gap(s) in prerequisite concepts`, weight: 5, severity: 'medium' }); }

  examRisk = Math.min(100, examRisk);

  // ── 5. PRODUCTIVITY DECLINE RISK ─────────────────────────────────────────
  const productivityFactors = [];
  let productivityDecline = 0;

  if (activityDecline > 0.5)   { productivityDecline += 40; productivityFactors.push({ label: `${Math.round(activityDecline*100)}% fewer platform events this week vs last`, weight: 40, severity: 'critical' }); }
  else if (activityDecline > 0.3){ productivityDecline += 25; productivityFactors.push({ label: `${Math.round(activityDecline*100)}% drop in weekly activity`, weight: 25, severity: 'high' }); }
  else if (activityDecline > 0.1){ productivityDecline += 12; productivityFactors.push({ label: `${Math.round(activityDecline*100)}% slight activity decline`, weight: 12, severity: 'medium' }); }

  if (completionTrend < 30)    { productivityDecline += 30; productivityFactors.push({ label: `Task completion critically low: ${Math.round(completionTrend)}%`, weight: 30, severity: 'critical' }); }
  else if (completionTrend < 50){ productivityDecline += 18; productivityFactors.push({ label: `Task completion low: ${Math.round(completionTrend)}%`, weight: 18, severity: 'high' }); }
  else if (completionTrend < 65){ productivityDecline += 8;  productivityFactors.push({ label: `Task completion moderate: ${Math.round(completionTrend)}%`, weight: 8, severity: 'medium' }); }

  if (procrastination > 70)    { productivityDecline += 20; productivityFactors.push({ label: `Severe procrastination: ${Math.round(procrastination)}%`, weight: 20, severity: 'critical' }); }
  else if (procrastination > 50){ productivityDecline += 10; productivityFactors.push({ label: `High procrastination pattern: ${Math.round(procrastination)}%`, weight: 10, severity: 'high' }); }

  productivityDecline = Math.min(100, productivityDecline);

  // ── 6. RECOVERY POTENTIAL (higher = more recoverable) ────────────────────
  const recoveryFactors = [];
  let recoveryPotential = 80;

  if (failureRisk > 75)        { recoveryPotential -= 28; recoveryFactors.push({ label: `Critical failure risk (${Math.round(failureRisk)}) — recovery window narrowing`, weight: -28 }); }
  else if (failureRisk > 50)   { recoveryPotential -= 15; recoveryFactors.push({ label: `High failure risk (${Math.round(failureRisk)}) limits recovery speed`, weight: -15 }); }
  else if (failureRisk > 30)   { recoveryPotential -= 5;  }

  if (burnoutProb > 70)        { recoveryPotential -= 22; recoveryFactors.push({ label: `High burnout probability (${Math.round(burnoutProb)}%) slows recovery`, weight: -22 }); }
  else if (burnoutProb > 50)   { recoveryPotential -= 10; }

  if (scheduleCollapse > 70)   { recoveryPotential -= 15; recoveryFactors.push({ label: `Schedule collapse risk (${Math.round(scheduleCollapse)}) — needs urgent restructuring`, weight: -15 }); }

  if (consistencyScore > 65)   { recoveryPotential += 12; recoveryFactors.push({ label: `Good study consistency (${Math.round(consistencyScore)}%) supports rapid recovery`, weight: 12 }); }
  else if (consistencyScore > 45){ recoveryPotential += 6; }

  if (plans.length > 0 && avgPlanProgress >= 50){ recoveryPotential += 8; recoveryFactors.push({ label: `Active plans with ${Math.round(avgPlanProgress)}% average progress show academic intent`, weight: 8 }); }

  if (events.length > 30)      { recoveryPotential += 5; recoveryFactors.push({ label: 'Sufficient behavioral data for precise recovery tracking', weight: 5 }); }

  if (adaptPrefs?.recovery_mode){ recoveryPotential -= 8; recoveryFactors.push({ label: 'Recovery mode active — system is already compensating', weight: -8 }); }

  recoveryPotential = Math.max(10, Math.min(100, Math.round(recoveryPotential)));

  // ── 7. CONFIDENCE SCORE ───────────────────────────────────────────────────
  let confidenceScore = 0;
  if (events.length >= 50) confidenceScore += 30;
  else if (events.length >= 20) confidenceScore += 20;
  else if (events.length >= 5)  confidenceScore += 10;

  if (totalTasks >= 10) confidenceScore += 25;
  else if (totalTasks >= 5) confidenceScore += 15;
  else if (totalTasks >= 1) confidenceScore += 8;

  if (patterns.length >= 5) confidenceScore += 20;
  else if (patterns.length >= 3) confidenceScore += 12;

  if (latestRisk)       confidenceScore += 15;
  if (weakTopics.length > 0) confidenceScore += 5;
  if (latestSched)      confidenceScore += 5;

  confidenceScore = Math.min(100, confidenceScore);

  // ── Overall health ────────────────────────────────────────────────────────
  const overallScore = Math.round(
    failureRisk * 0.30 + burnoutProb * 0.20 +
    scheduleCollapse * 0.15 + examRisk * 0.20 + productivityDecline * 0.15
  );
  const overallHealth = overallScore >= 70 ? 'critical'
    : overallScore >= 50 ? 'at_risk'
    : overallScore >= 30 ? 'moderate' : 'healthy';

  // ── Trend direction ───────────────────────────────────────────────────────
  const prevPrediction = _getPreviousWeekPrediction(userId);
  const trendDirection = _computeTrend(overallScore, prevPrediction?.overall_score);

  return {
    failureRisk:             Math.round(failureRisk),
    burnoutProbability:      Math.round(burnoutProb),
    scheduleCollapseRisk:    Math.round(scheduleCollapse),
    examFailureRisk:         Math.round(examRisk),
    productivityDeclineRisk: Math.round(productivityDecline),
    recoveryPotential,
    confidenceScore:         Math.round(confidenceScore),
    overallScore,
    overallHealth,
    trendDirection,
    factors: {
      failure:      failureFactors,
      burnout:      burnoutFactors,
      schedule:     scheduleFactors,
      exam:         examFactors,
      productivity: productivityFactors,
      recovery:     recoveryFactors,
    },
    dataPoints: {
      totalEvents:      events.length,
      totalTasks,
      overdueCount:     overdueTasks,
      overdueRate:      Math.round(overdueRate * 100),
      avgPlanProgress:  Math.round(avgPlanProgress),
      consistencyScore: Math.round(consistencyScore),
      burnoutRisk:      Math.round(burnoutPattern),
      lateNightPct:     Math.round(lateNightRatio * 100),
      tasksDueSoon,
      weakTopicCount:    weakTopics.length,
      thisWeekEvents:    thisWeek,
      lastWeekEvents:    lastWeek,
      hardCourseCount,
      scheduleWarnings:  scheduleWarnings.length,
      avgConceptMastery: memoryProfile?.avg_mastery ?? 0,
      forgettingCount:   forgettingAlerts.length,
      knowledgeGapCount: knowledgeGaps.length,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _getAllTasks(userId) {
  try {
    const plans = db.getUserPlans(userId);
    return plans.flatMap(p => db.getPlanTasks(p.id) || []);
  } catch (_) { return []; }
}

function _weekStart(ts) {
  return ts - (ts % WEEK_MS);
}

function _getPreviousWeekPrediction(userId) {
  try {
    const hist = db.getPredictionHistory(userId, 3);
    if (hist.length < 2) return null;
    return hist[hist.length - 2]; // second-to-last entry
  } catch (_) { return null; }
}

function _computeTrend(currentScore, prevScore) {
  if (prevScore == null) return 'stable';
  const diff = currentScore - prevScore;
  if (diff >= 8) return 'declining';    // risk score increasing = declining academic health
  if (diff <= -8) return 'improving';   // risk score decreasing = improving
  return 'stable';
}

// Build prediction history for the timeline (8 weekly snapshots)
function buildPredictionTimeline(userId) {
  const stored = db.getPredictionHistory(userId, 8);
  const trends = db.getStudentTrends(userId, 8);
  const perfHist = db.getPerformanceHistory(userId, 8);
  const now = Date.now();

  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = _weekStart(now - i * WEEK_MS);
    const label = i === 0 ? 'Now' : `W-${i}`;

    // Try stored prediction snapshot first
    const snap = stored.find(s => Math.abs(s.week_start - weekStart) < WEEK_MS);
    if (snap) {
      weeks.push({
        label,
        weekStart: snap.week_start,
        failureRisk: snap.failure_risk,
        burnoutProbability: snap.burnout_probability,
        productivityDeclineRisk: snap.productivity_decline_risk,
        recoveryPotential: snap.recovery_potential,
        overallScore: snap.overall_score,
        overallHealth: snap.overall_health,
      });
      continue;
    }

    // Fallback: estimate from performance history
    const perf = perfHist.find(p => Math.abs(p.week_start - weekStart) < WEEK_MS);
    if (perf) {
      const estFailure = Math.max(0, 100 - perf.productivity_score);
      weeks.push({
        label,
        weekStart,
        failureRisk: Math.round(estFailure * 0.8),
        burnoutProbability: Math.round(perf.risk_score ?? 0),
        productivityDeclineRisk: Math.round(Math.max(0, 60 - perf.productivity_score)),
        recoveryPotential: perf.productivity_score,
        overallScore: Math.round(estFailure * 0.7),
        overallHealth: estFailure > 60 ? 'at_risk' : 'moderate',
      });
      continue;
    }

    weeks.push({ label, weekStart, failureRisk: null, burnoutProbability: null, productivityDeclineRisk: null, recoveryPotential: null, overallScore: null, overallHealth: null });
  }
  return weeks;
}

module.exports = { computeAndSave, computePredictions, buildPredictionTimeline };
