<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { RouteInfo, LatLng } from '../types/routes';
import { useRoutesApi } from '../composables/useRoutesApi';

/**
 * Props定義
 */
interface Props {
  /** 目的地の市町村名 */
  destination: string;
  /** 目的地の緯度経度 */
  destinationLocation: LatLng;
}

const props = defineProps<Props>();

// Routes API composable
const { fetchRoutesFromTokyo, getGoogleMapsRouteUrl } = useRoutesApi();

/**
 * 状態管理
 */
const routes = ref<RouteInfo[]>([]);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');

/**
 * ルート情報を取得
 */
async function loadRoutes() {
  if (!props.destination || !props.destinationLocation) {
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '';

  try {
    const results = await fetchRoutesFromTokyo(props.destinationLocation);
    routes.value = results;

    if (results.length === 0) {
      hasError.value = true;
      errorMessage.value = 'ルート情報が見つかりませんでした';
    }
  } catch (error) {
    console.error('Failed to load routes:', error);
    hasError.value = true;
    errorMessage.value = 'ルート情報の取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
}

/**
 * コンポーネントマウント時にルート情報を取得
 */
onMounted(() => {
  loadRoutes();
});

/**
 * 目的地が変更されたら再取得
 */
watch(() => [props.destination, props.destinationLocation], () => {
  loadRoutes();
});
</script>

<template>
  <div class="route-info">
    <!-- ヘッダー -->
    <div class="route-header">
      <h3 class="route-title">東京駅からのアクセス</h3>
    </div>

    <!-- ローディング表示 -->
    <div v-if="isLoading" class="loading-container">
      <n-spin size="medium" />
      <p>ルート情報を読み込んでいます...</p>
    </div>

    <!-- エラー表示 -->
    <div v-else-if="hasError" class="error-container">
      <n-alert type="warning" :title="errorMessage" />
    </div>

    <!-- ルート情報表示 -->
    <div v-else class="routes-container">
      <!-- ルート情報カード -->
      <div class="routes-grid">
        <n-card
          v-for="route in routes"
          :key="route.travelMode"
          size="small"
          class="route-card"
        >
          <div class="route-content">
            <!-- アイコンとモード名 -->
            <div class="route-mode">
              <span class="route-icon">{{ route.travelMode === 'DRIVE' ? '🚗' : '🚄' }}</span>
              <span class="route-mode-name">{{ route.travelMode === 'DRIVE' ? '車' : '公共交通機関' }}</span>
            </div>

            <!-- 所要時間 -->
            <div class="route-detail">
              <span class="detail-label">所要時間</span>
              <span class="detail-value">{{ route.formattedDuration }}</span>
            </div>

            <!-- 距離 -->
            <div class="route-detail">
              <span class="detail-label">距離</span>
              <span class="detail-value">{{ route.formattedDistance }}</span>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Google Mapsで詳細を見るボタン -->
      <div class="maps-button-container">
        <n-button
          type="primary"
          size="medium"
          tag="a"
          :href="getGoogleMapsRouteUrl(destinationLocation)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Mapsで詳細を見る
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-info {
  width: 100%;
}

.route-header {
  margin-bottom: 16px;
}

.route-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
}

.loading-container p {
  color: #666;
  margin: 0;
}

.error-container {
  padding: 16px 0;
}

.routes-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.routes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.route-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.route-icon {
  font-size: 24px;
  line-height: 1;
}

.route-mode-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.route-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #666;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.maps-button-container {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .routes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
