<script setup lang="ts">
/**
 * ShareCard.vue
 * 分享卡片展示与下载组件
 */

import { ref, onMounted } from 'vue';
import api, { resolveUrl } from '../../api';
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
    { type: 'text', content: 'PERSONALITY REPORT', x: 375, y: 90, fontSize: 24, color: '#fb7185', fontWeight: '900', textAlign: 'center' },
    { type: 'text', content: '✨ 【{projectTitle}】 ✨', x: 375, y: 155, fontSize: 32, color: '#4b5563', fontWeight: 'bold', textAlign: 'center' },
    
    // 6. 结果等级/标题
    { type: 'text', content: '{title}', x: 375, y: 240, fontSize: 50, color: '#fb7185', fontWeight: 'bold', textAlign: 'center' },
    
    // 7. 装饰线
    { type: 'line', x: 225, y: 335, width: 300, height: 4, color: '#fecdd3' },

    // 9. MBTI/核心结果 (超大字体)
    { 
      type: 'text', content: '{mbti}', x: 375, y: 440, fontSize: 130, color: '#f43f5e', fontWeight: 'bold', textAlign: 'center',
      shadow: { color: 'rgba(244, 63, 94, 0.2)', blur: 20, offsetX: 0, offsetY: 10 }
    },
    
    // 10. 综合评分 - 突出重点
    { 
      type: 'rect', x: 275, y: 370, width: 200, height: 40, color: '#fff1f2', borderRadius: 20 
    },
    { 
      type: 'text', content: '综合评分', x: 375, y: 380, fontSize: 24, color: '#fb7185', fontWeight: 'bold', textAlign: 'center' 
    },
    { 
      type: 'text', content: '{score}', x: 375, y: 450, fontSize: 130, color: '#fb7185', fontWeight: '900', textAlign: 'center',
      shadow: { color: 'rgba(244, 63, 94, 0.15)', blur: 10, offsetX: 0, offsetY: 5 }
    },
    
    // 11. 寄语/描述
    { type: 'text', content: '每一份特质，都是独一无二的光 ✨', x: 375, y: 600, fontSize: 28, color: '#6b7280', textAlign: 'center' },
    
    // 12. 底部引导区
    { type: 'line', x: 100, y: 665, width: 550, height: 2, color: '#f3f4f6' },
    
    // 二维码占位/品牌区域
    { type: 'rect', x: 100, y: 680, width: 100, height: 100, color: '#f9fafb', borderRadius: 15 },
    { type: 'text', content: '长按扫码解锁你的灵魂', x: 210, y: 695, fontSize: 28, color: '#4b5563', fontWeight: 'bold' },
    { type: 'text', content: '探索更多精准有趣的心理测评', x: 210, y: 735, fontSize: 24, color: '#9ca3af' },
    
    // 品牌标识
    // { type: 'text', content: '@测评中心', x: 650, y: 732, fontSize: 22, color: '#fb7185', fontWeight: 'bold', textAlign: 'right' }
  ]
};

onMounted(async () => {
  const layout = JSON.parse(JSON.stringify(props.layout || defaultLayout));
  
  // 获取系统配置中的二维码
  try {
    const settingsRes = await api.get('/api/settings');
    const qrcodeUrl = settingsRes.data.qrcodeUrl;
    
    if (qrcodeUrl) {
      // 查找二维码图层（目前是占位矩形）
      // 我们的 defaultLayout 中，二维码相关的是 y: 680 的 rect
      const qrcodeLayerIndex = layout.layers.findIndex((l: any) => l.x === 100 && l.y === 680 && l.width === 100);
      if (qrcodeLayerIndex !== -1) {
        // 替换为图片图层
        layout.layers[qrcodeLayerIndex] = {
          type: 'image',
          content: resolveUrl(qrcodeUrl),
          x: 100,
          y: 680,
          width: 100,
          height: 100,
          borderRadius: 15
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch settings for QR code, using placeholder:', err);
  }

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
