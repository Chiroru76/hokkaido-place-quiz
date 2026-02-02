import type { QuizState, QuestionState, AnsweredState } from "../types/quiz";

export function startQuestion(
  _state: QuizState,
  payload: {
    sessionId: string;
    total: number;
    currentIndex: number;
    questionId: number;
    placeName: string;
    correctCount: number;
  },
): QuestionState {
  return {
    phase: "question",
    sessionId: payload.sessionId,
    total: payload.total,
    currentIndex: payload.currentIndex,
    correctCount: payload.correctCount,
    questionId: payload.questionId,
    placeName: payload.placeName,
  };
}

export function answerQuestion(
  state: QuizState,
  payload: {
    correct: boolean;
    correctReading?: string;
    correctCount: number;
  },
): AnsweredState {
  if (state.phase !== "question") {
    throw new Error("回答できるのは question 状態のみです");
  }

  return {
    ...state,
    phase: "answered",
    correct: payload.correct,
    correctReading: payload.correctReading,
    correctCount: payload.correctCount,
  };
}

export function nextQuestion(
  state: QuizState,
  payload: {
    questionId: number;
    placeName: string;
  },
): QuestionState {
  if (state.phase !== "answered") {
    throw new Error("次へ進めるのは answered 状態のみです");
  }

  return {
    ...state,
    phase: "question",
    currentIndex: state.currentIndex + 1,
    questionId: payload.questionId,
    placeName: payload.placeName,
  };
}
