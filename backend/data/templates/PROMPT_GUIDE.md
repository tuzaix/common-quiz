# 测评项目生成专用提示词指南

为了让 AI 能够精准生成符合本平台格式的项目文件，请使用以下结构化提示词。

---

## 复制以下提示词发送给 AI：

**P1. 目标 (Goal)**
我需要你为一个通用测评平台生成两个核心 JSON 配置文件：`config.json`（项目配置）和 `questions.json`（题库）。
本次要生成的测评项目名称是：**[在此输入项目名称，例如：大五人格测试]**。

**P2. 上下文 (Context)**
该平台采用前后端分离架构，前端基于 Vue 3，后端使用 Node.js。项目通过文件夹进行隔离。
- `config.json` 负责定义计分引擎（sum/dimension_sum/formula/mbti）、结果判定规则（resultRules）和 UI 主题。
- `questions.json` 负责定义题目列表，支持单选题，且选项可以绑定 `dimensionKey`（维度）或 `jumpTo`（跳题逻辑），题目数量不得少于20道题。

**P3. 规范 (Constraints)**
1. **计分引擎选择**：
   - 如果是 MBTI，使用 `mbti` 引擎，维度固定为 E/I, S/N, T/F, J/P。
   - 如果是分数累加，使用 `sum`。
   - 如果涉及复杂逻辑（如加权平均、常模转换），使用 `formula` 引擎，并编写对应的 JS 代码块（确保顶层有 return 语句，不要使用 IIFE 包装）。
2. **结果规则**：`resultRules` 中的 `condition` 必须是合法的 JS 表达式（如 `totalScore > 80` 或 `mbti === 'INTJ'`）。
3. **语言**：所有内容使用中文。
4. **输出格式**：请直接输出两个 JSON 代码块，不要有余赘言。

**P4. 示例结构 (Example)**

`config.json` 参考：
```json
{
  "id": "project-id",
  "title": "项目名称",
  "theme": { "primaryColor": "#颜色代码" },
  "resultConfig": {
    "scoringEngine": "计分引擎类型",
    "formula": "var d = dimensions || {}; var extra = d.extroversion || 0; var intro = d.introversion || 0; var type = extra >= intro ? 'E' : 'I'; return { personalityType: type, scoreGap: Math.abs(extra - intro), totalScore: extra + intro };",
    "resultRules": [
      { "condition": "判断条件", "title": "结论标题", "description": "详细描述" }
    ]
  }
}
```

`questions.json` 参考：
```json
[
  {
    "id": "Q1",
    "type": "single_choice",
    "content": { "text": "题目文本" },
    "dimensionKey": "归属维度(可选)",
    "options": [
      { "id": "o1", "label": "选项文字", "value": 分值, "dimensionKey": "选项特定维度(可选)" }
    ]
  }
]
```

---

**请根据以上规范，为 [在此再次输入项目名称] 生成完整的配置文件。**
