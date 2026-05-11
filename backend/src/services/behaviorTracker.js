const db = require('../db/queries');

// Topic keywords map — maps common academic terms to subject labels
const TOPIC_KEYWORDS = {
  'math': 'Mathematics', 'calculus': 'Mathematics', 'algebra': 'Mathematics',
  'integral': 'Mathematics', 'derivative': 'Mathematics', 'equation': 'Mathematics',
  'physics': 'Physics', 'force': 'Physics', 'velocity': 'Physics', 'energy': 'Physics',
  'programming': 'Programming', 'code': 'Programming', 'algorithm': 'Programming',
  'function': 'Programming', 'array': 'Programming', 'loop': 'Programming',
  'data structure': 'Data Structures', 'linked list': 'Data Structures',
  'tree': 'Data Structures', 'graph': 'Data Structures', 'stack': 'Data Structures',
  'database': 'Databases', 'sql': 'Databases', 'query': 'Databases',
  'network': 'Networks', 'protocol': 'Networks', 'tcp': 'Networks', 'http': 'Networks',
  'operating system': 'Operating Systems', 'process': 'Operating Systems',
  'thread': 'Operating Systems', 'memory': 'Operating Systems',
  'circuit': 'Electronics', 'voltage': 'Electronics', 'current': 'Electronics',
  'signal': 'Electronics', 'digital': 'Electronics',
  'exam': null, 'test': null, 'study': null, 'help': null,
};

function extractTopic(message) {
  if (!message) return null;
  const lower = message.toLowerCase();
  for (const [keyword, topic] of Object.entries(TOPIC_KEYWORDS)) {
    if (topic && lower.includes(keyword)) return topic;
  }
  // Fallback: first meaningful word (>4 chars, not a common word)
  const stopWords = new Set(['what', 'when', 'where', 'which', 'there', 'their', 'about', 'would', 'could', 'should', 'have', 'that', 'this', 'from', 'with', 'your', 'into', 'been', 'does', 'explain', 'please', 'tell', 'help', 'need', 'know', 'understand']);
  const words = lower.split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w));
  return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : null;
}

function isRepeatQuestion(userId, topic) {
  if (!topic) return false;
  const existing = db.getUserWeakTopics(userId, 50);
  return existing.some(t => t.topic === topic && t.question_count >= 2);
}

const track = {
  chatMessage(userId, message, courseContext = null) {
    try {
      const topic = courseContext || extractTopic(message);
      const repeat = isRepeatQuestion(userId, topic);
      db.addBehaviorEvent(userId, 'chat_message', topic, { repeat });
      if (topic) {
        db.upsertWeakTopic(userId, topic, courseContext);
        db.addAIInteraction(userId, topic, repeat);
      }
    } catch (_) {}
  },

  taskCompleted(userId, subject = null) {
    try {
      db.addBehaviorEvent(userId, 'task_completed', subject);
    } catch (_) {}
  },

  taskCreated(userId, subject = null) {
    try {
      db.addBehaviorEvent(userId, 'task_created', subject);
    } catch (_) {}
  },

  planCreated(userId) {
    try {
      db.addBehaviorEvent(userId, 'plan_created');
    } catch (_) {}
  },

  optimizerUsed(userId) {
    try {
      db.addBehaviorEvent(userId, 'optimizer_used');
    } catch (_) {}
  },

  riskChecked(userId, riskLevel = null) {
    try {
      db.addBehaviorEvent(userId, 'risk_checked', null, { level: riskLevel });
    } catch (_) {}
  },

  login(userId) {
    try {
      db.addBehaviorEvent(userId, 'login');
    } catch (_) {}
  },

  pageView(userId, page) {
    try {
      db.addBehaviorEvent(userId, 'page_view', page);
    } catch (_) {}
  },

  courseAdded(userId, courseName) {
    try {
      db.addBehaviorEvent(userId, 'course_added', courseName);
    } catch (_) {}
  },
};

module.exports = { track, extractTopic };
