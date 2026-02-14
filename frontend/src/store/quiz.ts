import { defineStore } from 'pinia';
import { ScoringService } from '../services/ScoringService';

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    projectConfig: null as any,
    questions: [] as any[],
    currentQuestionIndex: 0,
    questionHistory: [] as number[], // 记录访问过的题目索引，用于返回上一题
    answers: {} as Record<string, any>,
    calculationResult: null as any,
    matchedRule: null as any,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    isLastQuestion: (state) => state.currentQuestionIndex === state.questions.length - 1,
    currentQuestion: (state) => state.questions[state.currentQuestionIndex],
  },

  actions: {
    setProjectData(config: any, questions: any[]) {
      this.projectConfig = config;
      this.questions = questions;
    },

    saveAnswer(questionId: string, value: any) {
      this.answers[questionId] = value;
    },

    nextQuestion(jumpToId?: string) {
      this.questionHistory.push(this.currentQuestionIndex);
      
      if (jumpToId) {
        const nextIndex = this.questions.findIndex(q => q.id === jumpToId);
        if (nextIndex !== -1) {
          this.currentQuestionIndex = nextIndex;
          return;
        }
      }

      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
      }
    },

    prevQuestion() {
      if (this.questionHistory.length > 0) {
        this.currentQuestionIndex = this.questionHistory.pop()!;
      } else if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },

    calculateResult() {
      if (!this.projectConfig || !this.projectConfig.resultConfig) return;

      const answersList = Object.entries(this.answers).map(([id, value]) => {
        const question = this.questions.find(q => q.id === id);
        const selectedOption = question?.options?.find((o: any) => o.value === value);
        return {
          questionId: id,
          value,
          dimensionKey: selectedOption?.dimensionKey || question?.dimensionKey // 有些题目类型可能在题目层级定义维度
        };
      });

      const scoringService = new ScoringService(this.projectConfig.resultConfig, answersList);
      this.calculationResult = scoringService.calculate();
      this.matchedRule = scoringService.matchRule(this.calculationResult);
    }
  }
});
