import { useNavigate, useParams } from 'react-router-dom';
import { usePrepStore } from '../stores/prepStore';
import { useState } from 'react';

export default function PrepResultPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const store = usePrepStore();
  const [activeSection, setActiveSection] = useState('competencies');
  const doc = store.prepDoc;

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-mist">加载准备文档...</div>
      </div>
    );
  }

  const sections = [
    { key: 'competencies', label: '📊 能力分析' },
    { key: 'questions', label: '📋 预测问题', count: doc.questions?.length },
    { key: 'stories', label: '📖 STAR 故事库', count: doc.starStories?.length },
    { key: 'intro', label: '🎤 自我介绍' },
    { key: 'askQuestions', label: '❓ 反问问题' },
    { key: 'difficult', label: '⚠️ 难点应对' },
  ];

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r p-4 flex flex-col shrink-0">
        <h2 className="font-bold mb-4">📝 面试准备文档</h2>
        <nav className="flex-1 space-y-1">
          {sections.map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.key ? 'bg-pulse/15 text-pulse' : 'text-mist hover:bg-surface'}`}>
              {s.label} {s.count != null && <span className="text-iron text-xs">({s.count})</span>}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t space-y-2">
          <div className="text-xs text-iron">💾 已保存到 Obsidian</div>
          <button onClick={() => { usePrepStore.getState().reset(); nav('/interview/new'); }}
            className="btn-primary w-full !text-sm !py-2">开始模拟面试 →</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'competencies' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📊 核心能力维度</h2>
            <div className="space-y-4">
              {doc.competencies?.map((comp: any, i: number) => (
                <div key={i} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{comp.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${comp.weight === '高' ? 'bg-[rgba(239,68,68,.15)] text-error' : comp.weight === '中' ? 'bg-[rgba(240,160,80,.15)] text-ember' : 'bg-surface text-iron'}`}>{comp.weight}优先级</span>
                  </div>
                  <p className="text-sm text-mist">{comp.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'questions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📋 预测问题库 ({doc.questions?.length || 0} 题)</h2>
            {['技术深挖','项目经验','行为题','系统设计','开放题'].map(cat => {
              const qs = doc.questions?.filter((q: any) => q.category === cat) || [];
              if (qs.length === 0) return null;
              return (
                <div key={cat} className="mb-6">
                  <h3 className="text-lg font-medium mb-3">{cat} ({qs.length})</h3>
                  <div className="space-y-2">
                    {qs.map((q: any, i: number) => (
                      <div key={i} className="bg-surface rounded-lg px-4 py-3 flex items-start gap-3 border">
                        <span className={`text-xs mt-0.5 px-2 py-0.5 rounded-full shrink-0 ${q.probability === '高' ? 'bg-[rgba(239,68,68,.15)] text-error' : q.probability === '中' ? 'bg-[rgba(240,160,80,.15)] text-ember' : 'bg-surface text-iron'}`}>{q.probability}</span>
                        <span className="text-sm">{q.question}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSection === 'stories' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📖 STAR 故事银行 ({doc.starStories?.length || 0} 个)</h2>
            <div className="space-y-6">
              {doc.starStories?.map((story: any, i: number) => (
                <div key={i} className="card">
                  <h3 className="text-lg font-medium mb-1">{story.name}</h3>
                  <div className="flex gap-2 mb-3">
                    {story.coversCompetencies?.map((c: string) => <span key={c} className="text-xs bg-pulse/10 text-pulse px-2 py-0.5 rounded-full">{c}</span>)}
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-iron">Situation</dt><dd className="mt-1">{story.situation}</dd></div>
                    <div><dt className="text-iron">Task</dt><dd className="mt-1">{story.task}</dd></div>
                    <div><dt className="text-iron">Action</dt><dd className="mt-1">{story.action}</dd></div>
                    <div><dt className="text-iron">Result</dt><dd className="mt-1">{story.result}</dd></div>
                  </dl>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs bg-surface rounded p-2 border"><span className="text-iron">60s精简版：</span>{story.shortVersion}</div>
                    <div className="text-xs bg-surface rounded p-2 border"><span className="text-iron">15s一句话：</span>{story.oneLiner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'intro' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">🎤 自我介绍脚本</h2>
            <div className="card mb-4"><h3 className="font-medium mb-2">2分钟完整版</h3><p className="text-sm text-mist leading-relaxed">{doc.selfIntroFull}</p></div>
            <div className="card"><h3 className="font-medium mb-2">30秒电梯游说</h3><p className="text-sm text-mist leading-relaxed">{doc.selfIntroShort}</p></div>
          </div>
        )}

        {activeSection === 'askQuestions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">❓ 反问问题库</h2>
            {doc.questionsToAsk?.map((group: any, i: number) => (
              <div key={i} className="card mb-4"><h3 className="font-medium mb-3">{group.category}</h3>
                <ul className="space-y-2">{group.questions?.map((q: string, j: number) => <li key={j} className="text-sm text-mist flex gap-2"><span className="text-pulse">•</span> {q}</li>)}</ul>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'difficult' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">⚠️ 难点应对策略</h2>
            {doc.difficultAnswers?.map((item: any, i: number) => (
              <div key={i} className="card mb-4"><h3 className="font-medium mb-2">{item.scenario}</h3><p className="text-sm text-mist leading-relaxed">{item.formula}</p></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
