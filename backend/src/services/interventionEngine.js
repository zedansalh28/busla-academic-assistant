/**
 * Intervention Engine
 *
 * Generates specific, actionable interventions from prediction scores.
 * Every intervention explains WHY it was triggered and WHAT to do.
 * Interventions are sorted by urgency (5 = critical, 1 = info).
 */

const db = require('../db/queries');

function generateInterventions(prediction) {
  const {
    failureRisk, burnoutProbability, scheduleCollapseRisk,
    examFailureRisk, productivityDeclineRisk, recoveryPotential,
    dataPoints, factors,
  } = prediction;

  const {
    overdueRate = 0, avgPlanProgress = 0, consistencyScore = 50,
    tasksDueSoon = 0, weakTopicCount = 0, lateNightPct = 0,
    hardCourseCount = 0, scheduleWarnings = 0,
    thisWeekEvents = 0, lastWeekEvents = 0,
  } = dataPoints || {};

  const interventions = [];

  // ── Urgency 5: CRITICAL ───────────────────────────────────────────────────

  if (failureRisk >= 75) {
    interventions.push({
      type: 'critical',
      title: 'Academic Failure Risk — Act Today',
      message: `Your failure risk score is ${failureRisk}/100 — a critical threshold. You must reduce your overdue backlog, contact your academic advisor, and activate recovery mode in the Optimizer immediately.`,
      action_type: 'emergency_plan',
      urgency: 5,
      reason: `Failure risk at ${failureRisk}% (threshold: 75%)`,
      action_label: 'Open Optimizer',
      action_href: '/optimizer',
    });
  }

  if (burnoutProbability >= 70) {
    interventions.push({
      type: 'critical',
      title: 'Burnout Imminent — Stop and Rest',
      message: `Burnout probability is ${burnoutProbability}%. You have shown ${lateNightPct > 20 ? `${lateNightPct}% late-night sessions and ` : ''}a ${lastWeekEvents > 0 ? Math.round((lastWeekEvents - thisWeekEvents) / lastWeekEvents * 100) : 0}% activity drop this week. Take a full recovery day — studying through burnout worsens outcomes.`,
      action_type: 'recovery',
      urgency: 5,
      reason: `Burnout probability at ${burnoutProbability}% — activity collapse detected`,
      action_label: 'View Recovery Plan',
      action_href: '/risk',
    });
  }

  // ── Urgency 4: HIGH ───────────────────────────────────────────────────────

  if (scheduleCollapseRisk >= 65) {
    interventions.push({
      type: 'warning',
      title: 'Schedule Collapse Approaching',
      message: `${tasksDueSoon} tasks due within 7 days${scheduleWarnings > 0 ? ` plus ${scheduleWarnings} schedule warning(s) detected` : ''}. Regenerate your schedule now — the Optimizer will automatically redistribute your workload.`,
      action_type: 'schedule_adjustment',
      urgency: 4,
      reason: `${tasksDueSoon} deadlines + ${scheduleWarnings} warnings in current schedule`,
      action_label: 'Regenerate Schedule',
      action_href: '/optimizer',
    });
  }

  if (examFailureRisk >= 60) {
    const topWeak = (factors?.exam || []).slice(0, 1)[0];
    interventions.push({
      type: 'warning',
      title: 'Exam Failure Risk Detected',
      message: `Exam failure risk is ${examFailureRisk}/100. ${topWeak ? `Primary concern: ${topWeak.label}.` : ''} Schedule dedicated exam-prep blocks in the Optimizer and use Chat to review weak topics with spaced repetition.`,
      action_type: 'exam_prep',
      urgency: 4,
      reason: `Exam risk at ${examFailureRisk}% — weak topics + upcoming exams`,
      action_label: 'Open Chat',
      action_href: '/chat',
    });
  }

  if (overdueRate > 0.4 && tasksDueSoon > 0) {
    interventions.push({
      type: 'warning',
      title: `${Math.round(overdueRate * 100)}% Overdue + Deadlines This Week`,
      message: `You have an accumulating backlog AND upcoming deadlines. Clear overdue tasks first — even incomplete progress counts. Use the Planner's "in-progress" status to track partial work.`,
      action_type: 'backlog_clear',
      urgency: 4,
      reason: `${Math.round(overdueRate * 100)}% overdue rate with ${tasksDueSoon} tasks due this week`,
      action_label: 'Open Planner',
      action_href: '/planner',
    });
  }

  // ── Urgency 3: MEDIUM ─────────────────────────────────────────────────────

  if (productivityDeclineRisk >= 50 && burnoutProbability < 70) {
    interventions.push({
      type: 'warning',
      title: 'Productivity Declining',
      message: `This week: ${thisWeekEvents} events vs last week: ${lastWeekEvents}. Use the Pomodoro method — 25 min focused work + 5 min break. Even one productive session per day reverses the trend.`,
      action_type: 'productivity_boost',
      urgency: 3,
      reason: `Productivity decline: ${thisWeekEvents} vs ${lastWeekEvents} weekly events`,
    });
  }

  if (lateNightPct > 25) {
    interventions.push({
      type: 'warning',
      title: `${lateNightPct}% of Sessions After 22:00`,
      message: `Late-night studying reduces memory consolidation by ~40%. The Optimizer will automatically shift your hardest blocks to your detected peak hours. Try it now.`,
      action_type: 'habit_change',
      urgency: 3,
      reason: `${lateNightPct}% of study events recorded after 22:00`,
      action_label: 'Shift Schedule',
      action_href: '/optimizer',
    });
  }

  if (hardCourseCount >= 3 && avgPlanProgress < 50) {
    const courseStr = hardCourseCount >= 3 ? `${hardCourseCount} hard courses` : 'hard courses';
    interventions.push({
      type: 'warning',
      title: `${courseStr} + Low Plan Progress`,
      message: `You are carrying ${courseStr} with only ${Math.round(avgPlanProgress)}% average plan completion. Prioritize your hardest course first each week — difficulty-weighted sessions are already prioritized in the Optimizer.`,
      action_type: 'workload_redistribution',
      urgency: 3,
      reason: `${hardCourseCount} hard courses with ${Math.round(avgPlanProgress)}% plan progress`,
    });
  }

  if (weakTopicCount >= 3) {
    interventions.push({
      type: 'suggestion',
      title: `${weakTopicCount} Recurring Struggle Topics`,
      message: `You keep returning to the same topics in Chat. Try the Feynman technique: explain each topic in writing in your own words, then ask the AI to evaluate your explanation rather than re-asking the question.`,
      action_type: 'learning_strategy',
      urgency: 3,
      reason: `${weakTopicCount} topics asked about 3+ times each`,
    });
  }

  // ── Urgency 2: LOW ────────────────────────────────────────────────────────

  if (consistencyScore < 50 && burnoutProbability < 50) {
    interventions.push({
      type: 'suggestion',
      title: 'Build Daily Study Habit',
      message: `Consistency score: ${Math.round(consistencyScore)}%. Set a daily 20-minute study alarm at your detected peak activity hour. Compound consistency beats occasional long sessions.`,
      action_type: 'habit_building',
      urgency: 2,
      reason: `Consistency at ${Math.round(consistencyScore)}% — irregular study pattern detected`,
    });
  }

  if (avgPlanProgress < 40 && plans_present(prediction) && failureRisk < 50) {
    interventions.push({
      type: 'suggestion',
      title: 'Study Plans Need Attention',
      message: `Average plan progress is ${Math.round(avgPlanProgress)}%. Break large plans into tasks under 30 minutes — completion psychology matters. Tick off small wins daily.`,
      action_type: 'plan_management',
      urgency: 2,
      reason: `${Math.round(avgPlanProgress)}% average plan completion`,
      action_label: 'Open Planner',
      action_href: '/planner',
    });
  }

  // ── Urgency 1: POSITIVE ───────────────────────────────────────────────────

  if (recoveryPotential >= 70 && failureRisk < 35) {
    interventions.push({
      type: 'positive',
      title: 'Strong Academic Position',
      message: `Recovery potential is ${recoveryPotential}% and failure risk is low at ${failureRisk}%. Your academic health looks good — maintain consistency and the prediction system will track your continued improvement.`,
      action_type: 'reinforcement',
      urgency: 1,
      reason: `Recovery potential ${recoveryPotential}% + failure risk ${failureRisk}%`,
    });
  }

  if (failureRisk < 25 && burnoutProbability < 30 && consistencyScore > 65) {
    interventions.push({
      type: 'positive',
      title: 'Academic Health: Excellent',
      message: `All major risk indicators are in the healthy range. Your behavioral patterns show consistent, balanced study habits. Keep this up through exam season.`,
      action_type: 'reinforcement',
      urgency: 1,
      reason: 'All scores within healthy thresholds',
    });
  }

  return interventions.sort((a, b) => b.urgency - a.urgency);
}

function plans_present(prediction) {
  return (prediction.dataPoints?.totalTasks ?? 0) > 0;
}

/**
 * Generates a 7-step recovery plan based on risk level.
 * Steps are specific and sequenced.
 */
function generateRecoveryPlan(prediction) {
  const { overallHealth, failureRisk, burnoutProbability, scheduleCollapseRisk, examFailureRisk, dataPoints } = prediction;
  const { overdueRate = 0, weakTopicCount = 0, tasksDueSoon = 0 } = dataPoints || {};

  const plan = { title: '', steps: [] };

  if (overallHealth === 'critical' || failureRisk >= 65) {
    plan.title = '7-Day Emergency Academic Recovery Plan';
    plan.steps = [
      { day: 'Day 1 (Today)', action: `Emergency triage: list every pending task. Mark anything due within 3 days as URGENT. Archive tasks that are no longer relevant.` },
      { day: 'Day 2', action: `Open the Optimizer and generate a new schedule in Recovery Mode — it will automatically reduce your weekly load by 25%.` },
      { day: 'Day 3–4', action: weakTopicCount > 0 ? `Focus entirely on clearing overdue tasks in your weakest subject. Use Chat to review fundamentals only.` : `Clear all overdue tasks — start with the smallest ones to build momentum. Aim for 3 completions per day.` },
      { day: 'Day 5', action: `Message or visit your lecturer/advisor. Explain your situation — many will allow extensions. Most SCE departments have support mechanisms.` },
      { day: 'Day 6', action: tasksDueSoon > 0 ? `Dedicate the full day to the task(s) due soonest. Don't multitask — deep work on one deliverable.` : `Deep work session: pick your most challenging subject and spend 3 focused hours with the Chat for guided study.` },
      { day: 'Day 7', action: `Review your prediction dashboard. Run a new computation — if failure risk dropped by 10+ points, your plan is working. Set daily alarms for next week.` },
    ];
  } else if (overallHealth === 'at_risk' || failureRisk >= 40) {
    plan.title = '7-Day Academic Risk Reduction Plan';
    plan.steps = [
      { day: 'Day 1–2', action: `Review all study plans. Complete at least ${Math.min(tasksDueSoon + 2, 5)} tasks to clear your most urgent backlog.` },
      { day: 'Day 3', action: `Generate a new Optimizer schedule. Input all your courses with correct difficulty levels for accurate time allocation.` },
      { day: 'Day 4–5', action: weakTopicCount > 0 ? `Schedule 2 focused sessions on your top ${Math.min(weakTopicCount, 2)} weak areas. Use the Chat in a quiz format — ask it to test you.` : `Schedule 2 sessions on your hardest active course. Work problems, not just notes.` },
      { day: 'Day 6', action: burnoutProbability > 40 ? `Half-day recovery — walk, sleep, or exercise. Cognitive rest improves next-day retention by 30%.` : `Exam readiness check: attempt 1 past exam under timed conditions.` },
      { day: 'Day 7', action: `Reassess predictions. Run the Load Check and Prediction Engine. Set concrete weekly goals for the next 2 weeks.` },
    ];
  } else {
    plan.title = '7-Day Academic Optimization Plan';
    plan.steps = [
      { day: 'This week', action: 'Maintain current study pace. Review all upcoming deadlines and add any missing tasks to the Planner.' },
      { day: 'Mid-week', action: 'Use the Optimizer to plan next week in advance — front-loading hard subjects early in the week improves outcomes.' },
      { day: 'Thursday', action: 'Review the week: how many tasks did you complete vs plan? Update plan progress percentages.' },
      { day: 'Weekend', action: 'Light review of the most challenging topics using spaced repetition. Ask Chat to quiz you on 3 concepts.' },
      { day: 'Next week', action: 'Re-run prediction analysis to verify your academic health trajectory is improving.' },
    ];
  }

  return plan;
}

module.exports = { generateInterventions, generateRecoveryPlan };
