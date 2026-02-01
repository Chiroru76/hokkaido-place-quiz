<script setup lang="ts">
import { useAchievedMunicipalities } from "../composables/useAchievedMunicipalities";
import HokkaidoMap from "../components/HokkaidoMap.vue";

const { achievedCount, achievementRate } = useAchievedMunicipalities();
</script>

<template>
  <div class="content-container">
    <n-card class="map-card">
      <div class="map-wrapper">
        <div class="achievement-badge">
          <div class="badge-label">達成状況</div>
          <div class="badge-count">
            <span class="current">{{ achievedCount }}</span>
            <span class="separator">/</span>
            <span class="total">179</span>
          </div>

          <n-progress
            type="line"
            :percentage="achievementRate"
            color="#67C23A"
          />
        </div>

        <HokkaidoMap />
      </div>

      <n-space justify="center" class="action-area">
        <router-link to="/">
          <n-button
            type="primary"
            size="large"
            round
            class="return-button"
          >
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

.map-card {
  width: 100%;
  max-width: 800px;
  border-radius: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.map-wrapper {
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 12px;
}

/* 達成状況バッジのスタイリング */
.achievement-badge {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  background: rgb(255, 255, 255);
  padding: 15px;
  border-radius: 50%;
  border: #67c23a solid 3px;
  width: 110px;
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transform: translate(20%, -20%);
}

.badge-label {
  font-size: 0.7rem;
  font-weight: bold;
  color: #666;
}

.badge-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.badge-count .current {
  font-size: 1.8rem;
  font-weight: 900;
  color: #67c23a;
}

.badge-count .separator,
.badge-count .total {
  font-size: 0.9rem;
  color: #999;
}

.map-container {
  border: 1px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
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
