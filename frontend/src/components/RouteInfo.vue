<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { RouteInfo, LatLng } from '../types/routes';
import { TOKYO_STATION } from '../types/routes';

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
    // TODO: Routes APIを呼び出してルート情報を取得
    // Phase 4で実装予定
    console.log('Loading routes from', TOKYO_STATION, 'to', props.destinationLocation);

    // 仮データ（Phase 4で削除）
    await new Promise(resolve => setTimeout(resolve, 1000));
    routes.value = [];

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
      <!-- TODO: Phase 6でルート情報カードを実装 -->
      <p class="placeholder-text">ルート情報を表示予定</p>
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
  gap: 12px;
}

.placeholder-text {
  color: #999;
  text-align: center;
  padding: 24px;
  margin: 0;
}
</style>
