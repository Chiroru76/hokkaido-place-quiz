<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { useGoogleMaps } from '../composables/useGoogleMaps';
import { useAchievedMunicipalities } from '../composables/useAchievedMunicipalities';

const { isAchieved, achievedList } = useAchievedMunicipalities();

// Google Maps composable
const { apiKey, mapId, initializeApi, importLibrary } = useGoogleMaps();

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
    // Google Maps API の初期化（初回のみ実行）
    initializeApi();

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

  // InfoWindowを作成（ツールチップ用、閉じるボタンなし）
  infoWindow = new google.maps.InfoWindow({
    disableAutoPan: true, // 自動パンを無効化（ツールチップのような動作）
  });

  // マウスオーバー時：ツールチップ表示とハイライト
  map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
    const municipalityName = event.feature.getProperty('市町村名');
    const achieved = isAchieved(municipalityName as string);

    if (municipalityName && infoWindow) {
      // ツールチップのHTML
      const tooltipContent = `
        <div style="padding: 8px 10px; min-width: 60px;">
          <div style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 5px;">
            ${municipalityName}
          </div>
          <div style="display: flex; align-items: center; gap: 5px; font-size: 14px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${achieved ? '#4caf50' : '#b0b0b0'};"></span>
            <span style="color: ${achieved ? '#4caf50' : '#666'};">
              ${achieved ? '正解' : '未正解'}
            </span>
          </div>
        </div>
      `;

      infoWindow.setContent(tooltipContent);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    }

    // ハイライト効果
    map!.data.overrideStyle(event.feature, {
      strokeWeight: 2,
      fillOpacity: 0.8,
      fillColor: achieved ? '#4caf50' : '#b0b0b0',
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

<style>
/* Google Maps InfoWindowの閉じるボタンを非表示 */
.gm-style-iw-chr {
  display: none !important;
}

/* InfoWindowのパディング調整 */
.gm-style-iw {
  padding: 0 !important;
}

.gm-style-iw-d {
  overflow: hidden !important;
}
</style>
