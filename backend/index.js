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
const SHARES_FILE = path.join(__dirname, 'data', 'shares.json');

// 助手函数：读取/写入分享数据
const getShares = () => {
  if (!fs.existsSync(SHARES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SHARES_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
};

const saveShares = (shares) => {
  fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2));
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

// 确保分享数据文件存在
if (!fs.existsSync(SHARES_FILE)) {
  fs.writeFileSync(SHARES_FILE, '{}');
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

    // 计算统计信息
    const stats = {
      totalProjects: projects.length,
      totalCards: cards.length,
      usedCards: cards.filter(c => c.status === 'used').length,
      unusedCards: cards.filter(c => c.status === 'unused').length,
      
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
          shares: allShares[projectId] || 0
        };
      }),

      // 最近 7 天的趋势 (模拟数据或从日志中提取)
      // 这里暂时根据卡密生成时间做简单统计
      trends: Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        return {
          date: dateStr,
          newCards: cards.filter(c => c.createdAt && c.createdAt.startsWith(dateStr)).length,
          usedCards: cards.filter(c => c.usedAt && c.usedAt.startsWith(dateStr)).length
        };
      })
    };

    res.json(stats);
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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
          description: config.description || config.meta?.description || '暂无描述',
          category: config.category || '其他',
          tags: config.tags || [],
          coverImage: config.coverImage || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          isHot: config.isHot || config.meta?.isHot || false,
          views: config.views || Math.floor(Math.random() * 10000) + 1000,
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

// 验证卡密
app.post('/api/verify-card', (req, res) => {
  const { cardCode, projectId, deviceId } = req.body;
  try {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
