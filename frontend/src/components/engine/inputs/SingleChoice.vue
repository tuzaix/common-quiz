<script setup lang="ts">
/**
 * SingleChoice.vue
 * 单选题输入组件
 */

interface Option {
  id: string;
  label: string;
  value: number | string;
  dimensionKey?: string;
}

const props = defineProps<{
  options: Option[];
  modelValue?: string | number;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const handleSelect = (option: Option) => {
  emit('update:modelValue', option.value);
  emit('change', option);
};
</script>

<template>
  <div class="grid grid-cols-1 gap-4">
    <button
      v-for="(option, index) in options"
      :key="option.id"
      @click="handleSelect(option)"
      class="group relative w-full p-5 text-left rounded-2xl transition-all duration-300 border-2 overflow-hidden active:scale-[0.98]"
      :class="modelValue === option.value 
        ? 'border-rose-400 bg-rose-50/50 shadow-md shadow-rose-100' 
        : 'border-gray-100 bg-white hover:border-rose-200 hover:bg-rose-50/20'"
    >
      <div class="flex items-center gap-4 relative z-10">
        <!-- 选项索引 A, B, C... -->
        <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors"
          :class="modelValue === option.value 
            ? 'bg-rose-500 text-white' 
            : 'bg-gray-100 text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-500'"
        >
          {{ String.fromCharCode(65 + index) }}
        </div>
        
        <span class="flex-1 text-lg font-medium transition-colors"
          :class="modelValue === option.value ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'"
        >
          {{ option.label }}
        </span>

        <!-- 选中状态图标 -->
        <div class="transition-all duration-300 transform"
          :class="modelValue === option.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
        >
          <div class="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-sm shadow-rose-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
  </div>
</template>
