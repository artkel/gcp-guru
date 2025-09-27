import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, SessionStats } from '@/types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Screen state
      currentScreen: 'start',

      // Session state
      currentQuestion: null,
      selectedAnswers: new Set(),
      sessionStats: {
        total: 0,
        correct: 0,
        accuracy: 0,
        sessionStart: Date.now(),
      },
      sessionTimer: 0,

      // UI state
      theme: 'light',
      isLoading: false,

      // Training state
      selectedDomains: null,
      availableTags: [],
      useShuffledQuestions: true,

      // User data
      userProgress: null,
      questionsList: [],

      // Actions
      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      setCurrentQuestion: (question) => set({ currentQuestion: question }),

      setSelectedAnswers: (answers) => set({ selectedAnswers: answers }),

      updateSessionStats: (stats) =>
        set((state) => ({
          sessionStats: { ...state.sessionStats, ...stats },
        })),

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
          localStorage.setItem('theme', theme);
        }
      },

      setIsLoading: (loading) => set({ isLoading: loading }),

      setSelectedDomains: (domains) => set({ selectedDomains: domains }),

      setAvailableTags: (tags) => set({ availableTags: tags }),

      setUseShuffledQuestions: (useShuffled) => set({ useShuffledQuestions: useShuffled }),

      setUserProgress: (progress) => set({ userProgress: progress }),

      setQuestionsList: (questions) => set({ questionsList: questions }),

      startSessionTimer: () => {
        const sessionStart = Date.now();
        set((state) => ({
          sessionStats: { ...state.sessionStats, sessionStart },
        }));

        // Start timer interval
        const interval = setInterval(() => {
          set((state) => ({
            sessionTimer: Date.now() - state.sessionStats.sessionStart,
          }));
        }, 1000);

        // Store interval ID for cleanup
        set({ sessionTimer: interval as any });
      },

      stopSessionTimer: () => {
        const { sessionTimer } = get();
        if (sessionTimer) {
          clearInterval(sessionTimer as any);
          set({ sessionTimer: 0 });
        }
      },

      resetSessionStats: () =>
        set({
          sessionStats: {
            total: 0,
            correct: 0,
            accuracy: 0,
            sessionStart: Date.now(),
          },
          sessionTimer: 0,
          selectedAnswers: new Set(),
          currentQuestion: null,
        }),

      // Restore session timer after page refresh
      restoreSessionTimer: () => {
        const { sessionStats, currentScreen } = get();
        // Only restore timer if we're in training mode and have an active session
        if (currentScreen === 'training' && sessionStats.total > 0) {
          const interval = setInterval(() => {
            set((state) => ({
              sessionTimer: Date.now() - state.sessionStats.sessionStart,
            }));
          }, 1000);
          set({ sessionTimer: interval as any });
        }
      },
    }),
    {
      name: 'gcp-guru-storage',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          // Restore Set from Array when deserializing
          if (key === 'selectedAnswers' && Array.isArray(value)) {
            return new Set(value);
          }
          return value;
        },
        replacer: (key, value) => {
          // Convert Set to Array when serializing
          if (value instanceof Set) {
            return Array.from(value);
          }
          return value;
        },
      }),
      partialize: (state) => ({
        theme: state.theme,
        currentScreen: state.currentScreen,
        sessionStats: state.sessionStats,
        selectedDomains: state.selectedDomains,
        useShuffledQuestions: state.useShuffledQuestions,
        currentQuestion: state.currentQuestion,
        selectedAnswers: state.selectedAnswers, // Will be converted by replacer
      }),
    }
  )
);

// Theme initialization
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  const theme = savedTheme || systemTheme;

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  useAppStore.getState().setTheme(theme);
}