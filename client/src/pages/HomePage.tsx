import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface SessionMeta { id: string; date: string; company: string; position: string; type: string; }

// 商业 SaaS 首页：干净、标准卡片、无装饰性动效
export default function HomePage() {
  const nav = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => {});
  }, []);

  const modes = [
    {
      icon: '🎙️',
      title: '模拟面试',
      desc: 'AI 面试官根据岗位 JD 动态提问，语音或文字作答，每轮回答实时 STAR 评分，记录自动归档。',
      cta: '进入模拟面试',
      to: '/interview/new',
    },
    {
      icon: '📝',
      title: '面试准备',
      desc: '粘贴 JD 和简历，生成 STAR 故事银行、预测问题库、自我介绍脚本，带着准备上面试。',
      cta: '生成准备文档',
      to: '/prep/new',
    },
    {
      icon: '📑',
      title: '简历定制',
      desc: '上传简历 + 岗位 JD，分析匹配度并输出定制简历、专业排版与面试准备，全流程存档。',
      cta: '定制简历',
      to: '/resume',
    },
  ];

  return (
    <div className="min-h-screen bg-void">
      {/* 顶栏 */}
      <header className="border-b bg-surface">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <span className="w-7 h-7 rounded-lg bg-pulse text-white flex items-center justify-center text-sm">面</span>
            AI 面试助手
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <button onClick={() => nav('/interview/new')} className="px-3 py-1.5 rounded-md text-mist hover:text-ink hover:bg-void transition-colors">模拟面试</button>
            <button onClick={() => nav('/prep/new')} className="px-3 py-1.5 rounded-md text-mist hover:text-ink hover:bg-void transition-colors">面试准备</button>
            <button onClick={() => nav('/resume')} className="px-3 py-1.5 rounded-md text-mist hover:text-ink hover:bg-void transition-colors">简历定制</button>
            <button onClick={() => nav('/settings')} className="ml-2 px-3 py-1.5 rounded-md border text-mist hover:text-ink hover:bg-void transition-colors">设置</button>
          </nav>
        </div>
      </header>

      {/* 首屏 */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">把每一次面试准备，变成有把握的练习</h1>
        <p className="text-mist mt-3 max-w-2xl leading-relaxed">
          输入岗位 JD，AI 面试官实时追问、按 STAR 结构评分；简历与 JD 自动匹配，输出定制简历和面试准备文档，全流程归档。
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => nav('/interview/new')} className="btn-primary">开始模拟面试</button>
          <button onClick={() => nav('/resume')} className="btn-secondary">定制简历</button>
        </div>
      </section>

      {/* 功能模式卡片 */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((m) => (
            <button
              key={m.to}
              onClick={() => nav(m.to)}
              className="card text-left hover:shadow-card-hover flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-void flex items-center justify-center text-xl mb-4">{m.icon}</div>
              <h2 className="text-lg font-semibold text-ink mb-2">{m.title}</h2>
              <p className="text-sm text-mist leading-relaxed flex-1">{m.desc}</p>
              <div className="text-sm text-pulse font-medium mt-4">{m.cta} →</div>
            </button>
          ))}
        </div>
      </section>

      {/* 最近记录 */}
      {sessions.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <h3 className="text-sm font-semibold text-mist mb-3">最近记录</h3>
          <div className="card divide-y">
            {sessions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => nav(s.type === 'prep' ? `/prep/${s.id}` : `/interview/${s.id}`)}
                className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-void transition-colors"
              >
                <span className="text-lg">{s.type === 'prep' ? '📝' : '📄'}</span>
                <div>
                  <div className="text-sm font-medium text-ink">{s.company} {s.position}</div>
                  <div className="text-xs text-iron mt-0.5">{s.date} · {s.type === 'prep' ? '面试准备' : '模拟面试'}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t py-6 text-center">
        <p className="text-xs text-iron">AI 面试助手 · 本地运行 · 数据不出本机</p>
      </footer>
    </div>
  );
}
