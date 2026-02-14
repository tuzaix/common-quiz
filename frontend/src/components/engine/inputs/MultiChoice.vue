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
  <div class="space-y-3">
    <button
      v-for="option in options"
      :key="option.id"
      @click="handleToggle(option)"
      class="w-full p-4 text-left border rounded-lg transition-all hover:border-blue-500 hover:bg-blue-50 flex justify-between items-center"
      :class="modelValue?.includes(option.value) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
    >
      <span>{{ option.label }}</span>
      <span v-if="modelValue?.includes(option.value)" class="text-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </button>
  </div>
</template>
