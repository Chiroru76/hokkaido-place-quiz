<script setup lang="ts">
import { ref } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import { useRouter } from 'vue-router'

/**
 * quizStoreとrouterを取得
 */
const quizStore = useQuizStore()
const router = useRouter()
const isLoading = ref(false)

/**
 * スタートボタンクリック時の処理
 * 1. quizStoreのstartSessionを呼び出し
 * 2. /quiz/questionへ遷移
 */
async function onStart() {
  isLoading.value = true
  try {
    await quizStore.startSession()
    router.push('/quiz/question')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- ローディング画面 -->
  <div v-if="isLoading" class="loading-overlay">
    <img
      src="/hokkaido.png"
      alt="北海道"
      class="hokkaido-spinner"
    />
    <p class="loading-text">ローディング中</p>
    <p class="loading-sub">もう少し待っててな〜</p>
  </div>

  <!-- 通常のスタート画面 -->
  <div v-else class="idle-screen">
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
        :disabled="isLoading"
        @click="onStart"
      >
        スタート
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
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

.loading-overlay {
  position: fixed;
  inset: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.hokkaido-spinner {
  width: 160px;
  height: auto;
  animation: spin 2.5s linear infinite;
  margin-bottom: 24px;
}

.loading-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.loading-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
