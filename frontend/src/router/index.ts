import { createRouter, createWebHistory } from 'vue-router';
import QuizPage from '../pages/QuizPage.vue';
import AchievementPage from '../pages/AchievementPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'quiz',
      component: QuizPage,
    },
    {
      path: '/achievement',
      name: 'achievement',
      component: AchievementPage,
    },
  ],
});

export default router;
