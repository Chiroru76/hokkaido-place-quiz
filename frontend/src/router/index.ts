import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../pages/StartPage.vue';
import QuestionPage from '../pages/QuestionPage.vue';
import AnsweredPage from '../pages/AnsweredPage.vue';
import ResultPage from '../pages/ResultPage.vue';
import AchievementPage from '../pages/AchievementPage.vue';
import { useQuizStore } from '../stores/quizStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartPage,
    },
    {
      path: '/quiz/question',
      name: 'question',
      component: QuestionPage,
      /**
       * ルートガード: questionフェーズでない場合はトップページへリダイレクト
       */
      beforeEnter: (_to, _from, next) => {
        const quizStore = useQuizStore();
        if (quizStore.state.phase !== 'question') {
          next('/');
        } else {
          next();
        }
      },
    },
    {
      path: '/quiz/answered',
      name: 'answered',
      component: AnsweredPage,
      /**
       * ルートガード: answeredフェーズでない場合はトップページへリダイレクト
       */
      beforeEnter: (_to, _from, next) => {
        const quizStore = useQuizStore();
        if (quizStore.state.phase !== 'answered') {
          next('/');
        } else {
          next();
        }
      },
    },
    {
      path: '/quiz/result',
      name: 'result',
      component: ResultPage,
      /**
       * ルートガード: completedフェーズでない場合はトップページへリダイレクト
       */
      beforeEnter: (_to, _from, next) => {
        const quizStore = useQuizStore();
        if (quizStore.state.phase !== 'completed') {
          next('/');
        } else {
          next();
        }
      },
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
