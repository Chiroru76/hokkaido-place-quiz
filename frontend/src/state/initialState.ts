import type { QuizState } from "../types/quiz";

export const initialQuizState: QuizState = {
  phase: "idle",
  sessionId: null,
  total: 0,
  currentIndex: 0,
  correctCount: 0
};
