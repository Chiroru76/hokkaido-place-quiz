<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(to bottom, #e3f2fd 0%, #f0f8ff 100%);
}

.main-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 16px;
  color: #000000;
}
</style>
