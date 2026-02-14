<script setup lang="ts">
import { computed } from 'vue';

/**
 * ScaleSlider.vue
 * 量表/滑动条输入组件 - 优雅玫瑰粉色系
 */

const props = defineProps<{
  min?: number;
  max?: number;
  step?: number;
  modelValue?: number;
  labels?: { [key: number]: string };
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const range = computed(() => {
  const min = props.min || 1;
  const max = props.max || 5;
  const step = props.step || 1;
  return Math.floor((max - min) / step) + 1;
});

const bubblePosition = computed(() => {
  const min = props.min || 1;
  const max = props.max || 5;
  const val = props.modelValue || min;
  return ((val - min) / (max - min)) * 100;
});

const handleChange = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<template>
  <div class="py-8 px-4">
    <div class="relative mb-12">
      <!-- 背景刻度线 -->
      <div class="absolute top-1/2 left-0 w-full h-1 bg-rose-100 rounded-full -translate-y-1/2 -z-10"></div>
      
      <!-- 刻度点 -->
      <div class="absolute top-1/2 left-0 w-full flex justify-between px-0.5 -translate-y-1/2 -z-10">
        <div 
          v-for="n in range" 
          :key="n" 
          class="w-1.5 h-1.5 rounded-full"
          :class="(modelValue || min || 1) >= (min || 1) + (n - 1) * (step || 1) ? 'bg-rose-300' : 'bg-rose-100'"
        ></div>
      </div>

      <input
        type="range"
        :min="min || 1"
        :max="max || 5"
        :step="step || 1"
        :value="modelValue || min || 1"
        @input="handleChange"
        class="custom-range w-full h-2 bg-transparent appearance-none cursor-pointer"
      />

      <!-- 当前值提示气泡 -->
      <div 
        class="absolute -top-10 left-0 transition-all duration-200 pointer-events-none"
        :style="{ left: bubblePosition + '%' }"
      >
        <div class="relative -left-1/2 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-rose-200 flex items-center justify-center min-w-[32px]">
          {{ labels?.[modelValue || min || 1] || (modelValue || min || 1) }}
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-500 rotate-45"></div>
        </div>
      </div>
    </div>

    <!-- 底部标签 -->
    <div class="flex justify-between px-1">
      <div 
        v-for="n in range" 
        :key="n" 
        class="flex flex-col items-center"
        :style="{ width: (100 / (range - 1)) + '%' }"
      >
        <span 
          class="text-xs font-medium transition-colors duration-300 text-center px-1"
          :class="(modelValue || min || 1) === (min || 1) + (n - 1) * (step || 1) 
            ? 'text-rose-600 font-bold scale-110' 
            : 'text-gray-400'"
        >
          {{ labels?.[(min || 1) + (n - 1) * (step || 1)] || ((min || 1) + (n - 1) * (step || 1)) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-range::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: transparent;
}

.custom-range::-webkit-slider-thumb {
  height: 28px;
  width: 28px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -10px;
  border: 3px solid #f43f5e; /* rose-500 */
  box-shadow: 0 4px 10px rgba(244, 63, 94, 0.3);
  transition: all 0.2s ease;
}

.custom-range:active::-webkit-slider-thumb {
  transform: scale(1.15);
  box-shadow: 0 6px 15px rgba(244, 63, 94, 0.4);
}

/* Firefox */
.custom-range::-moz-range-thumb {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: 3px solid #f43f5e;
  box-shadow: 0 4px 10px rgba(244, 63, 94, 0.3);
}

/* IE/Edge */
.custom-range::-ms-thumb {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: 3px solid #f43f5e;
}
</style>
