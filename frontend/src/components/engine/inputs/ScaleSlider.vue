<script setup lang="ts">
/**
 * ScaleSlider.vue
 * 量表/滑动条输入组件
 */

const props = defineProps<{
  min?: number;
  max?: number;
  step?: number;
  modelValue?: number;
  labels?: { [key: number]: string };
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const handleChange = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<template>
  <div class="py-6">
    <input
      type="range"
      :min="min || 1"
      :max="max || 5"
      :step="step || 1"
      :value="modelValue || min || 1"
      @input="handleChange"
      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
    <div class="flex justify-between mt-4 px-2 text-sm text-gray-600">
      <span v-for="n in (max || 5)" :key="n" class="text-center">
        {{ labels?.[n] || n }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滑动条样式 */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>
