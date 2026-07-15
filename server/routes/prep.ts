import { Hono } from 'hono';
import { generatePrep, scoreStar } from '../services/agnes.js';
import { readSettings, createSessionFile } from '../services/obsidian.js';
import type { PrepGenerateRequest, StarScoreRequest } from '../types.js';

export const prepRoute = new Hono();

prepRoute.post('/generate', async (c) => {
  try {
    const { jdText, resumeText } = await c.req.json<PrepGenerateRequest>();
    const settings = await readSettings();
    const prepDoc = await generatePrep(jdText, resumeText, settings.apiKey || undefined, settings.model || undefined);

    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `${today}-prep-${Date.now()}`;

    const markdown = generatePrepMarkdown(prepDoc, jdText);
    await createSessionFile(
      { id: sessionId, date: today, company: '', position: '', type: 'prep', tags: ['面试准备'] },
      markdown
    );

    return c.json({ ...prepDoc, sessionId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

prepRoute.post('/score-star', async (c) => {
  try {
    const { question, answer, jdContext } = await c.req.json<StarScoreRequest>();
    const settings = await readSettings();
    const score = await scoreStar(question, answer, jdContext, settings.apiKey || undefined, settings.model || undefined);
    return c.json(score);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

function generatePrepMarkdown(doc: any, jdText: string): string {
  let md = `# 📝 面试准备文档\n\n`;
  md += `## 📋 岗位要求\n\n> ${jdText.replace(/\n/g, '\n> ')}\n\n`;
  md += `## 🎯 核心能力维度\n\n`;
  doc.competencies?.forEach((comp: any) => {
    md += `- **${comp.name}** (${comp.weight}) — ${comp.evidence}\n`;
  });
  md += `\n## 📖 预测问题库\n\n`;
  const categories = ['技术深挖', '项目经验', '行为题', '系统设计', '开放题'];
  categories.forEach(cat => {
    const qs = doc.questions?.filter((q: any) => q.category === cat) || [];
    if (qs.length === 0) return;
    md += `### ${cat}\n\n`;
    qs.forEach((q: any) => { md += `- [${q.probability}] ${q.question}\n`; });
    md += '\n';
  });
  md += `## 📖 STAR 故事银行\n\n`;
  doc.starStories?.forEach((story: any, i: number) => {
    md += `### 故事 ${i + 1}: ${story.name}\n\n`;
    md += `**覆盖能力：** ${story.coversCompetencies?.join(', ')}\n\n`;
    md += `| 版本 | 内容 |\n|------|------|\n`;
    md += `| 完整版 (2min) | ${story.fullVersion} |\n`;
    md += `| 精简版 (60s) | ${story.shortVersion} |\n`;
    md += `| 一句话 (15s) | ${story.oneLiner} |\n\n`;
    md += `<details><summary>完整 STAR</summary>\n\n`;
    md += `- **S:** ${story.situation}\n- **T:** ${story.task}\n- **A:** ${story.action}\n- **R:** ${story.result}\n`;
    md += `</details>\n\n`;
  });
  md += `## 🎤 自我介绍脚本\n\n### 2分钟版本\n\n${doc.selfIntroFull}\n\n### 30秒版本\n\n${doc.selfIntroShort}\n\n`;
  md += `## ❓ 反问问题库\n\n`;
  doc.questionsToAsk?.forEach((group: any) => {
    md += `### ${group.category}\n\n`;
    group.questions?.forEach((q: string) => { md += `- ${q}\n`; });
    md += '\n';
  });
  md += `## ⚠️ 难点应对策略\n\n`;
  doc.difficultAnswers?.forEach((item: any) => {
    md += `### ${item.scenario}\n\n${item.formula}\n\n`;
  });
  return md;
}
