<script setup lang="ts">
/**
 * CardVerifyModal.vue
 * 卡密验证弹窗组件
 */

import { ref } from 'vue';
import axios from 'axios';

const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits(['verified', 'cancel']);

const cardCode = ref('');
const isLoading = ref(false);
const error = ref('');

const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

const verify = async () => {
  if (!cardCode.value) {
    error.value = '请输入卡密';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/verify-card', {
      cardCode: cardCode.value,
      projectId: props.projectId,
      deviceId: getDeviceId()
    });

    if (response.data.success) {
      // 验证成功，将卡密存入本地存储
      localStorage.setItem(`card_${props.projectId}`, cardCode.value);
      emit('verified');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '验证失败，请重试';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div class="max-w-md w-full bg-white p-8 shadow-2xl rounded-3xl border border-rose-100 animate-scale-in">
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-black text-gray-800">解锁测试报告</h1>
        <p class="text-gray-500 mt-2">请输入有效卡密以查看您的专属测评结果</p>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2 px-1">卡密代码</label>
          <input
            v-model="cardCode"
            type="text"
            placeholder="请输入您的 6 位或更多位卡密"
            class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 focus:bg-white outline-none transition-all text-lg font-medium placeholder:text-gray-300"
            @keyup.enter="verify"
            autofocus
          />
          <p v-if="error" class="text-rose-500 text-sm mt-3 px-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <button
            @click="verify"
            :disabled="isLoading"
            class="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-rose-200 flex items-center justify-center text-lg disabled:opacity-70 disabled:hover:scale-100"
          >
            <span v-if="isLoading" class="animate-spin mr-3">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isLoading ? '正在验证...' : '立即解锁报告' }}
          </button>
          
          <button @click="emit('cancel')" class="py-2 text-sm text-gray-400 hover:text-rose-400 transition-colors">
            暂不查看，返回首页
          </button>
        </div>
      </div>

      <div class="mt-8 p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50">
        <p class="text-xs text-rose-700 leading-relaxed flex gap-2">
          <span class="shrink-0 text-rose-400">💡</span>
          <span>
            <strong>温馨提示：</strong><br />
            卡密通常由测试发起者提供。如果您没有卡密，请联系管理员或从指定渠道获取。(演示卡密：123456)
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
