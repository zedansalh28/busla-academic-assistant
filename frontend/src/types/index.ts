// Types
export interface User {
  id: string;
  major: string;
  year: string;
  learning_style: string;
  subjects_of_interest: string[];
  difficulty_level: string;
}

export interface Session {
  id: string;
  user_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  sources?: Array<{ title: string; category: string }>;
  timestamp?: number;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  sources: Array<{ title: string; category: string }>;
  confidence: number;
  suggestions?: string[];
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  deadline: number;
  milestones: string[];
  progress: number;
  created_at: number;
  updated_at: number;
}

export interface StudyTask {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  due_date?: number;
  created_at: number;
  updated_at: number;
}

export interface Recommendation {
  id: string;
  topic: string;
  type: string;
  title: string;
  description: string;
  difficulty?: string;
  recommendation_type: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  description?: string;
  is_demo: number;
  created_at: number;
  updated_at: number;
  materials?: CourseMaterial[];
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  material_type: string;
  content: string;
  file_size: number;
  created_at: number;
}

export interface CourseChatResponse {
  session_id: string;
  answer: string;
  course_id: string;
  course_name: string;
  sources: Array<{ title: string; category: string }>;
  confidence: number;
}
