// Types
export interface User {
  id: string;
  major: string;
  year: string;
  learning_style: string;
  subjects_of_interest: string[];
  difficulty_level: string;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  session_id: string;
  profile: User | null;
}

// ── Optimizer types ────────────────────────────────────────────────────────

export interface OptimizerCourse {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very hard';
}

export interface ExamDate {
  course: string;
  date: string;
}

export interface Deadline {
  title: string;
  date: string;
}

export interface OptimizerInputs {
  courses: OptimizerCourse[];
  available_hours_per_week: number;
  preferred_days: string[];
  weak_subjects: string[];
  academic_stage: string;
  exam_dates: ExamDate[];
  deadlines: Deadline[];
}

export interface ScheduleBlock {
  id?: string;
  course_name: string;
  day: string;
  start_time: string;
  end_time: string;
  block_type: string;
  priority: number;
  reason: string;
}

export interface CourseBreakdown {
  name: string;
  hours: number;
  reason: string;
}

export interface GeneratedSchedule {
  schedule_id: string;
  blocks: ScheduleBlock[];
  warnings: string[];
  summary: string;
  total_hours: number;
  course_breakdown: CourseBreakdown[];
}

// ── Risk Prediction types ──────────────────────────────────────────────────

export interface RiskFactor {
  label: string;
  weight: number;
}

export interface RiskInputs {
  active_courses: OptimizerCourse[];
  available_hours: number;
  upcoming_exams: number;
  days_until_nearest_exam: number;
  missed_tasks: number;
  total_tasks: number;
  self_stress_level: number;
  has_final_project: boolean;
  academic_stage: string;
  planner_completion_rate: number;
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  recommendations: string[];
}

// ── Adaptive Learning Intelligence Engine types ───────────────────────────

export interface BehaviorPattern {
  type: string;
  subject: string | null;
  value: number;
  explanation: string;
  computed_at: number;
}

export interface AdaptivePrefs {
  explanation_depth: 'simplified' | 'standard' | 'advanced';
  session_length: 'short' | 'medium' | 'long';
  focus_subjects: string[];
  recovery_mode: boolean;
  example_frequency: 'high' | 'medium' | 'low';
}

export interface HeatmapCell {
  date: string;
  count: number;
  dayOfWeek: number;
}

export interface WeeklyTrend {
  label: string;
  completionRate: number | null;
  studyEvents: number;
  chatSessions: number;
}

export interface SubjectAnalysis {
  subject: string;
  weakness_score: number;
  strength_score: number;
  explanation: string;
}

export interface TopicMetric {
  topic: string;
  count: number;
  repeat_count: number;
  is_repeat_heavy: boolean;
}

export interface AnalyticsRecommendation {
  priority: 'high' | 'medium' | 'info' | 'positive';
  icon: string;
  text: string;
}

export interface WeakTopic {
  id: string;
  topic: string;
  course: string | null;
  question_count: number;
  last_asked: number;
  confidence_trend: string;
}

export interface AnalyticsDashboard {
  productivity_score: number;
  consistency_score: number;
  burnout_score: number;
  ai_dependency_level: 'low' | 'normal' | 'high';
  adaptive_prefs: AdaptivePrefs;
  patterns: BehaviorPattern[];
  heatmap_data: HeatmapCell[];
  weekly_trends: WeeklyTrend[];
  subject_analysis: SubjectAnalysis[];
  top_topics: TopicMetric[];
  weak_topics: WeakTopic[];
  recommendations: AnalyticsRecommendation[];
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

// ── AI Academic Memory & Learning Brain types ─────────────────────────────

export interface ConceptMemory {
  id: string;
  user_id: string;
  concept: string;
  subject: string | null;
  mastery_score: number;
  confidence_score: number;
  retention_score: number;
  struggle_count: number;
  revision_count: number;
  interaction_count: number;
  last_interaction: number;
  first_seen: number;
  explanation_type_preferred: string;
  days_since: number;
}

export interface StudentLearningProfile {
  user_id: string;
  preferred_explanation: string;
  preferred_depth: string;
  avg_session_focus: string;
  learning_velocity: number;
  burnout_tendency: number;
  procrastination_index: number;
  ai_dependency_trend: string;
  strongest_subject: string | null;
  weakest_subject: string | null;
  active_struggles: string[];
  total_concepts_tracked: number;
  avg_mastery: number;
  last_computed: number;
}

export interface ExplanationEffectiveness {
  explanation_type: string;
  success_count: number;
  fail_count: number;
  effectiveness_score: number;
}

export interface KnowledgeGap {
  id: string;
  user_id: string;
  weak_concept: string;
  missing_prerequisite: string;
  subject: string | null;
  gap_severity: number;
  is_resolved: number;
  detected_at: number;
}

export interface RevisionPriority {
  concept: string;
  subject: string | null;
  mastery_score: number;
  retention_score: number;
  priority_score: number;
  days_since: number;
  next_revision: string;
  reason: string;
}

export interface ForgettingAlert {
  concept: string;
  subject: string | null;
  mastery_score: number;
  retention_score: number;
  days_since: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface MemorySnapshot {
  snapshot_date: number;
  overall_mastery: number;
  concept_count: number;
  improving_count: number;
  declining_count: number;
  forgetting_count: number;
}

export interface LearningBrainDashboard {
  profile: StudentLearningProfile | null;
  concepts: ConceptMemory[];
  forgetting_alerts: ForgettingAlert[];
  revision_queue: RevisionPriority[];
  knowledge_gaps: KnowledgeGap[];
  explanation_effectiveness: ExplanationEffectiveness[];
  snapshots: MemorySnapshot[];
  summary: {
    total_concepts: number;
    avg_mastery: number;
    mastered_count: number;
    struggling_count: number;
    forgetting_count: number;
    gap_count: number;
  };
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

// ── AI Predictive Academic Performance Engine types ───────────────────────

export interface PredictionFactor {
  label: string;
  weight: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AcademicPrediction {
  failureRisk: number;
  burnoutProbability: number;
  scheduleCollapseRisk: number;
  examFailureRisk: number;
  productivityDeclineRisk: number;
  recoveryPotential: number;
  confidenceScore: number;
  overallScore: number;
  overallHealth: 'healthy' | 'moderate' | 'at_risk' | 'critical';
  trendDirection: 'improving' | 'declining' | 'stable';
  factors: {
    failure?: PredictionFactor[];
    burnout?: PredictionFactor[];
    schedule?: PredictionFactor[];
    exam?: PredictionFactor[];
    productivity?: PredictionFactor[];
    recovery?: PredictionFactor[];
  };
  dataPoints: Record<string, number>;
  computed_at?: number;
}

export interface Intervention {
  id?: string;
  type: 'critical' | 'warning' | 'suggestion' | 'positive';
  title: string;
  message: string;
  action_type: string;
  urgency: number;
  reason: string;
  action_label?: string;
  action_href?: string;
  acknowledged?: number;
}

export interface RecoveryStep {
  day: string;
  action: string;
}

export interface RecoveryPlan {
  title: string;
  steps: RecoveryStep[];
}

export interface PredictionTimelineEntry {
  week: string;
  weekStart: number;
  failureRisk: number;
  burnoutProbability: number;
  overallScore: number;
  overallHealth: string;
  trendDirection?: string;
}

export interface PredictionResponse extends AcademicPrediction {
  interventions: Intervention[];
  recovery_plan: RecoveryPlan;
}

export interface PredictionComputeResponse {
  recomputed: boolean;
  computed_at: number;
  overall_health: string;
  overall_score: number;
  failure_risk: number;
  interventions_generated: number;
  interventions: Intervention[];
  recovery_plan: RecoveryPlan;
}
