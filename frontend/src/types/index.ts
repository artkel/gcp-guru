export interface Question {
  question_number: number;
  question_text: string;
  answers: Record<string, {
    answer_text: string;
    status: 'correct' | 'incorrect';
  }>;
  tag: string[];
  explanation: string;
  hint: string;
  score: number;
  starred: boolean;
  note: string;
}

export interface QuestionResponse {
  question: Question;
  is_correct: boolean;
  correct_answers: string[];
  explanation?: string;
}

export interface AnswerSubmission {
  selected_answers: string[];
  request_explanation?: boolean;
}

export interface SessionStats {
  total: number;
  correct: number;
  accuracy: number;
  sessionStart: number;
}

export interface LastSession {
  date: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  duration_minutes: number;
  tags: string[];
}

export interface TagProgress {
  tag: string;
  total_questions: number;
  mistakes_count: number;
  learning_count: number;
  mastered_count: number;
  perfected_count: number;
  mastery_percentage: number;
}

export interface OverallProgress {
  total_questions: number;
  mistakes_count: number;
  learning_count: number;
  mastered_count: number;
  perfected_count: number;
  starred_questions: number;
  questions_with_notes: number;
  total_training_time_minutes: number;
  tag_progress: TagProgress[];
}

export interface SessionHistory {
  date: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
}

export interface UserProgress {
  overall: OverallProgress;
  last_session: LastSession | null;
  session_history: SessionHistory[];
}

export type Screen = 'start' | 'domain-selection' | 'training' | 'progress' | 'browse';

export interface AppState {
  // Screen state
  currentScreen: Screen;

  // Session state
  currentQuestion: Question | null;
  selectedAnswers: Set<string>;
  sessionStats: SessionStats;
  sessionTimer: number;

  // UI state
  theme: 'light' | 'dark';
  isLoading: boolean;

  // Training state
  selectedDomains: string[] | null;
  availableTags: string[];

  // User data
  userProgress: UserProgress | null;
  questionsList: Question[];

  // Actions
  setCurrentScreen: (screen: Screen) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setSelectedAnswers: (answers: Set<string>) => void;
  updateSessionStats: (stats: Partial<SessionStats>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedDomains: (domains: string[] | null) => void;
  setAvailableTags: (tags: string[]) => void;
  setUserProgress: (progress: UserProgress | null) => void;
  setQuestionsList: (questions: Question[]) => void;
  startSessionTimer: () => void;
  stopSessionTimer: () => void;
  resetSessionStats: () => void;
}