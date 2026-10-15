import { useState } from 'react';
import { motion } from 'framer-motion';
import { useResumeStore } from '../stores/resumeStore';
import { api } from '../lib/api';

// M3/M4 交付面板：定制简历生成 → 排版预览/导出 → 面试准备 → 整单存档 Obsidian
export default function ResumeDeliverPanel() {
  const store = useResumeStore();
  const [notes, setNotes] = useState('');

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

  // M3 排版（确定性）
  const handleLayout = async () => {
    if (!store.tailored) return;
    store.setPhase('tailoring');
    store.setError(null);
    try {
      const layout = await api.layoutResume(store.tailored);
      store.setLayout(layout);
    } catch (err: any) {
      store.setError(`排版生成失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
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
  // 仅 M3/M4 阶段视为"交付进行中"；M1 解析 / M2 匹配 不阻塞交付按钮
  const busy = store.phase === 'tailoring' || store.phase === 'preparing' || store.phase === 'archiving';
  const canAct = ready && !busy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <div className="bg-surface border border-[rgba(255,255,255,.08)] rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">🚀 定制 & 交付（M3 · M4）</h3>
            <p className="text-xs text-iron mt-1">
              {ready ? '基于 JD + 简历生成定制简历、排版、面试准备，并存档到 Obsidian' : '需先填好 JD 与简历（各 ≥10 字）'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleTailor} disabled={!canAct} className="btn-primary text-xs px-4 py-2">
              {store.phase === 'tailoring' ? '处理中…' : t ? '重新定制' : '✨ 生成定制简历（M3）'}
            </button>
            <button onClick={handlePrep} disabled={!canAct} className="btn-primary text-xs px-4 py-2">
              {store.phase === 'preparing' ? '生成中…' : prep ? '重新生成' : '🎤 面试准备（M4）'}
            </button>
          </div>
        </div>

        {/* M3 定制简历 */}
        {t && (
          <div className="space-y-4 text-sm border-t border-[rgba(255,255,255,.08)] pt-4">
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
              <details className="rounded-lg border border-[rgba(255,255,255,.08)] p-3">
                <summary className="text-xs text-mist cursor-pointer">📝 修改日志（{t.changes.length}）</summary>
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
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button onClick={handleLayout} className="btn-primary text-xs px-4 py-2">
                {layout ? '🔄 重新排版' : '🎨 排版（kami 版式）'}
              </button>
              {layout && (
                <>
                  <button onClick={downloadHtml} className="btn-secondary text-xs px-4 py-2">⬇️ 下载 HTML（可打印 PDF）</button>
                  {layout.placeholderCount > 0 && (
                    <span className="text-xs text-ember">含 {layout.placeholderCount} 处占位，补全后再出终稿</span>
                  )}
                </>
              )}
            </div>

            {/* 排版预览 iframe */}
            {layout && (
              <div className="rounded-lg overflow-hidden border border-[rgba(255,255,255,.1)] bg-white">
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
          <div className="space-y-4 text-sm border-t border-[rgba(255,255,255,.08)] pt-4 mt-4">
            <div className="text-mist text-xs uppercase tracking-wider">🎤 面试准备文档 <span className="text-iron normal-case">（{prep.sessionId}）</span></div>

            {prep.selfIntroShort && (
              <div>
                <div className="text-xs text-mist mb-1">60 秒自我介绍</div>
                <p className="text-mist bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-lg p-3">{prep.selfIntroShort}</p>
              </div>
            )}

            {prep.questions?.length > 0 && (
              <div>
                <div className="text-xs text-mist mb-2">高概率问题（{prep.questions.length}）</div>
                <div className="space-y-2">
                  {prep.questions.slice(0, 8).map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        q.probability === '高' ? 'bg-error/15 text-error' : q.probability === '中' ? 'bg-ember/15 text-ember' : 'bg-[rgba(255,255,255,.08)] text-iron'
                      }`}>{q.probability}</span>
                      <span className="text-sm text-ink">{q.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prep.starStories?.length > 0 && (
              <details className="rounded-lg border border-[rgba(255,255,255,.08)] p-3">
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

        {/* M4 存档 */}
        <div className="border-t border-[rgba(255,255,255,.08)] pt-4 mt-4">
          <div className="text-mist text-xs uppercase tracking-wider mb-2">💾 整单存档到 Obsidian（M4）</div>
          <div className="flex flex-wrap gap-2 items-start">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="备注（可选，如：本单已补 GMV 数据…）"
              className="flex-1 min-w-[200px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-xs text-ink placeholder:text-iron focus:outline-none focus:border-pulse/50"
            />
            <button onClick={handleArchive} disabled={store.phase === 'archiving'} className="btn-primary text-xs px-4 py-2">
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
