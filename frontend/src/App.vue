<script setup lang="ts">
import { ref } from "vue";
import type { QuizState } from "./types/quiz";
import { initialQuizState } from "./state/initialState";
import {
  startQuestion,
  answerQuestion,
  nextQuestion,
} from "./state/transitions";
import { startSession, fetchNextQuestion, submitAnswer } from "./api/quizApi";

const state = ref<QuizState>({ ...initialQuizState });
const answerInput = ref("");

// Google Maps APIキーを環境変数から取得
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
  correct_count: number;
};

// APIレスポンスを画面用payload（camelCase）に変換する
function toStartPayload(
  session: SessionResponse,
  next: NextQuestionResponse,
  correctCount: number,
) {
  return {
    sessionId: session.session_id,
    total: session.total,
    currentIndex: (next.current ?? 1) - 1,
    questionId: next.question_id ?? 0,
    placeName: next.name ?? "",
    correctCount,
  };
}

// 次の問題用のpayloadに変換
function toNextPayload(next: NextQuestionResponse) {
  return {
    questionId: next.question_id ?? 0,
    placeName: next.name ?? "",
  };
}

// 回答結果用のpayloadに変換
function toAnswerPayload(res: AnswerResponse) {
  return {
    correct: res.correct,
    correctReading: res.correct_reading,
    correctCount: res.correct_count,
  };
}

/**
 * スタートボタン
 */
async function onStart() {
  // セッション開始
  const session: SessionResponse = await startSession(10);

  // 最初の問題取得
  const next: NextQuestionResponse = await fetchNextQuestion(
    session.session_id,
  );

  // loadに変換してstateを更新
  // 第１引数: 既存のstate
  // 第２引数: APIレスポンスを変換したpayload（次のフェースに必要なデータ一式）
  state.value = startQuestion(state.value, toStartPayload(session, next, 0));
}

/**
 * 回答ボタン
 */
async function onAnswer() {
  if (state.value.phase !== "question") {
    return;
  }

  const sessionId = state.value.sessionId;
  const questionId = state.value.questionId;
  const answer = answerInput.value;

  if (!sessionId || !questionId) {
    return;
  }
  // 回答APIを呼び出し
  const response: AnswerResponse = await submitAnswer(
    sessionId,
    questionId,
    answer,
  );

  // APIレスポンスをpayloadに変換してstateを更新
  state.value = answerQuestion(state.value, toAnswerPayload(response));

  answerInput.value = "";
}

/**
 * 次の問題へ
 */
async function onNext() {
  if (state.value.phase !== "answered") {
    return;
  }

  const sessionId = state.value.sessionId;
  if (!sessionId) {
    return;
  }

  // 次の問題取得
  const next: NextQuestionResponse = await fetchNextQuestion(sessionId);

  if (next.completed) {
    state.value = {
      phase: "completed",
      sessionId: state.value.sessionId,
      total: state.value.total,
      correctCount: state.value.correctCount,
    };
  } else {
    state.value = nextQuestion(state.value, toNextPayload(next));
  }
}

/**
 * もう一度挑戦
 */
function onRetry() {
  state.value = { ...initialQuizState };
  answerInput.value = "";
}
</script>

<template>
  <div class="app-container">
    <h1>北海道地名読みクイズ</h1>

    <!-- idle -->
    <div v-if="state.phase === 'idle'">
        <n-space vertical size="large">
          <p>北海道の地名の読み方を当てるクイズです。</p>

          <n-card title="ルール" size="small">
            <n-space vertical>
              <p> 全10問出題されます</p>
              <p> 地名の読みを「ひらがな」で入力してください</p>
              <p> 179市町村全て読めるようになりましょう</p>
            </n-space>
          </n-card>

          <n-button type="primary" size="large" block @click="onStart">
            スタート
          </n-button>
        </n-space>
    </div>

    <!-- question -->
    <div v-else-if="state.phase === 'question'">
      <n-space vertical size="large">
        <n-card size="small">
          <n-space vertical size="small">
            <n-space justify="space-between">
              <span>問題 {{ state.currentIndex + 1 }} / {{ state.total }}</span>
              <span>正解数：{{ state.correctCount }}</span>
            </n-space>
            <n-progress
              :percentage="((state.currentIndex + 1) / state.total) * 100"
              :show-indicator="false"
            />
          </n-space>
        </n-card>

        <n-card title="次の地名の読み方は？">
          <h2>{{ state.placeName }}</h2>
        </n-card>

        <n-space justify="center">
          <n-input
            v-model:value="answerInput"
            placeholder="ひらがなで入力"
            style="width: 300px;"
          />
          <n-button type="primary" size="large" @click="onAnswer">
            回答する
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- answered -->
    <div v-else-if="state.phase === 'answered'">
      <n-space vertical size="large">
        <n-alert
          v-if="state.correct"
          type="success"
          title="正解！"
        />
        <n-alert
          v-else
          type="error"
          :title="`不正解（正解: ${state.correctReading}）`"
        />

        <n-card title="場所を確認" size="small">
          <iframe
            v-if="googleMapsApiKey"
            width="100%"
            height="300"
            frameborder="0"
            style="border:0; border-radius: 8px;"
            v-bind:src="`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${state.placeName},北海道&zoom=10`"
          ></iframe>
          <p v-else style="color: #999;">地図を表示するにはAPIキーが必要です</p>
        </n-card>

        <n-button type="primary" size="large" block @click="onNext">
          次へ
        </n-button>
      </n-space>
    </div>

    <!-- completed -->
    <div v-else-if="state.phase === 'completed'">
      <n-space vertical size="large" align="center">
        <n-result
          v-if="state.correctCount / state.total >= 0.8"
          status="success"
          title="素晴らしい！"
          :description="`${state.correctCount} / ${state.total} 問正解！道民レベルです！`"
        />
        <n-result
          v-else-if="state.correctCount / state.total >= 0.5"
          status="info"
          title="なかなか良い成績です！"
          :description="`${state.correctCount} / ${state.total} 問正解！`"
        />
        <n-result
          v-else
          status="warning"
          title="もう少し頑張りましょう！"
          :description="`${state.correctCount} / ${state.total} 問正解`"
        />
        <n-button type="primary" size="large" @click="onRetry">
          もう一度挑戦
        </n-button>
      </n-space>
    </div>  
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #e3f2fd 0%, #f0f8ff 100%);
  padding: 40px 16px;
  color: #000000;
}

.app-container > * {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.app-container h1 {
  color: #000000;
}

.app-container p {
  color: #000000;
}
</style>
