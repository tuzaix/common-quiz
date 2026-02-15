const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECTS_DIR = path.join(__dirname, 'backend', 'data', 'projects');
const OUTPUT_DIR = path.join(__dirname, '运营', '分享图片');
const SETTINGS_FILE = path.join(__dirname, 'backend', 'data', 'settings.json');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取系统设置获取二维码
let qrcodeUrl = '';
try {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  qrcodeUrl = settings.qrcodeUrl || '';
} catch (e) {
  console.log('无法读取设置文件，将不包含二维码');
}

function parseScore(condition) {
  if (!condition) return Math.floor(Math.random() * 41) + 60; // 随机 60-100
  
  // 匹配 totalScore >= 11 && totalScore <= 16
  const rangeMatch = condition.match(/totalScore\s*>=\s*(\d+)\s*&&\s*totalScore\s*<=\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 匹配 totalScore > 40
  const gtMatch = condition.match(/totalScore\s*>\s*(\d+)/);
  if (gtMatch) {
    const min = parseInt(gtMatch[1]) + 1;
    return Math.floor(Math.random() * 10) + min; // 在最小值基础上随机增加 1-10 分
  }

  // 匹配 totalScore < 10
  const ltMatch = condition.match(/totalScore\s*<\s*(\d+)/);
  if (ltMatch) {
    const max = parseInt(ltMatch[1]) - 1;
    return Math.floor(Math.random() * Math.min(max + 1, 10)) + Math.max(0, max - 9); // 在最大值范围内随机
  }

  return Math.floor(Math.random() * 31) + 70; // 默认随机 70-100
}

function generateSVG(projectTitle, resultTitle, resultDescription, score = 85, projectId = '') {
  const width = 750;
  const height = 950;
  const isMBTI = projectId === 'mbti-test';
  
  // MBTI 特殊处理：提取四字母代码
  let mbtiCode = '';
  let mbtiTitle = resultTitle;
  if (isMBTI) {
    const match = resultTitle.match(/^([A-Z]{4})\s*-\s*(.*)/);
    if (match) {
      mbtiCode = match[1];
      mbtiTitle = resultTitle; // 保持原样 "ESTJ - 总经理"
    }
  }

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff1f2;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ffe4e6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fecdd3;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="15" stdDeviation="15" flood-color="#fb7185" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- 1. 背景 -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <circle cx="0" cy="${height}" r="250" fill="#fda4af" opacity="0.3"/>
  
  <!-- 2. 主卡片 -->
  <rect x="50" y="40" width="650" height="870" fill="#ffffff" rx="40" filter="url(#shadow)"/>
  
  <!-- 3. 顶部文字 -->
  <text x="375" y="100" font-family="sans-serif" font-size="24" font-weight="900" fill="#fb7185" text-anchor="middle" letter-spacing="3">PERSONALITY REPORT</text>
  
  <!-- 4. 项目标题 -->
  <g font-family="sans-serif" font-size="34" font-weight="bold" fill="#4b5563">
    <text x="375" y="170" text-anchor="middle">
      <tspan fill="#fb7185">✨</tspan> 【${projectTitle}】 <tspan fill="#fb7185">✨</tspan>
    </text>
  </g>
  
  <!-- 5. 结果大标题 -->
  <text x="375" y="${isMBTI ? 280 : 280}" font-family="sans-serif" font-size="${isMBTI ? 54 : 64}" font-weight="bold" fill="#fb7185" text-anchor="middle">${mbtiTitle}</text>
  
  <!-- 6. 分割线 -->
  <line x1="250" y1="360" x2="500" y2="360" stroke="#fecdd3" stroke-width="3" stroke-linecap="round"/>
  
  ${isMBTI ? `
    <!-- MBTI 特殊布局：显示大号代码 -->
    <text x="375" y="600" font-family="sans-serif" font-size="220" font-weight="900" fill="#fb7185" text-anchor="middle" opacity="0.9">${mbtiCode}</text>
  ` : `
    <!-- 普通项目布局：显示分数 -->
    <rect x="300" y="410" width="150" height="46" rx="23" fill="#fff1f2"/>
    <text x="375" y="442" font-family="sans-serif" font-size="24" font-weight="bold" fill="#fb7185" text-anchor="middle">综合评分</text>
    <text x="375" y="640" font-family="sans-serif" font-size="160" font-weight="900" fill="#fb7185" text-anchor="middle">${score}</text>
  `}
  
  <!-- 9. 底部名言 -->
  <text x="375" y="800" font-family="sans-serif" font-size="30" font-weight="bold" fill="#6b7280" text-anchor="middle">
    每一份特质，都是独一无二的光 <tspan fill="#fb7185">✨</tspan>
  </text>

  <!-- 10. 底部装饰线 -->
  <rect x="250" y="850" width="250" height="10" rx="5" fill="#fff1f2"/>
</svg>
  `.trim();
}

async function saveAsJpg(svgString, outputPath) {
  try {
    await sharp(Buffer.from(svgString))
      .jpeg({ quality: 90 })
      .toFile(outputPath);
  } catch (e) {
    console.error(`保存图片失败: ${outputPath}`, e);
  }
}

const TARGET_COUNT = 30; // 每个项目至少生成的图片数量

async function run() {
  const projects = fs.readdirSync(PROJECTS_DIR);

  for (const projectId of projects) {
    const configPath = path.join(PROJECTS_DIR, projectId, 'config.json');
    if (!fs.existsSync(configPath)) continue;

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const rules = config.resultConfig?.resultRules || [];
      
      if (rules.length === 0) continue;

      const projectOutputDir = path.join(OUTPUT_DIR, projectId);
      if (!fs.existsSync(projectOutputDir)) {
        fs.mkdirSync(projectOutputDir, { recursive: true });
      }

      // 计算最终生成数量：取指定数量与规则总数的较大值
      const finalCount = Math.max(TARGET_COUNT, rules.length);

      console.log(`正在为项目 [${config.title}] 生成 ${finalCount} 张 JPG 图片...`);

      for (let i = 0; i < finalCount; i++) {
        const rule = rules[i % rules.length]; // 循环使用规则
        const score = parseScore(rule.condition); // 每次随机生成分数
        const svg = generateSVG(config.title, rule.title || '测试结果', rule.description, score, projectId);
        const fileName = `share_${i + 1}.jpg`;
        await saveAsJpg(svg, path.join(projectOutputDir, fileName));
      }

    } catch (e) {
      console.error(`处理项目 ${projectId} 时出错:`, e);
    }
  }

  console.log('所有分享图片生成完成！');
}

run();
