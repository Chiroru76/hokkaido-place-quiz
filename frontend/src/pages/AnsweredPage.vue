<script setup lang="ts">
import { useQuizStore } from '../stores/quizStore'
import { useRouter } from 'vue-router'
import { useKeyboard } from '../composables/useKeyboard'
import { useMunicipalityTrivia } from '../composables/useMunicipalityTrivia'
import AnsweredMap from '../components/AnsweredMap.vue'
import PlacesList from '../components/PlacesList.vue'
import RouteInfo from '../components/RouteInfo.vue'

/**
 * quizStoreとrouterを取得
 */
const quizStore = useQuizStore()
const router = useRouter()
const { getTrivia } = useMunicipalityTrivia()

/**
 * 次へボタンクリック時の処理
 * 1. quizStoreのnextQuestionを呼び出し
 * 2. 完了ならば/quiz/result、継続なら/quiz/questionへ遷移
 */
async function onNext() {
  await quizStore.nextQuestion()

  // 状態を確認して遷移先を決定
  if (quizStore.state.phase === 'completed') {
    router.push('/quiz/result')
  } else if (quizStore.state.phase === 'question') {
    router.push('/quiz/question')
  }
}

/**
 * キーボードショートカット
 * Enterキーで次へ進む
 */
useKeyboard({
  Enter: () => {
    onNext()
  },
})
</script>

<template>
  <div v-if="quizStore.state.phase === 'answered'" class="answered-screen">
    <n-space vertical size="large" align="center">
      <n-card class="answered-hero">
        <div class="answered-title" :class="quizStore.state.correct ? 'is-correct' : 'is-wrong'">
          {{ quizStore.state.correct ? '正解！' : '不正解' }}
        </div>
        <div class="answered-place">
          <div class="place-label">地名</div>
          <div class="place-main">{{ quizStore.state.placeName }}</div>
          <div class="place-reading">
            <span class="reading-label">よみ</span>
            <span class="reading-text">{{ quizStore.state.correctReading || '（正解入力）' }}</span>
          </div>
        </div>
      </n-card>

      <div class="answered-main">
        <n-card class="answered-map">
          <AnsweredMap :place-name="quizStore.state.placeName" />
        </n-card>

        <n-space vertical size="medium" class="answered-side">
          <n-card
            v-if="getTrivia(quizStore.state.placeName)"
            class="answered-card answered-card--trivia"
            size="small"
          >
            <div class="answered-card-head">
              <div class="answered-card-icon" aria-hidden="true">💡</div>
              <div class="card-title">豆知識</div>
            </div>
            <p class="card-text">{{ getTrivia(quizStore.state.placeName) }}</p>
          </n-card>
          <n-card class="answered-card answered-card--access" size="small">
            <div class="answered-card-head">
              <div class="answered-card-icon" aria-hidden="true">🚗</div>
              <div class="card-title">東京から車で行く場合</div>
            </div>
            <RouteInfo :place-name="quizStore.state.placeName" />
          </n-card>
        </n-space>
      </div>

      <n-card class="answered-places" size="small">
        <div class="answered-card-head">
          <div class="answered-card-icon" aria-hidden="true">🖼️</div>
          <div class="card-title">周辺の観光スポット</div>
        </div>
        <PlacesList :place-name="quizStore.state.placeName" />
      </n-card>

      <n-button type="primary" size="large" class="answer-button" @click="onNext">
        次の問題へ
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
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

@media (max-width: 900px) {
  .answered-main {
    grid-template-columns: 1fr;
  }

  .place-main {
    font-size: 28px;
  }
}
</style>
