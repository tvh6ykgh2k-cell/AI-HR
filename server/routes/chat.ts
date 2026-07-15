import { Hono } from 'hono';
import { sendChat } from '../services/agnes.js';
import { readSettings, readSessionContent, appendToSession } from '../services/obsidian.js';
import type { ChatMessage, SliderSettings } from '../types.js';

export const chatRoute = new Hono();

function sliderInstructions(s: SliderSettings): string {
  const lines: string[] = [];
  if (s.followUpDepth >= 4) lines.push('- 对每个技术回答至少追问2-3层深度');
  if (s.followUpDepth <= 2) lines.push('- 每个问题只问一层，回答后即进入下一题');
  if (s.questionPace >= 4) lines.push('- 快速抛出下一个问题，保持高压节奏');
  if (s.questionPace <= 2) lines.push('- 给候选人充足的思考时间，不要催促');
  if (s.strictness >= 4) lines.push('- 直接指出错误，毫不妥协');
  if (s.strictness <= 2) lines.push('- 鼓励为主，委婉指出问题');
  if (s.hintFrequency >= 4) lines.push('- 察觉候选人犹豫时主动引导和提示');
  if (s.hintFrequency <= 2) lines.push('- 仅在候选人明确表示不会时才给出提示');
  if (s.technicalDepth >= 4) lines.push('- 追问源码级实现和底层原理');
  if (s.technicalDepth <= 2) lines.push('- 聚焦实际项目经验和应用层面');
  return lines.join('\n');
}

function buildSystemPrompt(
  personality: string, sliders: SliderSettings, jdContext: string, starContext: string
): string {
  return `${personality}\n\n## 面试风格指令\n${sliderInstructions(sliders)}\n\n## 岗位要求\n${jdContext}\n\n## 题型覆盖\n请按以下比例出题：技术深挖 35%、项目经验 25%、行为题 20%、系统设计 15%、开放题 5%。\n\n## STAR 追问指令\n${starContext || '（首轮面试，暂无 STAR 评分数据）'}\n\n## 面试流程\n1. 自然开始，先让候选人做自我介绍\n2. 根据 JD 和候选人回答动态调整问题方向\n3. 当候选人回答缺少量化结果时，追问具体数据\n4. 当候选人回答过于概括时，追问技术决策细节\n5. 面试结束时给予总体反馈`;
}

chatRoute.post('/', async (c) => {
  const { sessionId, message, jdContext, starContext } = await c.req.json<{
    sessionId: string; message: string; jdContext?: string; starContext?: string;
  }>();
  const settings = await readSettings();
  const systemPrompt = buildSystemPrompt(settings.personality, settings.sliders, jdContext || '', starContext || '');
  const savedContent = await readSessionContent({
    id: sessionId, date: new Date().toISOString().slice(0, 10),
    company: '', position: '', type: 'interview', tags: [],
  });
  const historyMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
  if (savedContent) {
    const qaMatches = savedContent.matchAll(/\*\*🤖 面试官：\*\*\s*(.+?)\n\n\*\*👤 我：\*\*\s*(.+?)\n/g);
    for (const m of qaMatches) {
      historyMessages.push({ role: 'assistant', content: m[1].trim() });
      historyMessages.push({ role: 'user', content: m[2].trim() });
    }
  }
  historyMessages.push({ role: 'user', content: message });
  const apiKey = settings.apiKey || undefined;
  const model = settings.model || undefined;
  return c.newResponse(new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const token of sendChat(historyMessages, { apiKeyOverride: apiKey, modelOverride: model })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally { controller.close(); }
    },
  }), { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
});

chatRoute.post('/save-qa', async (c) => {
  const { sessionId, question, answer } = await c.req.json<{ sessionId: string; question: string; answer: string }>();
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const qaBlock = `\n### Q${timestamp}\n**🤖 面试官：** ${question}\n\n**👤 我：** ${answer}\n`;
  await appendToSession({ id: sessionId, date: new Date().toISOString().slice(0, 10), company: '', position: '', type: 'interview', tags: [] }, qaBlock);
  return c.json({ success: true });
});
