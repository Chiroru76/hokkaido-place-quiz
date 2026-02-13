<script setup lang="ts">
import { computed } from 'vue'
import { useFavoriteMunicipalities } from '../composables/useFavoriteMunicipalities'

const { favorites, removeFavorite } = useFavoriteMunicipalities()

// Setを配列に変換
const favoriteList = computed(() => Array.from(favorites.value))
</script>

<template>
  <div class="content-container">
    <n-card class="favorites-card">
      <!-- ヘッダー：件数表示 -->
      <div class="favorites-header">
        <h2 class="favorites-title">行ってみたい市町村</h2>
        <span class="favorites-count">合計 {{ favoriteList.length }} 件</span>
      </div>

      <!-- 空状態 -->
      <div v-if="favoriteList.length === 0" class="favorites-empty">
        行ってみたい市町村はありません。
      </div>

      <!-- リスト -->
      <div v-else class="favorites-list">
        <div v-for="name in favoriteList" :key="name" class="favorite-item">
          <span class="favorite-name">{{ name }}</span>
          <n-button size="small" @click="removeFavorite(name)">
            削除
          </n-button>
        </div>
      </div>

      <!-- クイズに戻るボタン -->
      <n-space justify="center" class="action-area">
        <router-link to="/">
          <n-button type="primary" size="large" round class="return-button">
            クイズに戻る
          </n-button>
        </router-link>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.content-container {
  padding: 40px 20px;
  background: transparent;
}

.favorites-card {
  width: 100%;
  max-width: 800px;
  border-radius: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.favorites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.favorites-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.favorites-count {
  font-size: 14px;
  color: #9aa4b2;
}

.favorites-empty {
  text-align: center;
  padding: 40px 0;
  color: #9aa4b2;
  font-size: 14px;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.favorite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #f5f7f4;
  border: 1px solid #e8ede6;
}

.favorite-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.action-area {
  margin-top: 24px;
}

.return-button {
  width: 100%;
  max-width: 400px;
  height: 40px;
  border-radius: 32px;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(180deg, #67C23A 0%, #6db12a 100%);
  transition: all 0.3s ease;
}
</style>
