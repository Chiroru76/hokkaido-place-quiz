<script setup lang="ts">
import { useQuizStore } from '../stores/quizStore'
import { useRouter } from 'vue-router'
import HokkaidoMap from '../components/HokkaidoMap.vue'

/**
 * quizStoreとrouterを取得
 */
const quizStore = useQuizStore()
const router = useRouter()

/**
 * もう一度挑戦ボタンクリック時の処理
 * 1. quizStoreのresetを呼び出し
 * 2. トップページへ遷移
 */
function onRetry() {
  quizStore.reset()
  router.push('/')
}

/**
 * Xでシェアボタンクリック時の処理
 */
function onShareToX() {
  quizStore.shareToX()
}
</script>

<template>
  <div v-if="quizStore.state.phase === 'completed'" class="completed-screen">
    <n-card class="completed-card">
      <n-space vertical size="large" align="center">
        <div class="result-title">
          <span v-if="quizStore.state.correctCount / quizStore.state.total >= 0.8">なまらすごい！</span>
          <span v-else-if="quizStore.state.correctCount / quizStore.state.total >= 0.5">この調子で行くべ！</span>
          <span v-else>もっとやれるべ！</span>
        </div>
        <div class="score-line">
          <span class="score-label">SCORE</span>
          <div class="score-value">
            <span class="score-main">{{ quizStore.state.correctCount }}</span>
            <span class="score-sub">/ {{ quizStore.state.total }}</span>
          </div>
        </div>

        <div class="asked-section">
          <n-text strong>今回出題した市町村</n-text>
          <n-space wrap size="small" class="asked-tags">
            <n-tag
              v-for="place in quizStore.askedPlaces"
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
                <span class="current">{{ quizStore.achievedCount }}</span>
                <span class="separator">/</span>
                <span class="total">179</span>
              </div>
              <n-progress
                type="line"
                :percentage="quizStore.achievementRate"
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
          <button type="button" class="btn-sns btn-x" @click="onShareToX">
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" aria-hidden="true">
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
            </svg>
            <span>結果をシェア</span>
          </button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
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
</style>
