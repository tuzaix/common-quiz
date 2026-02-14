<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuizStore } from '../store/quiz';
import QuestionContainer from '../components/engine/QuestionContainer.vue';
import ResultFactory from '../components/engine/ResultFactory.vue';

import axios from 'axios';

const route = useRoute();
const router = useRouter();
const store = useQuizStore();
const isFinished = ref(false);

// 从后端获取配置
const fetchConfig = async (id: string) => {
  store.isLoading = true;
  try {
    const response = await axios.get(`http://localhost:3000/api/projects/${id}/config`);
    const { config, questions } = response.data;
    
    // 检查访问模式
    if (config.settings?.accessMode === 'code_required') {
      const savedCard = localStorage.getItem(`card_${id}`);
      if (!savedCard) {
        router.push({ name: 'verify', query: { projectId: id } });
        return;
      }
    }
    
    // 打乱题目顺序
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    
    store.setProjectData(config, shuffledQuestions);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    store.error = '无法加载项目配置，请检查后端服务是否启动。';
  } finally {
    store.isLoading = false;
  }
};

onMounted(() => {
  const projectId = route.params.id as string;
  fetchConfig(projectId);
});

const lastJumpTo = ref<string | undefined>(undefined);

const handleAnswer = ({ questionId, value, jumpTo }: any) => {
  store.saveAnswer(questionId, value);
  lastJumpTo.value = jumpTo;
};

const handleNext = () => {
  if (store.isLastQuestion && !lastJumpTo.value) {
    handleComplete();
  } else {
    store.nextQuestion(lastJumpTo.value);
    lastJumpTo.value = undefined;
  }
};

const handleComplete = () => {
  store.calculateResult();
  isFinished.value = true;
};

const restart = () => {
  window.location.reload();
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div v-if="store.isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="store.error" class="max-w-md mx-auto p-8 bg-white shadow-lg rounded-xl text-center">
      <div class="text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">出错了</h2>
      <p class="text-gray-600 mb-6">{{ store.error }}</p>
      <button @click="router.push('/')" class="px-6 py-2 bg-blue-600 text-white rounded-lg">返回首页</button>
    </div>

    <div v-else-if="!isFinished" class="animate-fade-in">
      <QuestionContainer
        :questions="store.questions"
        :currentQuestionIndex="store.currentQuestionIndex"
        :answers="store.answers"
        @answer="handleAnswer"
        @next="handleNext"
        @prev="store.prevQuestion"
        @complete="handleComplete"
      />
    </div>

    <div v-else class="animate-fade-in">
      <ResultFactory
        :result="store.calculationResult"
        :rule="store.matchedRule"
        :config="store.projectConfig.resultConfig"
        @restart="restart"
      />
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
