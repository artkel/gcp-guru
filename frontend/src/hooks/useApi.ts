import useSWR from 'swr';
import { api } from '@/lib/api';
import { Question, UserProgress } from '@/types';

// Questions hooks
export function useRandomQuestion(tags?: string[]) {
  return useSWR(
    tags ? ['questions/random', JSON.stringify(tags)] : 'questions/random',
    () => api.questions.getRandom(tags),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
}

export function useQuestions(filters?: {
  tags?: string[];
  search?: string;
  starred_only?: boolean;
}) {
  return useSWR(
    ['questions', JSON.stringify(filters)],
    () => api.questions.getList(filters || {}),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useQuestion(questionId: number | null) {
  return useSWR(
    questionId ? `questions/${questionId}` : null,
    () => questionId ? api.questions.getById(questionId) : null,
    {
      revalidateOnFocus: false,
    }
  );
}

// Tags hook
export function useAvailableTags() {
  return useSWR('tags', api.tags.getAvailable, {
    revalidateOnFocus: false,
  });
}

// Progress hooks
export function useProgress() {
  return useSWR('progress', api.progress.get, {
    revalidateOnFocus: false,
  });
}

export function useSessionSummary() {
  return useSWR('progress/session', api.progress.getSessionSummary, {
    revalidateOnFocus: false,
  });
}

// Mutation hooks
export function useSubmitAnswer() {
  return async (questionId: number, selectedAnswers: string[], requestExplanation = false) => {
    return api.questions.submitAnswer(questionId, selectedAnswers, requestExplanation);
  };
}

export function useGetHint() {
  return async (questionId: number) => {
    return api.questions.getHint(questionId);
  };
}

export function useGetExplanation() {
  return async (questionId: number, regenerate = false) => {
    return api.questions.getExplanation(questionId, regenerate);
  };
}

export function useToggleStar() {
  return async (questionId: number, starred: boolean) => {
    return api.questions.toggleStar(questionId, starred);
  };
}

export function useUpdateNote() {
  return async (questionId: number, note: string) => {
    return api.questions.updateNote(questionId, note);
  };
}

export function useSkipQuestion() {
  return async (questionId: number) => {
    return api.questions.skip(questionId);
  };
}

export function useStartNewSession() {
  return async (activeDurationMs?: number) => {
    return api.progress.startNewSession(activeDurationMs);
  };
}

export function useResetProgress() {
  return async (options?: {
    scores?: boolean;
    sessionHistory?: boolean;
    stars?: boolean;
    notes?: boolean;
    trainingTime?: boolean;
  }) => {
    return api.progress.reset(options);
  };
}

export function useClearExplanations() {
  return async () => {
    return api.progress.clearExplanations();
  };
}

export function useClearHints() {
  return async () => {
    return api.progress.clearHints();
  };
}