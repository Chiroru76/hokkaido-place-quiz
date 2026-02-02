import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { QuizState } from '../types/quiz'
import { initialQuizState } from '../state/initialState'

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

  // ===================================
  // Actions (アクション - 状態を変更する関数)
  // ===================================

  /**
   * クイズセッションを開始する
   * Phase 2で実装予定
   */
  async function startSession() {
    // TODO: Phase 2で実装
    console.log('startSession called')
  }

  /**
   * 回答を送信する
   * Phase 2で実装予定
   */
  async function submitAnswer(answer: string) {
    // TODO: Phase 2で実装
    console.log('submitAnswer called', answer)
  }

  /**
   * 次の問題へ進む
   * Phase 2で実装予定
   */
  async function nextQuestion() {
    // TODO: Phase 2で実装
    console.log('nextQuestion called')
  }

  /**
   * 状態をリセットする
   */
  function reset() {
    state.value = { ...initialQuizState }
    answerInput.value = ''
  }

  // ===================================
  // Return (外部に公開する)
  // ===================================

  return {
    // State
    state,
    answerInput,

    // Getters
    isQuizActive,
    currentQuestion,

    // Actions
    startSession,
    submitAnswer,
    nextQuestion,
    reset,
  }
})
