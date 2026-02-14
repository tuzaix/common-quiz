<script setup lang="ts">
/**
 * QuestionContainer.vue
 * 负责题目展示、进度条、题目切换逻辑
 */

import { computed, ref } from 'vue';
import { getComponentByType } from './QuestionTypeRegistry';

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
  const selectedOption = currentQuestion.value.options?.find((o: any) => o.value === value);
  emit('answer', {
    questionId: currentQuestion.value.id,
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
  <div class="max-w-2xl mx-auto p-4 md:p-8 bg-white shadow-lg rounded-xl">
    <!-- 进度条 -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-500">题目 {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
        <span class="text-sm font-medium text-blue-600">{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- 题目内容 -->
    <div v-if="currentQuestion" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ currentQuestion.content.text }}</h2>
      <div v-if="currentQuestion.content.media" class="mb-4">
        <img v-if="currentQuestion.content.media.type === 'image'" :src="currentQuestion.content.media.url" class="w-full rounded-lg shadow-sm" />
      </div>

      <!-- 动态渲染题目输入组件 -->
      <component
        :is="getComponentByType(currentQuestion.type)"
        v-bind="currentQuestion"
        :modelValue="answers[currentQuestion.id]"
        @update:modelValue="handleAnswer"
        @change="() => emit('next')"
      />
    </div>

    <div v-else class="flex justify-center items-center h-32">
      <p class="text-gray-400">正在加载题目...</p>
    </div>

    <!-- 底部按钮 -->
    <div class="mt-12 flex justify-between">
      <button
        @click="emit('prev')"
        :disabled="currentQuestionIndex === 0"
        class="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 flex items-center"
      >
        <span class="mr-2">←</span> 上一题
      </button>
      
      <button
        v-if="currentQuestionIndex === questions.length - 1"
        @click="emit('complete')"
        class="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
      >
        完成并查看结果
      </button>
      <button
        v-else
        @click="emit('next')"
        class="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
      >
        下一题
      </button>
    </div>
  </div>
</template>
