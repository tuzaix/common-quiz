<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits(['close', 'saved']);

const activeTab = ref('basic'); // basic, questions, scoring
const config = ref<any>(null);
const questions = ref<any[]>([]);
const selectedQuestionIds = ref<Set<string>>(new Set());
const isLoading = ref(true);

const toggleSelection = (id: string) => {
  if (selectedQuestionIds.value.has(id)) {
    selectedQuestionIds.value.delete(id);
  } else {
    selectedQuestionIds.value.add(id);
  }
};

const toggleSelectAll = () => {
  if (selectedQuestionIds.value.size === questions.value.length) {
    selectedQuestionIds.value.clear();
  } else {
    selectedQuestionIds.value = new Set(questions.value.map(q => q.id));
  }
};

const bulkUpdateType = (type: string) => {
  const count = selectedQuestionIds.value.size;
  if (count === 0) return;
  questions.value.forEach(q => {
    if (selectedQuestionIds.value.has(q.id)) {
      q.type = type;
    }
  });
  selectedQuestionIds.value.clear();
  alert(`已将选中的 ${count} 个题目修改为指定的类型`);
};

const bulkDelete = () => {
  if (selectedQuestionIds.value.size === 0) return;
  if (confirm(`确定要删除选中的 ${selectedQuestionIds.value.size} 个题目吗？`)) {
    questions.value = questions.value.filter(q => !selectedQuestionIds.value.has(q.id));
    selectedQuestionIds.value.clear();
  }
};
const showImportModal = ref(false);
const importJson = ref('');

const AI_PROMPT = `你是一个专业的题库转换助手。请将用户提供的题目内容转换为以下标准的 JSON 格式：

[
  {
    "id": "unique_id",
    "type": "single_choice", 
    "content": { "text": "题目文本" },
    "options": [
      { "id": "o1", "label": "选项A", "value": 1, "dimensionKey": "可选维度" },
      { "id": "o2", "label": "选项B", "value": 0 }
    ]
  }
]

注意：
1. type 可选值: single_choice (单选), multi_choice (多选), scale (量表)。
2. value 为该选项对应的分值。
3. dimensionKey 为计分维度（可选）。
4. 请直接输出 JSON 代码块，不要包含任何解释文字。`;

const copyPrompt = () => {
  navigator.clipboard.writeText(AI_PROMPT);
  alert('提示词已复制到剪贴板，请前往 ChatGPT/Claude 转换您的题库');
};

const handleImport = () => {
  try {
    const data = JSON.parse(importJson.value);
    if (!Array.isArray(data)) throw new Error('必须是数组格式');
    
    // 简单的格式校验
    data.forEach((q: any, index: number) => {
      if (!q.type || !q.content?.text) throw new Error(`第 ${index + 1} 题格式不正确`);
    });

    questions.value = [...questions.value, ...data];
    showImportModal.value = false;
    importJson.value = '';
    alert(`成功导入 ${data.length} 道题目`);
  } catch (error: any) {
    alert('导入失败: ' + error.message);
  }
};

const fetchProjectData = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(`http://localhost:3000/api/projects/${props.projectId}/config`);
    config.value = {
      ...response.data.config,
      settings: response.data.config.settings || { accessMode: 'public' },
      theme: response.data.config.theme || { primaryColor: '#3B82F6', backgroundColor: '#F3F4F6' },
      description: response.data.config.description || ''
    };
    questions.value = response.data.questions;
  } catch (error) {
    console.error('Failed to fetch project data:', error);
  } finally {
    isLoading.value = false;
  }
};

const saveConfig = async () => {
  try {
    await axios.put(`http://localhost:3000/api/projects/${props.projectId}/config`, config.value);
    alert('配置已保存');
  } catch (error) {
    alert('保存失败');
  }
};

const saveQuestions = async () => {
  try {
    await axios.put(`http://localhost:3000/api/projects/${props.projectId}/questions`, questions.value);
    alert('题目已保存');
  } catch (error) {
    alert('保存失败');
  }
};

const getEngineDesc = (engine: string) => {
  const descs: Record<string, string> = {
    sum: '将所有题目选项的分值直接累加。',
    dimension_sum: '按维度（如：外向、焦虑等）分别累加分值。',
    formula: '在基础分值之上应用自定义数学公式。'
  };
  return descs[engine] || '';
};

const addRule = () => {
  config.value.resultConfig.resultRules.push({
    condition: 'totalScore >= 0',
    title: '新结果标题',
    description: '结果描述内容'
  });
};

const removeRule = (index: number) => {
  config.value.resultConfig.resultRules.splice(index, 1);
};

const addQuestion = () => {
  questions.value.push({
    id: `q${Date.now()}`,
    type: 'single_choice',
    content: { text: '新题目' },
    options: [
      { id: 'o1', label: '选项1', value: 1 },
      { id: 'o2', label: '选项2', value: 0 }
    ]
  });
};

const removeQuestion = (index: number) => {
  if (confirm('确定要删除此题目吗？')) {
    questions.value.splice(index, 1);
  }
};

onMounted(fetchProjectData);
</script>

<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 md:p-8">
    <div class="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <!-- 头部 -->
      <header class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h2 class="text-xl font-bold text-gray-800">编辑项目: {{ projectId }}</h2>
          <p class="text-sm text-gray-500">配置题目、计分引擎与结果规则</p>
        </div>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <!-- 标签页切换 -->
      <nav class="flex border-b px-6 bg-white">
        <button 
          v-for="tab in [{id:'basic', name:'基础设置'}, {id:'questions', name:'题库管理'}, {id:'scoring', name:'计分与结果'}]"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="px-6 py-4 border-b-2 font-medium transition-colors"
        >
          {{ tab.name }}
        </button>
      </nav>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div v-if="isLoading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <div v-else-if="config" class="max-w-4xl mx-auto">
          <!-- 基础设置 -->
          <div v-if="activeTab === 'basic'" class="space-y-6 bg-white p-8 rounded-xl shadow-sm">
            <div class="grid grid-cols-2 gap-6">
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">项目标题</label>
                <input v-model="config.title" type="text" placeholder="输入项目名称" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">项目描述</label>
                <textarea v-model="config.description" rows="3" placeholder="输入测试项目的详细介绍" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">访问模式</label>
                <select v-model="config.settings.accessMode" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="public">公开访问</option>
                  <option value="code_required">卡密验证</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">主题主色</label>
                  <div class="flex items-center space-x-2">
                    <input v-model="config.theme.primaryColor" type="color" class="h-10 w-12 border rounded cursor-pointer" />
                    <input v-model="config.theme.primaryColor" type="text" class="flex-1 px-3 py-2 border rounded-lg text-sm uppercase" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">背景颜色</label>
                  <div class="flex items-center space-x-2">
                    <input v-model="config.theme.backgroundColor" type="color" class="h-10 w-12 border rounded cursor-pointer" />
                    <input v-model="config.theme.backgroundColor" type="text" class="flex-1 px-3 py-2 border rounded-lg text-sm uppercase" />
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t flex justify-end">
              <button @click="saveConfig" class="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all">
                保存基础设置
              </button>
            </div>
          </div>

          <!-- 计分与结果 -->
          <div v-if="activeTab === 'scoring'" class="space-y-6 bg-white p-8 rounded-xl shadow-sm">
            <div class="space-y-6">
              <h4 class="text-lg font-bold text-gray-800">计分引擎配置</h4>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">计分模型</label>
                <select v-model="config.resultConfig.scoringEngine" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="sum">简单求和 (Sum)</option>
                  <option value="dimension_sum">维度求和 (Dimension Sum)</option>
                  <option value="formula">自定义公式 (Formula)</option>
                </select>
                <p class="text-xs text-gray-400 mt-2">{{ getEngineDesc(config.resultConfig.scoringEngine) }}</p>
              </div>
              
              <div v-if="config.resultConfig.scoringEngine === 'formula'" class="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                 <label class="block text-sm font-semibold text-gray-700 mb-2">自定义计分公式 (JS 表达式)</label>
                 <textarea 
                   v-model="config.resultConfig.formula" 
                   placeholder="例如: score * 1.2 + GET_DIM('extra')" 
                   class="w-full h-24 px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 ></textarea>
                 
                 <div class="mt-3 grid grid-cols-2 gap-4">
                   <div class="space-y-1">
                     <p class="text-[10px] font-bold text-gray-400 uppercase">可用变量</p>
                     <div class="flex flex-wrap gap-1">
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-blue-600">score</code>
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-blue-600">dims</code>
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-blue-600">avg</code>
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-blue-600">count</code>
                     </div>
                   </div>
                   <div class="space-y-1">
                     <p class="text-[10px] font-bold text-gray-400 uppercase">内置函数</p>
                     <div class="flex flex-wrap gap-1">
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-purple-600">MAX(a,b)</code>
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-purple-600">IF(c,t,f)</code>
                       <code class="px-1.5 py-0.5 bg-white border rounded text-[10px] text-purple-600">GET_DIM('k')</code>
                     </div>
                   </div>
                 </div>

                 <div class="mt-4 pt-3 border-t border-gray-200">
                   <p class="text-[10px] font-bold text-gray-400 uppercase mb-2">常用模板 (点击复制)</p>
                   <div class="space-y-2">
                     <button @click="config.resultConfig.formula = 'score * 100 / (count * 5)'" class="block w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border rounded text-[11px] text-gray-600 transition-colors">
                       🎯 <strong>百分制转换</strong>: <code>score * 100 / (count * 5)</code>
                     </button>
                     <button @click="config.resultConfig.formula = 'MAX(score, 60)'" class="block w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border rounded text-[11px] text-gray-600 transition-colors">
                       🛡️ <strong>保底分数</strong>: <code>MAX(score, 60)</code>
                     </button>
                     <button @click="config.resultConfig.formula = 'dims.extroversion > dims.introversion ? 100 : 50'" class="block w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border rounded text-[11px] text-gray-600 transition-colors">
                       ⚖️ <strong>维度对比</strong>: <code>dims.A > dims.B ? 100 : 50</code>
                     </button>
                   </div>
                 </div>
               </div>

                <hr class="my-6 border-gray-100">

                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <h4 class="text-lg font-bold text-gray-800">结果匹配规则</h4>
                    <button @click="addRule" class="text-sm text-blue-600 font-bold">+ 添加规则</button>
                  </div>
                  <div v-for="(rule, idx) in config.resultConfig.resultRules" :key="idx" class="p-4 border rounded-lg space-y-3 bg-gray-50 relative">
                    <button @click="removeRule(idx as number)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">×</button>
                    <div>
                      <label class="block text-xs font-bold text-gray-400 uppercase mb-1">触发条件 (JS 表达式)</label>
                      <input v-model="rule.condition" type="text" class="w-full px-3 py-2 border rounded bg-white text-sm font-mono">
                      <p class="text-[10px] text-gray-400 mt-1">可用变量: totalScore, dimensionScores</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="col-span-2">
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">结果标题</label>
                        <input v-model="rule.title" type="text" class="w-full px-3 py-2 border rounded bg-white text-sm">
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">详细描述</label>
                        <textarea v-model="rule.description" class="w-full px-3 py-2 border rounded bg-white text-sm" rows="2"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div class="pt-6 border-t flex justify-end">
              <button @click="saveConfig" class="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all">
                保存计分配置
              </button>
            </div>
          </div>

          <!-- 题库管理 -->
          <div v-if="activeTab === 'questions'" class="space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    :checked="selectedQuestionIds.size === questions.length && questions.length > 0"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  >
                  <span class="ml-2 text-sm font-medium text-gray-700">全选 ({{ questions.length }})</span>
                </div>
                
                <!-- 批量操作栏 -->
                <div v-if="selectedQuestionIds.size > 0" class="flex items-center space-x-2 border-l pl-4 animate-fade-in">
                  <span class="text-xs font-bold text-blue-600 uppercase">批量修改类型:</span>
                  <select @change="(e: any) => bulkUpdateType(e.target.value)" class="px-2 py-1 border rounded bg-blue-50 text-xs font-bold text-blue-700 outline-none">
                    <option value="" disabled selected>选择类型</option>
                    <option value="single_choice">单选</option>
                    <option value="multi_choice">多选</option>
                    <option value="scale">量表</option>
                  </select>
                  <button @click="bulkDelete" class="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100 border border-red-100">
                    批量删除 ({{ selectedQuestionIds.size }})
                  </button>
                </div>
              </div>

              <div class="flex space-x-3">
                <button @click="showImportModal = true" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-sm border border-blue-200">
                  批量导入 JSON
                </button>
                <button @click="addQuestion" class="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm text-sm">
                  + 添加题目
                </button>
              </div>
            </div>

            <div v-for="(q, qIdx) in questions" :key="q.id" 
                 :class="selectedQuestionIds.has(q.id) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-white'"
                 class="p-6 rounded-xl shadow-sm border relative group transition-all">
              <div class="absolute top-4 left-4 z-10">
                <input 
                  type="checkbox" 
                  :checked="selectedQuestionIds.has(q.id)"
                  @change="toggleSelection(q.id)"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                >
              </div>

              <button @click="removeQuestion(qIdx)" class="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <div class="grid grid-cols-12 gap-4 pl-8">
                <div class="col-span-2">
                  <label class="block text-xs font-bold text-gray-400 mb-1 uppercase">类型</label>
                  <select v-model="q.type" class="w-full px-2 py-1 border rounded bg-gray-50 text-sm">
                    <option value="single_choice">单选</option>
                    <option value="multi_choice">多选</option>
                    <option value="scale">量表</option>
                  </select>
                </div>
                <div class="col-span-10">
                  <label class="block text-xs font-bold text-gray-400 mb-1 uppercase">题干内容</label>
                  <input v-model="q.content.text" type="text" class="w-full px-3 py-1 border rounded outline-none focus:border-blue-500" />
                </div>
              </div>

              <!-- 选项编辑 (简略版) -->
              <div v-if="q.options" class="mt-4 space-y-2">
                <div v-for="opt in q.options" :key="opt.id" class="flex items-center space-x-2">
                  <input v-model="opt.label" type="text" placeholder="选项名称" class="flex-1 px-3 py-1 border rounded text-sm" />
                  <input v-model.number="opt.value" type="number" placeholder="分值" class="w-20 px-3 py-1 border rounded text-sm" />
                  <input v-model="opt.dimensionKey" type="text" placeholder="维度(可选)" class="w-24 px-3 py-1 border rounded text-sm" />
                </div>
              </div>
            </div>

            <div class="pt-6 border-t flex justify-end">
              <button @click="saveQuestions" class="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all">
                保存题库
              </button>
            </div>
          </div>

          <!-- 计分与结果 (占位) -->
          <div v-if="activeTab === 'scoring'" class="bg-white p-8 rounded-xl shadow-sm text-center py-20">
            <p class="text-gray-400">计分引擎可视化配置开发中...</p>
            <p class="text-sm text-gray-300 mt-2">目前请通过修改后端 JSON 文件来调整计分逻辑</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 导入模态框 -->
  <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <header class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h3 class="font-bold text-gray-800">批量导入题库</h3>
        <button @click="showImportModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </header>
      
      <div class="p-6 space-y-4 flex-1 overflow-y-auto">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 class="text-blue-800 font-bold text-sm mb-1">💡 格式转换助手</h4>
          <p class="text-blue-600 text-xs mb-3">如果您的题库是 Excel、Word 或文本格式，可以复制下方提示词，让 AI 帮您转换为标准 JSON。</p>
          <button @click="copyPrompt" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded font-bold hover:bg-blue-700 transition-colors">
            复制 AI 转换提示词
          </button>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">粘贴题库 JSON (数组格式)</label>
          <textarea 
            v-model="importJson" 
            placeholder='[{"id":"q1", "type":"single_choice", "content":{"text":"题目内容"}, "options":[...]}]'
            class="w-full h-64 px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          ></textarea>
        </div>
      </div>

      <footer class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
        <button @click="showImportModal = false" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
          取消
        </button>
        <button @click="handleImport" :disabled="!importJson.trim()" class="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md">
          确认导入
        </button>
      </footer>
    </div>
  </div>
</template>
