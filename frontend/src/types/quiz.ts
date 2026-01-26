export type Phase = "idle" | "question" | "answered" | "completed";

type BaseState = {
  phase: Phase;
  sessionId: string | null;
  total: number;
  currentIndex: number; // 0-based
  correctCount: number;
};

export type IdleState = BaseState & {
  phase: "idle";
};

export type QuestionState = BaseState & {
  phase: "question";
  questionId: number;
  placeName: string;
};

export type AnsweredState = BaseState & {
  phase: "answered";
  questionId: number;
  placeName: string;
  correct: boolean;
  correctReading?: string;
};

export type CompletedState = BaseState & {
  phase: "completed";
};

export type QuizState =
  | IdleState
  | QuestionState
  | AnsweredState
  | CompletedState;
