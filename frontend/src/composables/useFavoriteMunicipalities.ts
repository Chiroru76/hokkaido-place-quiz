import { ref } from "vue";

const STORAGE_KEY = "hokkaido-quiz-favorites";

/**
 * お気に入りの市町村の型定義
 */
interface FavoriteData {
  municipalityName: string;
  timestamp: number;
}

// モジュールスコープで定義
const favorites = ref<Set<string>>(new Set());

/**
 * ローカルストレージからお気に入りデータを読み込む
 */
function loadFromLocalStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: FavoriteData[] = JSON.parse(stored);
      return new Set(data.map(item => item.municipalityName));
    }
  } catch (error) {
    console.error("Failed to load favorite municipalities from localStorage:", error);
  }
  return new Set();
}

/**
 * ローカルストレージにお気に入りデータを保存する
 */
function saveToLocalStorage(favs: Set<string>) {
  try {
    const data: FavoriteData[] = Array.from(favs).map(name => ({
      municipalityName: name,
      timestamp: Date.now(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save favorite municipalities to localStorage:", error);
  }
}

// 初期化：モジュール読み込み時に実行
favorites.value = loadFromLocalStorage();

/**
 * お気に入りの市町村の管理を行うcomposable
 */
export function useFavoriteMunicipalities() {
  /**
   * お気に入りを追加
   */
  function addFavorite(municipalityName: string): void {
    favorites.value.add(municipalityName);
    saveToLocalStorage(favorites.value);
  }

  /**
   * お気に入りを削除
   */
  function removeFavorite(municipalityName: string): void {
    favorites.value.delete(municipalityName);
    saveToLocalStorage(favorites.value);
  }

  /**
   * お気に入り状態をトグル
   */
  function toggleFavorite(municipalityName: string): boolean {
    if (isFavorite(municipalityName)) {
      removeFavorite(municipalityName);
      return false;
    } else {
      addFavorite(municipalityName);
      return true;
    }
  }

  /**
   * お気に入りかどうかをチェック
   */
  function isFavorite(municipalityName: string): boolean {
    return favorites.value.has(municipalityName);
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}

    
