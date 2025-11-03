// Core types for the Course Planner application

export interface User {
  id: string;
  email: string;
  companyId: string;
  role: 'admin' | 'creator' | 'reviewer';
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  brandingSettings: BrandingSettings;
  createdAt: Date;
}

export interface BrandingSettings {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  fonts?: string[];
  styleGuide?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  companyId: string;
  creatorId: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  currentPhase: number;
  outline: CourseOutline;
  resources: Resource[];
  team: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseOutline {
  modules: Module[];
  estimatedDuration?: number;
  learningObjectives?: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  estimatedDuration?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  content: LessonContent;
  questions: Question[];
  estimatedDuration?: number;
}

export interface LessonContent {
  type: 'text' | 'video' | 'interactive' | 'assessment';
  body: string;
  media?: Media[];
  interactions?: Interaction[];
}

export interface Media {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
}

export interface Interaction {
  type: 'quiz' | 'exercise' | 'discussion' | 'simulation';
  data: any;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'video' | 'url';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: ResourceMetadata;
  embeddingId?: string;
}

export interface ResourceMetadata {
  pageCount?: number;
  wordCount?: number;
  duration?: number;
  keywords?: string[];
  summary?: string;
}

export interface TeamMember {
  userId: string;
  role: 'creator' | 'sme' | 'reviewer';
  permissions: string[];
  addedAt: Date;
}

export interface Comment {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  authorId: string;
  text: string;
  resolved: boolean;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WizardPhase {
  phase: number;
  title: string;
  description: string;
  completed: boolean;
  data: any;
}

export interface SMEQuestion {
  id: string;
  courseId: string;
  question: string;
  context: string;
  answered: boolean;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  createdAt: Date;
}

export interface AIGenerationRequest {
  courseId: string;
  phase: 'outline' | 'content' | 'questions' | 'consolidation' | 'update';
  context: any;
  resources?: string[];
}

export interface AIGenerationResponse {
  success: boolean;
  data: any;
  tokensUsed: number;
  cost: number;
  error?: string;
}

export interface CostTracking {
  id: string;
  courseId: string;
  operation: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

export interface Embedding {
  id: string;
  resourceId: string;
  chunk: string;
  embedding: number[];
  metadata: any;
  createdAt: Date;
}

export interface RAGSearchResult {
  chunk: string;
  resourceId: string;
  resourceName: string;
  similarity: number;
  metadata: any;
}
