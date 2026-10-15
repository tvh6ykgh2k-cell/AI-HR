import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Target, BrainCircuit, ListChecks, BarChart3, Zap } from 'lucide-react';
import ImagePaste from '../components/ImagePaste';
import FileUpload from '../components/FileUpload';
import ResumeDeliverPanel from '../components/ResumeDeliverPanel';
import PipelineStepper from '../components/PipelineStepper';
import { useResumeStore } from '../stores/resumeStore';
import { api } from '../lib/api';

const BAND_META: Record<string, { label: string; cls: string }> = {
  strong: { label: '匹配友好', cls: 'text-success border-success/40 bg-success/10' },
  possible: { label: '有挑战', cls: 'text-ember border-ember/40 bg-ember/10' },
  weak: { label: '门槛较高', cls: 'text-error border-error/40 bg-error/10' },
};

const PRI_META: Record<string, { label: string; cls: string }> = {
  high: { label: '建议投递', cls: 'text-success' },
  medium: { label: '可考虑', cls: 'text-ember' },
  low: { label: '优先级低', cls: 'text-iron' },
};

function Section({ icon, title, children, right }: { icon?: React.ReactNode; title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="card !p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-ink flex items-center gap-2">
          {icon && <span className="text-iron">{icon}</span>}{title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Chip({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'pulse' | 'ember' | 'error' }) {
  const map = {
    default: 'border text-mist',
    pulse: 'border-pulse/40 text-pulse bg-pulse/10',
    ember: 'border-ember/40 text-ember bg-ember/10',
    error: 'border-error/40 text-error bg-error/10',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${map[tone]}`}>{children}</span>
  );
}

// 评分环（纯 SVG，无依赖）
function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c * (1 - pct / 100);
  const color = pct >= 75 ? 'var(--pulse)' : pct >= 50 ? 'var(--ember)' : 'var(--error)';
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#26262C" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(pct)}</span>
        <span className="text-[10px] text-iron uppercase tracking-wider">匹配度</span>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const store = useResumeStore();
  const [jdRecognizing, setJdRecognizing] = useState(false);

  const canAnalyzeJd = store.jdText.trim().length >= 10;
  const canParseResume = store.resumeText.trim().length >= 10;

  const handleJdImage = async (base64: string) => {
    setJdRecognizing(true);
    store.setError(null);
    try {
      const jd = await api.recognizeJD(base64);
      store.setJdText(jd.rawText || JSON.stringify(jd, null, 2));
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      setJdRecognizing(false);
    }
  };

  const handleAnalyzeJd = async () => {
    if (!canAnalyzeJd) return;
    store.setPhase('parsing-jd');
    store.setError(null);
    try {
      const analysis = await api.analyzeJD(store.jdText);
      store.setJdAnalysis(analysis);
    } catch (err: any) {
      store.setError(`JD 解析失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  const handleParseResume = async () => {
    if (!canParseResume) return;
    store.setPhase('parsing-resume');
    store.setError(null);
    try {
      const parsed = await api.parseResume(store.resumeText);
      store.setResumeParsed(parsed);
    } catch (err: any) {
      store.setError(`简历解析失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  const canMatch = canAnalyzeJd && canParseResume;
  const handleMatch = async () => {
    if (!canMatch) return;
    store.setPhase('matching');
    store.setError(null);
    try {
      // 若尚未解析 JD，先跑 analyzeJD 取关键词集，注入确定性关键词匹配；已解析则复用，避免重复 LLM 调用
      let analysis = store.jdAnalysis;
      if (!analysis) {
        analysis = await api.analyzeJD(store.jdText);
        store.setJdAnalysis(analysis);
      }
      const report = await api.matchResume(store.jdText, store.resumeText, analysis);
      store.setMatch(report);
    } catch (err: any) {
      store.setError(`匹配分析失败：${err.message}`);
    } finally {
      store.setPhase('idle');
    }
  };

  const jd = store.jdAnalysis;
  const m = store.match;

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">简历定制</h1>
          <p className="text-[13px] text-iron mt-1">简历 + 岗位 JD → 匹配分析 → 定制简历 / 排版 / 面试准备</p>
        </div>
        <button
          onClick={handleMatch}
          disabled={!canMatch || store.phase !== 'idle'}
          className="btn-primary"
          title={canMatch ? '' : '需先填好 JD 与简历'}
        >
          <span className="flex items-center gap-1.5">
            {store.phase === 'matching' ? '匹配分析中…' : <><Zap size={14} /> 匹配分析</>}
          </span>
        </button>
      </div>

      <PipelineStepper />

      {store.error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-error/30 bg-error/10 text-error text-sm">{store.error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左：简历 */}
        <Section icon={<FileText size={15} />} title="简历" right={canParseResume ? (
          <button onClick={handleParseResume} disabled={store.phase !== 'idle'} className="btn-primary !text-xs !px-3 !py-1.5">
            {store.phase === 'parsing-resume' ? '解析中…' : store.resumeParsed ? '重新解析' : '解析简历'}
          </button>
        ) : null}>
          <FileUpload
            title="上传或粘贴简历"
            accept=".pdf,.docx,.doc,.txt,.md"
            onText={(t) => store.setResumeText(t)}
            initialValue={store.resumeText}
            loading={store.phase === 'parsing-resume'}
          />
        </Section>

        {/* 右：JD */}
        <Section icon={<Target size={15} />} title="岗位 JD" right={canAnalyzeJd ? (
          <button onClick={handleAnalyzeJd} disabled={store.phase !== 'idle'} className="btn-primary !text-xs !px-3 !py-1.5">
            {store.phase === 'parsing-jd' ? '解析中…' : jd ? '重新解析' : '解析 JD'}
          </button>
        ) : null}>
          <div className="space-y-3">
            <ImagePaste onImage={handleJdImage} loading={jdRecognizing} />
            <FileUpload
              title="或直接粘贴 JD 文本"
              accept=".txt,.md"
              hint="支持 .txt / .md（或上方截图识别）"
              onText={(t) => store.setJdText(t)}
              initialValue={store.jdText}
            />
          </div>
        </Section>
      </div>

      {/* JD 解析结果 */}
      {jd && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <Section
            icon={<BrainCircuit size={15} />}
            title="JD 解析结果"
            right={
              <div className="flex items-center gap-2">
                <Chip tone="pulse">{BAND_META[jd.matchBand]?.label || jd.matchBand}</Chip>
                <Chip tone={jd.applicationPriority === 'high' ? 'default' : 'default'}>
                  <span className={PRI_META[jd.applicationPriority]?.cls}>
                    {PRI_META[jd.applicationPriority]?.label || jd.applicationPriority}
                  </span>
                </Chip>
              </div>
            }
          >
            <div className="space-y-5 text-sm">
              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">岗位 · {jd.role} {jd.company ? `@ ${jd.company}` : ''}</div>
              </div>

              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">关键词</div>
                <div className="flex flex-wrap gap-1.5">
                  {jd.keywords.map((k, i) => <Chip key={i} tone={i < 5 ? 'pulse' : 'default'}>{k}</Chip>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">硬性要求</div>
                  <ul className="space-y-1.5">
                    {jd.mustHave.map((m, i) => (
                      <li key={i} className="flex gap-2 text-ink"><span className="text-error">•</span>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">加分项</div>
                  <ul className="space-y-1.5">
                    {jd.niceToHave.length ? jd.niceToHave.map((m, i) => (
                      <li key={i} className="flex gap-2 text-mist"><span className="text-ember">·</span>{m}</li>
                    )) : <li className="text-iron">无</li>}
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">雇主最重视的 3 件事</div>
                <ol className="space-y-2">
                  {jd.top3Focus.map((f, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pulse/15 text-pulse text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">投递策略</div>
                <p className="text-ink bg-pulse/5 border border-pulse/20 rounded-lg p-3">{jd.strategy}</p>
              </div>

              {jd.redFlags.length > 0 && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">风险提示</div>
                  <ul className="space-y-1.5">
                    {jd.redFlags.map((r, i) => (
                      <li key={i} className="flex gap-2 text-ember"><span>⚠</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      )}

      {/* 简历解析结果 */}
      {store.resumeParsed && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        >
          <Section icon={<ListChecks size={15} />} title="简历解析结果">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="font-medium text-base text-ink">{store.resumeParsed.name || store.resumeParsed.title || '（未识别姓名/头衔）'}</div>
                {store.resumeParsed.title && <Chip tone="pulse">{store.resumeParsed.title}</Chip>}
              </div>

              {store.resumeParsed.summary && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-1.5">个人总结</div>
                  <p className="text-ink">{store.resumeParsed.summary}</p>
                </div>
              )}

              {store.resumeParsed.experience.length > 0 && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">工作经历（{store.resumeParsed.experience.length}）</div>
                  <div className="space-y-3">
                    {store.resumeParsed.experience.map((e, i) => (
                      <div key={i} className="border-l-2 border pl-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{e.role || e.company}</span>
                          {e.company && <span className="text-mist text-xs">@ {e.company}</span>}
                          {e.period && <span className="text-iron text-xs ml-auto">{e.period}</span>}
                        </div>
                        <ul className="mt-1.5 space-y-1">
                          {e.bullets.map((b, j) => (
                            <li key={j} className="flex gap-2 text-mist text-sm"><span className="text-pulse">·</span>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {store.resumeParsed.skills.length > 0 && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">技能</div>
                  <div className="flex flex-wrap gap-1.5">
                    {store.resumeParsed.skills.map((s, i) => <Chip key={i}>{s}</Chip>)}
                  </div>
                </div>
              )}

              {store.resumeParsed.education?.length ? (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">教育</div>
                  {store.resumeParsed.education.map((e, i) => <div key={i} className="text-mist">{e}</div>)}
                </div>
              ) : null}
            </div>
          </Section>
        </motion.div>
      )}

      {/* M2 匹配分析结果 */}
      {store.phase === 'matching' && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <Section icon={<BarChart3 size={15} />} title="匹配分析结果">
            <div className="flex items-center gap-4">
              <div className="skel h-24 w-24 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skel h-4 w-1/3" />
                <div className="skel h-6 w-2/3" />
                <div className="skel h-6 w-1/2" />
              </div>
            </div>
            <div className="skel mt-4 h-16 w-full" />
            <div className="text-xs text-iron mt-3">正在分析 JD 与简历匹配度…（含确定性关键词检测）</div>
          </Section>
        </motion.div>
      )}

      {m && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <Section icon={<BarChart3 size={15} />} title="匹配分析结果">
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-6">
                <ScoreRing score={m.score} />
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-1">关键词覆盖</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {m.hitKeywords.map((k, i) => <Chip key={i} tone="pulse">✓ {k}</Chip>)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.missingKeywords.length > 0 ? (
                      m.missingKeywords.map((k, i) => <Chip key={i} tone="error">✗ {k}</Chip>)
                    ) : m.hitKeywords.length > 0 ? (
                      <Chip>全部命中</Chip>
                    ) : (
                      <Chip tone="ember">未提取关键词（先「解析 JD」再匹配，可启用确定性检测）</Chip>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-mist text-xs uppercase tracking-wider mb-2">ATS 体检</div>
                <div className="space-y-2">
                  {m.atsChecks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 text-xs ${c.pass ? 'text-success' : 'text-error'}`}>
                        {c.pass ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="text-ink">{c.item}</span>
                        {c.note && <span className="text-mist"> — {c.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* gaps */}
              {m.gaps.length > 0 && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">内容缺口（岗位要但你简历没体现）</div>
                  <ul className="space-y-1.5">
                    {m.gaps.map((g, i) => (
                      <li key={i} className="flex gap-2 text-ember"><span>·</span>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* suggestions */}
              {m.suggestions.length > 0 && (
                <div>
                  <div className="text-mist text-xs uppercase tracking-wider mb-2">逐条修改建议</div>
                  <div className="space-y-3">
                    {m.suggestions.map((s) => (
                      <div key={s.id} className="border border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            s.priority === 'P0' ? 'bg-error/15 text-error'
                            : s.priority === 'P1' ? 'bg-ember/15 text-ember'
                            : 'bg-void text-mist'
                          }`}>{s.priority}</span>
                          <span className="text-xs text-iron">{s.id}</span>
                        </div>
                        {s.current && (
                          <div className="text-xs text-mist line-through decoration-iron mb-1">
                            现状：{s.current}
                          </div>
                        )}
                        <div className="text-sm text-ink">{s.suggested}</div>
                        {s.reason && <div className="text-xs text-iron mt-1.5">理由：{s.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      )}

      {/* M3/M4 定制 & 交付面板 */}
      <ResumeDeliverPanel />
    </div>
  );
}
