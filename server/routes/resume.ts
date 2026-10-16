import { Hono } from 'hono';
import { readSettings, createSessionFile } from '../services/obsidian.js';
import {
  analyzeJD,
  parseResume,
  matchResume,
  tailorResume,
  generateInterviewScript,
} from '../services/resumeService.js';
import { renderResumeHtml } from '../services/resumeLayout.js';
import { renderWithTemplate } from '../services/templateLayout.js';
import type {
  JdAnalyzeRequest,
  ResumeParseRequest,
  MatchRequest,
  TailorRequest,
  LayoutRequest,
  ResumeSessionPayload,
  InterviewScriptRequest,
} from '../types.js';

export const resumeRoute = new Hono();

// ① JD 解析
resumeRoute.post('/analyze-jd', async (c) => {
  try {
    const { jdText } = await c.req.json<JdAnalyzeRequest>();
    if (!jdText || !jdText.trim()) {
      return c.json({ error: 'jdText 不能为空' }, 400);
    }
    const settings = await readSettings();
    const analysis = await analyzeJD(jdText, settings.apiKey || undefined, settings.model || undefined);
    return c.json(analysis);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ② 简历结构化解析
resumeRoute.post('/parse', async (c) => {
  try {
    const { resumeText } = await c.req.json<ResumeParseRequest>();
    if (!resumeText || !resumeText.trim()) {
      return c.json({ error: 'resumeText 不能为空' }, 400);
    }
    const settings = await readSettings();
    const parsed = await parseResume(resumeText, settings.apiKey || undefined, settings.model || undefined);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ③ 简历 × JD 匹配分析（M2）
resumeRoute.post('/match', async (c) => {
  try {
    const { jdText, resumeText, jdAnalysis } = await c.req.json<MatchRequest>();
    if (!jdText || !jdText.trim()) return c.json({ error: 'jdText 不能为空' }, 400);
    if (!resumeText || !resumeText.trim()) return c.json({ error: 'resumeText 不能为空' }, 400);
    const settings = await readSettings();
    const report = await matchResume(
      { jdText, resumeText, jdAnalysis },
      settings.apiKey || undefined,
      settings.model || undefined
    );
    return c.json(report);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ④ 定制简历生成（M3，LLM，不造假）
resumeRoute.post('/tailor', async (c) => {
  try {
    const { resumeText, jdText, jdAnalysis, match } = await c.req.json<TailorRequest>();
    if (!resumeText || !resumeText.trim()) return c.json({ error: 'resumeText 不能为空' }, 400);
    if (!jdText || !jdText.trim()) return c.json({ error: 'jdText 不能为空' }, 400);
    const settings = await readSettings();
    const tailored = await tailorResume(
      { resumeText, jdText, jdAnalysis, match },
      settings.apiKey || undefined,
      settings.model || undefined
    );
    return c.json(tailored);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ④½ 面试逐字稿（M5，LLM，不造假：缺数据留 [待补充] 占位；生成即自动存档到 Obsidian）
resumeRoute.post('/interview-script', async (c) => {
  try {
    const { jdText, resumeText, jdAnalysis, match } = await c.req.json<InterviewScriptRequest>();
    if (!jdText || !jdText.trim()) return c.json({ error: 'jdText 不能为空' }, 400);
    if (!resumeText || !resumeText.trim()) return c.json({ error: 'resumeText 不能为空' }, 400);
    const settings = await readSettings();
    const script = await generateInterviewScript(
      { jdText, resumeText, jdAnalysis, match },
      settings.apiKey || undefined,
      settings.model || undefined
    );

    // 生成即存档：独立工单（id 加 -script 后缀，避免与 M4 简历工单 / M4 prep 冲突）
    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `${today}-script-${Date.now()}`;
    const markdown = buildInterviewScriptMarkdown(script, jdAnalysis?.role || '');
    await createSessionFile(
      {
        id: `${sessionId}`,
        date: today,
        company: jdAnalysis?.company || '',
        position: jdAnalysis?.role || script.title || '',
        type: 'resume',
        tags: ['面试逐字稿', '模拟面试'],
      },
      markdown
    );

    return c.json({ ...script, sessionId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 逐字稿 → Obsidian Markdown（对话体，可直接打印/背诵）
function buildInterviewScriptMarkdown(s: any, role: string): string {
  let md = `# 🎬 面试逐字稿${s.title ? `：${s.title}` : ''}\n\n`;
  md += `> 岗位：${role || '（未指定）'}${s.meta?.format ? `｜${s.meta.format}` : ''}${s.meta?.duration ? `｜预计 ${s.meta.duration}` : ''}\n\n`;

  if (s.meta?.focus?.length) {
    md += `## 面试官最可能深挖\n\n`;
    s.meta.focus.forEach((f: string) => md += `- ${f}\n`);
    md += `\n`;
  }

  if (s.selfIntro?.script) {
    md += `## 开场 · 自我介绍\n\n`;
    if (s.selfIntro.prompt) md += `**面试官**：${s.selfIntro.prompt}\n\n`;
    md += `**候选人**：${s.selfIntro.script}\n\n`;
  }

  (s.rounds || []).forEach((r: any) => {
    md += `## ${r.name || '问答'}\n\n`;
    (r.turns || []).forEach((t: any, i: number) => {
      md += `### Q${i + 1}｜${t.question}\n\n`;
      md += `**候选人参考回答**：\n\n${t.answer || ''}\n\n`;
      (t.followUps || []).forEach((f: any, j: number) => {
        md += `> **追问 ${j + 1}**：${f.question}\n>\n`;
        md += f.answer?.split('\n').map((line: string) => `> ${line}`).join('\n');
        md += `\n\n`;
      });
      if (t.tip) md += `💡 提示：${t.tip}\n\n`;
    });
  });

  if (s.questionsToAsk?.length) {
    md += `## 你的反问\n\n`;
    s.questionsToAsk.forEach((q: string) => md += `- ${q}\n`);
    md += `\n`;
  }

  if (s.pitfalls?.length) {
    md += `## 高风险 / 陷阱题\n\n`;
    s.pitfalls.forEach((p: string) => md += `- ${p}\n`);
    md += `\n`;
  }

  if (s.tips?.length) {
    md += `## 备考注意\n\n`;
    s.tips.forEach((t: string) => md += `- ${t}\n`);
  }

  return md;
}

// ⑤ 排版渲染（M3，确定性，无 LLM）
resumeRoute.post('/layout', async (c) => {
  try {
    const { resume, templateHtml } = await c.req.json<LayoutRequest>();
    if (!resume || !resume.targetTitle && !resume.name) {
      return c.json({ error: 'resume 不能为空' }, 400);
    }
    // 有用户模板 → 确定性填充；否则回退默认 kami 版式
    const result = templateHtml?.trim()
      ? renderWithTemplate(resume, templateHtml)
      : renderResumeHtml(resume);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ⑥ 整条流水线存档到 Obsidian（M4）
// 面试准备文档由既有 POST /api/prep/generate 生成并独立存档；
// 这里把本次"JD 解析 → 匹配 → 定制简历 → 修改日志/占位"整单存档，并关联面试准备工单号。
resumeRoute.post('/session', async (c) => {
  try {
    const payload = await c.req.json<ResumeSessionPayload>();
    if (!payload.jdText || !payload.jdText.trim()) {
      return c.json({ error: 'jdText 不能为空' }, 400);
    }

    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `${today}-resume-${Date.now()}`;
    const markdown = buildResumeSessionMarkdown(payload);
    const filePath = await createSessionFile(
      {
        id: sessionId,
        date: today,
        company: payload.jdAnalysis?.company || '',
        position: payload.jdAnalysis?.role || payload.tailored?.targetTitle || '',
        type: 'resume',
        tags: ['简历定制', payload.tailored?.placeholders?.length ? '含占位待补' : '已完善'],
      },
      markdown
    );

    return c.json({
      sessionId,
      filePath,
      saved: true,
      hasPlaceholders: (payload.tailored?.placeholders?.length || 0) > 0,
      interviewPrepSessionId: payload.interviewPrepSessionId || null,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ─────────────────────────────────────────────
// Markdown 拼装（存档正文）
// ─────────────────────────────────────────────
function buildResumeSessionMarkdown(p: ResumeSessionPayload): string {
  let md = `# 📑 简历定制工单\n\n`;
  md += `> 岗位：${p.jdAnalysis?.role || '（未解析）'}${p.jdAnalysis?.company ? ` @ ${p.jdAnalysis.company}` : ''}\n\n`;

  md += `## 1. 岗位 JD\n\n${p.jdText.replace(/\n/g, '\n> ')}\n\n`;

  if (p.jdAnalysis) {
    const j = p.jdAnalysis;
    md += `## 2. JD 解析\n\n`;
    md += `- **匹配难度**：${j.matchBand}｜**投递优先级**：${j.applicationPriority}\n`;
    md += `- **硬性要求**：${j.mustHave?.join('；') || '—'}\n`;
    md += `- **加分项**：${j.niceToHave?.join('；') || '—'}\n`;
    md += `- **雇主最看重**：${j.top3Focus?.join('；') || '—'}\n`;
    if (j.redFlags?.length) md += `- **⚠️ 风险信号**：${j.redFlags.join('；')}\n`;
    if (j.strategy) md += `- **投递策略**：${j.strategy}\n`;
    md += `\n`;
  }

  if (p.match) {
    const m = p.match;
    md += `## 3. 匹配分析\n\n`;
    md += `- **匹配度**：${m.score}/100\n`;
    md += `- **已命中关键词**：${m.hitKeywords?.join('、') || '—'}\n`;
    md += `- **缺失关键词**：${m.missingKeywords?.join('、') || '（无）'}\n\n`;
    if (m.suggestions?.length) {
      md += `### 修改建议（按优先级）\n\n`;
      [...m.suggestions]
        .sort((a, b) => a.priority.localeCompare(b.priority))
        .forEach((s) => {
          md += `- **[${s.priority}]** ${s.suggested}\n`;
          if (s.reason) md += `  - 理由：${s.reason}\n`;
        });
      md += `\n`;
    }
  }

  if (p.tailored) {
    const t = p.tailored;
    md += `## 4. 定制简历\n\n`;
    if (t.summary) md += `**个人简介**：${t.summary}\n\n`;
    md += t.experience
      ?.filter((e) => e.bullets?.length)
      .map((e) => `### ${e.company || e.role || '经历'}${e.period ? `（${e.period}）` : ''}\n${e.bullets.map((b) => `- ${b}`).join('\n')}\n`)
      .join('') || '';
    if (t.skills?.length) {
      md += `**技能**：${t.skills.map((s) => `${s.label}：${s.body}`).join('；')}\n\n`;
    }
    md += `## 5. 修改日志\n\n`;
    (t.changes || []).forEach((ch) => {
      md += `- 【${ch.section}】${ch.change} — ${ch.reason}\n`;
    });
    md += `\n`;
    if (t.placeholders?.length) {
      md += `## 6. ⚠️ 待补充数据（人工填写）\n\n`;
      t.placeholders.forEach((ph) => md += `- [ ] ${ph}\n`);
      md += `\n`;
    }
  }

  if (p.interviewPrepSessionId) {
    md += `## 关联面试准备\n\n`;
    md += `> 面试准备文档：${p.interviewPrepSessionId}\n\n`;
  }

  if (p.notes) md += `## 备注\n\n${p.notes}\n`;

  return md;
}
