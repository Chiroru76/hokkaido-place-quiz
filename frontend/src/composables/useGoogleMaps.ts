import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Google Maps APIが初期化済みかどうかのフラグ
let isInitialized = false;

/**
 * Google Maps APIを初期化するcomposable
 * setOptions()は一度だけ呼び出されることを保証します
 */
export function useGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  /**
   * Google Maps APIを初期化（初回のみ実行）
   */
  function initializeApi() {
    if (!isInitialized && apiKey) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      isInitialized = true;
    }
  }

  return {
    apiKey,
    mapId,
    initializeApi,
    importLibrary,
  };
}
