import { useState, useRef } from 'react';
import { Rocket, Sparkles, Mic, Save, Layout, Download, ClipboardList, CircleCheck, FilePlus, ScrollText, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResumeStore } from '../stores/resumeStore';
import type { InterviewScript } from '../stores/resumeStore';
import { api } from '../lib/api';

// 可照抄的排版模板脚手架：用户改成自己的版式，保留 {{占位符}} 即可
const EXAMPLE_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{{name}} · {{targetTitle}}</title>
<style>
  /* 在这里写你自己简历模板的版式/配色/字体，越像你的原模板越好 */
  body { font-family: "Source Han Serif SC", "Noto Serif CJK SC", serif; margin: 24px; color: #1a1a1a; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 12px; }
  section { margin: 14px 0; }
  .sec-title { font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; }
</style>
</head>
<body>
  <header>
    <h1>{{name}} {{englishName}}</h1>
    <div class="meta">{{targetTitle}} ｜ {{phone}} ｜ {{email}} ｜ {{location}}</div>
  </header>

  <section>
    <div class="sec-title">个人简介</div>
    <p>{{summary}}</p>
  </section>

  <section>
    <div class="sec-title">核心数据</div>
    <div>{{highlights}}</div>
  </section>

  <section>
    <div class="sec-title">工作经历</div>
    <div>{{experience}}</div>
  </section>

  <section>
    <div class="sec-title">技能</div>
    <div>{{skills}}</div>
  </section>

  <section>
    <div class="sec-title">教育背景</div>
    <div>{{education}}</div>
  </section>

  <section>
    <div class="sec-title">证书</div>
    <div>{{certifications}}</div>
  </section>

  <section>
    <div class="sec-title">待补充数据</div>
    <div>{{missingData}}</div>
  </section>
</body>
</html>`;

// M3/M4 交付面板：定制简历生成 → 排版预览/导出 → 面试准备 → 整单存档 Obsidian
export default function ResumeDeliverPanel() {
  const store = useResumeStore();
  const [notes, setNotes] = useState('');
  const tplRef = useRef<HTMLInputElement>(null);

  const ready = store.jdText.trim().length >= 10 && store.resumeText.trim().length >= 10;

  // M3 定制简历
  const handleTailor = async () => {
    if (!ready) return;
    store.setPhase('tailoring');
    store.setError(null);
    try {
      const tailored = await api.tailorResume(store.jdText, store.resumeText, store.jdAnalysis || undefined, store.match || undefined);
      store.setTailored(tailored);
      store.setLayout(null); // 旧排版失效
    } catch (err: any) {
      store.setError(`定制简历生成失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  // M3 排版（确定性）— 有用户模板则按模板出，没有则默认版式
  const handleLayout = async () => {
    if (!store.tailored) return;
    store.setPhase('tailoring');
    store.setError(null);
    try {
      const layout = await api.layoutResume(
        store.tailored,
        store.resumeTemplateHtml || undefined
      );
      store.setLayout(layout);
    } catch (err: any) {
      store.setError(`排版生成失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  // 上传用户自己的排版模板（.html，含 {{占位符}}）
  const handleTemplateFile = async (file: File) => {
    const text = await file.text();
    if (!text.includes('{{')) {
      alert('模板里没找到 {{占位符}}。至少需要 {{name}} / {{targetTitle}} / {{experience}} 等，可点「下载模板示例」看写法。');
      return;
    }
    store.setResumeTemplate(text, file.name);
    store.setLayout(null); // 模板变了，旧排版失效
  };

  const clearTemplate = () => {
    store.clearResumeTemplate();
    store.setLayout(null);
  };

  // 下载可照抄的模板示例（占位符脚手架）
  const downloadTemplateExample = () => {
    const sample = EXAMPLE_TEMPLATE;
    const blob = new Blob([sample], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '简历模板示例.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 下载排版 HTML（浏览器可直接打印为 PDF）
  const downloadHtml = () => {
    if (!store.layout) return;
    const blob = new Blob([store.layout.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = store.layout.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // M4 面试准备（复用 /api/prep/generate，自动存档）
  const handlePrep = async () => {
    if (!ready) return;
    store.setPhase('preparing');
    store.setError(null);
    try {
      const prep = await api.generatePrep(store.jdText, store.resumeText);
      store.setPrep(prep);
    } catch (err: any) {
      store.setError(`面试准备生成失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  // M5 面试逐字稿（LLM，不造假：缺数据留 [待补充]）
  const [copied, setCopied] = useState(false);
  const handleInterviewScript = async () => {
    if (!ready) return;
    store.setPhase('interview-script');
    store.setError(null);
    try {
      const script = await api.generateInterviewScript(
        store.jdText,
        store.resumeText,
        store.jdAnalysis || undefined,
        store.match || undefined
      );
      store.setInterviewScript(script as InterviewScript);
    } catch (err: any) {
      store.setError(`面试逐字稿生成失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  // 逐字稿导出 Markdown / 复制全文
  const buildScriptMarkdown = (sc: InterviewScript): string => {
    const lines: string[] = [];
    lines.push(`# ${sc.title || '模拟面试逐字稿'}`, '');
    const m = sc.meta || {};
    if (m.format || m.duration) lines.push(`> ${[m.format, m.duration].filter(Boolean).join(' · ')}`, '');
    if (m.focus?.length) {
      lines.push('**面试官最可能深挖**：');
      m.focus.forEach((f) => lines.push(`- ${f}`));
      lines.push('');
    }
    if (sc.selfIntro?.script) {
      lines.push('## 开场 · 自我介绍', '');
      if (sc.selfIntro.prompt) lines.push(`**面试官**：${sc.selfIntro.prompt}`, '');
      lines.push(`**候选人**：${sc.selfIntro.script}`, '');
    }
    (sc.rounds || []).forEach((r) => {
      lines.push(`## ${r.name || '问答'}`, '');
      (r.turns || []).forEach((t, i) => {
        lines.push(`### Q${i + 1}｜${t.question}`, '');
        lines.push(`**候选人参考回答**：${t.answer || ''}`, '');
        (t.followUps || []).forEach((f, j) => {
          lines.push(`> 追问 ${j + 1}｜${f.question}`, `> ${f.answer || ''}`, '');
        });
        if (t.tip) lines.push(`_提示：${t.tip}_`, '');
      });
    });
    if (sc.questionsToAsk?.length) {
      lines.push('## 你的反问', '');
      sc.questionsToAsk.forEach((q) => lines.push(`- ${q}`));
      lines.push('');
    }
    if (sc.pitfalls?.length) {
      lines.push('## 高风险 / 陷阱题', '');
      sc.pitfalls.forEach((p) => lines.push(`- ${p}`));
      lines.push('');
    }
    if (sc.tips?.length) {
      lines.push('## 备考注意', '');
      sc.tips.forEach((t) => lines.push(`- ${t}`));
    }
    return lines.join('\n');
  };

  const copyScript = async () => {
    const sc = store.interviewScript;
    if (!sc) return;
    try {
      await navigator.clipboard.writeText(buildScriptMarkdown(sc));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard 不可用时静默 */
    }
  };

  const downloadScript = () => {
    const sc = store.interviewScript;
    if (!sc) return;
    const md = buildScriptMarkdown(sc);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `面试逐字稿-${(sc.meta?.format || 'interview').replace(/[\/\s]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // M4 整条流水线存档
  const handleArchive = async () => {
    if (!store.jdText.trim()) return;
    store.setPhase('archiving');
    store.setError(null);
    try {
      const res = await api.archiveResumeSession({
        jdText: store.jdText,
        jdAnalysis: store.jdAnalysis || undefined,
        match: store.match || undefined,
        tailored: store.tailored || undefined,
        interviewPrepSessionId: store.prep?.sessionId || undefined,
        interviewScriptSessionId: store.interviewScript?.sessionId || undefined,
        notes: notes.trim() || undefined,
      });
      store.setArchive(res);
    } catch (err: any) {
      store.setError(`存档失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  const t = store.tailored;
  const layout = store.layout;
  const prep = store.prep;
  const script = store.interviewScript;
  // 仅 M3/M4/M5 阶段视为"交付进行中"；M1 解析 / M2 匹配 不阻塞交付按钮
  const busy = store.phase === 'tailoring' || store.phase === 'preparing' || store.phase === 'interview-script' || store.phase === 'archiving';
  const canAct = ready && !busy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <div className="card !p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-ink flex items-center gap-2"><Rocket size={15} className="text-iron" /> 定制 & 交付</h3>
            <p className="text-xs text-iron mt-1">
              {ready ? '基于 JD + 简历生成定制简历、排版、面试准备，并存档到 Obsidian' : '需先填好 JD 与简历（各 ≥10 字）'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleTailor} disabled={!canAct} className="btn-primary !text-xs !px-3 !py-1.5">
              <span className="flex items-center gap-1.5">{store.phase === 'tailoring' ? '处理中…' : t ? <><Rocket size={13} /> 重新定制</> : <><Sparkles size={13} /> 生成定制简历</>}</span>
            </button>
            <button onClick={handlePrep} disabled={!canAct} className="btn-primary !text-xs !px-3 !py-1.5">
              <span className='flex items-center gap-1.5'>{store.phase === 'preparing' ? '生成中…' : prep ? '重新生成' : <><Mic size={13} /> 面试准备</>}</span>
            </button>
            <button onClick={handleInterviewScript} disabled={!canAct} className="btn-primary !text-xs !px-3 !py-1.5">
              <span className='flex items-center gap-1.5'>{store.phase === 'interview-script' ? '生成中…' : script ? '重新生成逐字稿' : <><ScrollText size={13} /> 面试逐字稿</>}</span>
            </button>
          </div>
        </div>

        {/* M3 定制简历 */}
        {store.phase === 'tailoring' && (
          <div className="space-y-3 border-t border pt-4">
            <div className="skel h-5 w-1/2" />
            <div className="skel h-4 w-full" />
            <div className="skel h-4 w-5/6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="skel h-16" />
              <div className="skel h-16" />
              <div className="skel h-16" />
              <div className="skel h-16" />
            </div>
            <div className="text-xs text-iron">正在生成定制简历（LLM · 不造假：缺数留 [待补充] 占位）…</div>
          </div>
        )}

        {t && (
          <div className="space-y-4 text-sm border-t border pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-ink">{t.name || '候选人'}</span>
              <span className="text-xs text-pulse">{t.targetTitle}</span>
              {(t.contact?.phone || t.contact?.email) && (
                <span className="text-xs text-iron">
                  {[t.contact.phone, t.contact.email, t.contact.location].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>

            {t.summary && <p className="text-mist">{t.summary}</p>}

            {t.highlights?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {t.highlights.slice(0, 4).map((h, i) => (
                  <div key={i} className="rounded-lg bg-pulse/5 border border-pulse/20 p-3">
                    <div className="text-lg font-bold text-pulse">
                      {h.value}{h.unit ? ` ${h.unit}` : ''}
                    </div>
                    <div className="text-xs text-iron mt-0.5">{h.label}</div>
                  </div>
                ))}
              </div>
            )}

            {t.experience?.filter((e) => e.bullets?.length).length > 0 && (
              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">定制后工作经历</div>
                <div className="space-y-3">
                  {t.experience.filter((e) => e.bullets?.length).map((e, i) => (
                    <div key={i} className="border-l-2 border-pulse/30 pl-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{e.role || e.company}</span>
                        {e.company && <span className="text-xs text-mist">@ {e.company}</span>}
                        {e.period && <span className="text-xs text-iron ml-auto">{e.period}</span>}
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {e.bullets.map((b, j) => (
                          <li key={j} className="text-mist text-sm leading-relaxed">
                            <span className="text-pulse mr-1">▸</span>
                            {renderWithPlaceholder(b)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {t.skills?.length > 0 && (
              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">技能</div>
                <div className="space-y-1.5">
                  {t.skills.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-pulse font-medium mr-2">{s.label}</span>
                      <span className="text-mist">{s.body}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 修改日志 */}
            {t.changes?.length > 0 && (
              <details className="rounded-lg border border p-3">
                <summary className="text-xs text-mist cursor-pointer">修改日志（{t.changes.length}）</summary>
                <ul className="mt-2 space-y-1.5 text-xs text-iron">
                  {t.changes.map((c, i) => (
                    <li key={i}>
                      <span className="text-ember">【{c.section}】</span>
                      {c.change} <span className="text-mist">— {c.reason}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* 待补充占位 */}
            {t.placeholders?.length > 0 && (
              <div className="rounded-lg border border-ember/30 bg-ember/10 p-3">
                <div className="text-xs text-ember font-medium mb-1.5">⚠️ {t.placeholders.length} 处需人工补数据（未造假，留占位）</div>
                <ul className="space-y-1 text-xs text-mist">
                  {t.placeholders.map((p, i) => (
                    <li key={i}><span className="text-ember">·</span> {p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 排版操作 */}
            <div className="space-y-2 pt-1">
              {/* 模板排版：上传自己的 .html 简历模板 */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border p-3 bg-void">
                <div className="flex-1 min-w-[180px]">
                  <div className="text-xs font-medium text-mist flex items-center gap-1.5"><FilePlus size={13} className="text-iron" /> 用你自己的简历模板排版</div>
                  <div className="text-[11px] text-iron mt-1">上传 .html 模板（占位符用双花括号包裹：{"{{name}}"} / {"{{experience}}"} / {"{{summary}}"} 等）；不传则用默认版式</div>
                </div>
                <input ref={tplRef} type="file" accept=".html,.htm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTemplateFile(f); e.target.value = ''; }} />
                <button onClick={() => tplRef.current?.click()} className="btn-secondary !text-xs !px-3 !py-1.5">
                  <span className="flex items-center gap-1.5"><FilePlus size={13} /> {store.resumeTemplateName ? '更换模板' : '上传模板'}</span>
                </button>
                <button onClick={downloadTemplateExample} className="btn-secondary !text-xs !px-3 !py-1.5">
                  <span className="flex items-center gap-1.5"><Download size={13} /> 下载模板示例</span>
                </button>
                {store.resumeTemplateName && (
                  <button onClick={clearTemplate} className="btn-secondary !text-xs !px-3 !py-1.5 text-ember">移除模板（用默认版式）</button>
                )}
              </div>
              {store.resumeTemplateName && (
                <div className="text-[11px] text-iron flex items-center gap-1.5">
                  <CircleCheck size={12} className="text-success" /> 已加载模板 <span className="text-mist font-medium">{store.resumeTemplateName}</span>，「生成排版」将按此模板出稿
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleLayout} className="btn-primary !text-xs !px-3 !py-1.5">
                  <span className='flex items-center gap-1.5'>{layout ? '重新排版' : <><Layout size={13} /> 生成排版</>}</span>
                </button>
                {layout && (
                  <>
                    <button onClick={downloadHtml} className="btn-secondary !text-xs !px-3 !py-1.5">下载 HTML（可打印为 PDF）</button>
                    {layout.usedTemplate && (
                      <span className="text-xs text-success">✓ 按你的模板排版</span>
                    )}
                    {layout.unfilledTokens && layout.unfilledTokens.length > 0 && (
                      <span className="text-xs text-ember">模板里这些占位没匹配到数据：{layout.unfilledTokens.join('、')}</span>
                    )}
                    {layout.placeholderCount > 0 && (
                      <span className="text-xs text-ember">含 {layout.placeholderCount} 处占位，补全后再出终稿</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 排版预览 iframe */}
            {layout && (
              <div className="rounded-lg overflow-hidden border border bg-white">
                <iframe
                  title="简历排版预览"
                  srcDoc={layout.html}
                  className="w-full h-[560px] border-0"
                />
              </div>
            )}
          </div>
        )}

        {/* M4 面试准备 */}
        {prep && (
          <div className="space-y-4 text-sm border-t border pt-4 mt-4">
            <div className="text-[13px] font-semibold text-mist">面试准备文档 <span className="text-iron normal-case">（{prep.sessionId}）</span></div>

            {prep.selfIntroShort && (
              <div>
                <div className="text-xs text-mist mb-1">60 秒自我介绍</div>
                <p className="text-mist bg-void border border rounded-lg p-3">{prep.selfIntroShort}</p>
              </div>
            )}

            {prep.questions?.length > 0 && (
              <div>
                <div className="text-xs text-mist mb-2">高概率问题（{prep.questions.length}）</div>
                <div className="space-y-2">
                  {prep.questions.slice(0, 8).map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        q.probability === '高' ? 'bg-error/15 text-error' : q.probability === '中' ? 'bg-ember/15 text-ember' : 'bg-void text-iron'
                      }`}>{q.probability}</span>
                      <span className="text-sm text-ink">{q.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prep.starStories?.length > 0 && (
              <details className="rounded-lg border border p-3">
                <summary className="text-xs text-mist cursor-pointer">⭐ STAR 故事（{prep.starStories.length}）</summary>
                <div className="mt-2 space-y-3">
                  {prep.starStories.map((s, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium text-ink mb-1">{s.name}</div>
                      <div className="text-iron">S：{s.situation} T：{s.task} A：{s.action} R：{s.result}</div>
                      {s.shortVersion && <div className="text-mist mt-1">60s 版：{s.shortVersion}</div>}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {prep.questionsToAsk?.length > 0 && (
              <div>
                <div className="text-xs text-mist mb-2">反问清单</div>
                <ul className="space-y-1">
                  {prep.questionsToAsk.flatMap((g) => g.questions).map((q, i) => (
                    <li key={i} className="text-sm text-mist"><span className="text-pulse mr-1">·</span>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* M5 面试逐字稿 */}
        {store.phase === 'interview-script' && (
          <div className="space-y-3 border-t border pt-4 mt-4">
            <div className="flex items-center gap-2">
              <ScrollText size={15} className="text-iron" />
              <span className="text-[13px] font-semibold text-mist">面试逐字稿生成中</span>
            </div>
            <div className="skel h-4 w-1/2" />
            <div className="skel h-16 w-full" />
            <div className="skel h-4 w-3/4" />
            <div className="skel h-20 w-full" />
            <div className="text-xs text-iron">正在撰写模拟面试逐字稿（LLM · 不造假：缺数据留 [待补充]）…</div>
          </div>
        )}

        {script && (
          <div className="space-y-5 text-sm border-t border pt-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[13px] font-semibold text-ink flex items-center gap-2">
                <ScrollText size={15} className="text-pulse" />
                {script.title || '模拟面试逐字稿'}
                {script.sessionId && (
                  <span className="text-[10px] text-iron font-normal">已存档 {script.sessionId}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyScript} className="btn-secondary !text-xs !px-2.5 !py-1">
                  <span className="flex items-center gap-1">
                    {copied ? <><Check size={12} className="text-success" /> 已复制</> : <><Copy size={12} /> 复制</>}
                  </span>
                </button>
                <button onClick={downloadScript} className="btn-secondary !text-xs !px-2.5 !py-1">
                  <span className="flex items-center gap-1"><Download size={12} /> 导出 .md</span>
                </button>
              </div>
            </div>

            {script.meta && (script.meta.format || script.meta.duration) && (
              <div className="flex flex-wrap gap-2">
                {script.meta.format && <span className="text-xs px-2 py-1 rounded-full border border text-mist">{script.meta.format}</span>}
                {script.meta.duration && <span className="text-xs px-2 py-1 rounded-full border border text-mist">预计 {script.meta.duration}</span>}
              </div>
            )}

            {script.meta?.focus?.length > 0 && (
              <div>
                <div className="text-xs text-mist uppercase tracking-wider mb-2">面试官最可能深挖</div>
                <div className="flex flex-wrap gap-1.5">
                  {script.meta.focus.map((f, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full border border-pulse/40 text-pulse bg-pulse/10">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {script.selfIntro?.script && (
              <div className="rounded-lg border border p-3 bg-void">
                <div className="text-xs text-mist uppercase tracking-wider mb-2">开场 · 自我介绍（逐字稿）</div>
                {script.selfIntro.prompt && (
                  <div className="text-sm text-iron mb-2">面试官：{script.selfIntro.prompt}</div>
                )}
                <p className="text-sm text-ink leading-relaxed">{renderWithPlaceholder(script.selfIntro.script)}</p>
              </div>
            )}

            {script.rounds?.map((r, ri) => (
              <div key={ri}>
                <div className="text-xs text-mist uppercase tracking-wider mb-2">{r.name || `轮次 ${ri + 1}`}</div>
                <div className="space-y-3">
                  {r.turns?.map((turn, ti) => (
                    <div key={ti} className="rounded-lg border border p-3">
                      <div className="text-[11px] text-iron mb-1.5">Q{ri * 10 + ti + 1}</div>
                      <div className="text-sm text-ink font-medium mb-2">{turn.question}</div>
                      <div className="rounded bg-void border border p-2.5">
                        <div className="text-[11px] text-iron mb-1">参考回答</div>
                        <p className="text-[13px] text-mist leading-relaxed">{renderWithPlaceholder(turn.answer)}</p>
                      </div>
                      {turn.followUps?.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {turn.followUps.map((f, fi) => (
                            <div key={fi} className="rounded border border-dashed border p-2.5 ml-3">
                              <div className="text-[12px] text-ink font-medium mb-1">追问：{f.question}</div>
                              <p className="text-[12px] text-iron leading-relaxed">{renderWithPlaceholder(f.answer)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {turn.tip && (
                        <div className="mt-2 text-[11px] text-ember bg-ember/10 border border-ember/20 rounded p-2">
                          提示：{turn.tip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {script.questionsToAsk?.length > 0 && (
              <div>
                <div className="text-xs text-mist uppercase tracking-wider mb-2">你的反问（逐字稿）</div>
                <ul className="space-y-1.5">
                  {script.questionsToAsk.map((q, i) => (
                    <li key={i} className="text-[13px] text-ink"><span className="text-pulse mr-1.5">·</span>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {script.pitfalls?.length > 0 && (
              <div>
                <div className="text-xs text-mist uppercase tracking-wider mb-2">高风险 / 陷阱题</div>
                <ul className="space-y-1.5">
                  {script.pitfalls.map((p, i) => (
                    <li key={i} className="text-[13px] text-ember"><span className="mr-1.5">▲</span>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {script.tips?.length > 0 && (
              <div>
                <div className="text-xs text-mist uppercase tracking-wider mb-2">备考注意</div>
                <ul className="space-y-1.5">
                  {script.tips.map((tp, i) => (
                    <li key={i} className="text-[13px] text-mist"><span className="text-pulse mr-1.5">✓</span>{tp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* M4 存档 */}
        <div className="border-t border pt-4 mt-4">
          <div className="text-[13px] font-semibold text-mist mb-2 flex items-center gap-1.5"><Save size={14} className="text-iron" /> 整单存档到 Obsidian</div>
          <div className="flex flex-wrap gap-2 items-start">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="备注（可选，如：本单已补 GMV 数据…）"
              className="flex-1 min-w-[200px] bg-void border border rounded-lg px-3 py-2 text-xs text-ink placeholder:text-iron focus:outline-none focus:border-pulse/50"
            />
            <button onClick={handleArchive} disabled={store.phase === 'archiving'} className="btn-primary !text-xs !px-3 !py-1.5">
              {store.phase === 'archiving' ? '存档中…' : '存档本次工单'}
            </button>
          </div>
          {store.archive?.saved && (
            <div className="mt-3 text-xs text-success">
              ✓ 已存档：{store.archive.sessionId}
              {store.archive.hasPlaceholders && <span className="text-ember">（含待补占位）</span>}
              {store.archive.interviewPrepSessionId && (
                <span className="text-iron"> · 已关联面试准备 {store.archive.interviewPrepSessionId}</span>
              )}
              {store.archive.interviewScriptSessionId && (
                <span className="text-iron"> · 已关联逐字稿 {store.archive.interviewScriptSessionId}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 把 bullet 里的 [待补充: xxx] 高亮渲染
function renderWithPlaceholder(text: string) {
  const parts = text.split(/(\[待补充[:：][^\]]+\])/g);
  return parts.map((p, i) =>
    /^\[待补充/.test(p) ? (
      <span key={i} className="text-ember bg-ember/10 border border-ember/30 rounded px-1 text-xs">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
