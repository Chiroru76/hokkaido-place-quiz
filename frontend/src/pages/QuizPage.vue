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
type AskedPlace = { name: string; correct: boolean };
const askedPlaces = ref<AskedPlace[]>([]);

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
  askedPlaces.value = [];
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

  const payload = toAnswerPayload({
    ...response,
    correct_reading: response.correct ? answer : response.correct_reading,
  });

  // APIレスポンスをpayloadに変換してstateを更新
  state.value = answerQuestion(state.value, payload);

  // 正解の場合、市町村を正解済みとして記録
  if (response.correct) {
    markAsAchieved(state.value.placeName);
  }

  askedPlaces.value = [
    ...askedPlaces.value,
    { name: state.value.placeName, correct: response.correct },
  ];

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
    // 回答時に記録するので、ここでは追加しない
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
  askedPlaces.value = [];
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
            <n-text class="rules-text">北海道にある179市町村の名前<br>あなたはいくつ読めますか？</n-text>

            <n-text strong class="rules-title">あそびかた</n-text>
            <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">1</div>
                  <p>問題は5問出題されます</p>
                </div>
              </n-gi>
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">2</div>
                  <p>市町村名の読みを<br>「ひらがな」で入力</p>
                </div>
              </n-gi>
              <n-gi>
                <div class="rule-item">
                  <div class="rule-badge">3</div>
                  <p>全179市町村の<br>コンプリートを目指そう</p>
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
    <div v-else-if="state.phase === 'answered'" class="answered-screen">
      <n-space vertical size="large" align="center">
        <n-card class="answered-hero">
          <div class="answered-title" :class="state.correct ? 'is-correct' : 'is-wrong'">
            {{ state.correct ? '正解！' : '不正解' }}
          </div>
          <div class="answered-place">
            <div class="place-label">地名</div>
            <div class="place-main">{{ state.placeName }}</div>
            <div class="place-reading">
              <span class="reading-label">よみ</span>
              <span class="reading-text">{{ state.correctReading || '（正解入力）' }}</span>
            </div>
          </div>
        </n-card>

        <div class="answered-main">
          <n-card class="answered-map">
            <AnsweredMap :place-name="state.placeName" />
          </n-card>

          <n-space vertical size="medium" class="answered-side">
            <n-card
              v-if="getTrivia(state.placeName)"
              class="answered-card answered-card--trivia"
              size="small"
            >
              <div class="answered-card-head">
                <div class="answered-card-icon" aria-hidden="true">💡</div>
                <div class="card-title">豆知識</div>
              </div>
              <p class="card-text">{{ getTrivia(state.placeName) }}</p>
            </n-card>
            <n-card class="answered-card answered-card--access" size="small">
              <div class="answered-card-head">
                <div class="answered-card-icon" aria-hidden="true">🚗</div>
                <div class="card-title">東京から車で行く場合</div>
              </div>
              <RouteInfo :place-name="state.placeName" />
            </n-card>
          </n-space>
        </div>

        <n-card class="answered-places" size="small">
          <div class="answered-card-head">
            <div class="answered-card-icon" aria-hidden="true">🖼️</div>
            <div class="card-title">周辺の観光スポット</div>
          </div>
          <PlacesList :place-name="state.placeName" />
        </n-card>

        <n-button type="primary" size="large" class="answer-button" @click="onNext">
          次の問題へ
        </n-button>
      </n-space>
    </div>

    <!-- completed -->
    <div v-else-if="state.phase === 'completed'" class="completed-screen">
      <n-card class="completed-card">
        <n-space vertical size="large" align="center">
          <div class="result-title">
            <span v-if="state.correctCount / state.total >= 0.8">なまらすごい！</span>
            <span v-else-if="state.correctCount / state.total >= 0.5">この調子で行くべ！</span>
            <span v-else>もっとやれるべ！</span>
          </div>
          <div class="score-line">
            <span class="score-label">SCORE</span>
            <div class="score-value">
              <span class="score-main">{{ state.correctCount }}</span>
              <span class="score-sub">/ {{ state.total }}</span>
            </div>
          </div>

          <div class="asked-section">
            <n-text strong>今回出題した市町村</n-text>
          <n-space wrap size="small" class="asked-tags">
            <n-tag
              v-for="place in askedPlaces"
              :key="`${place.name}-${place.correct}`"
              :type="place.correct ? 'success' : 'error'"
              round
            >
              {{ place.name }}
            </n-tag>
          </n-space>
          </div>

          <div class="map-section">
            <div class="map-title">現在の市町村マップ</div>
            <div class="map-wrapper">
              <HokkaidoMap />
              <div class="achievement-badge">
                <div class="badge-label">達成状況</div>
                <div class="badge-count">
                  <span class="current">{{ achievedCount }}</span>
                  <span class="separator">/</span>
                  <span class="total">179</span>
                </div>
                <n-progress
                  type="line"
                  :percentage="achievementRate"
                  color="#67C23A"
                  :show-indicator="false"
                />
              </div>
            </div>
          </div>

          <n-space horizontal size="medium">
            <n-button type="primary" size="large" class="answer-button" @click="onRetry">
              もう一度挑戦
            </n-button>
            <button type="button" class="btn-sns btn-x" @click="shareToX">
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" aria-hidden="true">
                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
              </svg>
              <span>結果をシェア</span>
            </button>
          </n-space>
        </n-space>
      </n-card>
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
  font-size: 20px;
  font-weight: 700;
  color: #4b6b2a;
}

.rules-text {
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

.completed-screen {
  padding: 12px 0 24px;
}

.completed-card {
  border-radius: 28px;
  box-shadow: 0 16px 40px rgba(22, 62, 96, 0.12);
}

.result-title {
  font-size: 28px;
  font-weight: 800;
  color: #f28b1a;
  text-align: center;
}

.score-line {
  display: grid;
  gap: 6px;
  align-items: center;
  justify-items: center;
}

.score-label {
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #9aa4b2;
}

.score-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.score-main {
  font-size: 44px;
  font-weight: 800;
  color: #ff5252;
}

.score-sub {
  font-size: 18px;
  color: #9aa4b2;
}

.score-caption {
  font-size: 13px;
  color: #6b7785;
}

.asked-section {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 30px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.asked-tags {
  justify-content: center;
}

.map-section {
  width: 100%;
  display: grid;
  gap: 12px;
}

.map-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.map-wrapper {
  position: relative;
  width: 100%;
  min-width: 520px;
  margin: 0 auto;
}

.achievement-badge {
  position: absolute;
  right: 0px;
  top: 0px;
  z-index: 10;
  background: rgb(255, 255, 255);
  padding: 12px;
  border-radius: 50%;
  border: #67c23a solid 3px;
  width: 110px;
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.badge-label {
  font-size: 0.7rem;
  font-weight: bold;
  color: #666;
}

.badge-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.badge-count .current {
  font-size: 1.8rem;
  font-weight: 900;
  color: #67c23a;
}

.badge-count .separator,
.badge-count .total {
  font-size: 0.9rem;
  color: #999;
}

.map-note {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.btn-sns {
  display: flex;
  padding: 0.6rem 1rem;
  box-sizing: border-box;
  border-radius: 0.2rem;
  width: 9rem;
  color: white;
  text-align: center;
  text-decoration: none;
  transition: 0.3s;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}

.btn-sns svg {
  fill: #fff;
}

.btn-sns span {
  display: inline-block;
  width: 6rem;
  text-align: center;
}

.btn-sns:hover {
  transform: scale(1.1);
}

.btn-x {
  background-color: #111319;
}

/* Answered Phase Styles */

.answered-hero {
  width: 100%;
  max-width: 560px;
  border-radius: 28px;
  padding: 5px 100px;
  box-shadow: 0 12px 30px rgba(22, 62, 96, 0.12);
  background: #ffffff;
}

.answered-title {
  font-size: 30px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 3px;
  border-radius: 30px;
  background-color: #ffffff;
}

.answered-title.is-correct {
  color: #67c23a;
}

.answered-title.is-wrong {
  color: #ff6b6b;
}

.answered-place {
  display: grid;
  gap: 1px;
  justify-items: center;
}

.place-label {
  font-size: 12px;
  color: #9aa4b2;
  letter-spacing: 0.18em;
}

.place-main {
  font-size: 50px;
  font-weight: 800;
  color: #1a1a1a;
}

.place-reading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #b6e08c;
  padding: 1px 14px;
  border-radius: 999px;
}

.reading-label {
  font-size: 10px;
  color: #67c23a;
  font-weight: 700;
}

.reading-text {
  font-size: 14px;
  font-weight: 700;
  color: #2f3a2f;
}

.answered-main {
  width: 100%;
  max-width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 10px;
  padding: 15px 5px;
  align-items: start;
  box-shadow: 0 10px 24px rgba(22, 62, 96, 0.12);
  background-color: #ffffff;
  border-radius: 20px;
}

.answered-map {
  border-radius: 20px;
  margin: 15px 0;
}

.answered-side {
  width: 100%;
}

.answered-card {
  border-radius: 18px;
  box-shadow: 0 8px 18px rgba(22, 62, 96, 0.08);
  margin: 2px 0;
  padding: 1px 0;
  border: 2px dashed transparent;
}

.answered-card--trivia {
  background: #fff6cc;
  border-color: #f7d66b;
}

.answered-card--access {
  background: #ffe1e1;
  border-color: #f08e8e;
}

.answered-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.answered-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ffffff;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(22, 62, 96, 0.08);
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #2f3a2f;
  margin-bottom: 2px;
}

.card-text {
  font-size: 13px;
  line-height: 1.7;
  color: #3d3d3d;
}

.answered-places {
  width: 100%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(22, 62, 96, 0.08);
}

.next-button {
  width: 100%;
  max-width: 320px;
  height: 44px;
  border-radius: 32px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(180deg, #ffa726 0%, #f28b1a 100%);
  color: #ffffff;
}

@media (max-width: 900px) {
  .answered-main {
    grid-template-columns: 1fr;
  }

  .place-main {
    font-size: 28px;
  }
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
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(180deg, #67C23A 0%, #6db12a 100%);
  transition: all 0.3s ease;
}

.answer-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(63, 239, 69, 0.3);
}


.timer-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
