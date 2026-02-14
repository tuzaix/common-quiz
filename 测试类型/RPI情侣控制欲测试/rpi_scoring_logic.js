/**
 * RPI (Relationship Possession Index) 测评计分逻辑算法实现 (题库整合版)
 * 
 * 本文件结合了 rpi_question_bank_v1_40.json 的配置，
 * 详细描述了从原始答案到最终报告的计算全过程。
 */

// 1. 核心配置参考 (来源于 rpi_question_bank_v1_40.json)
const SCORING_CONFIG = {
  scale: { min: 1, max: 7 },
  dimensions: [
    { id: "Control", name: "控制欲", weight: 0.3 },
    { id: "Jealousy", name: "嫉妒强度", weight: 0.25 },
    { id: "Dependency", name: "情感依赖", weight: 0.2 },
    { id: "Insecurity", name: "关系不安全感", weight: 0.25 }
  ]
};

/**
 * 核心计算主函数
 * @param {Object} userAnswers 用户答案集，格式为 { "C_01": 5, "J_01": 2, ... }
 * @param {Array} questionItems 题库中的 items 数组
 * @param {Object} recommendationBank 题库中的 recommendations 对象
 * @returns {Object} 包含维度得分、总分和建议的完整报告数据
 */
function calculateRPI(userAnswers, questionItems, recommendationBank) {
  const { min, max } = SCORING_CONFIG.scale;
  
  // 维度数据暂存
  const dimStats = {
    Control: { totalScore: 0, totalWeight: 0 },
    Jealousy: { totalScore: 0, totalWeight: 0 },
    Dependency: { totalScore: 0, totalWeight: 0 },
    Insecurity: { totalScore: 0, totalWeight: 0 }
  };

  // --- 第一步：计算各维度原始得分 ---
  questionItems.forEach(item => {
    // 过滤掉检测项 (direction: "check")
    if (item.direction === 'check') return;
    
    const rawValue = userAnswers[item.id];
    if (rawValue === undefined) return;

    // 1. 正反向处理
    let processedScore = rawValue;
    if (item.direction === 'reverse') {
      // 公式: (Min + Max) - Raw
      processedScore = (min + max) - rawValue;
    }

    // 2. 累加维度分数 (考虑题目自身的 weight)
    const itemWeight = item.weight || 1.0;
    if (dimStats[item.dimension]) {
      dimStats[item.dimension].totalScore += (processedScore * itemWeight);
      dimStats[item.dimension].totalWeight += itemWeight;
    }
  });

  // --- 第二步：计算维度归一化分数 (1-7分) ---
  const normalizedScores = {};
  SCORING_CONFIG.dimensions.forEach(dim => {
    const stats = dimStats[dim.id];
    if (stats.totalWeight > 0) {
      // 维度得分 = 维度总分 / 维度总权重
      const avg = stats.totalScore / stats.totalWeight;
      normalizedScores[dim.id] = parseFloat(avg.toFixed(2));
    } else {
      normalizedScores[dim.id] = 0;
    }
  });

  // --- 第三步：计算总体占有欲指数 (维度加权) ---
  let weightedSum = 0;
  let weightTotal = 0;
  SCORING_CONFIG.dimensions.forEach(dim => {
    weightedSum += normalizedScores[dim.id] * dim.weight;
    weightTotal += dim.weight;
  });
  
  // 总分 = Σ(维度分 * 维度权重) / Σ维度权重
  const overallScore = weightTotal > 0 
    ? parseFloat((weightedSum / weightTotal).toFixed(2)) 
    : 0;

  // --- 第四步：匹配建议逻辑 ---
  const reportRecommendations = generateReportRecs(normalizedScores, recommendationBank);

  return {
    overall_index: overallScore,
    dimension_scores: normalizedScores,
    recommendations: reportRecommendations,
    calculation_meta: {
      timestamp: new Date().toISOString(),
      version: "1.4.0",
      scale: "1-7 Likert"
    }
  };
}

/**
 * 建议生成逻辑
 */
function generateReportRecs(scores, bank) {
  const result = [];
  // 按照得分从高到低排序，优先展示高分维度的改进建议
  const sortedDims = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  sortedDims.forEach(([dimId, score]) => {
    const dimName = SCORING_CONFIG.dimensions.find(d => d.id === dimId).name;
    const possibleRecs = bank[dimId] || [];
    
    // 逻辑：
    // 1. 如果维度分 >= 4，取该维度的前 2 条建议
    // 2. 如果该维度是最高分且分值 < 4，取 1 条建议（兜底）
    if (score >= 4) {
      result.push({
        dimension: dimName,
        score: score,
        advice: possibleRecs.slice(0, 2)
      });
    } else if (result.length === 0 && sortedDims[0][0] === dimId) {
      result.push({
        dimension: dimName,
        score: score,
        advice: possibleRecs.slice(0, 1)
      });
    }
  });
  return result;
}

// --- 计算示例 ---
/*
const sampleAnswers = {
  "C_01": 7, // 控制欲-正向: 7分
  "C_09": 1, // 控制欲-反向: 8-1 = 7分
  "J_01": 4, // 嫉妒-正向: 4分
  ...
};
const results = calculateRPI(sampleAnswers, bankData.items, bankData.recommendations);
console.log(`最终占有欲指数: ${results.overall_index}`);
*/

if (typeof module !== 'undefined') {
  module.exports = { calculateRPI };
}
