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

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50];

const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const totalPages = computed(() => Math.ceil(sortedProjects.value.length / pageSize.value));

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedProjects.value.slice(start, end);
});

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

const currentView = ref('projects'); // projects, cards, stats

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

onMounted(fetchProjects);
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-white shadow-md">
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
          @click="currentView = 'stats'"
          :class="currentView === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
        >数据统计</button>
        <button class="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">系统设置</button>
      </nav>
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

        <!-- 统计概览 -->
        <div class="grid grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600 flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400 mb-1">总项目数</div>
              <div class="text-2xl font-bold text-gray-800">{{ projects.length }}</div>
            </div>
            <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xl">
              📊
            </div>
          </div>
          <!-- 可以预留其他统计卡片 -->
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
                  <div class="font-medium text-gray-900">{{ project.title }}</div>
                  <div class="text-xs text-gray-400">ID: {{ project.id }}</div>
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
                  <span :class="project.status === 'published' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'" class="px-2 py-1 rounded text-xs font-bold uppercase">
                    {{ project.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td class="px-6 py-4 space-x-3">
                  <button 
                    @click="editingProjectId = project.id"
                    class="text-blue-600 hover:underline text-sm font-medium"
                  >编辑</button>
                  <button 
                    @click="handleManageCards(project.id)"
                    class="text-orange-600 hover:underline text-sm font-medium"
                  >卡密</button>
                  <a 
                    :href="`/quiz/${project.id}`"
                    target="_blank"
                    class="text-gray-600 hover:underline text-sm font-medium"
                  >预览</a>
                  <button 
                    @click="handleDeleteProject(project.id)"
                    class="text-red-600 hover:underline text-sm font-medium"
                  >删除</button>
                </td>
              </tr>
              <tr v-if="paginatedProjects.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-400">暂无项目</td>
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
        <header class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800">数据统计</h2>
        </header>
        <div class="bg-white p-12 rounded-xl shadow-sm text-center text-gray-400">
          统计功能开发中...
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
