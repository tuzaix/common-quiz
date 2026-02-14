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
  <div class="space-y-3">
    <button
      v-for="option in options"
      :key="option.id"
      @click="handleSelect(option)"
      class="w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 hover:bg-blue-50"
      :class="modelValue === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
    >
      {{ option.label }}
    </button>
  </div>
</template>
