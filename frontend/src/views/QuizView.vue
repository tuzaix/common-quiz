<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuizStore } from '../store/quiz';
import QuestionContainer from '../components/engine/QuestionContainer.vue';
import ResultFactory from '../components/engine/ResultFactory.vue';
import CardVerifyModal from '../components/engine/CardVerifyModal.vue';
import api from '../api';

const route = useRoute();
const router = useRouter();
const store = useQuizStore();
const isFinished = ref(false);
const showVerifyModal = ref(false);
const internalVerifiedTrigger = ref(0);

const isCodeVerified = computed(() => {
  // 依赖 trigger 以便在验证成功后强制重新计算
  internalVerifiedTrigger.value;
  
  if (!store.projectConfig?.settings?.accessMode) return true;
  if (store.projectConfig.settings.accessMode !== 'code_required') return true;
  
  const projectId = route.params.id as string;
  return !!localStorage.getItem(`card_${projectId}`);
});

// 从后端获取配置
const fetchConfig = async (id: string) => {
  store.isLoading = true;
  store.error = null;
  try {
    const isPreview = route.query.preview === 'true';
    const response = await api.get(`/api/projects/${id}/config`, {
      params: { preview: isPreview }
    });
    const { config, questions } = response.data;
    
    // 打乱题目顺序
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    
    store.setProjectData(config, shuffledQuestions);
  } catch (error: any) {
    console.error('Failed to fetch config:', error);
    if (error.response?.status === 403 && error.response?.data?.status === 'offline') {
      store.error = '该项目已下线，暂时无法访问。';
    } else {
      store.error = '无法加载项目配置，请检查后端服务是否启动。';
    }
  } finally {
    store.isLoading = false;
  }
};

onMounted(() => {
  const projectId = route.params.id as string;
  fetchConfig(projectId);
});

// 动态修改页面标题
watch(() => store.projectConfig?.title, (newTitle) => {
  if (newTitle) {
    document.title = `${newTitle} - 心理测评中心`;
  }
}, { immediate: true });

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

const handleComplete = async () => {
  store.calculateResult();
  isFinished.value = true;
  
  // 记录完成次数
  try {
    const projectId = route.params.id as string;
    await api.post(`/api/projects/${projectId}/complete`);
  } catch (err) {
    console.error('Failed to record completion:', err);
  }
  
  // 如果需要卡密验证且尚未验证，则弹出弹窗
  if (!isCodeVerified.value) {
    showVerifyModal.value = true;
  }
};

const handleVerified = () => {
  internalVerifiedTrigger.value++;
  showVerifyModal.value = false;
};

const handleCancelVerify = () => {
  router.push('/');
};

const restart = () => {
  window.location.reload();
};
</script>

<template>
  <div class="min-h-screen bg-[#fffafa] py-12 px-4 relative overflow-hidden">
    <!-- 背景装饰元素 -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/30 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-100/30 rounded-full blur-[120px]"></div>
      <div class="absolute top-[20%] right-[5%] w-[20%] h-[20%] bg-orange-50/20 rounded-full blur-[80px]"></div>
    </div>

    <div v-if="store.isLoading" class="flex flex-col justify-center items-center h-96">
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-rose-100 border-t-rose-500"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <div class="w-4 h-4 bg-rose-200 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p class="mt-6 text-rose-400 font-medium tracking-widest animate-pulse">正在加载精彩内容...</p>
    </div>

    <div v-else-if="store.error" class="max-w-md mx-auto p-10 bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl text-center border border-rose-100/50">
      <div class="text-rose-400 mb-6">
        <div class="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      <h2 class="text-2xl font-black text-gray-800 mb-3">哎呀，出错了</h2>
      <p class="text-gray-500 mb-8 leading-relaxed">{{ store.error }}</p>
      <button 
        @click="router.push('/')" 
        class="w-full px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all"
      >
        返回首页
      </button>
    </div>

    <div v-else-if="!isFinished" class="animate-fade-in">
      <QuestionContainer
        :questions="store.questions"
        :currentQuestionIndex="store.currentQuestionIndex"
        :answers="store.answers"
        :projectTitle="store.projectConfig?.title"
        @answer="handleAnswer"
        @next="handleNext"
        @prev="store.prevQuestion"
        @complete="handleComplete"
      />
    </div>

    <div v-else class="animate-fade-in max-w-4xl mx-auto">
      <ResultFactory
        v-if="isCodeVerified"
        :result="store.calculationResult"
        :rule="store.matchedRule"
        :config="store.projectConfig"
        :projectId="(route.params.id as string)"
        @restart="restart"
      />
      
      <!-- 卡密验证弹窗 -->
      <CardVerifyModal
        v-if="showVerifyModal"
        :projectId="(route.params.id as string)"
        @verified="handleVerified"
        @cancel="handleCancelVerify"
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
