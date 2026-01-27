<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import { useAchievedMunicipalities } from '../composables/useAchievedMunicipalities';

const { isAchieved, achievedList } = useAchievedMunicipalities();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let geoJsonLayer: L.GeoJSON | null = null;

/**
 * 市町村ポリゴンのスタイルを決定
 */
function getFeatureStyle(feature: any): L.PathOptions {
  const municipalityName = feature.properties.N03_004 || feature.properties.N03_003;
  const achieved = isAchieved(municipalityName);

  return {
    fillColor: achieved ? '#4caf50' : '#e0e0e0',
    fillOpacity: 0.6,
    color: '#ffffff',
    weight: 1,
  };
}

/**
 * 各市町村ポリゴンにインタラクションを設定
 */
function onEachFeature(feature: any, layer: L.Layer) {
  const municipalityName = feature.properties.N03_004 || feature.properties.N03_003;

  if (municipalityName) {
    // ツールチップ（ホバー時に表示）
    layer.bindTooltip(municipalityName, {
      sticky: true,
      className: 'municipality-tooltip',
    });

    // ホバー時のハイライト効果
    layer.on('mouseover', function (this: L.Path) {
      this.setStyle({
        weight: 2,
        fillOpacity: 0.8,
      });
    });

    layer.on('mouseout', function (this: L.Path) {
      this.setStyle({
        weight: 1,
        fillOpacity: 0.6,
      });
    });
  }
}

/**
 * 地図の初期化
 */
async function initMap() {
  if (!mapContainer.value) return;

  // 地図の作成（北海道の中心付近）
  map = L.map(mapContainer.value, {
    center: [43.2, 142.8],
    zoom: 7,
    zoomControl: true,
  });

  // タイルレイヤーの追加（OpenStreetMap）
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // GeoJSONデータの読み込み
  try {
    const response = await fetch('/data/hokkaido.geojson');
    const geojsonData = await response.json();

    // GeoJSONレイヤーの追加
    geoJsonLayer = L.geoJSON(geojsonData, {
      style: getFeatureStyle,
      onEachFeature: onEachFeature,
    }).addTo(map);
  } catch (error) {
    console.error('Failed to load GeoJSON data:', error);
  }
}

/**
 * 地図の更新（達成状況が変わったとき）
 */
function updateMap() {
  if (geoJsonLayer) {
    geoJsonLayer.setStyle(getFeatureStyle);
  }
}

// マウント時に地図を初期化
onMounted(() => {
  initMap();
});

// 達成リストが変わったら地図を更新
watch(achievedList, () => {
  updateMap();
});
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
}
</style>

<style>
/* ツールチップのスタイル（グローバル） */
.municipality-tooltip {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
}
</style>
