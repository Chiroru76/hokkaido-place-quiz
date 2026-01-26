<script setup lang="ts">
import { ref } from "vue";
import type { QuizState } from "./types/quiz";
import { initialQuizState } from "./state/initialState";

const state = ref<QuizState>({ ...initialQuizState });
</script>

<template>
  <main class="app">
    <h1>Hokkaido Place Quiz</h1>
    <p>phase: {{ state.phase }}</p>
  </main>
</template>

<style scoped>
.app {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}
</style>
