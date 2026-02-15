<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api, { resolveUrl } from '../api';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  coverImage: string;
  isHot: boolean;
  views: number;
  access: string;
  createdAt: string;
}

const router = useRouter();
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref('热门');

const categories = computed(() => {
  const cats = new Set(projects.value.map(p => p.category));
  return ['热门', '最新', '全部', ...Array.from(cats)];
});

const filteredProjects = computed(() => {
  let list = [...projects.value];
  
  // 基础搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }

  // 分类过滤与特殊逻辑
  if (selectedCategory.value === '全部') {
    // 默认展示
  } else if (selectedCategory.value === '热门') {
    list = list.filter(p => p.isHot || p.views > 5000);
  } else if (selectedCategory.value === '最新') {
    // 筛选最近3天内创建的项目
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    list = list.filter(p => new Date(p.createdAt) >= threeDaysAgo);
    
    // 如果最近3天没新项目，则展示按时间倒序的前8个
    if (list.length === 0) {
      list = [...projects.value].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 8);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } else {
    list = list.filter(p => p.category === selectedCategory.value);
  }
  
  return list;
});

const isNewProject = (createdAt: string) => {
   const date = new Date(createdAt);
   const now = new Date();
   const diffTime = Math.abs(now.getTime() - date.getTime());
   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   return diffDays <= 3; // 3天内定义为最新
 };

const fetchProjects = async () => {
  try {
    const response = await api.get('/api/projects');
    projects.value = response.data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  } finally {
    isLoading.value = false;
  }
};

const goToQuiz = (id: string) => {
  router.push(`/quiz/${id}`);
};

onMounted(async () => {
  document.title = '心理测评中心 - 探索真实的自己';
  await fetchProjects();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header/Hero Section -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">QuizFlow</span>
        </div>
        
        <div class="flex-1 max-w-md mx-8 hidden sm:block">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索感兴趣的测试..." 
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button @click="router.push('/admin')" class="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">后台管理</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <!-- Welcome Message -->
      <div class="mb-10 text-center sm:text-left">
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">发现更好的自己</h1>
        <p class="mt-3 text-lg text-gray-500 max-w-2xl">探索一系列精心设计的心理测评、性格分析和兴趣测试，开启自我认知之旅。</p>
      </div>

      <!-- Categories Filter -->
      <div class="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          v-for="cat in categories" 
          :key="cat"
          @click="selectedCategory = cat"
          class="px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          :class="selectedCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-500'"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Project Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <div class="h-48 bg-gray-200"></div>
          <div class="p-5 space-y-3">
            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <div v-else-if="filteredProjects.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          @click="goToQuiz(project.id)"
          class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col h-full"
        >
          <!-- Card Image -->
          <div class="relative h-48 overflow-hidden">
            <img 
              :src="resolveUrl(project.coverImage)" 
              :alt="project.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div class="absolute top-3 left-3 flex flex-col gap-1.5">
              <!-- 分类标签 -->
              <span class="px-2 py-0.5 bg-black/20 backdrop-blur-md text-white text-[10px] font-medium rounded-md w-fit">
                {{ project.category }}
              </span>
              <!-- 状态标签组 -->
              <div class="flex gap-1">
                <span v-if="isNewProject(project.createdAt)" class="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-md shadow-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  最新
                </span>
                <span v-if="project.isHot || project.views > 5000" class="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md shadow-sm flex items-center gap-1 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.342c-.716.445-1.315 1.037-1.752 1.732-.475.758-.888 1.612-1.241 2.545-.403 1.066-.74 2.14-1.038 3.203-1.032 3.667-1.616 6.347-1.616 6.347a1 1 0 001.243 1.177c.413-.108.847-.323 1.25-.63.454-.347.886-.807 1.258-1.31.761-1.028 1.458-2.42 1.954-4.124.404-1.38.641-2.836.702-4.305.01-.253.017-.504.022-.753l.011-.533zM10.925 10.313a4.333 4.333 0 00.435-1.203c.124-.523.184-1.053.184-1.587 0-.075-.001-.15-.003-.225a1 1 0 00-.44-.812 1 1 0 00-1.157.079 5.646 5.646 0 01-1.235.88c-.39.215-.79.385-1.189.502a1 1 0 00-.71 1.238l.003.011s.46 1.624 1.114 3.538c.128.372.293.74.495 1.106a1 1 0 001.432.351 5.79 5.79 0 011.353-.694c.41-.165.81-.277 1.187-.33a1 1 0 00.832-1.257z" clip-rule="evenodd" />
                  </svg>
                  热门
                </span>
              </div>
            </div>
            <div v-if="project.access === 'code_required'" class="absolute top-3 right-3">
              <span class="p-1.5 bg-yellow-400 text-yellow-900 rounded-lg shadow-sm" title="需要激活码">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 flex-1 flex flex-col">
            <h3 class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
              {{ project.title }}
            </h3>
            <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
              {{ project.description }}
            </p>
            
            <div class="flex items-center justify-between mt-auto">
              <div class="flex flex-wrap gap-1">
                <span v-for="tag in project.tags.slice(0, 2)" :key="tag" class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                  #{{ tag }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span class="flex items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ project.views > 1000 ? (project.views / 1000).toFixed(1) + 'k' : project.views }}
                </span>
                <span>{{ new Date(project.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Action -->
          <div class="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-blue-50 transition-colors">
            <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600">立即开始</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="text-gray-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900">没有找到匹配的测试</h3>
        <p class="text-gray-500 mt-1">尝试换个关键词或者选择其他分类吧</p>
        <button @click="searchQuery = ''; selectedCategory = '全部'" class="mt-6 text-blue-600 font-medium hover:underline">显示所有测试</button>
      </div>
    </main>

    <!-- Simple Footer -->
    <footer class="mt-20 border-t border-gray-200 pt-10 pb-10">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <p class="text-gray-400 text-sm">© 2026 QuizFlow 通用测试平台. 配置驱动，自动化测评.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
