<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../../api';

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
const showGenerateModal = ref(false);

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
const copyStatus = ref<Record<string, boolean>>({});

// 分页逻辑
const currentPage = ref(1);
const pageSize = ref(10);

// 当筛选条件改变时，重置页码到第一页
const handleFilterChange = () => {
  currentPage.value = 1;
};

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

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredCards.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredCards.value.length / pageSize.value);
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
  return paginatedCards.value.length > 0 && paginatedCards.value.every(c => selectedCodes.value.includes(c.code));
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 仅取消当前页的选择
    const currentCodes = paginatedCards.value.map(c => c.code);
    selectedCodes.value = selectedCodes.value.filter(code => !currentCodes.includes(code));
  } else {
    // 将当前页未选中的加入
    const currentCodes = paginatedCards.value.map(c => c.code);
    const newSelected = [...selectedCodes.value];
    currentCodes.forEach(code => {
      if (!newSelected.includes(code)) {
        newSelected.push(code);
      }
    });
    selectedCodes.value = newSelected;
  }
};

const handleBatchDelete = async () => {
  if (!selectedCodes.value.length) return;
  
  if (!confirm(`确定要删除选中的 ${selectedCodes.value.length} 个卡密吗？此操作不可恢复。`)) {
    return;
  }

  try {
    await api.post('/api/cards/batch-delete', {
      codes: selectedCodes.value
    });
    selectedCodes.value = [];
    fetchCards();
  } catch (error) {
    console.error('Failed to delete cards:', error);
    alert('删除失败');
  }
};

const fetchCards = async () => {
  isLoading.value = true;
  try {
    const response = await api.get('/api/cards');
    cards.value = response.data;
  } catch (error) {
    console.error('Failed to fetch cards:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchProjects = async () => {
  try {
    const response = await api.get('/api/projects');
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
    await api.post('/api/cards/generate', generateForm.value);
    await fetchCards();
    showGenerateModal.value = false;
    alert('卡密生成成功');
  } catch (error) {
    alert('生成失败');
  } finally {
    isGenerating.value = false;
  }
};

const handleCopyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    copyStatus.value[code] = true;
    setTimeout(() => {
      delete copyStatus.value[code];
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    // 回退方案
    const input = document.createElement('input');
    input.value = code;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      copyStatus.value[code] = true;
      setTimeout(() => {
        delete copyStatus.value[code];
      }, 2000);
    } catch (e) {
      alert('复制失败，请手动复制');
    }
    document.body.removeChild(input);
  }
};

onMounted(() => {
  fetchCards();
  fetchProjects();
});
</script>

<template>
  <div class="space-y-6">
    <!-- 顶部操作栏 -->
    <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div class="flex items-center gap-4">
        <h3 class="font-bold text-gray-800">卡密管理</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">项目:</span>
          <select 
            v-model="filterProjectId"
            @change="handleFilterChange"
            class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[150px]"
          >
            <option value="">全部项目</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">状态:</span>
          <select 
            v-model="filterStatus"
            @change="handleFilterChange"
            class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">全部状态</option>
            <option value="unused">未使用</option>
            <option value="used">已使用</option>
          </select>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <button 
          v-if="selectedCodes.length > 0"
          @click="handleBatchDelete"
          class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors border border-red-100"
        >
          批量删除 ({{ selectedCodes.length }})
        </button>
        <button 
          @click="fetchCards"
          class="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-200"
        >
          刷新
        </button>
        <button 
          @click="showGenerateModal = true"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
        >
          <span class="text-lg">+</span> 批量生成
        </button>
      </div>
    </div>

    <!-- 卡密生成弹窗 -->
    <div v-if="showGenerateModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-800">批量生成卡密</h3>
          <button @click="showGenerateModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">选择项目</label>
            <select 
              v-model="generateForm.projectId"
              class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }} ({{ p.id }})</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">生成数量</label>
              <div class="relative">
                <input 
                  v-model.number="generateForm.count"
                  type="number"
                  min="1"
                  class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span class="absolute right-4 top-3.5 text-gray-400">个</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">设备限制</label>
              <div class="relative">
                <input 
                  v-model.number="generateForm.deviceLimit"
                  type="number"
                  min="1"
                  class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span class="absolute right-4 top-3.5 text-gray-400">台</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">有效天数 (0 为永久)</label>
            <div class="relative">
              <input 
                v-model.number="generateForm.validDays"
                type="number"
                min="0"
                class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="设置卡密激活后的有效期"
              />
              <span class="absolute right-4 top-3.5 text-gray-400">天</span>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            @click="showGenerateModal = false"
            class="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            @click="handleGenerate"
            :disabled="isGenerating || !generateForm.projectId"
            class="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
          >
            <div v-if="isGenerating" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ isGenerating ? '正在生成...' : '立即生成' }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 class="font-bold text-gray-800">卡密列表 ({{ filteredCards.length }})</h3>
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
          <tr v-for="card in paginatedCards" :key="card.code" class="hover:bg-gray-50">
            <td class="px-4 py-4">
              <input 
                type="checkbox" 
                v-model="selectedCodes" 
                :value="card.code"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td class="px-6 py-4">
              <div 
                class="flex items-center gap-2 group cursor-pointer"
                @click="handleCopyCode(card.code)"
                title="点击复制卡密"
              >
                <span class="font-mono font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {{ card.code }}
                </span>
                <div class="relative flex items-center">
                  <svg v-if="!copyStatus[card.code]" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  
                  <!-- 复制成功的浮动提示 -->
                  <transition name="fade">
                    <span 
                      v-if="copyStatus[card.code]" 
                      class="absolute left-6 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10"
                    >
                      已复制
                    </span>
                  </transition>
                </div>
              </div>
            </td>
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

      <!-- 分页控件 -->
      <div v-if="filteredCards.length > 0" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>共 {{ filteredCards.length }} 个卡密</span>
          <div class="flex items-center gap-2">
            <span>每页显示:</span>
            <select 
              v-model.number="pageSize"
              @change="currentPage = 1"
              class="px-2 py-1 border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            上一页
          </button>
          
          <div class="flex items-center gap-1">
            <template v-for="p in totalPages" :key="p">
              <button 
                v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)"
                @click="currentPage = p"
                :class="currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                class="w-8 h-8 border rounded-lg text-sm font-medium transition-colors"
              >
                {{ p }}
              </button>
              <span v-else-if="p === currentPage - 3 || p === currentPage + 3" class="text-gray-400">...</span>
            </template>
          </div>

          <button 
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-5px);
}
</style>
