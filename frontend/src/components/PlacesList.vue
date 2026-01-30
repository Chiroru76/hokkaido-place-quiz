<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { usePlacesApi, type PlaceResult } from '../composables/usePlacesApi';

/**
 * Props定義
 */
interface Props {
  placeName: string;
}

const props = defineProps<Props>();

// Places API composable
const { searchPlacesByMunicipality, getPhotoUrl } = usePlacesApi();

// 状態管理
const places = ref<PlaceResult[]>([]);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');

/**
 * 観光スポットを検索
 */
async function loadPlaces() {
  if (!props.placeName) {
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '';

  try {
    const results = await searchPlacesByMunicipality(props.placeName);
    places.value = results;

    if (results.length === 0) {
      hasError.value = true;
      errorMessage.value = '周辺の観光スポットが見つかりませんでした';
    }
  } catch (error) {
    console.error('Failed to load places:', error);
    hasError.value = true;
    errorMessage.value = '観光スポットの取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
}

/**
 * コンポーネントマウント時に検索
 */
onMounted(() => {
  loadPlaces();
});

/**
 * placeNameが変更されたら再検索
 */
watch(() => props.placeName, () => {
  loadPlaces();
});
</script>

<template>
  <div class="places-list">
    <!-- ローディング表示 -->
    <div v-if="isLoading" class="loading-container">
      <n-spin size="medium" />
      <p>観光スポットを読み込んでいます...</p>
    </div>

    <!-- エラー表示 -->
    <div v-else-if="hasError" class="error-container">
      <n-alert type="warning" :title="errorMessage" />
    </div>

    <!-- スポット一覧 -->
    <div v-else class="places-grid">
      <n-card
        v-for="place in places"
        :key="place.id"
        size="small"
        class="place-card"
      >
        <div class="place-content">
          <!-- 写真 -->
          <div v-if="place.photos && place.photos.length > 0" class="place-photo">
            <img
              :src="getPhotoUrl(place.photos[0].name, 400)"
              :alt="place.displayName.text"
              @error="(e) => { if (e.target) (e.target as HTMLImageElement).src = '/placeholder-image.png'; }"
            />
          </div>
          <div v-else class="place-photo-placeholder">
            <span>📷</span>
          </div>

          <!-- 情報 -->
          <div class="place-info">
            <h3 class="place-name">{{ place.displayName.text }}</h3>

            <!-- 評価 -->
            <div v-if="place.rating" class="place-rating">
              <n-rate
                :value="place.rating"
                readonly
                size="small"
                :allow-half="true"
              />
              <span class="rating-text">
                {{ place.rating.toFixed(1) }}
                <span v-if="place.userRatingCount" class="review-count">
                  ({{ place.userRatingCount }})
                </span>
              </span>
            </div>

            <!-- 住所 -->
            <p class="place-address">{{ place.formattedAddress }}</p>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.places-list {
  width: 100%;
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

.places-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.place-card {
  overflow: hidden;
}

.place-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.place-photo {
  width: 100%;
  height: 160px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.place-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.place-photo-placeholder {
  width: 100%;
  height: 160px;
  border-radius: 4px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.place-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.place-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.place-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.review-count {
  color: #999;
  font-weight: normal;
}

.place-address {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}
</style>
