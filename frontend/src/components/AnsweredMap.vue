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
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

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

    // 地図の作成（北海道全体が見えるビュー、mapIdを指定してAdvancedMarkerを使用可能に）
    map = new Map(mapContainer.value, {
      center: { lat: 43.2, lng: 142.8 },
      zoom: 6.5, // 北海道全体が見えるズームレベル
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapId: mapId, // AdvancedMarkerElement使用のために必要
    });

    isLoading.value = false;

    // GeoJSONデータを読み込んで全市町村を表示
    await loadAllMunicipalities();

    // 初期表示時に指定された市町村があればハイライト
    if (props.placeName) {
      await loadAndDisplayPolygon();
    }
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
 * 全市町村のポリゴンを地図に表示（初期表示時）
 */
async function loadAllMunicipalities() {
  if (!map) {
    return;
  }

  // 既存のポリゴンをクリア
  map.data.forEach((feature: google.maps.Data.Feature) => {
    map!.data.remove(feature);
  });

  // GeoJSONデータを読み込み
  const data = await loadGeoJson();
  if (!data) {
    console.warn('GeoJSON data could not be loaded');
    return;
  }

  // 全市町村のポリゴンを地図に追加
  map.data.addGeoJson(data);

  // ポリゴンのスタイルを設定（全て灰色で表示）
  map.data.setStyle({
    fillColor: '#e0e0e0',
    fillOpacity: 0.3,
    strokeColor: '#ffffff',
    strokeWeight: 1,
  });
}

/**
 * 市町村へスムーズにズームインする（2-3秒のアニメーション）
 */
async function zoomToMunicipality(bounds: google.maps.LatLngBounds) {
  if (!map) {
    return;
  }

  const currentMap = map;
  const targetCenter = bounds.getCenter();

  // 目標ズームレベルを計算（fitBoundsと同等のズームレベル）
  const targetZoom = getZoomForBounds(bounds);

  return new Promise<void>((resolve) => {
    let animationComplete = false;

    // アニメーション完了を検知するリスナー
    const idleListener = currentMap.addListener('idle', () => {
      if (animationComplete) {
        google.maps.event.removeListener(idleListener);
        resolve();
      }
    });

    // Step 1: まず中心座標にパン（1秒程度）
    currentMap.panTo(targetCenter);

    // Step 2: 1秒後にズームを開始
    setTimeout(() => {
      currentMap.setZoom(targetZoom);

      // Step 3: さらに1秒後にアニメーション完了フラグを立てる
      setTimeout(() => {
        animationComplete = true;
      }, 1000);
    }, 1000);
  });
}

/**
 * 境界ボックスに適したズームレベルを計算
 */
function getZoomForBounds(bounds: google.maps.LatLngBounds): number {
  if (!map) {
    return 10;
  }

  // 一時的にfitBoundsして最適なズームレベルを取得
  const currentZoom = map.getZoom();
  map.fitBounds(bounds, 50);
  const optimalZoom = map.getZoom() || 10;

  // 元のズームレベルに戻す
  if (currentZoom) {
    map.setZoom(currentZoom);
  }

  return optimalZoom;
}

/**
 * ポリゴンとマーカーを地図に表示
 */
async function loadAndDisplayPolygon() {
  if (!map || !props.placeName) {
    return;
  }

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

  // 市町村でフィルタリング（中心座標とマーカー配置用）
  const filteredData = filterMunicipalityGeoJson(data, props.placeName);
  if (!filteredData) {
    console.warn(`Municipality not found: ${props.placeName}`);
    return;
  }

  // ターゲット市町村のポリゴンをハイライト表示
  map.data.setStyle((feature: google.maps.Data.Feature) => {
    const municipalityName = feature.getProperty('市町村名');
    const isTarget = municipalityName === props.placeName;

    return {
      fillColor: isTarget ? '#4caf50' : '#e0e0e0',
      fillOpacity: isTarget ? 0.6 : 0.3,
      strokeColor: isTarget ? '#ffffff' : '#ffffff',
      strokeWeight: isTarget ? 2 : 1,
    };
  });

  // ターゲット市町村の境界ボックスと中心座標を計算
  const bounds = new google.maps.LatLngBounds();
  filteredData.features.forEach((feature: any) => {
    const geometry = feature.geometry;
    if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]) {
      geometry.coordinates[0].forEach((coord: number[]) => {
        if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          bounds.extend(new google.maps.LatLng(coord[1], coord[0]));
        }
      });
    } else if (geometry?.type === 'MultiPolygon' && geometry.coordinates) {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0]?.forEach((coord: number[]) => {
          if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
            bounds.extend(new google.maps.LatLng(coord[1], coord[0]));
          }
        });
      });
    }
  });

  // boundsが空でないことを確認
  if (bounds.isEmpty()) {
    return;
  }

  // 市町村の中心座標を取得
  const center = bounds.getCenter();
  if (!center) {
    return;
  }

  // 北海道全体から該当市町村へスムーズにズームイン（2-3秒のアニメーション）
  await zoomToMunicipality(bounds);

  // アニメーション完了後、マーカーを配置
  const { AdvancedMarkerElement } = await importLibrary('marker');

  marker = new AdvancedMarkerElement({
    position: center,
    map: map,
    title: props.placeName,
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
