<script setup lang="ts">
import { useQuizStore } from '../stores/quizStore'
import { useRouter } from 'vue-router'
import { useKeyboard } from '../composables/useKeyboard'

/**
 * quizStoreとrouterを取得
 */
const quizStore = useQuizStore()
const router = useRouter()

/**
 * 回答ボタンクリック時の処理
 * 1. quizStoreのsubmitAnswerを呼び出し
 * 2. /quiz/answeredへ遷移
 */
async function onAnswer() {
  await quizStore.submitAnswer(quizStore.answerInput)
  router.push('/quiz/answered')
}

/**
 * キーボードショートカット
 * Cmd+Enter (Mac) または Ctrl+Enter (Windows) で回答送信
 */
useKeyboard({
  Enter: (event) => {
    if (event.metaKey || event.ctrlKey) {
      onAnswer()
    }
  },
})
</script>

<template>
  <div v-if="quizStore.state.phase === 'question'" class="question-container">
    <n-space vertical size="large" align="center">
      <!-- メイン質問カード -->
      <n-card class="question-card">
        <n-space vertical size="large" align="center">
          <!-- タイトル -->
          <h3 class="question-title">次の地名の読み方は？</h3>

          <!-- 地名表示 -->
          <div class="place-name-display">{{ quizStore.state.placeName }}</div>

          <!-- 問題数と正解数 -->
          <n-space justify="space-between" class="quiz-info">
            <span class="quiz-info-item">問題数 <strong>{{ quizStore.state.currentIndex + 1 }} / {{ quizStore.state.total }}</strong></span>
            <span class="quiz-info-item">正解数 <strong>{{ quizStore.state.correctCount }}</strong></span>
          </n-space>

          <!-- プログレスバー -->
          <div style="width: 100%; min-width: 150px;">
            <n-progress
              :percentage="quizStore.state.total ? ((quizStore.state.currentIndex + 1) / quizStore.state.total) * 100 : 0"
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
          v-model:value="quizStore.answerInput"
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
      <p class="timer-text">経過時間: {{ quizStore.formattedTime }}</p>
    </n-space>
  </div>
</template>

<style scoped>
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
