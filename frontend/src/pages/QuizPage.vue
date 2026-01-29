<script setup lang="ts">
import { ref } from "vue";
import type { QuizState } from "../types/quiz";
import { initialQuizState } from "../state/initialState";
import {
  startQuestion,
  answerQuestion,
  nextQuestion,
} from "../state/transitions";
import { startSession, fetchNextQuestion, submitAnswer } from "../api/quizApi";
import { useAchievedMunicipalities } from "../composables/useAchievedMunicipalities";
import { useKeyboard } from "../composables/useKeyboard";
import { useMunicipalityTrivia } from "../composables/useMunicipalityTrivia";
import { useTimer } from "../composables/useTimer";
import HokkaidoMap from "../components/HokkaidoMap.vue";
import AnsweredMap from "../components/AnsweredMap.vue";

const state = ref<QuizState>({ ...initialQuizState });
const answerInput = ref("");
const { formattedTime, start, stop, reset } = useTimer();
const { getTrivia } = useMunicipalityTrivia();

// 正解済み市町村管理
const { markAsAchieved, achievedCount, achievementRate } = useAchievedMunicipalities();

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
  reset();
  start();
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

  // 正解の場合、市町村を正解済みとして記録
  if (response.correct) {
    markAsAchieved(state.value.placeName);
  }

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
    stop();
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
  stop();
  reset();
  state.value = { ...initialQuizState };
  answerInput.value = "";
}

/**
 * Xでシェア
 */
function shareToX() {
  const text = `北海道地名読みクイズ
今回: ${state.value.correctCount} / ${state.value.total} 問正解！
累計: ${achievedCount.value} / 179 市町村クリア

#北海道地名読みクイズ`;

  const url = import.meta.env.VITE_APP_URL || 'https://hokkaido-place-quiz.example.com';
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  window.open(shareUrl, '_blank', 'width=550,height=420');
}

useKeyboard({
  Enter: () => {
    if (state.value.phase === "question") {
      onAnswer();
      return;
    }
    if (state.value.phase === "answered") {
      onNext();
    }
  },
});
</script>

<template>
  <div>
    <h1 class="page-title">北海道地名読みクイズ</h1>

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
            <span>経過時間: {{ formattedTime }}</span>
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

        <n-card
          v-if="getTrivia(state.placeName)"
          title="豆知識💡"
          size="small"
        >
          <p style="line-height: 1.8;">{{ getTrivia(state.placeName) }}</p>
        </n-card>

        <n-card title="場所を確認" size="small">
          <AnsweredMap :place-name="state.placeName" />
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

        <n-card title="達成状況マップ" size="small" style="width: 100%;">
          <n-space vertical size="small">
            <n-space vertical size="small">
              <n-space justify="space-between">
                <span style="font-size: 16px; font-weight: bold;">正解済み市町村数: {{ achievedCount }} / 179</span>
                <span style="font-size: 16px; font-weight: bold;">達成率: {{ achievementRate }}%</span>
              </n-space>
              <n-progress
                :percentage="achievementRate"
                :show-indicator="false"
              />
            </n-space>
            <HokkaidoMap />
            <p style="font-size: 12px; color: #666; text-align: center;">
              緑色が正解済みの市町村です
            </p>
          </n-space>
        </n-card>

        <n-space horizontal size="medium">
          <n-button type="primary" size="large" @click="onRetry">
            もう一度挑戦
          </n-button>
          <n-button size="large" @click="shareToX">
            Xでシェア
          </n-button>
        </n-space>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  color: #000000;
  margin-bottom: 24px;
}

p {
  color: #000000;
}
</style>
