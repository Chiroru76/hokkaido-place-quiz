import { ref, computed } from 'vue';

const STORAGE_KEY = 'hokkaido-quiz-achieved';
const TOTAL_MUNICIPALITIES = 179;

// 正解済み市町村名のセット
const achievedMunicipalities = ref<Set<string>>(loadFromLocalStorage());

/**
 * localStorageから正解済み市町村を読み込む
 */
function loadFromLocalStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (error) {
    console.error('Failed to load achieved municipalities:', error);
  }
  return new Set();
}

/**
 * localStorageに保存する
 */
function saveToLocalStorage(municipalities: Set<string>) {
  try {
    const array = Array.from(municipalities);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('Failed to save achieved municipalities:', error);
  }
}

/**
 * 正解済み市町村管理のcomposable
 */
export function useAchievedMunicipalities() {
  /**
   * 市町村を正解済みとしてマークする
   */
  const markAsAchieved = (municipalityName: string) => {
    if (!municipalityName) return;

    achievedMunicipalities.value.add(municipalityName);
    saveToLocalStorage(achievedMunicipalities.value);
  };

  /**
   * 指定した市町村が正解済みかチェック
   */
  const isAchieved = (municipalityName: string): boolean => {
    return achievedMunicipalities.value.has(municipalityName);
  };

  /**
   * 全ての正解済み市町村をリセット
   */
  const reset = () => {
    achievedMunicipalities.value.clear();
    saveToLocalStorage(achievedMunicipalities.value);
  };

  /**
   * 正解済み市町村数
   */
  const achievedCount = computed(() => achievedMunicipalities.value.size);

  /**
   * 達成率（0-100）
   */
  const achievementRate = computed(() => {
    return Math.floor((achievedMunicipalities.value.size / TOTAL_MUNICIPALITIES) * 100);
  });

  /**
   * 正解済み市町村の配列
   */
  const achievedList = computed(() => Array.from(achievedMunicipalities.value));

  return {
    markAsAchieved,
    isAchieved,
    reset,
    achievedCount,
    achievementRate,
    achievedList,
  };
}
