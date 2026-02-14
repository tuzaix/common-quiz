<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Card {
  code: string;
  projectId: string;
  status: 'unused' | 'used';
  createdAt: string;
  usedAt?: string;
}

interface Project {
  id: string;
  title: string;
}

const cards = ref<Card[]>([]);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const isGenerating = ref(false);

const generateForm = ref({
  projectId: '',
  count: 10
});

const fetchCards = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/cards');
    cards.value = response.data;
  } catch (error) {
    console.error('Failed to fetch cards:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchProjects = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/projects');
    projects.value = response.data;
    if (projects.value.length > 0) {
      generateForm.value.projectId = projects.value[0].id;
    }
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
};

const handleGenerate = async () => {
  if (!generateForm.value.projectId) return;
  isGenerating.value = true;
  try {
    await axios.post('http://localhost:3000/api/cards/generate', generateForm.value);
    await fetchCards();
    alert('卡密生成成功');
  } catch (error) {
    alert('生成失败');
  } finally {
    isGenerating.value = false;
  }
};

onMounted(() => {
  fetchCards();
  fetchProjects();
});
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 class="text-lg font-bold text-gray-800 mb-4">批量生成卡密</h3>
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">选择项目</label>
          <select 
            v-model="generateForm.projectId"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }} ({{ p.id }})</option>
          </select>
        </div>
        <div class="w-32">
          <label class="block text-sm font-medium text-gray-700 mb-1">生成数量</label>
          <input 
            v-model.number="generateForm.count"
            type="number"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button 
          @click="handleGenerate"
          :disabled="isGenerating"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300"
        >
          {{ isGenerating ? '生成中...' : '立即生成' }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 class="font-bold text-gray-800">卡密列表 ({{ cards.length }})</h3>
        <button @click="fetchCards" class="text-sm text-blue-600 hover:underline">刷新列表</button>
      </div>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 text-sm uppercase">
          <tr>
            <th class="px-6 py-3 font-medium">卡密</th>
            <th class="px-6 py-3 font-medium">所属项目</th>
            <th class="px-6 py-3 font-medium">状态</th>
            <th class="px-6 py-3 font-medium">生成时间</th>
            <th class="px-6 py-3 font-medium">使用时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="card in cards" :key="card.code" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-mono font-bold text-blue-600">{{ card.code }}</td>
            <td class="px-6 py-4 text-gray-600">{{ card.projectId }}</td>
            <td class="px-6 py-4">
              <span 
                :class="card.status === 'unused' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded text-xs font-bold"
              >
                {{ card.status === 'unused' ? '未使用' : '已使用' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-400">{{ new Date(card.createdAt).toLocaleString() }}</td>
            <td class="px-6 py-4 text-sm text-gray-400">{{ card.usedAt ? new Date(card.usedAt).toLocaleString() : '-' }}</td>
          </tr>
          <tr v-if="cards.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-gray-400">暂无卡密数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
