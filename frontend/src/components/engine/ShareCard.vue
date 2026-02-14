<script setup lang="ts">
/**
 * ShareCard.vue
 * 分享卡片展示与下载组件
 */

import { ref, onMounted } from 'vue';
import { CanvasRenderer, type Layer } from '../../services/CanvasRenderer';

const props = defineProps<{
  data: Record<string, any>;
  layout?: {
    width: number;
    height: number;
    layers: Layer[];
  };
}>();

const emit = defineEmits(['close']);

const imageBase64 = ref('');
const isGenerating = ref(true);

const defaultLayout: { width: number, height: number, layers: Layer[] } = {
  width: 750,
  height: 1000,
  layers: [
    { type: 'rect', x: 0, y: 0, width: 750, height: 1000, color: '#f3f4f6' },
    { type: 'rect', x: 50, y: 50, width: 650, height: 900, color: '#ffffff', borderRadius: 20 },
    { type: 'text', content: '测试结果分析', x: 100, y: 150, fontSize: 48, color: '#1f2937' },
    { type: 'text', content: '{title}', x: 100, y: 250, fontSize: 64, color: '#2563eb' },
    { type: 'text', content: '得分: {score}', x: 100, y: 400, fontSize: 36, color: '#4b5563' },
    { type: 'text', content: '长按或右键保存图片分享', x: 100, y: 900, fontSize: 24, color: '#9ca3af' }
  ]
};

onMounted(async () => {
  const layout = props.layout || defaultLayout;
  const renderer = new CanvasRenderer(layout.width, layout.height);
  try {
    imageBase64.value = await renderer.render(layout.layers, props.data);
  } catch (err) {
    console.error('Failed to generate share card:', err);
  } finally {
    isGenerating.value = false;
  }
});

const download = () => {
  const link = document.createElement('a');
  link.download = `result-${Date.now()}.png`;
  link.href = imageBase64.value;
  link.click();
};
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="font-bold text-gray-800">生成分享卡片</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6 flex flex-col items-center">
        <div v-if="isGenerating" class="h-96 flex items-center justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <img v-else :src="imageBase64" class="max-h-[60vh] shadow-lg rounded-lg mb-6" alt="Share Card" />
        
        <div class="w-full space-y-3">
          <button
            @click="download"
            :disabled="isGenerating"
            class="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            保存到相册
          </button>
          <p class="text-center text-xs text-gray-400">在微信中可长按图片直接发送给朋友</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
