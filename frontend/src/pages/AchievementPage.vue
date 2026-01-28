<script setup lang="ts">
import { useAchievedMunicipalities } from "../composables/useAchievedMunicipalities";
import HokkaidoMap from "../components/HokkaidoMap.vue";

const { achievedCount, achievementRate } = useAchievedMunicipalities();
</script>

<template>
  <div>
    <h1 class="page-title">達成状況</h1>

    <n-space vertical size="large">
      <n-card title="全体の達成状況" size="small">
        <n-space vertical size="small">
          <n-space justify="space-between">
            <span style="font-size: 18px; font-weight: bold;">正解済み市町村数: {{ achievedCount }} / 179</span>
            <span style="font-size: 18px; font-weight: bold;">達成率: {{ achievementRate }}%</span>
          </n-space>
          <n-progress
            :percentage="achievementRate"
            :show-indicator="false"
            type="line"
            status="success"
          />
        </n-space>
      </n-card>

      <n-card title="達成マップ" size="small">
        <n-space vertical size="small" style="align-items: center;">
          <HokkaidoMap />
          <p style="font-size: 12px; color: #666; text-align: center;">
            緑色が正解済みの市町村です。地図をホバーすると市町村名が表示されます。
          </p>
        </n-space>
      </n-card>

      <n-space justify="center">
        <router-link to="/">
          <n-button type="primary" size="large">
            クイズに戻る
          </n-button>
        </router-link>
      </n-space>
    </n-space>
  </div>
</template>

<style scoped>
.page-title {
  color: #000000;
  text-align: center;
  margin-bottom: 24px;
}
</style>
