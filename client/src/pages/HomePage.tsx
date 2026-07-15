import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

interface SessionMeta { id: string; date: string; company: string; position: string; type: string; }

export default function HomePage() {
  const nav = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-bold mb-2"
      >
        🎯 今天想做什么？
      </motion.h1>
      <p className="text-mist mb-10">选择模式，开始你的面试之旅</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full mb-12">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => nav('/interview/new')}
          className="bg-gradient-to-br from-[#1B3D52] to-[#0F2A38] border border-[rgba(61,214,200,.15)] rounded-2xl p-8 text-left hover:border-[rgba(61,214,200,.3)] transition-all shadow-xl"
        >
          <div className="text-4xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold mb-2">模拟面试</h2>
          <p className="text-mist text-sm">
            AI 面试官实战 · 语音+文字交互 · 实时保存 Obsidian
          </p>
          <div className="mt-4 inline-block bg-[rgba(61,214,200,.15)] text-pulse rounded-full px-4 py-1 text-sm">
            进入 →
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => nav('/prep/new')}
          className="bg-gradient-to-br from-[#1B3520] to-[#0F2A1A] border border-[rgba(240,160,80,.15)] rounded-2xl p-8 text-left hover:border-[rgba(240,160,80,.3)] transition-all shadow-xl"
        >
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">面试准备</h2>
          <p className="text-mist text-sm">
            生成 STAR 故事库 · 预测面试问题 · 输出 Prep 文档
          </p>
          <div className="mt-4 inline-block bg-[rgba(240,160,80,.15)] text-ember rounded-full px-4 py-1 text-sm">
            进入 →
          </div>
        </motion.button>
      </div>

      {sessions.length > 0 && (
        <div className="max-w-2xl w-full">
          <h3 className="text-iron text-sm uppercase tracking-widest mb-3">最近记录</h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => nav(s.type === 'prep' ? `/prep/${s.id}` : `/interview/${s.id}`)}
                className="w-full text-left bg-surface border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-[rgba(255,255,255,.14)] transition-colors"
              >
                <span className="text-lg">{s.type === 'prep' ? '📝' : '📄'}</span>
                <div>
                  <div className="text-sm">{s.date} {s.company} {s.position}</div>
                  <div className="text-xs text-iron">{s.type === 'prep' ? '面试准备文档' : '模拟面试'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => nav('/settings')}
        className="mt-8 text-iron hover:text-mist text-sm transition-colors"
      >
        ⚙️ 设置面试官人格 & 连接配置
      </button>
    </div>
  );
}
