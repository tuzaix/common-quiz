<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import ProjectEditor from '../components/admin/ProjectEditor.vue';
import CardManager from '../components/admin/CardManager.vue';

interface Project {
  id: string;
  title: string;
  access: string;
  status: string;
  createdAt: string;
}

const projects = ref<Project[]>([]);
const isLoading = ref(true);

// 筛选状态
const filterStatus = ref('');
const filterAccess = ref('');

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50];

const filteredProjects = computed(() => {
  let list = [...projects.value];
  
  if (filterStatus.value) {
    list = list.filter(p => p.status === filterStatus.value);
  }
  
  if (filterAccess.value) {
    list = list.filter(p => p.access === filterAccess.value);
  }
  
  return list;
});

const sortedProjects = computed(() => {
  return [...filteredProjects.value].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const totalPages = computed(() => Math.ceil(sortedProjects.value.length / pageSize.value));

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedProjects.value.slice(start, end);
});

const handleFilterChange = () => {
  currentPage.value = 1;
};

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

const showCreateModal = ref(false);
const showImportModal = ref(false);
const editingProjectId = ref<string | null>(null);
const managingCardProjectId = ref<string | null>(null);

const handleManageCards = (projectId: string) => {
  managingCardProjectId.value = projectId;
  currentView.value = 'cards';
};

const newProject = ref({
  id: '',
  title: ''
});

const importData = ref({
  config: '',
  questions: ''
});

const currentView = ref('projects'); // projects, cards, stats, settings
const statsData = ref<any>(null);

// 系统设置相关状态
const settings = ref({
  siteName: '',
  siteDescription: '',
  contactEmail: '',
  cardDefaultValidDays: 3,
  cardDefaultDeviceLimit: 3,
  shareTitle: '',
  shareDescription: '',
  qrcodeUrl: ''
});
const isSavingSettings = ref(false);
const isUploading = ref(false);

const handleUploadQrcode = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  const formData = new FormData();
  if (file) formData.append('file', file);
  
  isUploading.value = true;
  try {
    const response = await axios.post('http://localhost:3000/api/settings/upload-qrcode', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    settings.value.qrcodeUrl = response.data.url;
  } catch (error) {
    console.error('Failed to upload QR code:', error);
    alert('上传失败');
  } finally {
    isUploading.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/settings');
    settings.value = response.data;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }
};

const handleSaveSettings = async () => {
  isSavingSettings.value = true;
  try {
    await axios.post('http://localhost:3000/api/settings', settings.value);
    alert('系统设置已保存');
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('保存设置失败');
  } finally {
    isSavingSettings.value = false;
  }
};

// 统计页分页相关状态
const statsCurrentPage = ref(1);
const statsPageSize = ref(10);

const paginatedProjectStats = computed(() => {
  if (!statsData.value?.projectStats) return [];
  const start = (statsCurrentPage.value - 1) * statsPageSize.value;
  const end = start + statsPageSize.value;
  return statsData.value.projectStats.slice(start, end);
});

const statsTotalPages = computed(() => {
  if (!statsData.value?.projectStats) return 0;
  return Math.ceil(statsData.value.projectStats.length / statsPageSize.value);
});

const handleStatsPageChange = (page: number) => {
  if (page < 1 || page > statsTotalPages.value) return;
  statsCurrentPage.value = page;
};

const handleStatsPageSizeChange = () => {
  statsCurrentPage.value = 1;
};

const fetchStats = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/stats/overview');
    statsData.value = response.data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/projects');
    projects.value = response.data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleCreateProject = async () => {
  if (!newProject.value.id || !newProject.value.title) return;
  
  try {
    await axios.post('http://localhost:3000/api/projects', newProject.value);
    showCreateModal.value = false;
    newProject.value = { id: '', title: '' };
    await fetchProjects();
  } catch (error: any) {
    alert(error.response?.data?.error || '创建项目失败');
  }
};

const handleImportProject = async () => {
  if (!importData.value.config || !importData.value.questions) {
    alert('请填写完整的配置和题目 JSON');
    return;
  }
  
  try {
    const config = JSON.parse(importData.value.config);
    const questions = JSON.parse(importData.value.questions);
    
    await axios.post('http://localhost:3000/api/projects/import', { config, questions });
    showImportModal.value = false;
    importData.value = { config: '', questions: '' };
    await fetchProjects();
    alert('项目导入成功！');
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      alert('JSON 格式错误，请检查输入内容');
    } else {
      alert(error.response?.data?.error || '导入项目失败');
    }
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知时间';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '无效日期';
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleDeleteProject = async (id: string) => {
  if (!confirm('确定要删除该项目吗？此操作不可撤销。')) return;
  
  try {
    await axios.delete(`http://localhost:3000/api/projects/${id}`);
    await fetchProjects();
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};

const handleToggleStatus = async (id: string) => {
  try {
    const response = await axios.post(`http://localhost:3000/api/projects/${id}/toggle-status`);
    const project = projects.value.find(p => p.id === id);
    if (project) {
      project.status = response.data.status;
    }
  } catch (error) {
    console.error('Failed to toggle status:', error);
    alert('切换状态失败');
  }
};

const handleLogout = () => {
  localStorage.removeItem('admin_token');
  window.location.href = '/login';
};

onMounted(fetchProjects);
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-white shadow-md flex flex-col h-screen sticky top-0">
      <div class="p-6 border-b">
        <h1 class="text-xl font-bold text-gray-800 flex items-center">
          <span class="w-8 h-8 bg-blue-600 rounded mr-2 flex items-center justify-center text-white text-sm">QA</span>
          管理后台
        </h1>
      </div>
      <nav class="p-4 space-y-2">
        <button 
          @click="currentView = 'projects'"
          :class="currentView === 'projects' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
        >项目管理</button>
        <button 
          @click="currentView = 'cards'"
          :class="currentView === 'cards' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
        >卡密管理</button>
        <button 
          @click="currentView = 'stats'; fetchStats()"
          :class="currentView === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
        >数据统计</button>
        <button 
          @click="currentView = 'settings'; fetchSettings()"
          :class="currentView === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
        >系统设置</button>
      </nav>
      <div class="p-4 border-t mt-auto">
        <button 
          @click="handleLogout"
          class="w-full text-left px-4 py-2 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <span>退出登录</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 p-8">
      <div v-if="currentView === 'projects'">
        <header class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">项目管理</h2>
          <div class="space-x-4">
            <button 
              @click="showImportModal = true"
              class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all"
            >
              📥 导入项目
            </button>
            <button 
              @click="showCreateModal = true"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              + 新建项目
            </button>
          </div>
        </header>

        <!-- 筛选框 -->
        <div class="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-600">访问模式:</span>
            <select 
              v-model="filterAccess" 
              @change="handleFilterChange"
              class="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="">全部模式</option>
              <option value="public">公开</option>
              <option value="code_required">卡密验证</option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-600">项目状态:</span>
            <select 
              v-model="filterStatus" 
              @change="handleFilterChange"
              class="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="">全部状态</option>
              <option value="online">已上线</option>
              <option value="offline">已下线</option>
            </select>
          </div>

          <button 
            v-if="filterAccess || filterStatus"
            @click="filterAccess = ''; filterStatus = ''; handleFilterChange()"
            class="text-sm text-blue-600 hover:underline"
          >
            重置筛选
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- 项目列表 -->
        <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-16 text-center">#</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">项目名称</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">用户访问</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">访问模式</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">创建时间</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">状态</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(project, index) in paginatedProjects" :key="project.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-sm text-gray-400 text-center font-mono">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="px-6 py-4">
                  <a 
                    :href="`/quiz/${project.id}?preview=true`" 
                    target="_blank"
                    class="font-medium text-blue-600 hover:underline"
                  >{{ project.title }}</a>
                  <div class="text-xs text-gray-400">ID: {{ project.id }}</div>
                </td>
                <td class="px-6 py-4">
                  <a 
                    :href="`/quiz/${project.id}`" 
                    target="_blank"
                    class="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <span>点击访问</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
                <td class="px-6 py-4">
                  <span :class="project.access === 'public' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'" class="px-2 py-1 rounded text-xs font-bold uppercase">
                    {{ project.access === 'public' ? '公开' : '卡密' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ formatDate(project.createdAt) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="project.status === 'online' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-100'" class="px-2 py-1 rounded text-xs font-bold uppercase">
                    {{ project.status === 'online' ? '已上线' : '已下线' }}
                  </span>
                </td>
                <td class="px-6 py-4 space-x-3">
                  <button 
                    @click="handleToggleStatus(project.id)"
                    :class="project.status === 'online' ? 'text-orange-600' : 'text-blue-600'"
                    class="hover:underline text-sm font-medium"
                  >
                    {{ project.status === 'online' ? '下线' : '上线' }}
                  </button>
                  <button 
                    @click="editingProjectId = project.id"
                    class="text-blue-600 hover:underline text-sm font-medium"
                  >编辑</button>
                  <button 
                    @click="handleManageCards(project.id)"
                    class="text-orange-600 hover:underline text-sm font-medium"
                  >卡密</button>
                </td>
              </tr>
              <tr v-if="paginatedProjects.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-gray-400">暂无项目</td>
              </tr>
            </tbody>
          </table>

          <!-- 分页控制 -->
          <div class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-600">
            <div class="flex items-center space-x-4">
              <span>共 {{ sortedProjects.length }} 个项目</span>
              <div class="flex items-center space-x-2">
                <span>每页显示:</span>
                <select 
                  v-model="pageSize" 
                  @change="handlePageSizeChange"
                  class="border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
                </select>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <button 
                @click="handlePageChange(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <div class="flex items-center space-x-1">
                <template v-for="page in totalPages" :key="page">
                  <button 
                    v-if="Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages"
                    @click="handlePageChange(page)"
                    :class="currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-white'"
                    class="w-8 h-8 border rounded transition-colors"
                  >
                    {{ page }}
                  </button>
                  <span v-else-if="page === 2 || page === totalPages - 1" class="px-1 text-gray-400">...</span>
                </template>
              </div>
              <button 
                @click="handlePageChange(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="currentView === 'cards'">
        <header class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">卡密管理</h2>
          <button 
            @click="currentView = 'projects'; managingCardProjectId = null"
            class="text-blue-600 hover:underline flex items-center gap-1"
          >
            ← 返回项目列表
          </button>
        </header>
        <CardManager :initialProjectId="managingCardProjectId || undefined" />
      </div>

      <div v-else-if="currentView === 'stats'">
        <header class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">数据统计概览</h2>
          <button @click="fetchStats" class="text-sm text-blue-600 hover:underline">刷新数据</button>
        </header>

        <div v-if="!statsData" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <div v-else class="space-y-8">
          <!-- 核心指标 -->
          <div class="grid grid-cols-6 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div class="text-xs text-gray-400 mb-1">总项目数</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.totalProjects }}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
              <div class="text-xs text-gray-400 mb-1">总卡密数</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.totalCards }}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
              <div class="text-xs text-gray-400 mb-1">已使用卡密</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.usedCards }}</div>
              <div class="text-[10px] text-green-500 mt-1">使用率: {{ statsData.totalCards ? Math.round(statsData.usedCards / statsData.totalCards * 100) : 0 }}%</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
              <div class="text-xs text-gray-400 mb-1">待使用卡密</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.unusedCards }}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
              <div class="text-xs text-gray-400 mb-1">累计访问次数</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.totalViews || 0 }}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-500">
              <div class="text-xs text-gray-400 mb-1">累计完成答题</div>
              <div class="text-2xl font-bold text-gray-800">{{ statsData.totalCompletions || 0 }}</div>
              <div class="text-[10px] text-pink-500 mt-1">完成率: {{ statsData.totalViews ? Math.round(statsData.totalCompletions / statsData.totalViews * 100) : 0 }}%</div>
            </div>
          </div>

          <!-- 最近 7 天趋势 -->
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <h3 class="font-bold text-gray-800 mb-6 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-1 h-4 bg-blue-600 rounded"></span>
                最近 7 天活跃趋势
              </div>
              <div class="flex gap-4 text-xs font-normal">
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-purple-400 rounded-full"></span> 访问次数
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-pink-400 rounded-full"></span> 完成答题
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-blue-200 rounded-full"></span> 新生成卡密
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-green-400 rounded-full"></span> 已验证卡密
                </div>
              </div>
            </h3>
            <div class="flex items-end justify-between h-48 gap-2">
              <div v-for="day in statsData.trends" :key="day.date" class="flex-1 flex flex-col items-center group relative">
                <div class="w-full flex justify-center items-end gap-1 mb-2 h-full">
                  <!-- 访问次数条 (紫色) -->
                  <div 
                    class="w-2 bg-purple-400 rounded-t-sm transition-all group-hover:bg-purple-500" 
                    :style="{ height: `${Math.min(day.views * 2, 100)}%` }"
                    :title="`访问次数: ${day.views}`"
                  ></div>
                  <!-- 完成次数条 (粉色) -->
                  <div 
                    class="w-2 bg-pink-400 rounded-t-sm transition-all group-hover:bg-pink-500" 
                    :style="{ height: `${Math.min(day.completions * 2, 100)}%` }"
                    :title="`完成次数: ${day.completions}`"
                  ></div>
                  <!-- 生成条 -->
                  <div 
                    class="w-2 bg-blue-200 rounded-t-sm transition-all group-hover:bg-blue-300" 
                    :style="{ height: `${Math.min(day.newCards * 5, 100)}%` }"
                    :title="`新生成卡密: ${day.newCards}`"
                  ></div>
                  <!-- 使用条 -->
                  <div 
                    class="w-2 bg-green-400 rounded-t-sm transition-all group-hover:bg-green-500" 
                    :style="{ height: `${Math.min(day.usedCards * 5, 100)}%` }"
                    :title="`已验证卡密: ${day.usedCards}`"
                  ></div>
                </div>
                <div class="text-[10px] text-gray-400 rotate-45 mt-2 origin-left whitespace-nowrap">{{ day.date.split('-').slice(1).join('/') }}</div>
                
                <!-- 悬浮详情 -->
                <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap shadow-lg">
                  <div class="font-bold mb-1 border-b border-gray-600 pb-1">{{ day.date }}</div>
                  <div class="flex justify-between gap-4"><span>访问:</span> <span class="text-purple-300">{{ day.views }}</span></div>
                  <div class="flex justify-between gap-4"><span>完成:</span> <span class="text-pink-300">{{ day.completions }}</span></div>
                  <div class="flex justify-between gap-4"><span>生成:</span> <span class="text-blue-300">{{ day.newCards }}</span></div>
                  <div class="flex justify-between gap-4"><span>验证:</span> <span class="text-green-300">{{ day.usedCards }}</span></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 项目明细统计 -->
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="p-4 border-b bg-gray-50">
              <h3 class="font-bold text-gray-800">各项目数据明细</h3>
            </div>
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <tr>
                  <th class="px-6 py-3 font-semibold text-left">项目名称</th>
                  <th class="px-6 py-3 font-semibold text-center">总卡密</th>
                  <th class="px-6 py-3 font-semibold text-center">已使用</th>
                  <th class="px-6 py-3 font-semibold text-center">访问次数</th>
                  <th class="px-6 py-3 font-semibold text-center">完成答题</th>
                  <th class="px-6 py-3 font-semibold text-center">分享次数</th>
                  <th class="px-6 py-3 font-semibold">使用进度</th>
                </tr>
              </thead>
              <tbody class="divide-y text-sm">
                <tr v-for="p in paginatedProjectStats" :key="p.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 font-medium text-gray-800">{{ p.title }}</td>
                  <td class="px-6 py-4 text-center text-gray-600">{{ p.total }}</td>
                  <td class="px-6 py-4 text-center text-green-600 font-bold">{{ p.used }}</td>
                  <td class="px-6 py-4 text-center text-purple-600 font-bold">{{ p.views || 0 }}</td>
                  <td class="px-6 py-4 text-center text-pink-600 font-bold">{{ p.completions || 0 }}</td>
                  <td class="px-6 py-4 text-center text-blue-600 font-bold">{{ p.shares || 0 }}</td>
                  <td class="px-6 py-4">
                    <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        class="bg-blue-500 h-full transition-all duration-500"
                        :style="{ width: `${p.total ? (p.used / p.total * 100) : 0}%` }"
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 分页控制 -->
            <div class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-600">
              <div class="flex items-center space-x-4">
                <span>共 {{ statsData.projectStats.length }} 个项目</span>
                <div class="flex items-center space-x-2">
                  <span>每页显示:</span>
                  <select 
                    v-model="statsPageSize" 
                    @change="handleStatsPageSizeChange"
                    class="border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <button 
                  @click="handleStatsPageChange(statsCurrentPage - 1)"
                  :disabled="statsCurrentPage === 1"
                  class="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <div class="flex items-center space-x-1">
                  <template v-for="page in statsTotalPages" :key="page">
                    <button 
                      v-if="Math.abs(page - statsCurrentPage) <= 2 || page === 1 || page === statsTotalPages"
                      @click="handleStatsPageChange(page)"
                      :class="statsCurrentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-white'"
                      class="w-8 h-8 border rounded transition-colors"
                    >
                      {{ page }}
                    </button>
                    <span v-else-if="page === 2 || page === statsTotalPages - 1" class="px-1 text-gray-400">...</span>
                  </template>
                </div>
                <button 
                  @click="handleStatsPageChange(statsCurrentPage + 1)"
                  :disabled="statsCurrentPage === statsTotalPages"
                  class="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 系统设置 -->
      <div v-if="currentView === 'settings'">
        <header class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800">系统设置</h2>
          <p class="text-sm text-gray-500 mt-1">管理平台的全局基础配置</p>
        </header>

        <div class="max-w-4xl space-y-6">
          <!-- 站点信息 -->
          <section class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <h3 class="font-bold text-gray-800">站点信息</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">站点名称</label>
                  <input 
                    v-model="settings.siteName" 
                    type="text" 
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="如：趣味测试平台"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
                  <input 
                    v-model="settings.contactEmail" 
                    type="email" 
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="用于接收用户反馈"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">站点描述</label>
                <textarea 
                  v-model="settings.siteDescription" 
                  rows="3" 
                  class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="展示在首页的副标题"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 默认业务配置 -->
          <section class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <h3 class="font-bold text-gray-800">业务默认值</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">卡密默认有效天数</label>
                  <div class="flex items-center">
                    <input 
                      v-model.number="settings.cardDefaultValidDays" 
                      type="number" 
                      class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <span class="ml-2 text-gray-500 text-sm">天</span>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">卡密默认设备限制</label>
                  <div class="flex items-center">
                    <input 
                      v-model.number="settings.cardDefaultDeviceLimit" 
                      type="number" 
                      class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <span class="ml-2 text-gray-500 text-sm">台</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-400">注：这些值将作为生成卡密时的初始填充值。</p>
            </div>
          </section>

          <!-- 分享文案配置 -->
          <section class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <h3 class="font-bold text-gray-800">全局分享配置</h3>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-8">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">默认分享标题</label>
                    <input 
                      v-model="settings.shareTitle" 
                      type="text" 
                      class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">默认分享描述</label>
                    <textarea 
                      v-model="settings.shareDescription" 
                      rows="3" 
                      class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
                
                <div class="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                  <label class="block text-sm font-medium text-gray-700 mb-3">分享卡片二维码</label>
                  <div class="relative group">
                    <img 
                      v-if="settings.qrcodeUrl" 
                      :src="settings.qrcodeUrl" 
                      class="w-32 h-32 object-contain bg-white rounded shadow-sm"
                      alt="分享二维码"
                    />
                    <div v-else class="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      <span class="text-xs">未上传</span>
                    </div>
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                      <label class="cursor-pointer text-white text-xs font-bold bg-blue-600 px-2 py-1 rounded">更换图片</label>
                    </div>
                    <input 
                      type="file" 
                      @change="handleUploadQrcode" 
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                  </div>
                  <p class="text-[10px] text-gray-400 mt-3">建议尺寸：200x200px，PNG/JPG 格式</p>
                  <div v-if="isUploading" class="mt-2 text-xs text-blue-600 animate-pulse font-medium">正在上传...</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 保存按钮 -->
          <div class="flex justify-end pt-4">
            <button 
              @click="handleSaveSettings"
              :disabled="isSavingSettings"
              class="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <span v-if="isSavingSettings" class="animate-spin text-lg">⏳</span>
              {{ isSavingSettings ? '正在保存...' : '保存全局设置' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 新建项目弹窗 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">新建项目</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目 ID (英文/数字)</label>
            <input 
              v-model="newProject.id"
              type="text" 
              placeholder="例如: mbti-test"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
            <input 
              v-model="newProject.title"
              type="text" 
              placeholder="例如: 16型人格专业测评"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div class="mt-8 flex justify-end space-x-3">
          <button 
            @click="showCreateModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >取消</button>
          <button 
            @click="handleCreateProject"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >确认创建</button>
        </div>
      </div>
    </div>

    <!-- 导入项目弹窗 -->
    <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-bold text-gray-800 mb-2">导入项目</h3>
        <p class="text-sm text-gray-500 mb-4">请粘贴由 AI 生成的 JSON 配置文件内容</p>
        
        <div class="space-y-4 flex-1 overflow-y-auto pr-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">config.json 内容</label>
            <textarea 
              v-model="importData.config"
              rows="8"
              placeholder='{ "id": "mbti-test", "title": "...", ... }'
              class="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">questions.json 内容</label>
            <textarea 
              v-model="importData.questions"
              rows="8"
              placeholder='[ { "id": "Q1", "content": { "text": "..." }, ... } ]'
              class="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button 
            @click="showImportModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >取消</button>
          <button 
            @click="handleImportProject"
            class="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md"
          >立即导入</button>
        </div>
      </div>
    </div>

    <!-- 项目编辑器 -->
    <ProjectEditor 
      v-if="editingProjectId"
      :projectId="editingProjectId"
      @close="editingProjectId = null"
      @saved="fetchProjects"
    />
  </div>
</template>
