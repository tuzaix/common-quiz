<script setup lang="ts">
/**
 * ResultFactory.vue
 * 负责结果展示和分享卡片
 */

import { computed, ref } from 'vue';
import api from '../../api';
import ShareCard from './ShareCard.vue';

const props = defineProps<{
  result: any;
  rule: any;
  config: any;
  projectId?: string;
}>();

const emit = defineEmits(['restart']);

const showShareCard = ref(false);

const handleShowShare = async () => {
  showShareCard.value = true;
  // 记录分享次数
  if (props.projectId) {
    try {
      await api.post(`/api/projects/${props.projectId}/share`);
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }
};

const shareData = computed(() => ({
  projectTitle: props.config?.title || '', // 项目标题
  title: props.rule?.title || '测试结果',
  score: Math.round(props.result?.totalScore || 0),
  mbti: props.result?.mbti || '',
  description: props.rule?.description || ''
}));

const showRadar = computed(() => props.config?.resultConfig?.shareCard?.elements?.showRadar && props.result.dimensions);
</script>

<template>
  <div class="max-w-2xl mx-auto p-0 bg-white shadow-2xl rounded-3xl overflow-hidden text-center border border-pink-50">
    <!-- 顶部艺术背景 -->
    <div class="relative h-48 bg-gradient-to-br from-rose-100 via-pink-100 to-rose-200 flex items-center justify-center overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-full opacity-30">
        <div class="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-pink-300 rounded-full blur-3xl"></div>
      </div>
      <div class="relative z-10">
        <div v-if="config?.title" class="inline-block px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-rose-500 text-base font-medium mb-3 shadow-sm">
          ✨ 【{{ config.title }}】· 测评报告
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">{{ rule?.title }}</h1>
      </div>
    </div>

    <div class="px-6 py-10 md:px-12">
      <!-- 核心结果展示区 -->
      <div class="relative mb-12">
        <div v-if="result && result.totalScore !== undefined" class="flex flex-col items-center">
          <div class="relative inline-block">
            <svg class="w-40 h-40 -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#fee2e2" stroke-width="12" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="#fb7185" stroke-width="12" stroke-linecap="round" 
                :stroke-dasharray="440" :stroke-dashoffset="440 - (440 * (result.totalScore / 100))" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-5xl font-black text-gray-800">{{ Math.round(result.totalScore) }}</span>
              <span class="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1">综合评分</span>
            </div>
          </div>
        </div>

        <div v-if="result && result.mbti" class="mb-10 animate-bounce-slow">
          <div class="text-7xl font-black bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent italic tracking-tighter">{{ result.mbti }}</div>
          <div class="text-sm text-rose-400 font-bold uppercase tracking-[0.2em] mt-2">✨ 你的专属灵魂类型 ✨</div>
        </div>
      </div>

      <!-- 深度解析区 -->
      <div class="mb-12 text-left relative">
        <div class="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-rose-300 to-transparent rounded-full opacity-50"></div>
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="p-1.5 rounded-lg bg-rose-100 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </span>
          深度解析
        </h3>
        <div class="bg-rose-50/50 p-6 md:p-8 rounded-2xl border border-rose-100/50 backdrop-blur-sm">
          <div class="prose prose-rose max-w-none text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
            {{ rule?.description }}
          </div>
        </div>
      </div>

      <!-- 维度图表 (更柔和的样式) -->
      <div v-if="showRadar && result" class="mb-12">
        <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span class="p-1.5 rounded-lg bg-rose-100 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </span>
          维度雷达
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(score, key) in result.dimensions" :key="key" class="bg-white p-4 rounded-2xl border border-rose-50 shadow-sm flex items-center gap-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm font-medium mb-1.5">
                <span class="text-gray-700">{{ key }}</span>
                <span class="text-rose-500">{{ Math.round(score * 10) }}%</span>
              </div>
              <div class="h-2 bg-rose-50 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-rose-300 to-rose-500 rounded-full transition-all duration-1000" 
                  :style="{ width: (score * 10) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 交互按钮 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <button
          @click="handleShowShare"
          class="group relative flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          保存结果并分享
        </button>
        <button
          @click="emit('restart')"
          class="flex items-center justify-center gap-2 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 hover:border-rose-100 transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          再测一次
        </button>
      </div>
    </div>

    <!-- 分享卡片弹窗 -->
    <ShareCard
      v-if="showShareCard"
      :data="shareData"
      @close="showShareCard = false"
    />
  </div>
</template>
