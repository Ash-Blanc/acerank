
export enum View {
  LANDING = 'LANDING',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  MOCK_TEST = 'MOCK_TEST',
  ANALYTICS = 'ANALYTICS',
  LIBRARY = 'LIBRARY'
}

export enum ExamType {
  JEE_MAIN = 'JEE Main',
  JEE_ADVANCED = 'JEE Advanced',
  MHT_CET = 'MHT-CET',
  ALL = 'All Engineering'
}

export enum Subject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  MATH = 'Mathematics'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface Question {
  id: string;
  text: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicMastery {
  topicId: string;
  name: string;
  subject: Subject;
  masteryScore: number; // 0-100
  lastReviewed: number; // timestamp
  confidenceDecayRate: number; // 0.05 to 0.5 (higher = forgets faster)
  nextReviewDue: number; // timestamp
  totalQuestionsSolved: number;
  successRate: number;
}

export interface StudySession {
  id: string;
  topicId: string;
  topicName: string;
  subject: Subject;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  questionsAttempted: number;
  questionsCorrect: number;
  difficulty: Difficulty;
}

export interface UserState {
  name: string;
  examType: ExamType | null;
  targetYear: number;
  targetCollege: string;
  diagnosticCompleted: boolean;
  streak: number;
  studyHours: number;
  topicsMastered: number;
  weakAreas: string[];
  strongAreas: string[];
  dailyPlan: string[];
  subscriptionTier: SubscriptionTier;
  createdAt: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  imageUri?: string; // For generated images
  groundingSources?: GroundingSource[]; // For search results
}

export interface AgentLog {
  id: string;
  timestamp: number;
  step: 'Thought' | 'Action' | 'Result' | 'Error';
  content: string;
  toolName?: string;
  confidence?: number;
}

export interface ToolCall {
  name: string;
  args: any;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'note' | 'formula_sheet' | 'quiz' | 'summary';
  subject: Subject;
  topic: string;
  content: string; // Markdown content
  createdAt: number;
  tags: string[];
}
