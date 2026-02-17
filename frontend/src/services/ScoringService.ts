/**
 * ScoringService.ts
 * 负责计分逻辑的处理，不依赖 UI
 */

export interface ScoringConfig {
  scoringEngine: 'sum' | 'dimension_sum' | 'formula' | 'mbti';
  formula?: string;
  resultRules: Array<{
    condition: string;
    title: string;
    description: string;
  }>;
}

export interface Answer {
  questionId: string;
  value: any;
  dimensionKey?: string;
}

export class ScoringService {
  private config: ScoringConfig;
  private answers: Answer[];

  /**
   * 构造函数
   * @param config 计分配置
   * @param answers 用户提交的答案
   */
  constructor(config: ScoringConfig, answers: Answer[]) {
    this.config = config;
    this.answers = answers;
  }

  /**
   * 执行计算
   * @returns 计算结果
   */
  calculate() {
    switch (this.config.scoringEngine) {
      case 'sum':
        return this._calculateSum();
      case 'dimension_sum':
        return this._calculateDimension();
      case 'formula':
        return this._executeFormula();
      case 'mbti':
        return this._calculateMBTI();
      default:
        return { totalScore: 0 };
    }
  }

  /**
   * 计算 MBTI 类型
   */
  private _calculateMBTI() {
    const dimensions: Record<string, number> = {};
    this.answers.forEach(answer => {
      if (answer.dimensionKey) {
        dimensions[answer.dimensionKey] = (dimensions[answer.dimensionKey] || 0) + (Number(answer.value) || 0);
      }
    });

    // MBTI 维度对照：E-I, S-N, T-F, J-P
    // 假设 dimensionKey 为 E, I, S, N, T, F, J, P
    // 或者根据分值判断，例如 E > I 则为 E，否则为 I
    const getType = (high: string, low: string) => {
      return (dimensions[high] || 0) >= (dimensions[low] || 0) ? high : low;
    };

    const mbti = [
      getType('E', 'I'),
      getType('S', 'N'),
      getType('T', 'F'),
      getType('J', 'P')
    ].join('');

    return { 
      totalScore: 100, // MBTI 通常不看总分，设为 100 兼容逻辑
      mbti, 
      dimensions 
    };
  }

  /**
   * 计算总分
   */
  private _calculateSum() {
    const totalScore = this.answers.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return { totalScore };
  }

  /**
   * 计算各维度得分
   */
  private _calculateDimension() {
    const dimensions: Record<string, number> = {};
    let totalScore = 0;
    
    this.answers.forEach(answer => {
      const val = Number(answer.value) || 0;
      totalScore += val;
      
      if (answer.dimensionKey) {
        dimensions[answer.dimensionKey] = (dimensions[answer.dimensionKey] || 0) + val;
      }
    });
    
    return { totalScore, dimensions };
  }

  /**
   * 执行自定义公式
   */
  private _executeFormula() {
    if (!this.config.formula) return { totalScore: 0 };
    
    // 基础分值计算
    const totalScore = this.answers.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const dimensions: Record<string, number> = {};
    this.answers.forEach(answer => {
      if (answer.dimensionKey) {
        dimensions[answer.dimensionKey] = (dimensions[answer.dimensionKey] || 0) + (Number(answer.value) || 0);
      }
    });

    const context = {
      // 核心数据
      score: totalScore,
      totalScore: totalScore,
      dims: dimensions,
      dimensions: dimensions,
      count: this.answers.length,
      avg: this.answers.length > 0 ? totalScore / this.answers.length : 0,
      
      // 辅助函数
      MAX: Math.max,
      MIN: Math.min,
      ABS: Math.abs,
      ROUND: Math.round,
      CEIL: Math.ceil,
      FLOOR: Math.floor,
      IF: (cond: boolean, t: any, f: any) => cond ? t : f,
      
      // 高级逻辑辅助
      GET_DIM: (key: string) => dimensions[key] || 0,
      HAS_DIM: (key: string) => dimensions[key] !== undefined,
      
      // 用户原始答案 (用于极高定制化)
      answers: this.answers
    };

    try {
      // 创建沙箱环境执行公式
      const keys = Object.keys(context);
      const values = Object.values(context);
      
      // 更加健壮的公式执行逻辑
      let functionBody = '';
      if (this.config.formula.includes('return')) {
        // 如果包含 return，说明是一个完整的代码块或 IIFE
        functionBody = `
          try {
            ${this.config.formula}
          } catch (e) {
            console.error('Formula runtime error:', e);
            return 0;
          }
        `;
      } else {
        // 如果不包含 return，尝试作为表达式返回
        functionBody = `
          try {
            return ${this.config.formula};
          } catch (e) {
            console.error('Formula runtime error:', e);
            return 0;
          }
        `;
      }
      
      const fn = new Function(...keys, functionBody);
      const result = fn(...values);
      
      // 公式结果可以是数字（作为总分），也可以是对象（覆盖整个结果）
      if (typeof result === 'object' && result !== null) {
        return { totalScore, ...result };
      }
      return { totalScore: Number(result) || 0, dimensions };
    } catch (e) {
      console.error('Formula execution failed:', e);
      return { totalScore: 0, dimensions };
    }
  }

  /**
   * 根据计算结果匹配规则
   * @param calculationResult 计算出的结果对象
   */
  matchRule(calculationResult: any) {
    for (const rule of this.config.resultRules) {
      try {
        const context = { ...calculationResult };
        // 使用更安全且容错的 eval 方式
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `
          try {
            return ${rule.condition};
          } catch (e) {
            return false;
          }
        `);
        
        if (fn(...values)) {
          return rule;
        }
      } catch (e) {
        // 静默处理单条规则错误，尝试匹配下一条
      }
    }
    return this.config.resultRules[this.config.resultRules.length - 1]; // 默认返回最后一个规则
  }
}
