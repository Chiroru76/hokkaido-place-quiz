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
import PlacesList from "../components/PlacesList.vue";
import RouteInfo from "../components/RouteInfo.vue";

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
  const session: SessionResponse = await startSession(5);

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
  const text = `よめるべ？北海道

今回: ${state.value.correctCount} / ${state.value.total} 問正解！
累計: ${achievedCount.value} / 179 市町村クリア

#よめるべ？北海道 #北海道地名クイズ `;

  const url = import.meta.env.VITE_APP_URL || 'https://hokkaido-place-quiz.vercel.app';
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  window.open(shareUrl, '_blank', 'width=550,height=420');
}

useKeyboard({
  Enter: (event) => {
    if (state.value.phase === "question") {
      // Cmd+Enter (Mac) または Ctrl+Enter (Windows) で回答送信
      if (event.metaKey || event.ctrlKey) {
        onAnswer();
      }
      return;
    }
    if (state.value.phase === "answered") {
      // answered phase では通常の Enter で次へ進む
      onNext();
    }
  },
});
</script>

<template>
  <div>
    <!-- idle -->
    <div v-if="state.phase === 'idle'" class="idle-screen">
      <n-space vertical size="large" align="center">
          <n-space vertical size="large" align="center">
              <img
                src="/og-image.png"
                alt="よめるべ？北海道"
                class="hero-image"
              />
          </n-space>

        <n-card class="rules-card" size="large">
          <n-space vertical size="medium" align="center">
            <n-text strong class="rules-title">あそびかた</n-text>
            <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">1</div>
                  <p>全5問出題されます</p>
                </div>
              </n-gi>
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">2</div>
                  <p>読みを「ひらがな」で入力</p>
                </div>
              </n-gi>
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">3</div>
                  <p>179市町村を制覇しよう</p>
                </div>
              </n-gi>
            </n-grid>
          </n-space>
        </n-card>

        <n-button
          type="primary"
          size="large"
          class="answer-button"
          @click="onStart"
        >
          スタート
        </n-button>
      </n-space>
    </div>

    <!-- question -->
    <div v-else-if="state.phase === 'question'" class="question-container">
      <n-space vertical size="large" align="center">
        <!-- メイン質問カード -->
        <n-card class="question-card">
          <n-space vertical size="large" align="center">
            <!-- タイトル -->
            <h3 class="question-title">次の地名の読み方は？</h3>

            <!-- 地名表示 -->
            <div class="place-name-display">{{ state.placeName }}</div>

            <!-- 問題数と正解数 -->
            <n-space justify="space-between" class="quiz-info">
              <span class="quiz-info-item">問題数 <strong>{{ state.currentIndex + 1 }} / {{ state.total }}</strong></span>
              <span class="quiz-info-item">正解数 <strong>{{ state.correctCount }}</strong></span>
            </n-space>

            <!-- プログレスバー -->
            <div style="width: 100%; min-width: 150px;">
              <n-progress
                :percentage="state.total ? ((state.currentIndex + 1) / state.total) * 100 : 0"
                :show-indicator="false"
                status="success"
                color="#67C23A"
              />
            </div>
          </n-space>
        </n-card>

        <!-- 入力エリア -->
        <n-space vertical align="center" :size="16" class="answer-area">
          <n-input
            v-model:value="answerInput"
            placeholder="ひらがなで入力"
            size="large"
            class="answer-input"
          />
          <n-button
            type="primary"
            size="medium"
            class="answer-button"
            @click="onAnswer"
          >
            回答する
          </n-button>
        </n-space>

        <!-- 経過時間（小さく表示） -->
        <p class="timer-text">経過時間: {{ formattedTime }}</p>
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

        <n-card title="東京駅から車で行く場合🚗" size="small">
          <RouteInfo :place-name="state.placeName" />
        </n-card>

        <n-card title="周辺の観光スポット 🏞️" size="small">
          <PlacesList :place-name="state.placeName" />
        </n-card>

        <n-button type="primary" size="medium" class="answer-button" @click="onNext">
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

.idle-screen {
  padding-top: 12px;
}

.rules-card {
  width: 100%;
  max-width: 520px;
  border-radius: 20px;
  border: 2px solid #b6e08c;
  background: #f6fff0;
}

.rules-title {
  font-size: 16px;
  color: #4b6b2a;
}

.rule-item {
  display: grid;
  gap: 8px;
  justify-items: center;
  text-align: center;
  font-size: 12px;
  color: #2f3a2f;
}

.rule-badge {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #7bc043;
  color: #ffffff;
  font-weight: 700;
}

.start-button {
  width: 100%;
  max-width: 360px;
  border-radius: 28px;
  font-size: 20px;
  letter-spacing: 0.08em;
  background: #7bc043;
  color: #2d2d2d;
}

/* Question Phase Styles */
.question-container {
  padding: 32px 30px;
  background: linear-gradient(180deg, #a8d8f0 0%, #7cb8db 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
}

.question-card {
  width: 100%;
  max-width: 560px;
  border-radius: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  padding: 24px;
}

.question-title {
  font-size: 20px;
  font-weight: 500;
  color: #2d2d2d;
  margin: 0;
  text-align: center;
}

.place-name-display {
  font-size: 72px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.2;
  margin: 24px 0;
  letter-spacing: 0.05em;
}

.quiz-info {
  width: 100%;
  padding: 0 16px;
}

.quiz-info-item {
  font-size: 16px;
  color: #67C23A;
  font-weight: 500;
}

.quiz-info-item strong {
  font-size: 20px;
  font-weight: 700;
}

.answer-area {
  width: 100%;
  max-width: 560px;
}

.answer-input {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  font-size: 18px;
}

.answer-input :deep(.n-input__input-el) {
  text-align: center;
  font-size: 20px;
}

.answer-input :deep(.n-input__border),
.answer-input :deep(.n-input__state-border) {
  border: 2px solid #4a90e2;
  border-radius: 16px;
}

.answer-input :deep(.n-input--focus .n-input__border),
.answer-input :deep(.n-input--focus .n-input__state-border) {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.answer-button {
  width: 100%;
  max-width: 400px;
  height: 40px;
  border-radius: 32px;
  font-size: 20px;
  font-weight: 500;
  background: linear-gradient(180deg, #67C23A 0%, #4b6b2a 100%);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
  transition: all 0.3s ease;
}

.answer-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.3);
}


.timer-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
