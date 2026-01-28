<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <router-view />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}
</style>
