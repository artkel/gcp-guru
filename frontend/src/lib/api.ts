import { Question, QuestionResponse, AnswerSubmission, UserProgress } from '@/types';

const API_BASE_URL = '/api';

class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
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
    ): Promise<{ success: boolean; starred: boolean }> => {
      return request<{ success: boolean; starred: boolean }>(
        `/questions/${questionId}/star?starred=${starred}`,
        {
          method: 'POST',
        }
      );
    },

    updateNote: async (
      questionId: number,
      note: string
    ): Promise<{ success: boolean; note: string }> => {
      const encodedNote = encodeURIComponent(note);
      return request<{ success: boolean; note: string }>(
        `/questions/${questionId}/note?note=${encodedNote}`,
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

  // Progress endpoints
  progress: {
    get: async (): Promise<UserProgress> => {
      return request<UserProgress>('/progress');
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