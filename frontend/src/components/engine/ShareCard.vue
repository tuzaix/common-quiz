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
  height: 850,
  layers: [
    // 1. 全局背景渐变
    { 
      type: 'rect', x: 0, y: 0, width: 750, height: 850, 
      gradient: { colors: ['#fff1f2', '#ffe4e6', '#fecdd3'], direction: 'vertical' } 
    },
    // 2. 装饰性背景圆 (左下角)
    { type: 'circle', x: 0, y: 850, width: 400, color: '#fda4af', opacity: 0.3 },
    
    // 3. 主卡片容器 (白色背景)
    { 
      type: 'rect', x: 50, y: 40, width: 650, height: 770, color: '#ffffff', borderRadius: 40,
      shadow: { color: 'rgba(251, 113, 133, 0.15)', blur: 30, offsetX: 0, offsetY: 15 }
    },
    // 4. 卡片底部阴影增强
    { type: 'rect', x: 80, y: 790, width: 590, height: 20, color: '#fda4af', borderRadius: 10, opacity: 0.2 },

    // 5. 标题区域
    { type: 'text', content: 'PERSONALITY REPORT', x: 375, y: 100, fontSize: 24, color: '#fb7185', fontWeight: '900', textAlign: 'center' },
    { type: 'text', content: '✨ 专属测评报告 ✨', x: 375, y: 150, fontSize: 36, color: '#4b5563', fontWeight: 'bold', textAlign: 'center' },
    
    // 6. 用户标题 (比如：你是哪种职场性格？)
    { type: 'text', content: '{title}', x: 375, y: 220, fontSize: 52, color: '#1f2937', fontWeight: 'bold', textAlign: 'center' },
    
    // 7. 装饰线
    { type: 'line', x: 225, y: 310, width: 300, height: 4, color: '#fecdd3' },
    
    // 8. 核心特质展示
    { type: 'text', content: '我的核心特质', x: 375, y: 340, fontSize: 32, color: '#9ca3af', textAlign: 'center' },
    
    // 9. MBTI/核心结果 (超大字体)
    { 
      type: 'text', content: '{mbti}', x: 375, y: 410, fontSize: 130, color: '#f43f5e', fontWeight: 'bold', textAlign: 'center',
      shadow: { color: 'rgba(244, 63, 94, 0.2)', blur: 20, offsetX: 0, offsetY: 10 }
    },
    
    // 10. 综合评分 - 突出重点
    { 
      type: 'rect', x: 275, y: 410, width: 200, height: 40, color: '#fff1f2', borderRadius: 20 
    },
    { 
      type: 'text', content: '综合评分', x: 375, y: 418, fontSize: 24, color: '#fb7185', fontWeight: 'bold', textAlign: 'center' 
    },
    { 
      type: 'text', content: '{score}', x: 375, y: 480, fontSize: 110, color: '#fb7185', fontWeight: '900', textAlign: 'center',
      shadow: { color: 'rgba(244, 63, 94, 0.15)', blur: 10, offsetX: 0, offsetY: 5 }
    },
    
    // 11. 寄语/描述
    { type: 'text', content: '每一份特质，都是独一无二的光 ✨', x: 375, y: 620, fontSize: 28, color: '#6b7280', textAlign: 'center' },
    
    // 12. 底部引导区
    { type: 'line', x: 100, y: 680, width: 550, height: 2, color: '#f3f4f6' },
    
    // 二维码占位/品牌区域
    { type: 'rect', x: 100, y: 700, width: 90, height: 90, color: '#f9fafb', borderRadius: 15 },
    { type: 'text', content: '长按扫码解锁你的灵魂', x: 210, y: 720, fontSize: 26, color: '#4b5563', fontWeight: 'bold' },
    { type: 'text', content: '探索更多精准有趣的心理测评', x: 210, y: 760, fontSize: 22, color: '#9ca3af' },
    
    // 品牌标识
    { type: 'text', content: '@测评中心', x: 650, y: 760, fontSize: 22, color: '#fb7185', fontWeight: 'bold', textAlign: 'right' }
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
