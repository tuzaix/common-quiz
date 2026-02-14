/**
 * QuestionTypeRegistry.ts
 * 题目类型注册表，将题目类型映射到具体的输入组件
 */

import SingleChoice from './inputs/SingleChoice.vue';
import MultiChoice from './inputs/MultiChoice.vue';
import ScaleSlider from './inputs/ScaleSlider.vue';

export const QuestionTypeRegistry: Record<string, any> = {
  'single_choice': SingleChoice,
  'multi_choice': MultiChoice,
  'scale': ScaleSlider,
  'slider': ScaleSlider,
};

export function getComponentByType(type: string) {
  return QuestionTypeRegistry[type] || SingleChoice;
}
