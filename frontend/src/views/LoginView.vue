<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const password = ref('');
const isLoading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入账号和密码';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/admin/login', {
      username: username.value,
      password: password.value
    });

    if (response.data.success) {
      localStorage.setItem('admin_token', response.data.token);
      router.push('/admin');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '登录失败，请重试';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white p-8 shadow-xl rounded-2xl border border-gray-100">
      <div class="text-center mb-10">
        <div class="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
          <span class="text-3xl font-black">QA</span>
        </div>
        <h1 class="text-2xl font-black text-gray-800">管理后台登录</h1>
        <p class="text-gray-400 mt-2">请输入您的凭据以管理项目</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">账号</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入管理员账号"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入管理员密码"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
          />
          <p v-if="error" class="text-red-500 text-sm mt-3 font-medium">{{ error }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <span v-if="isLoading" class="animate-spin mr-2">
            <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ isLoading ? '验证中...' : '立即登录' }}
        </button>

        <div class="text-center">
          <button type="button" @click="router.push('/')" class="text-sm text-gray-400 hover:text-blue-600 transition-colors">返回首页</button>
        </div>
      </form>
    </div>
  </div>
</template>
