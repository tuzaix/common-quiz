const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PROJECTS_DIR = path.join(__dirname, 'data', 'projects');
const CARDS_FILE = path.join(__dirname, 'data', 'cards.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(CARDS_FILE)) {
  fs.writeFileSync(CARDS_FILE, JSON.stringify([], null, 2));
}

// 确保项目目录存在
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// 获取卡密列表
app.get('/api/cards', (req, res) => {
  try {
    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// 批量生成卡密
app.post('/api/cards/generate', (req, res) => {
  const { projectId, count } = req.body;
  if (!projectId || !count) return res.status(400).json({ error: 'Project ID and count are required' });

  try {
    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    const newCards = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      newCards.push({
        code,
        projectId,
        status: 'unused',
        createdAt: new Date().toISOString()
      });
    }
    const updatedCards = [...cards, ...newCards];
    fs.writeFileSync(CARDS_FILE, JSON.stringify(updatedCards, null, 2));
    res.json({ success: true, count: newCards.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate cards' });
  }
});

// 获取所有项目列表
app.get('/api/projects', (req, res) => {
  try {
    const projectDirs = fs.readdirSync(PROJECTS_DIR);
    const projects = projectDirs.map(id => {
      const projectPath = path.join(PROJECTS_DIR, id);
      const configPath = path.join(projectPath, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const stats = fs.statSync(projectPath);
        // 使用 ctime (状态修改时间) 作为创建时间的备选，因为 birthtime 在某些系统或文件操作下可能不可用
        const createdAt = (stats.birthtime && stats.birthtime.getTime() !== 0) 
          ? stats.birthtime.toISOString() 
          : stats.ctime.toISOString();
        return {
          id,
          title: config.title || config.meta?.title || id,
          access: config.settings?.accessMode || 'public',
          status: 'published',
          createdAt
        };
      }
      return null;
    }).filter(p => p !== null);
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// 创建新项目
app.post('/api/projects', (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'ID and Title are required' });

  const projectPath = path.join(PROJECTS_DIR, id);
  if (fs.existsSync(projectPath)) return res.status(400).json({ error: 'Project already exists' });

  try {
    console.log(`Creating project at: ${projectPath}`);
    fs.mkdirSync(projectPath, { recursive: true });
    
    const defaultConfig = {
      title: title,
      settings: { accessMode: 'public' },
      resultConfig: {
        scoringEngine: 'sum',
        resultRules: [
          { condition: 'totalScore >= 0', title: '完成测试', description: '感谢参与！' }
        ]
      }
    };
    
    const defaultQuestions = [
      {
        id: 'q1',
        type: 'single_choice',
        content: { text: '这是你的第一个问题' },
        options: [
          { id: 'o1', label: '选项 A', value: 1 },
          { id: 'o2', label: '选项 B', value: 0 }
        ]
      }
    ];

    fs.writeFileSync(path.join(projectPath, 'config.json'), JSON.stringify(defaultConfig, null, 2));
    fs.writeFileSync(path.join(projectPath, 'questions.json'), JSON.stringify(defaultQuestions, null, 2));

    res.status(201).json({ success: true, id });
  } catch (e) {
    console.error('Project creation failed:', e);
    res.status(500).json({ error: 'Failed to create project: ' + e.message });
  }
});

// 删除项目
app.delete('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  const projectPath = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectPath)) return res.status(404).json({ error: 'Project not found' });

  try {
    fs.rmSync(projectPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 更新项目配置
app.put('/api/projects/:projectId/config', (req, res) => {
  const { projectId } = req.params;
  const config = req.body;
  const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');

  if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Project not found' });

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// 更新题目列表
app.put('/api/projects/:projectId/questions', (req, res) => {
  const { projectId } = req.params;
  const questions = req.body;
  const questionsPath = path.join(PROJECTS_DIR, projectId, 'questions.json');

  if (!fs.existsSync(questionsPath)) return res.status(404).json({ error: 'Project not found' });

  try {
    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update questions' });
  }
});

// 获取项目配置
app.get('/api/projects/:projectId/config', (req, res) => {
  const { projectId } = req.params;
  const configPath = path.join(__dirname, 'data', 'projects', projectId, 'config.json');
  const questionsPath = path.join(__dirname, 'data', 'projects', projectId, 'questions.json');

  if (!fs.existsSync(configPath) || !fs.existsSync(questionsPath)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    res.json({ config, questions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse project data' });
  }
});

// 验证卡密 (更新之前的验证逻辑)
app.post('/api/verify-card', (req, res) => {
  const { cardCode, projectId } = req.body;
  try {
    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    const cardIndex = cards.findIndex(c => c.code === cardCode && c.projectId === projectId && c.status === 'unused');
    
    if (cardCode === '123456') { // 保留演示卡密
      return res.json({ success: true, message: 'Demo card verified' });
    }

    if (cardIndex !== -1) {
      cards[cardIndex].status = 'used';
      cards[cardIndex].usedAt = new Date().toISOString();
      fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
      res.json({ success: true, message: 'Card verified' });
    } else {
      res.status(403).json({ success: false, message: 'Invalid or already used card' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// 导入项目 (基于生成的配置)
app.post('/api/projects/import', (req, res) => {
  const { config, questions } = req.body;
  if (!config || !questions || !config.id) {
    return res.status(400).json({ error: 'Invalid project data. config.id, config, and questions are required.' });
  }

  const projectId = config.id;
  const projectPath = path.join(PROJECTS_DIR, projectId);

  if (fs.existsSync(projectPath)) {
    return res.status(400).json({ error: `Project ID "${projectId}" already exists.` });
  }

  try {
    fs.mkdirSync(projectPath, { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'config.json'), JSON.stringify(config, null, 2));
    fs.writeFileSync(path.join(projectPath, 'questions.json'), JSON.stringify(questions, null, 2));
    res.status(201).json({ success: true, id: projectId });
  } catch (e) {
    console.error('Import failed:', e);
    res.status(500).json({ error: 'Failed to import project: ' + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
