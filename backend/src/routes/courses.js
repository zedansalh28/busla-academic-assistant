const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validators');
const db = require('../db/queries');
const courseService = require('../services/courseService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only txt, pdf, and docx files are allowed'));
    }
  },
});

// POST /api/courses — create a new course
router.post('/', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['user_id', 'name']);
  const { user_id, name, code, description } = req.body;
  const course = db.createCourse(user_id, { name, code, description });
  res.status(201).json(course);
}));

// GET /api/courses/user/:userId — list all courses for a user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Seed demo courses on first visit
  await courseService.seedDemoCourses(userId);

  const courses = db.getUserCourses(userId);
  res.json({ courses });
}));

// GET /api/courses/:courseId — get single course (with materials)
router.get('/:courseId', asyncHandler(async (req, res) => {
  const course = db.getCourseWithMaterials(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
}));

// DELETE /api/courses/:courseId — delete a course
router.delete('/:courseId', asyncHandler(async (req, res) => {
  db.deleteCourse(req.params.courseId);
  res.json({ status: 'deleted', courseId: req.params.courseId });
}));

// POST /api/courses/:courseId/materials — add material (text paste or file upload)
router.post('/:courseId/materials', upload.single('file'), asyncHandler(async (req, res) => {
  const course = db.getCourse(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  let content = '';
  let material_type = 'text';
  let file_size = 0;
  let title = req.body.title || 'Untitled Material';

  if (req.file) {
    // File upload path
    content = await courseService.extractText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    material_type = req.file.originalname.split('.').pop().toLowerCase();
    file_size = req.file.size;
    if (!req.body.title) {
      title = req.file.originalname.replace(/\.[^.]+$/, '');
    }
  } else if (req.body.content) {
    // Text paste path
    content = req.body.content;
    material_type = 'text';
  } else {
    return res.status(400).json({ error: 'Provide either a file upload or content text' });
  }

  if (!content.trim()) {
    return res.status(400).json({ error: 'Extracted content is empty' });
  }

  const material = db.createCourseMaterial(req.params.courseId, {
    title,
    material_type,
    content,
    file_size,
  });

  res.status(201).json(material);
}));

// GET /api/courses/:courseId/materials — list materials for a course
router.get('/:courseId/materials', asyncHandler(async (req, res) => {
  const course = db.getCourse(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const materials = db.getCourseMaterials(req.params.courseId);
  res.json({ materials });
}));

// DELETE /api/courses/:courseId/materials/:materialId — remove a material
router.delete('/:courseId/materials/:materialId', asyncHandler(async (req, res) => {
  db.deleteCourseMaterial(req.params.materialId);
  res.json({ status: 'deleted', materialId: req.params.materialId });
}));

module.exports = router;
