export const STORAGE_KEYS = {
  USER_ID: 'busla_user_id',
  SESSION_ID: 'busla_session_id',
  PROFILE: 'busla_profile',
  IS_DEMO: 'busla_is_demo',
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const MAJORS = [
  'Software Engineering',
  'Electrical and Electronics Engineering',
  'Industrial Engineering & Management',
  'Civil Engineering',
  'Mechanical Engineering',
  'Preparatory Program',
];

export const YEARS = ['Preparatory', '1st', '2nd', '3rd', '4th'];

export const LEARNING_STYLES = [
  'Visual',
  'Analytical',
  'Kinesthetic',
];

export const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
];

export const SCE_SUBJECTS_BY_MAJOR: Record<string, string[]> = {
  'Software Engineering': [
    'Calculus 1', 'Calculus 2', 'Linear Algebra', 'Discrete Mathematics',
    'Introduction to Programming', 'Data Structures', 'Algorithms',
    'Object-Oriented Programming', 'Databases', 'Operating Systems',
    'Software Engineering', 'Web Development', 'Networks',
    'AI & Machine Learning', 'Final Project',
  ],
  'Electrical and Electronics Engineering': [
    'Calculus 1', 'Calculus 2', 'Linear Algebra', 'Physics 1', 'Physics 2',
    'Circuit Analysis', 'Electronics 1', 'Electronics 2',
    'Signals and Systems', 'Digital Systems', 'Control Systems',
    'Embedded Systems', 'Electromagnetic Fields', 'Communication Systems',
  ],
  'Industrial Engineering & Management': [
    'Calculus 1', 'Calculus 2', 'Statistics', 'Physics 1',
    'Introduction to Programming', 'Operations Research',
    'Project Management', 'Information Systems', 'Data Analysis',
    'Quality Management', 'Supply Chain', 'Human Factors Engineering',
  ],
  'Civil Engineering': [
    'Calculus 1', 'Calculus 2', 'Physics 1', 'Linear Algebra',
    'Engineering Mechanics (Statics)', 'Strength of Materials',
    'Structural Analysis', 'Fluid Mechanics', 'Soil Mechanics',
    'Concrete Design', 'Steel Structures', 'Engineering Drawing',
  ],
  'Mechanical Engineering': [
    'Calculus 1', 'Calculus 2', 'Physics 1', 'Physics 2', 'Linear Algebra',
    'Statics', 'Dynamics', 'Thermodynamics', 'Fluid Mechanics',
    'Materials Science', 'Manufacturing Processes',
    'Machine Design', 'Heat Transfer',
  ],
  'Preparatory Program': [
    'Preparatory Mathematics', 'Preparatory Physics',
    'Academic English', 'Introduction to Engineering',
    'Computer Basics', 'Scientific Thinking',
  ],
};
