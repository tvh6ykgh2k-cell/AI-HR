import type { TailoredResume, LayoutResult } from '../types.js';
import { KAMI_RESUME_CSS } from './resumeLayout.css.js';

// ─────────────────────────────────────────────
// ⑤ 排版渲染（确定性，无 LLM）
// 把 TailoredResume 渲染成 kami 版式（羊皮纸/宋体/A4）的可交付 HTML
// 可下载 / 浏览器打印为 PDF。[待补充] 用高亮占位标出，提示人工补数据。
// ─────────────────────────────────────────────

// HTML 转义（简历内容来自 LLM/用户上传，必须转义防注入）
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 渲染正文：转义 + 把 [待补充: xxx] 变成高亮占位 span，把 **强调** 变成 .hl 高亮
function renderInline(s: string): string {
  let out = esc(s || '').trim();
  // [待补充: 缺XX] / [待补充: 缺XX] → 占位样式
  out = out.replace(/\[待补充[:：]\s*([^\]]+)\]/g, '<span class="placeholder">待补充：$1</span>');
  out = out.replace(/\[待补充\]/g, '<span class="placeholder">待补充</span>');
  // **xx** → 高亮
  out = out.replace(/\*\*([^*]+)\*\*/g, '<span class="hl">$1</span>');
  return out;
}

// 统计正文里 [待补充...] 占位数量（用于前端提示"还有 N 处要补数据"）
function countPlaceholders(resume: TailoredResume): number {
  const chunks: string[] = [
    resume.summary || '',
    ...resume.experience?.flatMap((e) => e.bullets ?? []) ?? [],
    ...resume.highlights?.map((h) => `${h.value} ${h.unit ?? ''} ${h.label ?? ''}`) ?? [],
  ];
  return chunks.filter((c) => /待补充/.test(c)).length;
}

// 文件名安全化
function safeName(s: string): string {
  return (s || 'resume').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'resume';
}

function jobBlock(e: TailoredResume['experience'][number], i: number): string {
  const name = e.company || e.role || `经历 ${i + 1}`;
  const head = `
    <div class="job-head">
      <div><span class="job-name serif">${esc(name)}</span>${e.role && e.company ? `<span class="job-kind">· ${esc(e.role)}</span>` : ''}</div>
      <div class="job-period">${esc(e.period || '')}${e.tag ? `<span class="job-role"> · ${esc(e.tag)}</span>` : ''}</div>
    </div>`;
  const rows = e.bullets
    ?.filter((b) => b && b.trim())
    .map((b) => `<div class="job-text">${renderInline(b)}</div>`)
    .join('');
  return `<div class="job">${head}${rows ? `<div class="job-bullets">${rows}</div>` : ''}</div>`;
}

export function renderResumeHtml(resume: TailoredResume): LayoutResult {
  const contact = resume.contact || {};
  const contactParts = [
    contact.phone ? `<a href="tel:${esc(contact.phone)}">${esc(contact.phone)}</a>` : '',
    contact.email ? `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : '',
    contact.website ? `<a href="${esc(contact.website)}" target="_blank">${esc(contact.website)}</a>` : '',
  ].filter(Boolean);
  const contactHtml =
    contactParts
      .map((c, i) => `${c}${i < contactParts.length - 1 ? '<span class="sep">·</span>' : ''}`)
      .join('') +
    (contact.location ? `<span class="sep">·</span><span class="loc">${esc(contact.location)}</span>` : '');

  const metricsHtml = (resume.highlights || [])
    .slice(0, 4)
    .map(
      (h) =>
        `<div class="metric"><span class="metric-value serif">${
          h.value.includes('待补充')
            ? `<span class="placeholder">${esc(h.value.replace(/\[|\]/g, ''))}</span>`
            : esc(h.value)
        }${h.unit ? `<span class="unit">${esc(h.unit)}</span>` : ''}</span><span class="metric-label">${esc(h.label || '')}</span></div>`
    )
    .join('');

  const experienceHtml = (resume.experience || [])
    .filter((e) => (e?.bullets?.length ?? 0) > 0)
    .map((e, i) => jobBlock(e, i))
    .join('');

  const skillsHtml = (resume.skills || [])
    .filter((s) => s.label || s.body)
    .map(
      (s) =>
        `<div class="skill-row"><span class="skill-label">${esc(s.label)}</span><span class="skill-body">${renderInline(s.body)}</span></div>`
    )
    .join('');

  const eduHtml = (resume.education || [])
    .filter(Boolean)
    .map(
      (row) =>
        `<div class="edu-row"><span class="school serif">${esc(row)}</span></div>`
    )
    .join('');

  const certHtml = (resume.certifications || [])
    .filter(Boolean)
    .map((c) => `<div class="edu-row"><span class="school serif">${esc(c)}</span></div>`)
    .join('');

  // 按内容是否存在决定 section 渲染（无内容则整段省略，保持干净）
  const hasExperience = !!experienceHtml;
  const hasSkills = !!skillsHtml;
  const hasEdu = !!eduHtml;
  const hasCert = !!certHtml;

  const body = `
<div class="header">
  <div>
    <div class="name serif">${esc(resume.name || '候选人')}${
      resume.englishName ? `<span class="alias">${esc(resume.englishName)}</span>` : ''
    }</div>
  </div>
  <div class="contact">
    <span class="role">${esc(resume.targetTitle || '求职意向')}</span><br>
    ${contactHtml || '<span class="loc">联系方式待补充</span>'}
  </div>
</div>

${metricsHtml ? `<div class="metrics">${metricsHtml}</div>` : ''}

<section>
  <div class="section-title">个人简介</div>
  <div class="summary">${renderInline(resume.summary || '')}</div>
</section>

${
  hasExperience
    ? `<section><div class="section-title">工作经历</div>${experienceHtml}</section>`
    : ''
}
${
  hasSkills
    ? `<section><div class="section-title">技能</div>${skillsHtml}</section>`
    : ''
}
${
  hasEdu
    ? `<section><div class="section-title">教育背景</div>${eduHtml}</section>`
    : ''
}
${
  hasCert
    ? `<section><div class="section-title">证书</div>${certHtml}</section>`
    : ''
}`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(resume.name || '简历')} · ${esc(resume.targetTitle || '简历')}</title>
<meta name="author" content="${esc(resume.name || '')}">
<meta name="generator" content="AI-HR · kami 版式">
<style>${KAMI_RESUME_CSS}</style>
</head>
<body>
${body}
<script>
// 打印为 PDF 按钮（交付用）
window.addEventListener('DOMContentLoaded', function () {
  var btn = document.createElement('button');
  btn.textContent = '🖨 打印 / 存 PDF';
  btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99;background:var(--brand);color:#fff;border:none;border-radius:4px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:sans-serif';
  btn.onclick = function () { window.print(); };
  document.body.appendChild(btn);
});
</script>
</body>
</html>`;

  return {
    html,
    fileName: `简历_${safeName(resume.targetTitle || resume.name || '')}.html`,
    placeholderCount: countPlaceholders(resume),
  };
}
