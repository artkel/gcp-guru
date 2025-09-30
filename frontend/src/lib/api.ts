import { Question, QuestionResponse, AnswerSubmission, UserProgress, CaseStudyResponse, ShuffledQuestion, AnswerSubmissionWithMapping, ShuffledQuestionResponse } from '@/types';
import { auth } from '@/lib/firebase';

// For production, use the backend URL directly; for development, use relative path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Frontend Debug - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('Frontend Debug - API_BASE_URL:', API_BASE_URL);
}

class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Ensure we include /api in the path when using full backend URL
  const apiPath = API_BASE_URL.includes('http') ? '/api' : '';
  const url = `${API_BASE_URL}${apiPath}${endpoint}`;

  // Get Firebase auth token
  const user = auth.currentUser;
  let token = '';
  if (user) {
    try {
      token = await user.getIdToken();
    } catch (error) {
      console.error('Failed to get Firebase token:', error);
    }
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new APIError(errorData.detail || 'API request failed', response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error', 0);
  }
}

export const api = {
  // Question endpoints
  questions: {
    getRandom: async (tags?: string[]): Promise<Question> => {
      let params = '';
      if (tags && tags.length > 0) {
        const urlParams = new URLSearchParams();
        tags.forEach(tag => urlParams.append('tags', tag));
        params = `?${urlParams.toString()}`;
      }
      const cacheBuster = params ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
      return request<Question>(`/questions/random${params}${cacheBuster}`);
    },

    getRandomShuffled: async (tags?: string[]): Promise<ShuffledQuestion> => {
      let params = '';
      if (tags && tags.length > 0) {
        const urlParams = new URLSearchParams();
        tags.forEach(tag => urlParams.append('tags', tag));
        params = `?${urlParams.toString()}`;
      }
      const cacheBuster = params ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
      return request<ShuffledQuestion>(`/questions/random-shuffled${params}${cacheBuster}`);
    },

    getList: async (filters: {
      tags?: string[];
      search?: string;
      starred_only?: boolean;
    } = {}): Promise<Question[]> => {
      const params = new URLSearchParams();

      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.starred_only) {
        params.append('starred_only', 'true');
      }

      return request<Question[]>(`/questions?${params.toString()}`);
    },

    getById: async (questionId: number): Promise<Question> => {
      return request<Question>(`/questions/${questionId}`);
    },

    submitAnswer: async (
      questionId: number,
      selectedAnswers: string[],
      requestExplanation = false
    ): Promise<QuestionResponse> => {
      return request<QuestionResponse>(`/questions/${questionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          selected_answers: selectedAnswers,
          request_explanation: requestExplanation,
        } as AnswerSubmission),
      });
    },

    submitShuffledAnswer: async (
      questionId: number,
      selectedAnswers: string[],
      originalMapping: Record<string, string>,
      requestExplanation = false
    ): Promise<ShuffledQuestionResponse> => {
      return request<ShuffledQuestionResponse>(`/questions/${questionId}/answer-shuffled`, {
        method: 'POST',
        body: JSON.stringify({
          selected_answers: selectedAnswers,
          original_mapping: originalMapping,
          request_explanation: requestExplanation,
        } as AnswerSubmissionWithMapping),
      });
    },

    getHint: async (questionId: number): Promise<{ hint: string }> => {
      return request<{ hint: string }>(`/questions/${questionId}/hint`);
    },

    getExplanation: async (
      questionId: number,
      regenerate = false
    ): Promise<{ explanation: string }> => {
      const params = regenerate ? '?regenerate=true' : '';
      return request<{ explanation: string }>(`/questions/${questionId}/explanation${params}`);
    },

    toggleStar: async (
      questionId: number,
      starred: boolean
    ): Promise<{ success: boolean; starred: boolean; }> => {
      return request<{ success: boolean; starred: boolean; }>(
        `/questions/${questionId}/star?starred=${starred}`,
        {
          method: 'POST',
        }
      );
    },

    updateNote: async (
      questionId: number,
      note: string
    ): Promise<{ success: boolean; note: string; }> => {
      return request<{ success: boolean; note: string; }>(
        `/questions/${questionId}/note?note=${encodeURIComponent(note)}`,
        {
          method: 'POST',
        }
      );
    },

    skip: async (
      questionId: number
    ): Promise<{ success: boolean; skipped: boolean; }> => {
      return request<{ success: boolean; skipped: boolean; }>(
        `/questions/${questionId}/skip`,
        {
          method: 'POST',
        }
      );
    },
  },

  // Tags endpoint
  tags: {
    getAvailable: async (): Promise<{ tags: string[] }> => {
      return request<{ tags: string[] }>('/tags');
    },
  },

  // Case study endpoint
  caseStudy: {
    get: async (caseStudyName: string): Promise<CaseStudyResponse> => {
      return request<CaseStudyResponse>(`/case-study/${encodeURIComponent(caseStudyName)}`);
    },
  },

  // Progress endpoints
  progress: {
    get: async (): Promise<UserProgress> => {
      return request<UserProgress>('/progress');
    },

    getStatus: async (tags?: string[]): Promise<{ all_mastered: boolean }> => {
      const params = new URLSearchParams();
      if (tags) {
        tags.forEach(tag => params.append('tags', tag));
      }
      return request<{ all_mastered: boolean }>(`/progress/status?${params.toString()}`);
    },

    getSessionSummary: async (): Promise<any> => {
      return request<any>('/progress/session');
    },

    startNewSession: async (): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/progress/session/start', {
        method: 'POST',
      });
    },

    reset: async (options?: {
      scores?: boolean;
      sessionHistory?: boolean;
      stars?: boolean;
      notes?: boolean;
      trainingTime?: boolean;
    }): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/progress/reset', {
        method: 'POST',
        body: options ? JSON.stringify(options) : undefined,
      });
    },

    clearExplanations: async (): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/progress/clear-explanations', {
        method: 'POST',
      });
    },

    clearHints: async (): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/progress/clear-hints', {
        method: 'POST',
      });
    },
  },
};

export { APIError };