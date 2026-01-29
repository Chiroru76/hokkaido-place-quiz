<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useAchievedMunicipalities } from '../composables/useAchievedMunicipalities';

const { isAchieved, achievedList } = useAchievedMunicipalities();

// 地図表示用のref
const mapContainer = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');

// Google Maps インスタンス
let map: google.maps.Map | null = null;
let infoWindow: google.maps.InfoWindow | null = null;

// GeoJSONデータのキャッシュ
let geojsonData: any = null;

// Google Maps API キー
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

/**
 * GeoJSONデータを読み込む
 */
async function loadGeoJson() {
  if (geojsonData) {
    return geojsonData;
  }

  try {
    const response = await fetch('/data/hokkaido.geojson');
    geojsonData = await response.json();
    return geojsonData;
  } catch (error) {
    console.error('Failed to load GeoJSON data:', error);
    return null;
  }
}

/**
 * 地図の初期化
 */
async function initMap() {
  if (!mapContainer.value) {
    return;
  }

  if (!apiKey) {
    hasError.value = true;
    errorMessage.value = '地図を表示するにはAPIキーが必要です';
    isLoading.value = false;
    return;
  }

  try {
    // Google Maps API の設定
    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    // Maps ライブラリの読み込み
    const { Map } = await importLibrary('maps');

    // 地図の作成（北海道全体が見えるビュー）
    map = new Map(mapContainer.value, {
      center: { lat: 43.2, lng: 142.8 },
      zoom: 7,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapId: mapId, // Map ID を指定
    });

    isLoading.value = false;

    // GeoJSONデータを読み込んで全市町村を表示
    const data = await loadGeoJson();
    if (!data) {
      console.warn('GeoJSON data could not be loaded');
      return;
    }

    // 全市町村のポリゴンを地図に追加
    map.data.addGeoJson(data);

    // 達成状況に応じた動的スタイリングを設定
    updateMapStyle();

    // ホバー時のインタラクションを設定
    setupHoverInteractions();
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    hasError.value = true;
    errorMessage.value = '地図を読み込めませんでした';
    isLoading.value = false;
  }
}

/**
 * 達成状況に応じて地図のスタイルを更新
 */
function updateMapStyle() {
  if (!map) {
    return;
  }

  // 各市町村の達成状況に応じてスタイルを動的に設定
  map.data.setStyle((feature: google.maps.Data.Feature) => {
    const municipalityName = feature.getProperty('市町村名');
    const achieved = isAchieved(municipalityName as string);

    return {
      fillColor: achieved ? '#4caf50' : '#e0e0e0',
      fillOpacity: 0.6,
      strokeColor: '#ffffff',
      strokeWeight: 1,
    };
  });
}

/**
 * ホバー時のインタラクション（ツールチップ、ハイライト）を設定
 */
function setupHoverInteractions() {
  if (!map) {
    return;
  }

  // InfoWindowを作成（ツールチップ用）
  infoWindow = new google.maps.InfoWindow();

  // マウスオーバー時：ツールチップ表示とハイライト
  map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
    const municipalityName = event.feature.getProperty('市町村名');

    if (municipalityName && infoWindow) {
      // ツールチップ表示
      infoWindow.setContent(`<div style="padding: 4px 8px; font-size: 14px;">${municipalityName}</div>`);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    }

    // ハイライト効果
    const achieved = isAchieved(municipalityName as string);
    map!.data.overrideStyle(event.feature, {
      strokeWeight: 2,
      fillOpacity: 0.8,
      fillColor: achieved ? '#4caf50' : '#e0e0e0',
    });
  });

  // マウスアウト時：ツールチップを閉じてスタイルを元に戻す
  map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
    if (infoWindow) {
      infoWindow.close();
    }

    // スタイルをデフォルトに戻す
    map!.data.revertStyle(event.feature);
  });
}

/**
 * コンポーネントのマウント時に地図を初期化
 */
onMounted(() => {
  initMap();
});

/**
 * コンポーネントのアンマウント時のクリーンアップ
 */
onUnmounted(() => {
  // InfoWindowのクリーンアップ
  if (infoWindow) {
    infoWindow.close();
    infoWindow = null;
  }

  // 地図インスタンスの破棄
  map = null;
});

/**
 * 達成リストが変わったら地図のスタイルを更新
 */
watch(achievedList, () => {
  updateMapStyle();
});
</script>

<template>
  <div class="map-wrapper">
    <!-- ローディング表示 -->
    <div v-if="isLoading" class="loading-container">
      <n-spin size="large" />
      <p>地図を読み込んでいます...</p>
    </div>

    <!-- エラー表示 -->
    <div v-else-if="hasError" class="error-container">
      <n-alert type="error" :title="errorMessage" />
    </div>

    <!-- 地図表示エリア -->
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 600px;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f5f5f5;
  gap: 16px;
}

.loading-container p {
  color: #666;
  margin: 0;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}
</style>
