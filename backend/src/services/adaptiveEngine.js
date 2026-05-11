const db = require('../db/queries');

/**
 * Reads computed learning patterns for a user and derives adaptive preferences.
 * These preferences are then used by chatService and optimizer to personalize behavior.
 */
function generateAdaptivePrefs(patterns) {
  const get = (type) => patterns.find(p => p.pattern_type === type);
  const getAll = (type) => patterns.filter(p => p.pattern_type === type);

  const consistency = get('consistency')?.value ?? 50;
  const burnout = get('burnout_risk')?.value ?? 0;
  const procrastination = get('procrastination')?.value ?? 0;
  const dependency = get('ai_dependency')?.value ?? 50;
  const completionTrend = get('completion_trend')?.value ?? 50;
  const overdueRatio = get('overdue_ratio')?.value ?? 0;

  // Top weak subjects (sorted by weakness score desc)
  const weakSubjects = getAll('weak_subject')
    .filter(p => p.value > 30)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map(p => p.subject)
    .filter(Boolean);

  // ── Explanation depth ─────────────────────────────────────────────────────
  // Struggling students need simplified explanations; advanced students need brevity
  let explanationDepth = 'standard';
  if (dependency > 65 || completionTrend < 35 || overdueRatio > 50) {
    explanationDepth = 'simplified';
  } else if (dependency < 25 && completionTrend > 70 && consistency > 60) {
    explanationDepth = 'advanced';
  }

  // ── Session length recommendation ─────────────────────────────────────────
  let sessionLength = 'medium';
  if (burnout > 60) sessionLength = 'short';
  else if (consistency > 65 && burnout < 30) sessionLength = 'long';

  // ── Recovery mode ─────────────────────────────────────────────────────────
  // Triggered when burnout is high OR procrastination is high AND completion is low
  const recoveryMode = burnout > 60 || (procrastination > 70 && completionTrend < 35);

  // ── Example frequency ─────────────────────────────────────────────────────
  let exampleFrequency = 'medium';
  if (dependency > 60 || explanationDepth === 'simplified') exampleFrequency = 'high';
  else if (explanationDepth === 'advanced') exampleFrequency = 'low';

  // ── Productivity score (0-100 composite) ──────────────────────────────────
  const productivityScore = Math.min(100, Math.max(0, Math.round(
    consistency * 0.30 +
    completionTrend * 0.30 +
    (100 - burnout) * 0.20 +
    (100 - procrastination) * 0.10 +
    (100 - overdueRatio) * 0.10
  )));

  // ── AI dependency level ───────────────────────────────────────────────────
  let aiDependencyLevel = 'normal';
  if (dependency > 65) aiDependencyLevel = 'high';
  else if (dependency < 25) aiDependencyLevel = 'low';

  return {
    explanationDepth,
    sessionLength,
    focusSubjects: weakSubjects,
    recoveryMode,
    exampleFrequency,
    productivityScore,
    burnoutScore: Math.round(burnout),
    consistencyScore: Math.round(consistency),
    aiDependencyLevel,
  };
}

function computeAndSave(userId, patterns) {
  const prefs = generateAdaptivePrefs(patterns);
  db.saveAdaptivePrefs(userId, prefs);
  return prefs;
}

/**
 * Returns the system-prompt injection text based on adaptive preferences.
 * Used by chatService to personalize AI responses.
 */
function buildChatAdaptiveContext(prefs) {
  if (!prefs) return '';

  const lines = ['\n\n── Adaptive Learning Context ──'];

  if (prefs.explanation_depth === 'simplified') {
    lines.push('Communication: Use simple language and short sentences. Avoid jargon. Break explanations into numbered steps.');
  } else if (prefs.explanation_depth === 'advanced') {
    lines.push('Communication: Student is advanced. Be concise and technical. Skip basic definitions unless asked.');
  }

  if (prefs.example_frequency === 'high') {
    lines.push('Always include 2-3 concrete examples to illustrate each concept.');
  } else if (prefs.example_frequency === 'low') {
    lines.push('Keep examples minimal — only include one if essential for understanding.');
  }

  if (prefs.recovery_mode) {
    lines.push('Student is showing signs of academic fatigue or overload. Be encouraging, compassionate, and suggest breaking tasks into smaller steps. Do not overwhelm with too much information at once.');
  }

  const focusSubjects = typeof prefs.focus_subjects_json === 'string'
    ? JSON.parse(prefs.focus_subjects_json || '[]')
    : (prefs.focusSubjects || []);

  if (focusSubjects.length > 0) {
    lines.push(`Weak areas requiring extra attention: ${focusSubjects.join(', ')}. Provide extra care and clarity for these topics.`);
  }

  if (prefs.ai_dependency_level === 'high') {
    lines.push('Student relies heavily on AI. Encourage independent thinking: after answering, ask a follow-up question to check understanding or suggest they try solving a similar problem themselves.');
  }

  return lines.length > 1 ? lines.join('\n') : '';
}

module.exports = { generateAdaptivePrefs, computeAndSave, buildChatAdaptiveContext };
