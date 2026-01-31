<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <h1 class="app-title">よめるべ？北海道</h1>
      <nav class="nav-links">
        <router-link to="/" custom v-slot="{ navigate, isActive }">
          <n-button
            @click="navigate"
            :type="isActive ? 'primary' : 'default'"
            size="medium"
          >
            クイズ
          </n-button>
        </router-link>
        <router-link to="/achievement" custom v-slot="{ navigate, isActive }">
          <n-button
            @click="navigate"
            :type="isActive ? 'primary' : 'default'"
            size="medium"
          >
            達成状況
          </n-button>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 12px;
}
</style>
