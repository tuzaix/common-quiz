<script setup lang="ts">
/**
 * MultiChoice.vue
 * 多选题输入组件
 */

interface Option {
  id: string;
  label: string;
  value: number | string;
  dimensionKey?: string;
}

const props = defineProps<{
  options: Option[];
  modelValue?: (string | number)[];
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const selected = [...(props.modelValue || [])];

const handleToggle = (option: Option) => {
  const index = selected.indexOf(option.value);
  if (index > -1) {
    selected.splice(index, 1);
  } else {
    selected.push(option.value);
  }
  emit('update:modelValue', selected);
  emit('change', selected);
};
</script>

<template>
  <div class="grid grid-cols-1 gap-4">
    <button
      v-for="(option, index) in options"
      :key="option.id"
      @click="handleToggle(option)"
      class="group relative w-full p-5 text-left rounded-2xl transition-all duration-300 border-2 overflow-hidden active:scale-[0.98]"
      :class="modelValue?.includes(option.value) 
        ? 'border-pink-400 bg-pink-50/50 shadow-md shadow-pink-100' 
        : 'border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/20'"
    >
      <div class="flex items-center gap-4 relative z-10">
        <!-- 多选框样式 -->
        <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2"
          :class="modelValue?.includes(option.value) 
            ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-200 rotate-[360deg]' 
            : 'bg-gray-50 border-gray-100 text-gray-300 group-hover:border-pink-200 group-hover:text-pink-400'"
        >
          <svg v-if="modelValue?.includes(option.value)" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span v-else>{{ String.fromCharCode(65 + index) }}</span>
        </div>
        
        <span class="flex-1 text-lg font-medium transition-colors"
          :class="modelValue?.includes(option.value) ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'"
        >
          {{ option.label }}
        </span>

        <!-- 多选标记 -->
        <div class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-opacity"
          :class="modelValue?.includes(option.value) ? 'bg-pink-100 text-pink-600' : 'opacity-0'"
        >
          Selected
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
  </div>
</template>
