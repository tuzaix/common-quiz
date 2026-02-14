<script setup lang="ts">
/**
 * CardVerifyView.vue
 * 卡密验证页面
 */

import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const cardCode = ref('');
const isLoading = ref(false);
const error = ref('');

const verify = async () => {
  if (!cardCode.value) {
    error.value = '请输入卡密';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const projectId = route.query.projectId as string;
    const response = await axios.post('http://localhost:3000/api/verify-card', {
      cardCode: cardCode.value,
      projectId
    });

    if (response.data.success) {
      // 验证成功，将卡密存入本地存储或 Store
      localStorage.setItem(`card_${projectId}`, cardCode.value);
      // 跳转回测试页面
      router.push(`/quiz/${projectId}`);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '验证失败，请重试';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white p-8 shadow-xl rounded-2xl">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">需要验证</h1>
        <p class="text-gray-500 mt-2">此测试项目需要输入有效卡密才能继续</p>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">卡密代码</label>
          <input
            v-model="cardCode"
            type="text"
            placeholder="请输入您的 6 位或更多位卡密"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            @keyup.enter="verify"
          />
          <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
        </div>

        <button
          @click="verify"
          :disabled="isLoading"
          class="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center"
        >
          <span v-if="isLoading" class="animate-spin mr-2">
            <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ isLoading ? '验证中...' : '立即验证' }}
        </button>

        <div class="text-center">
          <button @click="router.push('/')" class="text-sm text-gray-500 hover:text-blue-600">返回首页</button>
        </div>
      </div>

      <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p class="text-xs text-blue-700 leading-relaxed">
          <strong>温馨提示：</strong><br />
          卡密通常由测试发起者提供。如果您没有卡密，请联系管理员或从指定渠道获取。 (演示卡密：123456)
        </p>
      </div>
    </div>
  </div>
</template>
