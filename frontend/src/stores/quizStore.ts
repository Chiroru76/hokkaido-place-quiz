import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { QuizState } from '../types/quiz'
import { initialQuizState } from '../state/initialState'
import {
  startQuestion,
  answerQuestion,
  nextQuestion as nextQuestionTransition,
} from '../state/transitions'
import {
  startSession as startSessionApi,
  fetchNextQuestion,
  submitAnswer as submitAnswerApi,
} from '../api/quizApi'
import { useTimer } from '../composables/useTimer'
import { useAchievedMunicipalities } from '../composables/useAchievedMunicipalities'
import { useFavoriteMunicipalities } from '../composables/useFavoriteMunicipalities'

/**
 * 出題した地名の情報
 */
type AskedPlace = {
  name: string
  correct: boolean
}

/**
 * APIレスポンスの型定義（snake_case）
 */
type SessionResponse = {
  session_id: string
  total: number
}

type NextQuestionResponse = {
  completed?: boolean
  question_id?: number
  name?: string
  current?: number
  total?: number
}

type AnswerResponse = {
  correct: boolean
  correct_reading?: string
  correct_count: number
}

/**
 * Quiz Store
 *
 * クイズの状態を管理するストア。
 * Composition API形式で定義（setup構文と同様の書き方）
 */
export const useQuizStore = defineStore('quiz', () => {
  // ===================================
  // State (状態)
  // ===================================

  /**
   * クイズの現在の状態
   * - idle: スタート画面
   * - question: 問題表示中
   * - answered: 回答結果表示中
   * - completed: クイズ完了
   */
  const state = ref<QuizState>({ ...initialQuizState })

  /**
   * ユーザーの回答入力
   */
  const answerInput = ref('')

  /**
   * 今回出題した市町村のリスト
   */
  const askedPlaces = ref<AskedPlace[]>([])

  // タイマー管理
  const timer = useTimer()

  // 正解済み市町村管理
  const achievements = useAchievedMunicipalities()

  // お気に入り市町村管理
  const favorites = useFavoriteMunicipalities()

  // ===================================
  // Getters (算出プロパティ)
  // ===================================

  /**
   * クイズが進行中かどうか
   */
  const isQuizActive = computed(() => state.value.phase !== 'idle')

  /**
   * 現在の問題の地名
   */
  const currentQuestion = computed(() => {
    if (state.value.phase === 'question' || state.value.phase === 'answered') {
      return state.value.placeName
    }
    return null
  })

  /**
   * タイマーの表示用文字列
   */
  const formattedTime = computed(() => timer.formattedTime.value)

  /**
   * 正解済み市町村数
   */
  const achievedCount = computed(() => achievements.achievedCount.value)

  /**
   * 達成率
   */
  const achievementRate = computed(() => achievements.achievementRate.value)

  // ===================================
  // Helper Functions (内部で使用する関数)
  // ===================================

  /**
   * APIレスポンス（snake_case）を画面用payload（camelCase）に変換
   */
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
      placeName: next.name ?? '',
      correctCount,
    }
  }

  /**
   * 次の問題用のpayloadに変換
   */
  function toNextPayload(next: NextQuestionResponse) {
    return {
      questionId: next.question_id ?? 0,
      placeName: next.name ?? '',
    }
  }

  /**
   * 回答結果用のpayloadに変換
   */
  function toAnswerPayload(res: AnswerResponse) {
    return {
      correct: res.correct,
      correctReading: res.correct_reading,
      correctCount: res.correct_count,
    }
  }

  // ===================================
  // Actions (アクション - 状態を変更する関数)
  // ===================================

  /**
   * クイズセッションを開始する
   *
   * 1. タイマーをリセットして開始
   * 2. APIでセッションを開始し、最初の問題を取得
   * 3. 状態を question フェーズに遷移
   */
  async function startQuizSession() {
    // タイマーをリセットして開始
    timer.reset()
    timer.start()

    // セッション開始（問題数: 5問）
    const session: SessionResponse = await startSessionApi(5)

    // 最初の問題取得
    const next: NextQuestionResponse = await fetchNextQuestion(session.session_id)

    // 状態を question フェーズに遷移
    state.value = startQuestion(state.value, toStartPayload(session, next, 0))

    // 出題履歴をクリア
    askedPlaces.value = []
  }

  /**
   * 回答を送信する
   *
   * 1. APIに回答を送信
   * 2. 正解の場合、市町村を正解済みとして記録
   * 3. 状態を answered フェーズに遷移
   * 4. 回答入力をクリア
   */
  async function submitQuizAnswer(answer: string) {
    if (state.value.phase !== 'question') {
      return
    }

    const sessionId = state.value.sessionId
    const questionId = state.value.questionId

    if (!sessionId || !questionId) {
      return
    }

    // 回答APIを呼び出し
    const response: AnswerResponse = await submitAnswerApi(
      sessionId,
      questionId,
      answer,
    )

    // APIレスポンスをpayloadに変換
    const payload = toAnswerPayload({
      ...response,
      correct_reading: response.correct ? answer : response.correct_reading,
    })

    // 状態を answered フェーズに遷移
    state.value = answerQuestion(state.value, payload)

    // 正解の場合、市町村を正解済みとして記録
    if (response.correct) {
      achievements.markAsAchieved(state.value.placeName)
    }

    // 出題履歴に追加
    askedPlaces.value = [
      ...askedPlaces.value,
      { name: state.value.placeName, correct: response.correct },
    ]

    // 回答入力をクリア
    answerInput.value = ''
  }

  /**
   * 次の問題へ進む
   *
   * 1. 次の問題をAPIから取得
   * 2. 完了していれば completed フェーズへ、そうでなければ次の問題へ
   * 3. 完了時はタイマーを停止
   */
  async function goToNextQuestion() {
    if (state.value.phase !== 'answered') {
      return
    }

    const sessionId = state.value.sessionId
    if (!sessionId) {
      return
    }

    // 次の問題取得
    const next: NextQuestionResponse = await fetchNextQuestion(sessionId)

    if (next.completed) {
      // クイズ完了
      timer.stop()
      state.value = {
        phase: 'completed',
        sessionId: state.value.sessionId,
        total: state.value.total,
        currentIndex: state.value.currentIndex,
        correctCount: state.value.correctCount,
      }
    } else {
      // 次の問題へ
      state.value = nextQuestionTransition(state.value, toNextPayload(next))
    }
  }

  /**
   * 状態を完全リセット（もう一度挑戦）
   */
  function reset() {
    timer.stop()
    timer.reset()
    state.value = { ...initialQuizState }
    answerInput.value = ''
    askedPlaces.value = []
  }

  /**
   * Xでシェア
   */
  function shareToX() {
    const url =
      import.meta.env.VITE_APP_URL || 'https://hokkaido-place-quiz.vercel.app'
    const text = `📍「 よめるべ？北海道 」

🗾 今回：${state.value.correctCount} / ${state.value.total} 問正解！
🏆 累計：${achievedCount.value} / 179 市町村クリア

北海道の地名、意外と読めないべ？

👇 あなたは何問いける？
${url}

#よめるべ北海道 #北海道地名クイズ`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

    window.open(shareUrl, '_blank', 'width=550,height=420')
  }

  // ===================================
  // Return (外部に公開する)
  // ===================================

  return {
    // State
    state,
    answerInput,
    askedPlaces,

    // Getters
    isQuizActive,
    currentQuestion,
    formattedTime,
    achievedCount,
    achievementRate,

    // Actions
    startSession: startQuizSession,
    submitAnswer: submitQuizAnswer,
    nextQuestion: goToNextQuestion,
    reset,
    shareToX,

    // Achievements (正解済み市町村管理の公開)
    markAsAchieved: achievements.markAsAchieved,
    isAchieved: achievements.isAchieved,
    achievedList: achievements.achievedList,

    // Favorites (お気に入り市町村管理の公開)
    // store が外部に公開する「名前（キー）」：実際に中身として使う「値（変数・関数）」
    favorites: favorites.favorites,
    addFavorite: favorites.addFavorite,
    removeFavorite: favorites.removeFavorite,
    toggleFavorite: favorites.toggleFavorite,
    isFavorite: favorites.isFavorite,
  }
})
