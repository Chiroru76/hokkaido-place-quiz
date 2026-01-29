<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

/**
 * Props定義
 */
interface Props {
  placeName: string;
}

const props = defineProps<Props>();

// 地図表示用のref
const mapContainer = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');

// Google Maps インスタンス
let map: google.maps.Map | null = null;
let marker: google.maps.marker.AdvancedMarkerElement | null = null;

// GeoJSONデータのキャッシュ
let geojsonData: any = null;

// Google Maps API キー
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

    // 地図の作成（北海道の中心付近、mapIdを指定してAdvancedMarkerを使用可能に）
    map = new Map(mapContainer.value, {
      center: { lat: 43.2, lng: 142.8 },
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapId: 'HOKKAIDO_MAP', // AdvancedMarkerElement使用のために必要
    });

    isLoading.value = false;

    // GeoJSONデータを読み込んでポリゴンを表示
    await loadAndDisplayPolygon();
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    hasError.value = true;
    errorMessage.value = '地図を読み込めませんでした';
    isLoading.value = false;
  }
}

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
 * 市町村名でGeoJSONをフィルタリング
 */
function filterMunicipalityGeoJson(data: any, municipalityName: string) {
  if (!data || !data.features) {
    return null;
  }

  const features = data.features.filter((feature: any) => {
    return feature.properties?.市町村名 === municipalityName;
  });

  if (features.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

/**
 * ポリゴンとマーカーを地図に表示
 */
async function loadAndDisplayPolygon() {
  if (!map || !props.placeName) {
    return;
  }

  // 既存のポリゴンをクリア
  map.data.forEach((feature: google.maps.Data.Feature) => {
    map!.data.remove(feature);
  });

  // 既存のマーカーをクリア
  if (marker) {
    marker.map = null;
    marker = null;
  }

  // GeoJSONデータを読み込み
  const data = await loadGeoJson();
  if (!data) {
    console.warn('GeoJSON data could not be loaded');
    return;
  }

  // 市町村でフィルタリング
  const filteredData = filterMunicipalityGeoJson(data, props.placeName);
  if (!filteredData) {
    console.warn(`Municipality not found: ${props.placeName}`);
    return;
  }

  // ポリゴンを地図に追加
  map.data.addGeoJson(filteredData);

  // ポリゴンのスタイルを設定
  map.data.setStyle({
    fillColor: '#4caf50',
    fillOpacity: 0.6,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  });

  // ポリゴンの境界に合わせて地図の表示範囲を調整
  const bounds = new google.maps.LatLngBounds();
  map.data.forEach((feature) => {
    feature.getGeometry()?.forEachLatLng((latLng) => {
      bounds.extend(latLng);
    });
  });
  map.fitBounds(bounds);

  // 市町村の中心座標を計算してマーカーを配置
  const center = bounds.getCenter();
  if (center) {
    // Marker ライブラリの読み込み
    const { AdvancedMarkerElement } = await importLibrary('marker');

    marker = new AdvancedMarkerElement({
      position: center,
      map: map,
      title: props.placeName,
    });
  }
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
  // マーカーの破棄
  if (marker) {
    marker.map = null;
    marker = null;
  }

  // 地図インスタンスの破棄
  map = null;
});

/**
 * placeNameが変更されたら地図を更新
 */
watch(() => props.placeName, async () => {
  if (props.placeName) {
    await loadAndDisplayPolygon();
    // TODO: Phase 4 でマーカー表示を実装
  }
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
  width: 100%;
  height: 300px;
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
