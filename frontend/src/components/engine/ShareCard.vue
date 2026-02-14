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
    // 背景渐变感
    { type: 'rect', x: 0, y: 0, width: 750, height: 1000, color: '#fff5f5' },
    // 顶部装饰块
    { type: 'rect', x: 0, y: 0, width: 750, height: 300, color: '#ffe4e6' },
    // 主白卡片
    { type: 'rect', x: 40, y: 150, width: 670, height: 800, color: '#ffffff', borderRadius: 40 },
    // 标题
    { type: 'text', content: '✨ 测评报告', x: 80, y: 230, fontSize: 32, color: '#fb7185' },
    { type: 'text', content: '{title}', x: 80, y: 320, fontSize: 56, color: '#1f2937', fontWeight: 'bold' },
    // 分隔线
    { type: 'rect', x: 80, y: 380, width: 100, height: 6, color: '#fb7185', borderRadius: 3 },
    // 得分/MBTI 展示
    { type: 'text', content: '我的专属特质：', x: 80, y: 480, fontSize: 36, color: '#9ca3af' },
    { type: 'text', content: '{mbti}', x: 80, y: 600, fontSize: 120, color: '#fb7185', fontWeight: 'bold' },
    { type: 'text', content: '评分：{score}', x: 80, y: 720, fontSize: 48, color: '#4b5563' },
    // 底部引导
    { type: 'text', content: '扫码或搜索「测评中心」解锁你的灵魂类型', x: 80, y: 880, fontSize: 24, color: '#9ca3af' },
    { type: 'text', content: '长按保存图片，分享给懂你的人', x: 80, y: 920, fontSize: 20, color: '#d1d5db' }
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
      <div class="p-4 border-b flex justify-between items-center bg-rose-50/30">
        <h3 class="font-bold text-gray-800 flex items-center gap-2">
          <span class="text-rose-500">✨</span> 生成我的分享卡片
        </h3>
        <button @click="emit('close')" class="p-1 hover:bg-rose-100 rounded-full transition-colors text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-8 flex flex-col items-center">
        <div v-if="isGenerating" class="h-96 flex flex-col items-center justify-center gap-4">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 rounded-full border-4 border-rose-100"></div>
            <div class="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
          </div>
          <p class="text-rose-400 font-medium animate-pulse">正在为您生成艺术卡片...</p>
        </div>
        <div v-else class="relative group">
          <img :src="imageBase64" class="max-h-[65vh] shadow-2xl rounded-2xl mb-8 border-4 border-white transition-transform duration-500 group-hover:scale-[1.02]" alt="Share Card" />
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black text-white text-xs font-bold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            长按图片可直接保存
          </div>
        </div>
        
        <div class="w-full space-y-4">
          <button
            @click="download"
            :disabled="isGenerating"
            class="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-rose-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            保存到手机相册
          </button>
          
          <div class="flex items-center justify-center gap-2 text-gray-400">
            <div class="h-[1px] flex-1 bg-gray-100"></div>
            <span class="text-[10px] uppercase tracking-widest font-bold">分享到</span>
            <div class="h-[1px] flex-1 bg-gray-100"></div>
          </div>

          <div class="flex justify-center gap-8">
            <div class="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer">
              <div class="w-12 h-12 rounded-2xl bg-[#ff2442] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-red-100">小</div>
              <span class="text-[10px] text-gray-500 font-medium">小红书</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer">
              <div class="w-12 h-12 rounded-2xl bg-[#07c160] flex items-center justify-center text-white p-2.5 shadow-md shadow-green-100">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.225 3.1c-4.47 0-8.1 3.32-8.1 7.42 0 2.22 1.05 4.22 2.7 5.62l-.68 2.52 2.38-1.25c.53.15 1.1.23 1.7.23 4.47 0 8.1-3.32 8.1-7.42 0-4.1-3.63-7.42-8.1-7.42zm4.35 6.02c-.3 0-.55-.25-.55-.55s.25-.55.55-.55.55.25.55.55-.25.55-.55.55zm-3.2 0c-.3 0-.55-.25-.55-.55s.25-.55.55-.55.55.25.55.55-.25.55-.55.55zM19.05 13.7c-.23 0-.45-.02-.68-.05-.4.85-.92 1.63-1.55 2.3.4.15.82.25 1.25.25.45 0 .88-.1 1.28-.28l1.78.93-.5-1.88c1.23-1.05 2.02-2.55 2.02-4.22 0-3.08-2.72-5.58-6.08-5.58-.33 0-.65.03-.98.08.73.98 1.18 2.18 1.18 3.48 0 3.32-2.92 6.02-6.52 6.02l-1.2-.12z"/></svg>
              </div>
              <span class="text-[10px] text-gray-500 font-medium">朋友圈</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer">
              <div class="w-12 h-12 rounded-2xl bg-[#2b85e4] flex items-center justify-center text-white p-2.5 shadow-md shadow-blue-100">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.31.26 2.56.73 3.71l-1.7 4.29 4.29-1.7c1.15.47 2.4.73 3.71.73 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
              </div>
              <span class="text-[10px] text-gray-500 font-medium">微信群</span>
            </div>
          </div>
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
