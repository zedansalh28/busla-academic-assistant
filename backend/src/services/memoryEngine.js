/**
 * AI Academic Memory & Personalized Learning Brain
 *
 * Builds long-term understanding of each student through:
 *   1. Concept extraction  — maps message keywords to engineering concepts
 *   2. Signal detection    — confusion / understanding / example needs
 *   3. Mastery tracking    — per-concept score 0–100 that evolves over time
 *   4. Retention decay     — Ebbinghaus-inspired forgetting curve
 *   5. Knowledge gaps      — missing prerequisites detected automatically
 *   6. Profile computation — aggregate cognitive profile per student
 *   7. Memory context      — compact string injected into LLM system prompt
 */

const db = require('../db/queries');

const DAY_MS = 86400000;
const STALE_MS = 60 * 60 * 1000; // recompute profile if older than 1 hour
const RETENTION_HALF_LIFE_DAYS = 21; // ~3 weeks until 50% retention loss
const FORGETTING_THRESHOLD = 0.65;   // flag when retention < 65% of original mastery
const FORGETTING_MIN_DAYS = 10;      // don't flag until at least 10 days inactive

// ── Concept → Keywords mapping (SCE Engineering curriculum) ─────────────────

const CONCEPT_MAP = {
  'Limits':                  ['limit', 'continuity', 'lim(', 'approaches zero', 'epsilon delta', 'squeeze theorem'],
  'Derivatives':             ['derivative', 'differentiation', "f'(x)", 'd/dx', 'chain rule', 'product rule', 'quotient rule', 'implicit differentiation', 'critical point', 'tangent line'],
  'Integrals':               ['integral', 'integration', 'antiderivative', 'definite integral', 'indefinite integral', 'riemann sum', 'area under', 'u-substitution', 'integration by parts'],
  'Differential Equations':  ['differential equation', 'ode', "y' =", 'separation of variables', 'initial value problem', 'homogeneous equation', 'particular solution'],
  'Linear Algebra':          ['matrix', 'matrices', 'vector', 'eigenvalue', 'eigenvector', 'determinant', 'linear transformation', 'rank', 'null space', 'basis', 'span', 'row reduction'],
  'Series & Sequences':      ['series', 'sequence', 'convergence', 'divergence', 'taylor series', 'maclaurin', 'fourier series', 'power series', 'radius of convergence'],
  'Probability':             ['probability', 'random variable', 'distribution', 'expected value', 'variance', 'conditional probability', 'bayes theorem', 'combinatorics'],
  'Statistics':              ['statistics', 'hypothesis test', 'p-value', 'confidence interval', 'regression', 'correlation', 'standard deviation', 'normal distribution'],
  'Recursion':               ['recursion', 'recursive', 'base case', 'call stack', 'factorial', 'fibonacci recursive', 'tree recursion', 'mutual recursion'],
  'Data Structures':         ['linked list', 'binary tree', 'heap', 'hash table', 'hash map', 'stack', 'queue', 'trie', 'b-tree', 'data structure'],
  'Sorting Algorithms':      ['quicksort', 'mergesort', 'heapsort', 'bubble sort', 'insertion sort', 'selection sort', 'counting sort', 'radix sort', 'sorting algorithm'],
  'Graph Algorithms':        ['graph algorithm', 'bfs', 'dfs', 'dijkstra', 'topological sort', 'spanning tree', 'bellman-ford', 'shortest path', 'graph traversal'],
  'Dynamic Programming':     ['dynamic programming', ' dp ', 'memoization', 'tabulation', 'knapsack', 'longest common', 'optimal substructure', 'overlapping subproblems'],
  'Complexity Analysis':     ['big o', 'time complexity', 'space complexity', 'o(n)', 'o(log n)', 'o(n^2)', 'asymptotic', 'worst case', 'amortized complexity'],
  'OOP':                     ['object oriented', 'class', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'method override', 'interface', 'abstract class'],
  'Pointers':                ['pointer', 'memory address', 'malloc', 'free(', 'null pointer', 'dereference', '*ptr', '&var', 'memory leak', 'dangling pointer'],
  'DC Circuits':             ['circuit', 'kvl', 'kcl', 'kirchhoff', "ohm's law", 'resistor', 'voltage divider', 'thevenin', 'norton', 'superposition', 'dc analysis'],
  'AC Circuits':             ['ac circuit', 'impedance', 'phasor', 'capacitor', 'inductor', 'rlc', 'resonance', 'reactance', 'complex impedance', 'power factor'],
  'Logic Gates':             ['logic gate', 'and gate', 'or gate', 'not gate', 'nand', 'nor', 'xor', 'boolean algebra', 'truth table', 'karnaugh map', 'logic circuit'],
  'Signals & Systems':       ['fourier transform', 'laplace transform', 'convolution', 'impulse response', 'transfer function', 'z-transform', 'signal processing', 'frequency domain'],
  'SQL Basics':              ['select from', 'where clause', 'insert into', 'update set', 'delete from', 'sql query', 'group by', 'order by', 'having clause'],
  'SQL Joins':               ['inner join', 'outer join', 'left join', 'right join', 'cross join', 'self join', 'natural join', 'join condition'],
  'Database Design':         ['normalization', '1nf', '2nf', '3nf', 'er diagram', 'entity relationship', 'primary key', 'foreign key', 'schema design', 'database schema'],
  'Design Patterns':         ['design pattern', 'singleton', 'factory pattern', 'observer pattern', 'decorator pattern', 'strategy pattern', 'mvc', 'repository pattern'],
  'Git':                     ['git commit', 'git branch', 'git merge', 'git rebase', 'pull request', 'git repository', 'git push', 'git clone', 'merge conflict'],
  'Operating Systems':       ['process', 'thread', 'deadlock', 'mutex', 'semaphore', 'cpu scheduling', 'virtual memory', 'page fault', 'context switch', 'race condition'],
  'Networking':              ['tcp/ip', 'http protocol', 'dns lookup', 'socket programming', 'osi model', 'routing protocol', 'subnetting', 'network layer'],
};

// ── Prerequisite dependency map ───────────────────────────────────────────────

const PREREQUISITE_MAP = {
  'Derivatives':            ['Limits'],
  'Integrals':              ['Derivatives'],
  'Differential Equations': ['Integrals', 'Linear Algebra'],
  'Series & Sequences':     ['Derivatives', 'Limits'],
  'Sorting Algorithms':     ['Recursion'],
  'Graph Algorithms':       ['Recursion', 'Data Structures'],
  'Dynamic Programming':    ['Recursion', 'Sorting Algorithms'],
  'Complexity Analysis':    ['Recursion', 'Sorting Algorithms'],
  'OOP':                    ['Pointers'],
  'Data Structures':        ['Pointers', 'Recursion'],
  'AC Circuits':            ['DC Circuits'],
  'Signals & Systems':      ['AC Circuits', 'Integrals', 'Linear Algebra'],
  'SQL Joins':              ['SQL Basics'],
  'Database Design':        ['SQL Basics', 'SQL Joins'],
};

// ── Concept extraction ────────────────────────────────────────────────────────

function extractConcepts(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [concept, keywords] of Object.entries(CONCEPT_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      // Infer subject from concept
      const subject = _conceptToSubject(concept);
      found.push({ concept, subject });
    }
  }
  return found;
}

function _conceptToSubject(concept) {
  const map = {
    'Limits': 'Mathematics', 'Derivatives': 'Mathematics', 'Integrals': 'Mathematics',
    'Differential Equations': 'Mathematics', 'Linear Algebra': 'Mathematics',
    'Series & Sequences': 'Mathematics', 'Probability': 'Mathematics', 'Statistics': 'Mathematics',
    'Recursion': 'Programming', 'Data Structures': 'Programming',
    'Sorting Algorithms': 'Programming', 'Graph Algorithms': 'Programming',
    'Dynamic Programming': 'Programming', 'Complexity Analysis': 'Programming',
    'OOP': 'Programming', 'Pointers': 'Programming',
    'DC Circuits': 'Electrical Engineering', 'AC Circuits': 'Electrical Engineering',
    'Logic Gates': 'Electrical Engineering', 'Signals & Systems': 'Electrical Engineering',
    'SQL Basics': 'Databases', 'SQL Joins': 'Databases', 'Database Design': 'Databases',
    'Design Patterns': 'Software Engineering', 'Git': 'Software Engineering',
    'Operating Systems': 'Systems', 'Networking': 'Systems',
  };
  return map[concept] || 'General';
}

// ── Signal detection ──────────────────────────────────────────────────────────

const CONFUSION_PATTERNS = [
  "don't understand", "dont understand", "confused", "not clear", "what do you mean",
  "doesn't make sense", "doesn't work", "still don't", "still confused", "lost",
  "what?", "huh?", "i don't get", "i dont get", "not following", "explain again",
  "what is", "what are", "how does", "why does",
];
const UNDERSTANDING_PATTERNS = [
  "i see", "i get it", "got it", "understand now", "makes sense", "i understand",
  "now i get", "that makes sense", "ah ok", "ah i see", "perfect", "clear now",
  "that helps", "thank you", "thanks, now", "understood",
];
const EXAMPLE_REQUEST_PATTERNS = [
  "example please", "give me an example", "can you show", "show me", "demonstrate",
  "for instance", "like what", "what does that look like", "show an example",
  "illustrate", "walk me through",
];
const DEPTH_MORE_PATTERNS = [
  "more detail", "explain more", "go deeper", "elaborate", "tell me more",
  "explain further", "more explanation", "deeper explanation", "prove it", "why does this work",
];
const DEPTH_LESS_PATTERNS = [
  "simpler", "simpler explanation", "eli5", "simple terms", "brief", "quick summary",
  "shorter", "just the basics", "tldr", "in short", "summarize",
];
const PRACTICE_PATTERNS = [
  "give me a problem", "practice question", "exercise", "quiz me", "test me",
  "problem to solve", "let me try", "practice problem", "exam question",
];

function detectSignals(message) {
  const lower = message.toLowerCase();
  const signals = [];

  if (CONFUSION_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'confusion', strength: 1.0 });
  }
  if (lower.includes('still') && (lower.includes('don\'t') || lower.includes('not'))) {
    signals.push({ type: 'repeat_confusion', strength: 1.5 });
  }
  if (UNDERSTANDING_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'understanding', strength: 1.0 });
  }
  if (EXAMPLE_REQUEST_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'example_request', strength: 0.8 });
  }
  if (DEPTH_MORE_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'depth_more', strength: 0.9 });
  }
  if (DEPTH_LESS_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'depth_less', strength: 0.9 });
  }
  if (PRACTICE_PATTERNS.some(p => lower.includes(p))) {
    signals.push({ type: 'practice_request', strength: 0.7 });
  }

  return signals;
}

// ── Explanation type detection from LLM response ─────────────────────────────

function detectExplanationType(response) {
  const lower = response.toLowerCase();
  const hasCode = response.includes('```') || response.includes('    ');
  const hasNumberedSteps = /\n\s*[1-9]\./m.test(response);
  const hasAnalogy = lower.includes('imagine') || lower.includes('think of it like') || lower.includes('similar to') || lower.includes('just like');
  const hasMath = /[∫∑∏√∂≈≠≤≥]|\\frac|\\int|\\sum|d\/dx/.test(response);
  const hasExercise = lower.includes('try:') || lower.includes('exercise:') || lower.includes('your turn') || lower.includes('practice:');
  const hasConcrete = lower.startsWith('for example') || lower.includes('for example,') || lower.includes('let\'s say') || lower.includes('consider this');

  if (hasExercise) return 'practice';
  if (hasAnalogy) return 'analogy';
  if (hasMath && !hasCode) return 'theoretical';
  if (hasNumberedSteps) return 'step_by_step';
  if (hasCode || hasConcrete) return 'example_based';
  return 'standard';
}

// ── Mastery delta computation ─────────────────────────────────────────────────

function computeMasteryDelta(signals) {
  let delta = 2; // base: +2 for any engagement
  for (const sig of signals) {
    switch (sig.type) {
      case 'confusion':        delta -= 5 * sig.strength; break;
      case 'repeat_confusion': delta -= 10 * sig.strength; break;
      case 'understanding':    delta += 6 * sig.strength; break;
      case 'practice_request': delta += 1; break; // engagement signal
      case 'example_request':  delta -= 1; break; // slight struggle signal
      case 'depth_more':       delta += 2; break; // curious, good sign
      case 'depth_less':       delta -= 2; break; // slight overload signal
    }
  }
  return Math.round(delta);
}

// ── Retention (Ebbinghaus decay) ─────────────────────────────────────────────

function computeRetention(masteryScore, lastInteractionTs) {
  const daysSince = (Date.now() - lastInteractionTs) / DAY_MS;
  if (daysSince < 1) return masteryScore;
  return masteryScore * Math.exp(-daysSince / RETENTION_HALF_LIFE_DAYS);
}

// ── Core: update concept memory after a chat exchange ────────────────────────

function updateConceptFromChat(userId, userMessage, llmResponse) {
  const concepts = extractConcepts(userMessage + ' ' + llmResponse);
  if (!concepts.length) return;

  const signals = detectSignals(userMessage);
  const explType = detectExplanationType(llmResponse);
  const now = Date.now();
  const delta = computeMasteryDelta(signals);

  for (const { concept, subject } of concepts) {
    const existing = db.getConceptMemory(userId, concept);
    const prevMastery = existing?.mastery_score ?? 40;
    const newMastery = Math.max(5, Math.min(95, prevMastery + delta));
    const newStruggleCount = (existing?.struggle_count ?? 0) +
      (signals.some(s => s.type === 'confusion' || s.type === 'repeat_confusion') ? 1 : 0);
    const retention = computeRetention(newMastery, now);

    db.upsertLearningMemory(userId, concept, subject, {
      mastery_score: newMastery,
      confidence_score: Math.max(10, Math.min(90, newMastery + (signals.some(s => s.type === 'understanding') ? 10 : -5))),
      retention_score: Math.round(retention),
      struggle_count: newStruggleCount,
      revision_count: (existing?.revision_count ?? 0) + 1,
      interaction_count: (existing?.interaction_count ?? 0) + 1,
      last_interaction: now,
    });

    // Log mastery change
    if (Math.abs(newMastery - prevMastery) >= 3) {
      db.logMasteryEvent(userId, concept, subject,
        signals.some(s => s.type === 'confusion') ? 'confusion' : 'chat_interaction',
        prevMastery, newMastery
      );
      db.recordRevision(userId, concept, subject, 'chat_review', prevMastery, newMastery);
    }

    // Save cognitive events
    for (const sig of signals) {
      db.saveCognitiveEvent(userId, concept, subject, sig.type, sig.strength, { explType });
    }

    // Track explanation effectiveness: pending signal approach
    // If confusion detected → last explanation failed; if understanding → succeeded
    if (signals.some(s => s.type === 'confusion' || s.type === 'repeat_confusion')) {
      db.upsertExplanationEffectiveness(userId, explType, false);
    }
    if (signals.some(s => s.type === 'understanding')) {
      db.upsertExplanationEffectiveness(userId, explType, true);
    }

    // Check for knowledge gaps
    _detectAndSaveGaps(userId, concept, subject, newMastery);
  }

  // Update depth preferences from signals
  if (signals.some(s => s.type === 'depth_less')) {
    _updateDepthPreference(userId, 'simplified', 'Student signaled overload');
  }
  if (signals.some(s => s.type === 'depth_more')) {
    _updateDepthPreference(userId, 'deep', 'Student requested more detail');
  }
}

function _detectAndSaveGaps(userId, concept, subject, conceptMastery) {
  if (conceptMastery >= 55) return; // only flag gaps if concept itself is struggling
  const prereqs = PREREQUISITE_MAP[concept];
  if (!prereqs) return;
  for (const prereq of prereqs) {
    const prereqMem = db.getConceptMemory(userId, prereq);
    const prereqMastery = prereqMem?.mastery_score ?? null;
    if (prereqMastery !== null && prereqMastery < 40) {
      const severity = Math.round((55 - conceptMastery) * 0.6 + (40 - prereqMastery) * 0.4);
      db.saveKnowledgeGap(userId, concept, prereq, subject, Math.min(100, severity));
    } else if (prereqMastery === null) {
      // Never encountered prerequisite — likely a gap
      db.saveKnowledgeGap(userId, concept, prereq, subject, 40);
    }
  }
}

function _updateDepthPreference(userId, newDepth, reason) {
  const profile = db.getStudentLearningProfile(userId);
  if (!profile) return;
  if (profile.preferred_depth === newDepth) return;
  db.recordPreferenceChange(userId, 'depth', profile.preferred_depth, newDepth, reason);
}

// ── Profile computation (1-hour cache) ───────────────────────────────────────

function computeAndSaveProfile(userId) {
  const profile = db.getStudentLearningProfile(userId);
  if (profile && Date.now() - profile.last_computed < STALE_MS) return profile;

  const concepts = db.getLearningMemory(userId);
  const effectiveness = db.getExplanationEffectiveness(userId);
  const adaptPrefs = db.getAdaptivePrefs(userId);
  const recentEvents = db.getRecentCognitiveEvents(userId, 14);

  // Preferred explanation type
  const bestExpl = effectiveness.length > 0 ? effectiveness[0].explanation_type : 'example_based';

  // Preferred depth: count depth signals from recent cognitive events
  const depthMore = recentEvents.filter(e => e.event_type === 'depth_more').length;
  const depthLess = recentEvents.filter(e => e.event_type === 'depth_less').length;
  let preferredDepth = 'standard';
  if (depthLess > depthMore + 2) preferredDepth = 'simplified';
  else if (depthMore > depthLess + 2) preferredDepth = 'deep';

  // Mastery stats
  const masteries = concepts.map(c => c.mastery_score);
  const avgMastery = masteries.length > 0 ? Math.round(masteries.reduce((s, v) => s + v, 0) / masteries.length) : 0;

  // Subject breakdown
  const subjectMastery = {};
  for (const c of concepts) {
    if (!subjectMastery[c.subject]) subjectMastery[c.subject] = [];
    subjectMastery[c.subject].push(c.mastery_score);
  }
  const subjectAverages = Object.entries(subjectMastery).map(([sub, scores]) => ({
    subject: sub,
    avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
  }));
  subjectAverages.sort((a, b) => b.avg - a.avg);
  const strongestSubject = subjectAverages[0]?.subject ?? null;
  const weakestSubject = subjectAverages[subjectAverages.length - 1]?.subject ?? null;

  // Active struggles: concepts with mastery < 45
  const activeStruggles = concepts
    .filter(c => c.mastery_score < 45)
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 5)
    .map(c => ({ concept: c.concept, mastery: c.mastery_score, subject: c.subject }));

  // Learning velocity: average mastery gain per week (from mastery log trends)
  const velocity = _computeVelocity(concepts);

  // Burnout + procrastination from adaptive prefs
  const burnoutTendency = adaptPrefs?.burnout_score ?? 0;
  const procrastinationIndex = Math.round((adaptPrefs?.consistency_score ?? 50) > 50
    ? 0
    : (50 - (adaptPrefs?.consistency_score ?? 50)));

  const profileData = {
    preferred_explanation: bestExpl,
    preferred_depth: preferredDepth,
    avg_session_focus: adaptPrefs?.session_length ?? 'medium',
    learning_velocity: velocity,
    burnout_tendency: burnoutTendency,
    procrastination_index: procrastinationIndex,
    ai_dependency_trend: adaptPrefs?.ai_dependency_level ?? 'normal',
    strongest_subject: strongestSubject,
    weakest_subject: weakestSubject,
    active_struggles: activeStruggles,
    total_concepts_tracked: concepts.length,
    avg_mastery: avgMastery,
  };

  db.upsertStudentLearningProfile(userId, profileData);

  // Save daily snapshot
  _saveSnapshot(userId, concepts);

  return { ...profileData, last_computed: Date.now() };
}

function _computeVelocity(concepts) {
  if (!concepts.length) return 0;
  const week = Date.now() - 7 * DAY_MS;
  // Concepts that had interactions this week
  const active = concepts.filter(c => c.last_interaction > week);
  if (!active.length) return 0;
  // Average mastery gain estimated from current mastery vs initial (first_seen)
  const gains = active.map(c => {
    const daysKnown = Math.max(1, (Date.now() - c.first_seen) / DAY_MS);
    return (c.mastery_score - 40) / (daysKnown / 7); // gain per week
  });
  const avg = gains.reduce((s, v) => s + v, 0) / gains.length;
  return parseFloat(avg.toFixed(2));
}

function _saveSnapshot(userId, concepts) {
  const now = concepts;
  const forgettingAlerts = getForgettingAlerts(userId, concepts);
  db.saveMemorySnapshot(userId, {
    overallMastery: concepts.length > 0
      ? Math.round(concepts.reduce((s, c) => s + c.mastery_score, 0) / concepts.length)
      : 0,
    conceptCount: concepts.length,
    improvingCount: concepts.filter(c => c.mastery_score >= 60).length,
    decliningCount: concepts.filter(c => c.mastery_score < 40).length,
    forgettingCount: forgettingAlerts.length,
  });
}

// ── Forgetting detection ──────────────────────────────────────────────────────

function getForgettingAlerts(userId, conceptsParam = null) {
  const concepts = conceptsParam ?? db.getLearningMemory(userId);
  const now = Date.now();
  const alerts = [];

  for (const c of concepts) {
    if (c.mastery_score < 45) continue; // only alert on things they once knew
    const daysSince = (now - c.last_interaction) / DAY_MS;
    if (daysSince < FORGETTING_MIN_DAYS) continue;
    const retention = computeRetention(c.mastery_score, c.last_interaction);
    const retentionRatio = retention / c.mastery_score;
    if (retentionRatio < FORGETTING_THRESHOLD) {
      alerts.push({
        concept: c.concept,
        subject: c.subject,
        mastery_score: c.mastery_score,
        retention_score: Math.round(retention),
        retention_ratio: parseFloat(retentionRatio.toFixed(2)),
        days_since: Math.round(daysSince),
        urgency: retentionRatio < 0.4 ? 'high' : retentionRatio < 0.55 ? 'medium' : 'low',
      });
    }
  }

  return alerts.sort((a, b) => a.retention_ratio - b.retention_ratio);
}

// ── Knowledge gap summary ─────────────────────────────────────────────────────

function getActiveGaps(userId) {
  return db.getKnowledgeGaps(userId);
}

// ── Revision priorities (spaced repetition logic) ────────────────────────────

function getRevisionPriorities(userId) {
  const concepts = db.getLearningMemory(userId);
  const now = Date.now();
  const items = [];

  for (const c of concepts) {
    const daysSince = (now - c.last_interaction) / DAY_MS;
    const retention = computeRetention(c.mastery_score, c.last_interaction);

    // Priority score: higher = needs revision more urgently
    // Formula: struggle_count weight + retention decay + low mastery penalty
    let priority = 0;
    priority += Math.max(0, (100 - retention)) * 0.4;
    priority += c.struggle_count * 8;
    priority += Math.max(0, (60 - c.mastery_score)) * 0.5;
    priority += Math.min(30, daysSince) * 0.3;

    // Ideal revision interval (spaced repetition): 1, 3, 7, 14, 21 days
    const intervals = [1, 3, 7, 14, 21];
    const idealNext = intervals.find(d => daysSince <= d) ?? 21;
    const overdue = daysSince > idealNext;

    if (priority > 15 || overdue) {
      items.push({
        concept: c.concept,
        subject: c.subject,
        mastery_score: c.mastery_score,
        priority_score: Math.round(priority),
        days_since_review: Math.round(daysSince),
        retention_score: Math.round(retention),
        struggle_count: c.struggle_count,
        overdue,
        suggested_action: _revisionAction(c, retention),
      });
    }
  }

  return items.sort((a, b) => b.priority_score - a.priority_score).slice(0, 10);
}

function _revisionAction(concept, retention) {
  if (concept.struggle_count >= 4) return 'Reteach from basics in Chat — repeated confusion detected';
  if (retention < concept.mastery_score * 0.4) return 'Urgent revision — significant forgetting detected';
  if (concept.mastery_score < 35) return 'Focused study session — foundational weakness';
  return 'Quick review — ask Chat to quiz you on this topic';
}

// ── Memory context for LLM injection ─────────────────────────────────────────

function buildMemoryContext(userId) {
  try {
    const profile = db.getStudentLearningProfile(userId);
    const struggles = (profile?.active_struggles ?? []).slice(0, 3);
    const forgetting = getForgettingAlerts(userId).slice(0, 2);
    const gaps = db.getKnowledgeGaps(userId).slice(0, 2);
    const effectiveness = db.getExplanationEffectiveness(userId);

    if (!profile && !struggles.length && !forgetting.length) return '';

    const lines = ['\n\nPERSONALIZED MEMORY PROFILE (adapt your response accordingly):'];

    // Explanation preference
    if (effectiveness.length > 0 && effectiveness[0].success_count >= 2) {
      const best = effectiveness[0];
      const label = _explLabel(best.explanation_type);
      lines.push(`• Explanation preference: ${label} (${best.success_count} successful interactions) — prioritize this style.`);
    }

    // Depth preference
    if (profile?.preferred_depth === 'simplified') {
      lines.push('• Student prefers shorter, simpler responses — avoid walls of text.');
    } else if (profile?.preferred_depth === 'deep') {
      lines.push('• Student wants theoretical depth — include the reasoning behind the method.');
    }

    // Burnout
    if (profile?.burnout_tendency >= 60) {
      lines.push('• Burnout tendency detected — keep response brief and supportive in tone.');
    }

    // Active struggles
    if (struggles.length > 0) {
      const list = struggles.map(s => `${s.concept} (mastery ${s.mastery}%)`).join(', ');
      lines.push(`• Known struggles: ${list} — be patient and thorough on these topics.`);
    }

    // Forgetting alerts (only inject if relevant to current question)
    if (forgetting.length > 0) {
      const list = forgetting.map(f => `${f.concept} (${f.days_since}d ago, ${Math.round(f.retention_ratio * 100)}% retained)`).join(', ');
      lines.push(`• Retention declining: ${list} — if relevant, suggest a quick revision.`);
    }

    // Knowledge gaps
    if (gaps.length > 0) {
      const gapStr = gaps.map(g => `${g.weak_concept} (missing: ${g.missing_prerequisite})`).join('; ');
      lines.push(`• Knowledge gaps: ${gapStr} — address prerequisites if the topic comes up.`);
    }

    return lines.join('\n');
  } catch (_) {
    return '';
  }
}

function _explLabel(type) {
  const labels = {
    example_based: 'example-first',
    step_by_step: 'step-by-step',
    theoretical: 'theoretical/proof-based',
    analogy: 'analogy-based',
    practice: 'practice problems',
    standard: 'balanced',
  };
  return labels[type] || type;
}

// ── Full dashboard data for frontend ─────────────────────────────────────────

function getDashboard(userId) {
  const profile = computeAndSaveProfile(userId);
  const concepts = db.getLearningMemory(userId);
  const forgetting = getForgettingAlerts(userId, concepts);
  const gaps = db.getKnowledgeGaps(userId);
  const revisions = getRevisionPriorities(userId);
  const snapshots = db.getMemorySnapshots(userId, 14);
  const effectiveness = db.getExplanationEffectiveness(userId);
  const recentEvents = db.getRecentCognitiveEvents(userId, 14);

  // Subject breakdown
  const subjectMap = {};
  for (const c of concepts) {
    if (!subjectMap[c.subject]) subjectMap[c.subject] = { concepts: [], totalMastery: 0 };
    subjectMap[c.subject].concepts.push(c);
    subjectMap[c.subject].totalMastery += c.mastery_score;
  }
  const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    concept_count: data.concepts.length,
    avg_mastery: Math.round(data.totalMastery / data.concepts.length),
    concepts: data.concepts.sort((a, b) => a.mastery_score - b.mastery_score),
  })).sort((a, b) => a.avg_mastery - b.avg_mastery);

  // Confusion hotspots from recent cognitive events
  const confusionEvents = recentEvents.filter(e =>
    e.event_type === 'confusion' || e.event_type === 'repeat_confusion'
  ).slice(0, 5);

  return {
    profile,
    concepts: concepts.sort((a, b) => a.mastery_score - b.mastery_score),
    forgetting_alerts: forgetting,
    knowledge_gaps: gaps,
    revision_queue: revisions,
    snapshots: snapshots.reverse(),
    explanation_effectiveness: effectiveness,
    subject_breakdown: subjectBreakdown,
    confusion_hotspots: confusionEvents,
    summary: {
      total_concepts: concepts.length,
      avg_mastery: profile?.avg_mastery ?? 0,
      forgetting_count: forgetting.length,
      gap_count: gaps.length,
      mastered_count: concepts.filter(c => c.mastery_score >= 75).length,
      struggling_count: concepts.filter(c => c.mastery_score < 40).length,
    },
  };
}

module.exports = {
  updateConceptFromChat,
  computeAndSaveProfile,
  buildMemoryContext,
  getForgettingAlerts,
  getActiveGaps,
  getRevisionPriorities,
  getDashboard,
  extractConcepts,
  detectSignals,
  detectExplanationType,
  computeMasteryDelta,
  computeRetention,
  CONCEPT_MAP,
  PREREQUISITE_MAP,
};
