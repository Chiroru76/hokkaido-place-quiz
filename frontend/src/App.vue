<script setup lang="ts">
import { ref } from "vue";
import type { QuizState } from "./types/quiz";
import { initialQuizState } from "./state/initialState";

const state = ref<QuizState>({ ...initialQuizState });

// APIのレスポンス型（snake_case）を定義する
type SessionResponse = {
  session_id: string;
  total: number;
};

// 次の問題取得APIのレスポンス型
type NextQuestionResponse = {
  completed?: boolean;
  question_id?: number;
  name?: string;
  current?: number;
  total?: number;
};

// 回答APIのレスポンス型
type AnswerResponse = {
  correct: boolean;
  correct_reading?: string;
};

// APIレスポンスを画面用payload（camelCase）に変換する
function toStartPayload(
  session: SessionResponse,
  next: NextQuestionResponse,
  correctCount: number
) {
  return {
    sessionId: session.session_id,
    total: session.total,
    currentIndex: (next.current ?? 1) - 1,
    questionId: next.question_id ?? 0,
    placeName: next.name ?? "",
    correctCount
  };
}

// 次の問題用のpayloadに変換
function toNextPayload(next: NextQuestionResponse) {
  return {
    questionId: next.question_id ?? 0,
    placeName: next.name ?? ""
  };
}

// 回答結果用のpayloadに変換
function toAnswerPayload(res: AnswerResponse) {
  return {
    correct: res.correct,
    correctReading: res.correct_reading
  };
}

/**
 * スタートボタン
 */
function onStart() {
  state.value = startQuestion(state.value, {
    sessionId: "dummy-session",
    total: 10,
    currentIndex: 0,
    correctCount: 0,
    questionId: 1,
    placeName: "旭川",
  });
}

/**
 * 回答ボタン
 */
function onAnswer() {
  state.value = answerQuestion(state.value, {
    correct: false,
    correctReading: "あさひかわ",
  });
}

/**
 * 次の問題へ
 */
function onNext() {
  state.value = nextQuestion(state.value, {
    questionId: 2,
    placeName: "札幌",
  });
}
</script>

<template>
  <main class="app">
    <h1>Hokkaido Place Quiz</h1>
    <p>phase: {{ state.phase }}</p>
  </main>
</template>

<style scoped>
.app {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}
</style>
