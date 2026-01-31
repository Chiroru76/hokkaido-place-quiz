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

router.afterEach((to) => {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: to.fullPath,
  });
});

export default router;
