const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { validateRequired, validateMessage } = require('../utils/validators');
const chatService = require('../services/chatService');
const courseService = require('../services/courseService');
const llmClient = require('../services/llmClient');
const db = require('../db/queries');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['session_id', 'user_id', 'message']);
  validateMessage(req.body.message);

  const { session_id, user_id, message } = req.body;

  const session = db.getSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const response = await chatService.processMessage(session_id, user_id, message);

  res.json({
    session_id,
    answer: response.answer,
    sources: response.sources,
    confidence: response.confidence,
    suggestions: response.suggestions,
  });
}));

router.get('/history/:sessionId', asyncHandler(async (req, res) => {
  const history = chatService.getSessionHistory(req.params.sessionId);
  res.json({ session_id: req.params.sessionId, messages: history });
}));

router.delete('/history/:sessionId', asyncHandler(async (req, res) => {
  const result = chatService.clearSessionHistory(req.params.sessionId);
  res.json({ session_id: req.params.sessionId, ...result });
}));

// POST /api/chat/course — course-specific chat with RAG context
router.post('/course', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['session_id', 'user_id', 'message', 'course_id']);
  validateMessage(req.body.message);

  const { session_id, user_id, message, course_id } = req.body;

  const session = db.getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const course = db.getCourse(course_id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const materials = db.getCourseMaterials(course_id);
  const profile = db.getProfile(user_id);

  const systemPrompt = courseService.buildCourseSystemPrompt(course, materials, message, profile);

  const history = db.getConversationHistory(session_id, 'course', course_id);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const answer = await llmClient.chat(messages, 500, 0.3);

  db.addMessage(session_id, 'user', message, 'course', course_id);
  db.addMessage(session_id, 'assistant', answer, 'course', course_id);

  const sourceTag = materials.length > 0
    ? [{ title: course.name, category: 'course_material' }]
    : [];

  res.json({
    session_id,
    answer,
    course_id,
    course_name: course.name,
    sources: sourceTag,
    confidence: materials.length > 0 ? 0.85 : 0.65,
  });
}));

// DELETE /api/chat/course-history/:sessionId/:courseId — clear course chat history
router.delete('/course-history/:sessionId/:courseId', asyncHandler(async (req, res) => {
  db.clearConversationHistory(req.params.sessionId, 'course', req.params.courseId);
  res.json({ status: 'cleared', courseId: req.params.courseId });
}));

module.exports = router;
