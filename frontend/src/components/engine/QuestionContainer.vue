<script setup lang="ts">
/**
 * QuestionContainer.vue
 * 负责题目展示、进度条、题目切换逻辑
 */

import { computed, ref } from 'vue';
import { getComponentByType } from './QuestionTypeRegistry';
import { resolveUrl } from '../../api';

interface Question {
  id: string;
  type: string;
  content: {
    text: string;
    media?: { type: 'image' | 'video', url: string };
  };
  options?: any[];
  settings?: any;
}

const props = defineProps<{
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, any>;
}>();

const emit = defineEmits(['answer', 'next', 'prev', 'complete']);

const currentQuestion = computed(() => props.questions[props.currentQuestionIndex]);

const handleAnswer = (value: any) => {
  const selectedOption = currentQuestion.value?.options?.find((o: any) => o.value === value);
  emit('answer', {
    questionId: currentQuestion.value?.id,
    value,
    dimensionKey: selectedOption?.dimensionKey,
    jumpTo: selectedOption?.jumpTo
  });
};

const progress = computed(() => {
  return Math.round(((props.currentQuestionIndex + 1) / props.questions.length) * 100);
});
</script>

<template>
  <div class="max-w-2xl mx-auto p-0 bg-white shadow-2xl rounded-3xl overflow-hidden border border-pink-50 relative">
    <!-- 顶部艺术化进度展示 -->
    <div class="bg-gradient-to-r from-rose-100/50 via-pink-100/50 to-rose-100/50 px-6 py-6 md:px-10 border-b border-pink-100/30">
      <div class="flex justify-between items-end mb-4">
        <div>
          <span class="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">Current Progress</span>
          <h3 class="text-2xl font-black text-gray-800 tabular-nums">
            {{ currentQuestionIndex + 1 }} <span class="text-gray-300 font-light mx-1">/</span> {{ questions.length }}
          </h3>
        </div>
        <div class="text-right">
          <span class="text-3xl font-black text-rose-500 tabular-nums">{{ progress }}<span class="text-sm ml-0.5">%</span></span>
        </div>
      </div>
      <div class="w-full bg-white/60 backdrop-blur-sm rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
        <div class="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm relative" :style="{ width: progress + '%' }">
          <div class="absolute top-0 right-0 w-2 h-full bg-white/30 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 题目内容 -->
    <div class="px-6 py-10 md:px-12 md:py-14 min-h-[400px] flex flex-col relative overflow-hidden">
      <!-- 装饰背景 -->
      <div class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div class="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div v-if="currentQuestion" class="relative z-10 flex-1">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-bold mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Question {{ currentQuestionIndex + 1 }}
        </div>
        
        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-800 mb-8 leading-tight tracking-tight">
          {{ currentQuestion.content.text }}
        </h2>
        
        <div v-if="currentQuestion.content.media" class="mb-8 group">
          <img v-if="currentQuestion.content.media.type === 'image'" 
            :src="resolveUrl(currentQuestion.content.media.url)" 
            class="w-full rounded-2xl shadow-xl border-4 border-white transition-transform duration-500 group-hover:scale-[1.01]" 
          />
        </div>

        <!-- 动态渲染题目输入组件 -->
        <div class="mt-4">
          <component
            :is="getComponentByType(currentQuestion.type)"
            v-bind="currentQuestion"
            :modelValue="answers[currentQuestion.id]"
            @update:modelValue="handleAnswer"
            @change="() => emit('next')"
          />
        </div>
      </div>

      <div v-else class="flex flex-col justify-center items-center h-64">
        <div class="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin mb-4"></div>
        <p class="text-rose-400 font-medium">准备题目中...</p>
      </div>
    </div>

    <!-- 底部导航按钮 -->
    <div class="px-6 py-8 md:px-12 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row gap-4 sm:items-center">
      <button
        @click="emit('prev')"
        :disabled="currentQuestionIndex === 0"
        class="group flex items-center justify-center gap-2 px-6 py-4 text-gray-500 font-bold rounded-2xl transition-all hover:bg-white hover:text-gray-800 disabled:opacity-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        上一题
      </button>
      
      <div class="flex-1"></div>

      <button
        v-if="currentQuestionIndex === questions.length - 1"
        @click="emit('complete')"
        class="flex items-center justify-center gap-2 px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:scale-95 group"
      >
        查看我的测评结果
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-else
        @click="emit('next')"
        class="flex items-center justify-center gap-2 px-10 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold hover:border-rose-200 hover:text-rose-500 transition-all active:scale-95"
      >
        跳过此题
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>
