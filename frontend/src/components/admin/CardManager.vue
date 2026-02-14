<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

interface Card {
  code: string;
  projectId: string;
  status: 'unused' | 'used';
  createdAt: string;
  usedAt?: string;
  validDays?: number;
  deviceLimit?: number;
  usedDevices?: string[];
}

interface Project {
  id: string;
  title: string;
}

const props = defineProps<{
  initialProjectId?: string;
}>();

const cards = ref<Card[]>([]);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const isGenerating = ref(false);

const generateForm = ref({
  projectId: '',
  count: 10,
  validDays: 3,
  deviceLimit: 3
});

const filterProjectId = ref(props.initialProjectId || '');
const filterStatus = ref('');
const sortBy = ref('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');
const selectedCodes = ref<string[]>([]);

const filteredCards = computed(() => {
  const result = cards.value.filter(card => {
    const projectMatch = !filterProjectId.value || card.projectId === filterProjectId.value;
    const statusMatch = !filterStatus.value || card.status === filterStatus.value;
    return projectMatch && statusMatch;
  });

  // 排序逻辑
  return result.sort((a, b) => {
    const factor = sortOrder.value === 'asc' ? 1 : -1;
    if (sortBy.value === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
    }
    return 0;
  });
});

const toggleSort = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'desc';
  }
};

const isAllSelected = computed(() => {
  return filteredCards.value.length > 0 && selectedCodes.value.length === filteredCards.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedCodes.value = [];
  } else {
    selectedCodes.value = filteredCards.value.map(c => c.code);
  }
};

const handleBatchDelete = async () => {
  if (selectedCodes.value.length === 0) return;
  if (!confirm(`确定要删除选中的 ${selectedCodes.value.length} 个卡密吗？`)) return;

  try {
    await axios.post('http://localhost:3000/api/cards/batch-delete', {
      codes: selectedCodes.value
    });
    await fetchCards();
    selectedCodes.value = [];
    alert('删除成功');
  } catch (error) {
    alert('删除失败');
  }
};

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
    
    // 优先使用传入的 ID，否则使用列表第一个
    if (props.initialProjectId) {
      generateForm.value.projectId = props.initialProjectId;
    } else if (projects.value.length > 0) {
      generateForm.value.projectId = projects.value[0]?.id || '';
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
          <div class="relative">
            <input 
              v-model.number="generateForm.count"
              type="number"
              min="1"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span class="absolute right-3 top-2 text-gray-400 text-sm">个</span>
          </div>
        </div>
        <div class="w-32">
          <label class="block text-sm font-medium text-gray-700 mb-1">有效天数</label>
          <div class="relative">
            <input 
              v-model.number="generateForm.validDays"
              type="number"
              min="0"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0为永久"
            />
            <span class="absolute right-3 top-2 text-gray-400 text-sm">天</span>
          </div>
        </div>
        <div class="w-32">
          <label class="block text-sm font-medium text-gray-700 mb-1">设备限制</label>
          <div class="relative">
            <input 
              v-model.number="generateForm.deviceLimit"
              type="number"
              min="1"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span class="absolute right-3 top-2 text-gray-400 text-sm">台</span>
          </div>
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
        <h3 class="font-bold text-gray-800">卡密列表 ({{ filteredCards.length }})</h3>
        <div class="flex items-center gap-4">
          <div v-if="selectedCodes.length > 0" class="flex items-center gap-2 pr-4 border-r border-gray-200">
            <span class="text-sm text-gray-600">已选 {{ selectedCodes.length }} 项</span>
            <button 
              @click="handleBatchDelete"
              class="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
            >
              批量删除
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">状态:</span>
            <select 
              v-model="filterStatus"
              class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">全部状态</option>
              <option value="unused">未使用</option>
              <option value="used">已使用</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">项目:</span>
            <select 
              v-model="filterProjectId"
              class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">全部项目</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <button @click="fetchCards" class="text-sm text-blue-600 hover:underline">刷新列表</button>
        </div>
      </div>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 text-sm uppercase">
          <tr>
            <th class="px-4 py-3 w-10">
              <input 
                type="checkbox" 
                :checked="isAllSelected" 
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th class="px-6 py-3 font-medium">卡密</th>
            <th class="px-6 py-3 font-medium">所属项目</th>
            <th class="px-6 py-3 font-medium">状态</th>
            <th class="px-6 py-3 font-medium">有效期/设备</th>
            <th 
              class="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
              @click="toggleSort('createdAt')"
            >
              <div class="flex items-center gap-1">
                生成时间
                <span class="flex flex-col text-[10px] leading-[1]">
                  <span :class="sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-300'">▲</span>
                  <span :class="sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-300'">▼</span>
                </span>
              </div>
            </th>
            <th class="px-6 py-3 font-medium">使用记录</th>
            <th class="px-6 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="card in filteredCards" :key="card.code" class="hover:bg-gray-50">
            <td class="px-4 py-4">
              <input 
                type="checkbox" 
                v-model="selectedCodes" 
                :value="card.code"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
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
            <td class="px-6 py-4 text-sm text-gray-600">
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                  <span class="text-xs text-gray-400">有效:</span>
                  <span>{{ card.validDays ? `${card.validDays}天` : '永久' }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-xs text-gray-400">设备:</span>
                  <span>{{ card.usedDevices?.length || 0 }}/{{ card.deviceLimit || 1 }}</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-400">{{ new Date(card.createdAt).toLocaleString() }}</td>
            <td class="px-6 py-4 text-sm text-gray-400">
              <div v-if="card.usedAt" class="space-y-1">
                <div>{{ new Date(card.usedAt).toLocaleString() }}</div>
                <div v-if="card.usedDevices?.length" class="text-xs text-blue-500 truncate w-32" :title="card.usedDevices.join(', ')">
                  ID: {{ card.usedDevices[0] }}...
                </div>
              </div>
              <span v-else>-</span>
            </td>
            <td class="px-6 py-4 text-right">
              <button 
                @click="selectedCodes = [card.code]; handleBatchDelete()"
                class="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="filteredCards.length === 0">
            <td colspan="8" class="px-6 py-12 text-center text-gray-400">暂无卡密数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
