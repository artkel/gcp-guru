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
      sessionTimerIntervalId: null as number | null,
      isTimerPaused: false,
      accumulatedTime: 0,

      // UI state
      theme: 'light',
      isLoading: false,

      // Training state
      selectedDomains: null,
      availableTags: [],
      useShuffledQuestions: true,
      selectedMasteryLevels: ['mistakes', 'learning', 'mastered', 'perfected'], // Default: all levels selected

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

      setSelectedMasteryLevels: (levels) => set({ selectedMasteryLevels: levels }),

      setUserProgress: (progress) => set({ userProgress: progress }),

      setQuestionsList: (questions) => set({ questionsList: questions }),

      startSessionTimer: () => {
        const sessionStart = Date.now();
        set((state) => ({
          sessionStats: { ...state.sessionStats, sessionStart },
          isTimerPaused: false,
          accumulatedTime: 0,
          sessionTimer: 0,
        }));

        // Start timer interval
        const interval = setInterval(() => {
          const state = get();
          if (!state.isTimerPaused) {
            set({
              sessionTimer: Date.now() - state.sessionStats.sessionStart,
            });
          }
        }, 1000) as unknown as number;

        // Store interval ID separately
        set({ sessionTimerIntervalId: interval });
      },

      pauseSessionTimer: () => {
        const { sessionStats, isTimerPaused } = get();
        if (!isTimerPaused) {
          // Calculate accumulated time before pausing
          const currentElapsed = Date.now() - sessionStats.sessionStart;
          set({
            isTimerPaused: true,
            accumulatedTime: currentElapsed,
          });
        }
      },

      resumeSessionTimer: () => {
        const { accumulatedTime, isTimerPaused } = get();
        if (isTimerPaused) {
          // Adjust sessionStart to account for paused time
          const newSessionStart = Date.now() - accumulatedTime;
          set((state) => ({
            sessionStats: { ...state.sessionStats, sessionStart: newSessionStart },
            isTimerPaused: false,
          }));
        }
      },

      stopSessionTimer: () => {
        const { sessionTimerIntervalId } = get();
        if (sessionTimerIntervalId) {
          clearInterval(sessionTimerIntervalId);
          set({
            sessionTimer: 0,
            sessionTimerIntervalId: null,
            isTimerPaused: false,
            accumulatedTime: 0
          });
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
          sessionTimerIntervalId: null,
          isTimerPaused: false,
          accumulatedTime: 0,
          selectedAnswers: new Set(),
          currentQuestion: null,
        }),

      // Restore session timer after page refresh
      restoreSessionTimer: () => {
        const { sessionStats, currentScreen } = get();
        // Only restore timer if we're in training mode and have an active session
        if (currentScreen === 'training' && sessionStats.total > 0) {
          const interval = setInterval(() => {
            const state = get();
            if (!state.isTimerPaused) {
              set({
                sessionTimer: Date.now() - state.sessionStats.sessionStart,
              });
            }
          }, 1000) as unknown as number;
          set({ sessionTimerIntervalId: interval });
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
        selectedMasteryLevels: state.selectedMasteryLevels,
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