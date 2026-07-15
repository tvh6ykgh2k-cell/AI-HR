import type { ChatMessage, PrepDocument, StarScore } from '../types.js';

const BASE_URL = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const API_KEY = process.env.AGNES_API_KEY || '';

function getApiKey(overrideKey?: string): string {
  return overrideKey || API_KEY;
}

const VISION_MODEL = 'agnes-vision';
const CHAT_MODEL = 'agnes-chat';

interface SendChatOptions {
  stream?: boolean;
  apiKeyOverride?: string;
  modelOverride?: string;
}

// SSE streaming chat generator
export async function* sendChat(
  messages: ChatMessage[],
  options: SendChatOptions = {}
): AsyncGenerator<string> {
  const apiKey = getApiKey(options.apiKeyOverride);
  const model = options.modelOverride || CHAT_MODEL;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream !== false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Agnes AI error: ${response.status} ${err}`);
  }

  if (options.stream === false) {
    const data = (await response.json()) as any;
    yield data.choices[0].message.content;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        /* skip malformed chunks */
      }
    }
  }
}

// JD recognition from screenshot (vision model)
export async function recognizeJD(
  imageBase64: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = getApiKey(apiKeyOverride);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请提取这张 BOSS直聘截图中的招聘信息，返回严格的 JSON 格式（不要 markdown 代码块）：

{
  "company": "公司名称",
  "position": "岗位名称",
  "salary": "薪资范围",
  "responsibilities": ["岗位职责1", "岗位职责2"],
  "requirements": ["任职要求1", "任职要求2"],
  "bonuses": ["加分项1", "加分项2"],
  "rawText": "原始JD文本"
}

如果某项信息未找到，填空字符串或空数组。务必只返回 JSON。`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageBase64}` },
            },
          ],
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`JD recognition failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  return data.choices[0].message.content;
}

// Generate interview prep document from JD + optional resume
export async function generatePrep(
  jdText: string,
  resumeText?: string,
  apiKeyOverride?: string
): Promise<PrepDocument> {
  const apiKey = getApiKey(apiKeyOverride);

  const resumeSection = resumeText
    ? `\n\n候选人简历：\n${resumeText}`
    : '\n\n（候选人未提供简历，请生成通用 STAR 框架，S/T/A/R 各段留空供候选人自行填充）';

  const prompt = `你是一位专业的面试准备顾问。根据以下 JD 和候选人的简历，请生成完整的面试准备文档。

JD 内容：
${jdText}
${resumeSection}

请严格按照以下 JSON Schema 返回（不要 markdown 代码块，只要纯 JSON）：

{
  "competencies": [
    {"name": "能力名称", "evidence": "JD中的证据", "weight": "高/中/低"}
  ],
  "questions": [
    {"question": "面试问题", "category": "技术深挖/项目经验/行为题/系统设计/开放题", "probability": "高/中/低"}
  ],
  "starStories": [
    {
      "name": "故事名称",
      "situation": "具体场景",
      "task": "你的任务",
      "action": "你的行动（3-4个具体步骤）",
      "result": "量化成果",
      "fullVersion": "2分钟完整叙述",
      "shortVersion": "60秒精简版",
      "oneLiner": "15秒一句话版",
      "coversCompetencies": ["覆盖的能力名称"]
    }
  ],
  "selfIntroFull": "2分钟自我介绍脚本（与JD高度匹配）",
  "selfIntroShort": "30秒电梯游说版本",
  "questionsToAsk": [
    {"category": "Hiring Manager/技术Leader/团队成员", "questions": ["问题1", "问题2"]}
  ],
  "difficultAnswers": [
    {"scenario": "你的弱点是什么/为什么离职/失败经历", "formula": "公式化回答模板"}
  ]
}

要求：
- 提取 4-6 个核心能力维度
- 生成 15-20 个预测问题，按高/中/低概率分类
- 如有简历，每个简历要点生成一个完整 STAR 故事；如无，生成 6-8 个通用 STAR 框架
- 问题分布：技术深挖 35%、项目经验 25%、行为题 20%、系统设计 15%、开放题 5%`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prep generation failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices[0].message.content;
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr) as PrepDocument;
}

// STAR scoring for a single answer
export async function scoreStar(
  question: string,
  answer: string,
  jdContext: string
): Promise<StarScore> {
  const prompt = `评估以下面试回答的 STAR 结构完整性：

面试问题：${question}
候选人回答：${answer}
岗位背景：${jdContext}

返回 JSON（不要 markdown）：
{
  "s": {"complete": true/false, "feedback": "Situation 评估反馈"},
  "t": {"complete": true/false, "feedback": "Task 评估反馈"},
  "a": {"complete": true/false, "feedback": "Action 评估反馈"},
  "r": {"complete": true/false, "feedback": "Result 评估反馈"},
  "overall": "整体 STAR 结构评价和改进建议"
}

判断标准：
- S (Situation): 是否说明了具体场景和背景？
- T (Task): 是否明确了个人职责和任务？
- A (Action): 是否描述了具体的个人行动和技术决策？
- R (Result): 是否有量化数据和业务成果？`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`STAR scoring failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices[0].message.content;
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr) as StarScore;
}

// Generate interview summary
export async function generateSummary(
  sessionContent: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = getApiKey(apiKeyOverride);
  const prompt = `以下是完整的面试记录。请生成面试总结：

${sessionContent}

返回 Markdown 格式的面试总结：
- **优点：** 2-3 条
- **待提升：** 2-3 条
- **总体评价：** X/10，一段话
- **建议：** 下次面试重点准备方向`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Summary generation failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  return data.choices[0].message.content;
}
