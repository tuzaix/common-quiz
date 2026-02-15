const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件目录，允许跨域访问图片
app.use('/uploads', cors(), express.static(path.join(__dirname, 'data/uploads')));

// 确保目录存在
const UPLOADS_DIR = path.join(__dirname, 'data/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `qrcode_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

const PROJECTS_DIR = path.join(__dirname, 'data', 'projects');
const CARDS_FILE = path.join(__dirname, 'data', 'cards.json');
const SHARES_FILE = path.join(__dirname, 'data', 'shares.json');
const VIEWS_FILE = path.join(__dirname, 'data', 'views.json');
const COMPLETIONS_FILE = path.join(__dirname, 'data', 'completions.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const DAILY_STATS_FILE = path.join(__dirname, 'data', 'daily_stats.json');
const QUIZ_COVERS_FILE = path.join(__dirname, 'data', 'quiz_covers.json');

// 助手函数：读取/写入系统设置
const getSettings = () => {
  const defaultSettings = {
    siteName: '趣味测试平台',
    siteDescription: '发现未知的自己',
    contactEmail: '',
    cardDefaultValidDays: 3,
    cardDefaultDeviceLimit: 3,
    shareTitle: '这个测试太准了，快来试试！',
    shareDescription: '发现一个超级好玩的心理测试，分享给你。',
    qrcodeUrl: ''
  };
  if (!fs.existsSync(SETTINGS_FILE)) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
  } catch (e) {
    return defaultSettings;
  }
};

const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

// 助手函数：读取/写入通用统计数据
const getStatsData = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '{}');
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return {};
  }
};

const saveStatsData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 助手函数：读取/写入分享数据
const getShares = () => getStatsData(SHARES_FILE);
const saveShares = (shares) => saveStatsData(SHARES_FILE, shares);

// 助手函数：读取/写入访问数据
const getViews = () => getStatsData(VIEWS_FILE);
const saveViews = (views) => saveStatsData(VIEWS_FILE, views);

// 助手函数：读取/写入完成数据
const getCompletions = () => getStatsData(COMPLETIONS_FILE);
const saveCompletions = (completions) => saveStatsData(COMPLETIONS_FILE, completions);

// 助手函数：读取/写入每日统计数据
const getDailyStats = () => getStatsData(DAILY_STATS_FILE);
const saveDailyStats = (stats) => saveStatsData(DAILY_STATS_FILE, stats);

// 助手函数：读取/写入封面配置
const getQuizCovers = () => getStatsData(QUIZ_COVERS_FILE);
const saveQuizCovers = (covers) => saveStatsData(QUIZ_COVERS_FILE, covers);

const recordDailyStat = (type) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const stats = getDailyStats();
  if (!stats[dateStr]) {
    stats[dateStr] = { views: 0, completions: 0 };
  }
  stats[dateStr][type] = (stats[dateStr][type] || 0) + 1;
  saveDailyStats(stats);
};

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

// 确保统计数据文件存在
[SHARES_FILE, VIEWS_FILE, COMPLETIONS_FILE, DAILY_STATS_FILE, QUIZ_COVERS_FILE].forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '{}');
  }
});

// 确保设置文件存在
if (!fs.existsSync(SETTINGS_FILE)) {
  saveSettings(getSettings());
}

// 数据迁移：从 config.json 迁移分享数据到 shares.json
try {
  const projects = fs.readdirSync(PROJECTS_DIR);
  const shares = getShares();
  let migrated = false;

  projects.forEach(projectId => {
    const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.shares !== undefined) {
        shares[projectId] = (shares[projectId] || 0) + config.shares;
        delete config.shares;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        migrated = true;
        console.log(`Migrated shares for project: ${projectId}`);
      }
    }
  });

  if (migrated) {
    saveShares(shares);
  }
} catch (e) {
  console.error('Migration error:', e);
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
  const { projectId, count, validDays, deviceLimit } = req.body;
  if (!projectId || !count) return res.status(400).json({ error: 'Project ID and count are required' });

  try {
    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    const newCards = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      newCards.push({
        code,
        projectId,
        status: 'unused',
        createdAt: new Date().toISOString(),
        validDays: validDays !== undefined ? validDays : 3, // Default to 3 days
        deviceLimit: deviceLimit !== undefined ? deviceLimit : 3, // Default to 3 devices
        usedDevices: [] // Store device identifiers
      });
    }
    const updatedCards = [...cards, ...newCards];
    fs.writeFileSync(CARDS_FILE, JSON.stringify(updatedCards, null, 2));
    res.json({ success: true, count: newCards.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate cards' });
  }
});

// 批量删除卡密
app.post('/api/cards/batch-delete', (req, res) => {
  const { codes } = req.body;
  if (!Array.isArray(codes)) return res.status(400).json({ error: 'Codes array is required' });

  try {
    let cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    cards = cards.filter(c => !codes.includes(c.code));
    fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete cards' });
  }
});

// 获取统计数据
app.get('/api/stats/overview', (req, res) => {
  try {
    const projects = fs.readdirSync(PROJECTS_DIR).filter(id => {
      return fs.existsSync(path.join(PROJECTS_DIR, id, 'config.json'));
    });
    
    let cards = [];
    if (fs.existsSync(CARDS_FILE)) {
      cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    }

    const allShares = getShares();
    const allViews = getViews();
    const allCompletions = getCompletions();
    const dailyStats = getDailyStats();

    // 计算统计信息
    const stats = {
      totalProjects: projects.length,
      totalCards: cards.length,
      usedCards: cards.filter(c => c.status === 'used').length,
      unusedCards: cards.filter(c => c.status === 'unused').length,
      totalViews: Object.values(allViews).reduce((a, b) => a + b, 0),
      totalCompletions: Object.values(allCompletions).reduce((a, b) => a + b, 0),
      
      // 按项目统计卡密使用情况
      projectStats: projects.map(projectId => {
        const projectCards = cards.filter(c => c.projectId === projectId);
        const config = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, projectId, 'config.json'), 'utf8'));
        return {
          id: projectId,
          title: config.title || projectId,
          total: projectCards.length,
          used: projectCards.filter(c => c.status === 'used').length,
          unused: projectCards.filter(c => c.status === 'unused').length,
          shares: allShares[projectId] || 0,
          views: allViews[projectId] || 0,
          completions: allCompletions[projectId] || 0
        };
      }),

      // 最近 7 天的趋势
      trends: Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayStat = dailyStats[dateStr] || { views: 0, completions: 0 };
        
        return {
          date: dateStr,
          newCards: cards.filter(c => c.createdAt && c.createdAt.startsWith(dateStr)).length,
          usedCards: cards.filter(c => c.usedAt && c.usedAt.startsWith(dateStr)).length,
          views: dayStat.views || 0,
          completions: dayStat.completions || 0
        };
      })
    };

    res.json(stats);
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 批量修改项目访问模式
app.post('/api/projects/batch-access', (req, res) => {
  const { ids, accessMode } = req.body;
  if (!Array.isArray(ids) || !accessMode) {
    return res.status(400).json({ error: 'IDs array and accessMode are required' });
  }

  try {
    const results = { success: [], failed: [] };
    
    ids.forEach(projectId => {
      const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (!config.settings) config.settings = {};
          config.settings.accessMode = accessMode;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          results.success.push(projectId);
        } catch (e) {
          results.failed.push({ id: projectId, error: e.message });
        }
      } else {
        results.failed.push({ id: projectId, error: 'Project not found' });
      }
    });

    res.json({ success: true, ...results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update access mode' });
  }
});

// 批量修改项目状态
app.post('/api/projects/batch-status', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'IDs array and status are required' });
  }

  try {
    const results = { success: [], failed: [] };
    
    ids.forEach(projectId => {
      const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          config.status = status;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          results.success.push(projectId);
        } catch (e) {
          results.failed.push({ id: projectId, error: e.message });
        }
      } else {
        results.failed.push({ id: projectId, error: 'Project not found' });
      }
    });

    res.json({ success: true, ...results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// 获取所有项目列表
app.get('/api/projects', (req, res) => {
  try {
    const projectDirs = fs.readdirSync(PROJECTS_DIR);
    const quizCovers = getQuizCovers();
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
          description: config.description || config.meta?.description || '暂无描述',
          category: config.category || '其他',
          tags: config.tags || [],
          coverImage: quizCovers[id] || config.coverImage || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          isHot: config.isHot || config.meta?.isHot || false,
          views: config.views || Math.floor(Math.random() * 10000) + 1000,
          access: config.settings?.accessMode || 'public',
          status: config.status || 'online',
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

// 切换项目状态 (上线/下线)
app.post('/api/projects/:projectId/toggle-status', (req, res) => {
  const { projectId } = req.params;
  const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');

  if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Project not found' });

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.status = config.status === 'offline' ? 'online' : 'offline';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, status: config.status });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle status' });
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
    
    // 如果项目已下线，且不是管理员预览模式（这里可以通过 query 参数区分）
    if (config.status === 'offline' && req.query.preview !== 'true') {
      return res.status(403).json({ error: 'Project is offline', status: 'offline' });
    }

    // 记录访问次数 (非预览模式)
    if (req.query.preview !== 'true') {
      const views = getViews();
      views[projectId] = (views[projectId] || 0) + 1;
      saveViews(views);
      recordDailyStat('views');
    }

    res.json({ config, questions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse project data' });
  }
});

// 验证卡密
app.post('/api/verify-card', (req, res) => {
  const { cardCode, projectId, deviceId } = req.body;
  try {
    // 检查项目状态
    const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.status === 'offline') {
        return res.status(403).json({ success: false, message: '该项目已下线，无法验证卡密' });
      }
    }

    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
    
    if (cardCode === '123456') { // 保留演示卡密
      return res.json({ success: true, message: 'Demo card verified' });
    }

    const cardIndex = cards.findIndex(c => c.code === cardCode && c.projectId === projectId);
    
    if (cardIndex === -1) {
      return res.status(403).json({ success: false, message: '卡密不存在' });
    }

    const card = cards[cardIndex];

    // 1. 检查状态和有效期
    if (card.status === 'used') {
      // 如果已使用，检查是否在有效期内且设备匹配
      if (card.validDays > 0) {
        const usedDate = new Date(card.usedAt);
        const now = new Date();
        const diffDays = (now - usedDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays > card.validDays) {
          return res.status(403).json({ success: false, message: '卡密已过期' });
        }
      }
      
      // 检查设备限制
      if (deviceId && card.usedDevices && !card.usedDevices.includes(deviceId)) {
        if (card.usedDevices.length >= (card.deviceLimit || 1)) {
          return res.status(403).json({ success: false, message: '已达到最大设备授权限制' });
        }
        // 未超过限制，添加新设备
        card.usedDevices.push(deviceId);
      }
    } else {
      // 2. 首次使用
      card.status = 'used';
      card.usedAt = new Date().toISOString();
      card.usedDevices = deviceId ? [deviceId] : [];
    }

    fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
    res.json({ success: true, message: '验证通过' });

  } catch (e) {
    console.error('Verification error:', e);
    res.status(500).json({ success: false, message: '验证失败' });
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

// 增加项目分享统计
app.post('/api/projects/:projectId/share', (req, res) => {
  const { projectId } = req.params;
  
  try {
    const shares = getShares();
    shares[projectId] = (shares[projectId] || 0) + 1;
    saveShares(shares);
    res.json({ success: true, shares: shares[projectId] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update share count' });
  }
});

// 增加项目完成统计
app.post('/api/projects/:projectId/complete', (req, res) => {
  const { projectId } = req.params;
  
  try {
    const completions = getCompletions();
    completions[projectId] = (completions[projectId] || 0) + 1;
    saveCompletions(completions);
    recordDailyStat('completions');
    res.json({ success: true, completions: completions[projectId] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update completion count' });
  }
});

// 上传项目封面
app.post('/api/admin/projects/:projectId/cover', upload.single('cover'), (req, res) => {
  const { projectId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const covers = getQuizCovers();
    const coverUrl = `/uploads/${req.file.filename}`;
    covers[projectId] = coverUrl;
    saveQuizCovers(covers);
    res.json({ success: true, coverUrl });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save cover configuration' });
  }
});

// 设置项目封面链接 (直接输入 URL)
app.post('/api/admin/projects/:projectId/cover-url', (req, res) => {
  const { projectId } = req.params;
  const { coverUrl } = req.body;
  if (!coverUrl) return res.status(400).json({ error: 'Cover URL is required' });

  try {
    const covers = getQuizCovers();
    covers[projectId] = coverUrl;
    saveQuizCovers(covers);
    res.json({ success: true, coverUrl });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save cover configuration' });
  }
});

// 系统设置 API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const settings = getSettings();
  
  if (username === settings.adminUsername && password === settings.adminPassword) {
    // 简单起见，返回一个模拟 token
    res.json({ success: true, token: 'admin-session-token' });
  } else {
    res.status(401).json({ success: false, message: '账号或密码错误' });
  }
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  try {
    saveSettings(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// 上传二维码接口
app.post('/api/settings/upload-qrcode', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const qrcodeUrl = `/uploads/${req.file.filename}`;
  res.json({ url: qrcodeUrl });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
