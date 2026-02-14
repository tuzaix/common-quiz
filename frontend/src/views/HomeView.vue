<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const startQuiz = () => {
  router.push('/quiz/default');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8 w-24 h-24 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <h1 class="text-4xl font-black text-gray-900 mb-4">通用测试平台</h1>
      <p class="text-gray-600 mb-10 text-lg leading-relaxed">
        一个配置驱动的自动化测试系统，支持多种计分模型与个性化分析。
      </p>
      
      <div class="space-y-4">
        <button
          @click="startQuiz"
          class="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          开始示例测试
        </button>
        <p class="text-sm text-gray-400">点击按钮体验心理素质测评样例</p>
      </div>
    </div>
    
    <div class="mt-20 grid grid-cols-3 gap-8 max-w-2xl w-full">
      <div class="text-center">
        <div class="text-blue-600 font-bold text-xl mb-1">100%</div>
        <div class="text-xs text-gray-500 uppercase tracking-wider">配置驱动</div>
      </div>
      <div class="text-center">
        <div class="text-blue-600 font-bold text-xl mb-1">多模型</div>
        <div class="text-xs text-gray-500 uppercase tracking-wider">计分引擎</div>
      </div>
      <div class="text-center">
        <div class="text-blue-600 font-bold text-xl mb-1">全适配</div>
        <div class="text-xs text-gray-500 uppercase tracking-wider">移动端优先</div>
      </div>
    </div>
  </div>
</template>
