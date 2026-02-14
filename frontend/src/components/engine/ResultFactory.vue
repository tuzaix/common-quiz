<script setup lang="ts">
/**
 * ResultFactory.vue
 * 负责结果展示和分享卡片
 */

import { computed, ref } from 'vue';
import ShareCard from './ShareCard.vue';

const props = defineProps<{
  result: any;
  rule: any;
  config: any;
}>();

const emit = defineEmits(['restart']);

const showShareCard = ref(false);

const shareData = computed(() => ({
  title: props.rule?.title || '测试结果',
  score: Math.round(props.result?.totalScore || 0),
  mbti: props.result?.mbti || '',
  description: props.rule?.description || ''
}));

const showRadar = computed(() => props.config.shareCard?.elements?.showRadar && props.result.dimensions);
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8 bg-white shadow-lg rounded-xl text-center">
    <!-- ... (rest of the template remains similar until the share button) ... -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-600 mb-2">{{ rule?.title }}</h1>
      <p class="text-gray-500">测试完成，以下是你的分析结果</p>
    </div>

    <div class="mb-10 text-left bg-gray-50 p-6 rounded-lg">
      <div class="prose max-w-none text-gray-700 leading-relaxed">
        {{ rule?.description }}
      </div>
    </div>

    <div v-if="result && result.totalScore !== undefined" class="mb-10">
      <div class="text-5xl font-black text-blue-600 mb-2">{{ Math.round(result.totalScore) }}</div>
      <div class="text-sm text-gray-400 uppercase tracking-widest font-semibold">最终得分</div>
    </div>

    <div v-if="result && result.mbti" class="mb-10">
      <div class="text-6xl font-black text-blue-600 mb-2">{{ result.mbti }}</div>
      <div class="text-sm text-gray-400 uppercase tracking-widest font-semibold">MBTI 类型</div>
    </div>

    <!-- 维度雷达图/柱状图占位 -->
    <div v-if="showRadar && result" class="mb-10 p-4 border rounded-lg bg-white">
      <div class="text-sm text-gray-500 mb-4">维度分析</div>
      <div class="flex justify-around items-end h-32 space-x-2">
        <div v-for="(score, key) in result.dimensions" :key="key" class="flex flex-col items-center flex-1">
          <div class="bg-blue-400 w-full rounded-t" :style="{ height: (score * 10) + '%' }"></div>
          <div class="text-xs mt-2 truncate w-full">{{ key }}</div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <button
        @click="emit('restart')"
        class="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
      >
        再测一次
      </button>
      <button
        @click="showShareCard = true"
        class="w-full py-4 bg-white text-blue-600 border border-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
      >
        分享结果
      </button>
    </div>

    <!-- 分享卡片弹窗 -->
    <ShareCard
      v-if="showShareCard"
      :data="shareData"
      @close="showShareCard = false"
    />
  </div>
</template>
