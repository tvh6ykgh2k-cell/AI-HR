import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  MessagesSquare, FileText, FileCheck2, ArrowRight, Activity, Clock, CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';

interface SessionMeta { id: string; date: string; company: string; position: string; type: string; }

// 企业后台 · 工作台：高密度、线性图标、标准卡片 + 表格，零装饰
export default function HomePage() {
  const nav = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => {});
  }, []);

  const entries = [
    {
      icon: MessagesSquare,
      title: '模拟面试',
      desc: 'AI 面试官按 JD 动态追问，语音/文字作答，实时 STAR 评分。',
      cta: '进入模拟面试',
      to: '/interview/new',
    },
    {
      icon: FileText,
      title: '面试准备',
      desc: '生成 STAR 故事银行、预测问题库、自我介绍脚本。',
      cta: '生成准备文档',
      to: '/prep/new',
    },
    {
      icon: FileCheck2,
      title: '简历定制',
      desc: '简历 + JD 匹配，输出定制简历、专业排版与面试准备。',
      cta: '定制简历',
      to: '/resume',
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">工作台</h1>
          <p className="text-[13px] text-iron mt-1">管理你的面试练习与简历定制工单</p>
        </div>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-pulse/10 text-pulse flex items-center justify-center"><Activity size={18} /></div>
          <div>
            <div className="text-lg font-semibold text-ink leading-none">{sessions.length}</div>
            <div className="text-[12px] text-iron mt-1">累计工单</div>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-success/10 text-success flex items-center justify-center"><CheckCircle2 size={18} /></div>
          <div>
            <div className="text-lg font-semibold text-ink leading-none">M1–M4</div>
            <div className="text-[12px] text-iron mt-1">全流水线就绪</div>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-ember/10 text-ember flex items-center justify-center"><Clock size={18} /></div>
          <div>
            <div className="text-lg font-semibold text-ink leading-none">
              {sessions[0]?.date?.slice(0, 10) || '—'}
            </div>
            <div className="text-[12px] text-iron mt-1">最近活跃</div>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <section>
        <h2 className="text-[13px] font-semibold text-mist mb-3">功能模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.to} onClick={() => nav(m.to)} className="card text-left hover:shadow-card-hover flex flex-col !p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-md bg-void text-pulse flex items-center justify-center"><Icon size={18} /></div>
                  <span className="text-[14px] font-semibold text-ink">{m.title}</span>
                </div>
                <p className="text-[13px] text-mist leading-relaxed flex-1">{m.desc}</p>
                <div className="flex items-center gap-1 text-[13px] text-pulse font-medium mt-4">
                  {m.cta} <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 最近记录 */}
      <section>
        <h2 className="text-[13px] font-semibold text-mist mb-3">最近记录</h2>
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-void/60 text-iron text-left">
                <th className="px-4 py-2.5 font-medium">类型</th>
                <th className="px-4 py-2.5 font-medium">岗位 / 公司</th>
                <th className="px-4 py-2.5 font-medium">日期</th>
                <th className="px-4 py-2.5 font-medium w-20" />
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-iron">暂无记录，从上方功能模块开始</td></tr>
              ) : (
                sessions.slice(0, 6).map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-void/40 transition-colors cursor-pointer"
                      onClick={() => nav(s.type === 'prep' ? `/prep/${s.id}` : `/interview/${s.id}`)}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] ${s.type === 'prep' ? 'bg-success/10 text-success' : 'bg-pulse/10 text-pulse'}`}>
                        {s.type === 'prep' ? '面试准备' : '模拟面试'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink">{s.company} {s.position}</td>
                    <td className="px-4 py-2.5 text-iron">{s.date}</td>
                    <td className="px-4 py-2.5 text-right text-iron"><ArrowRight size={14} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
