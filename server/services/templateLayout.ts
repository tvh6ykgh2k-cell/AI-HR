import type { TailoredResume, LayoutResult } from '../types.js';

// ─────────────────────────────────────────────
// 模板排版（确定性，无 LLM）
// 用户自带 .html 简历模板，其中用 {{占位符}} 标数据位；
// 这里把 TailoredResume 数据填进去，保持用户自己的版式/样式。
// 不带模板则回退 kami 默认版式（renderResumeHtml）。
// ─────────────────────────────────────────────

// HTML 转义（数据来自 LLM/用户上传，必须转义防注入）
function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 把内联 [待补充: xxx] / **强调** 转成占位/高亮 span（与 kami 版一致）
function inline(s: string): string {
  let out = esc(s || '').trim();
  out = out.replace(/\[待补充[:：]\s*([^\]]+)\]/g, '<span class="tpl-ph">待补充：$1</span>');
  out = out.replace(/\[待补充\]/g, '<span class="tpl-ph">待补充</span>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<span class="tpl-hl">$1</span>');
  return out;
}

function safeName(s: string): string {
  return (s || 'resume').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'resume';
}

// 各 section 渲染成中性 HTML 片段（继承模板自身样式；未知 class 也能正常堆叠）
function expFragment(resume: TailoredResume): string {
  return (resume.experience || [])
    .filter((e) => (e?.bullets?.length ?? 0) > 0)
    .map((e, i) => {
      const head = esc(e.company || e.role || `经历 ${i + 1}`) +
        (e.role && e.company ? ` · ${esc(e.role)}` : '') +
        (e.period ? `<span class="tpl-period">${esc(e.period)}</span>` : '');
      const bullets = (e.bullets || [])
        .filter((b) => b && b.trim())
        .map((b) => `<li>${inline(b)}</li>`)
        .join('');
      return `<div class="tpl-exp">${head ? `<div class="tpl-exp-head">${head}</div>` : ''}${
        bullets ? `<ul class="tpl-exp-bullets">${bullets}</ul>` : ''
      }</div>`;
    })
    .join('');
}

function skillsFragment(resume: TailoredResume): string {
  return (resume.skills || [])
    .filter((s) => s.label || s.body)
    .map((s) => `<div class="tpl-skill">${esc(s.label)}<span class="tpl-skill-body">${inline(s.body)}</span></div>`)
    .join('');
}

function listFragment(items: string[] | undefined, cls: string): string {
  return (items || []).filter(Boolean).map((r) => `<div class="${cls}">${esc(r)}</div>`).join('');
}

function metricsFragment(resume: TailoredResume): string {
  return (resume.highlights || []).slice(0, 4).map((h) => {
    const raw = h.value || '';
    const val = raw.includes('待补充')
      ? `<span class="tpl-ph">${esc(raw.replace(/\[|\]/g, ''))}</span>`
      : esc(raw);
    return `<div class="tpl-metric"><span class="tpl-metric-value">${val}${h.unit ? `<span class="tpl-unit">${esc(h.unit)}</span>` : ''}</span><span class="tpl-metric-label">${esc(h.label || '')}</span></div>`;
  }).join('');
}

function missingFragment(resume: TailoredResume): string {
  const list = resume.placeholders || [];
  if (!list.length) return '';
  return `<ul class="tpl-missing">${list.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`;
}

// 统计 [待补充] 数量（与前端提示一致）
function countPlaceholders(resume: TailoredResume): number {
  const chunks: string[] = [
    resume.summary || '',
    ...(resume.experience || []).flatMap((e) => e.bullets ?? []),
    ...(resume.highlights || []).map((h) => `${h.value} ${h.unit ?? ''} ${h.label ?? ''}`),
  ];
  return chunks.filter((c) => /待补充/.test(c)).length;
}

export function renderWithTemplate(resume: TailoredResume, templateHtml: string): LayoutResult {
  const contact = resume.contact || {};
  const map: Record<string, string> = {
    name: resume.name || '',
    englishName: resume.englishName || '',
    targetTitle: resume.targetTitle || '',
    phone: contact.phone || '',
    email: contact.email || '',
    location: contact.location || '',
    website: contact.website || '',
    summary: inline(resume.summary || ''),
    experience: expFragment(resume),
    skills: skillsFragment(resume),
    education: listFragment(resume.education, 'tpl-edu'),
    certifications: listFragment(resume.certifications, 'tpl-cert'),
    highlights: metricsFragment(resume),
    missingData: missingFragment(resume),
    // 兼容别名
    role: resume.targetTitle || '',
    姓名: resume.name || '',
    求职意向: resume.targetTitle || '',
    电话: contact.phone || '',
    邮箱: contact.email || '',
    简介: inline(resume.summary || ''),
  };

  const filled = new Set<string>();
  const unfilled: string[] = [];

  let html = templateHtml.replace(/\{\{\s*([a-zA-Z_一-龥]+)\s*\}\}/g, (m, key) => {
    if (key in map && map[key] !== '') {
      filled.add(key);
      return map[key];
    }
    if (key in map) {
      filled.add(key);
      return ''; // 有该 key 但值为空 → 留空
    }
    unfilled.push(key);
    return m; // 未知占位符原样保留，方便用户发现
  });

  // 片段模板（没有 <body> 壳）才补完整文档；完整文档直接注入
  const isFragment = !/<body[\s>]/i.test(html);
  if (isFragment) {
    html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head><meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${esc(
      resume.name || '简历'
    )} · ${esc(resume.targetTitle || '')}</title>\n<meta name="author" content="${esc(resume.name || '')}">\n</head>\n<body>\n` +
      html +
      `\n</body>\n</html>`;
  }

  // 注入打印按钮 + 最小占位/高亮样式（tpl-* 前缀，避免与用户样式冲突）
  const css = `.tpl-ph{background:#fff3bf;color:#8a6d1a;padding:0 4px;border-radius:3px;font-size:.9em}
.tpl-hl{font-weight:700}
.tpl-exp{margin-bottom:14px}
.tpl-exp-head{font-weight:700;margin-bottom:4px}
.tpl-period{font-weight:400;color:#666;margin-left:8px}
.tpl-exp-bullets{margin:4px 0 0 18px;padding:0}
.tpl-skill{margin:2px 0}
.tpl-skill-body{color:#555;margin-left:8px}
.tpl-metric{display:inline-block;margin:4px 14px 4px 0}
.tpl-metric-value{font-weight:700}
.tpl-metric-label{color:#666;font-size:.85em;margin-left:4px}
.tpl-missing li{color:#8a6d1a}
@page{margin:14mm}`;
  html = html.replace(/<head([^>]*)>/i, `<head$1>\n<style>${css}</style>`);

  const script = `\n<script>
window.addEventListener('DOMContentLoaded',function(){var b=document.createElement('button');
b.textContent='🖨 打印 / 存 PDF';
b.style.cssText='position:fixed;top:12px;right:12px;z-index:99;background:#1d3557;color:#fff;border:none;border-radius:4px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:sans-serif';
b.onclick=function(){window.print()};document.body.appendChild(b)});
</script>\n`;
  html = html.replace(/<\/body>/i, script + '</body>');

  return {
    html,
    fileName: `简历_${safeName(resume.targetTitle || resume.name || '')}.html`,
    placeholderCount: countPlaceholders(resume),
    usedTemplate: true,
    unfilledTokens: unfilled,
  };
}