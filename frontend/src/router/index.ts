import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import QuizView from '../views/QuizView.vue';
import CardVerifyView from '../views/CardVerifyView.vue';
import AdminView from '../views/AdminView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/quiz/:id',
      name: 'quiz',
      component: QuizView
    },
    {
      path: '/verify',
      name: 'verify',
      component: CardVerifyView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    }
  ]
});

export default router;
