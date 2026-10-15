import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

interface SessionMeta { id: string; date: string; company: string; position: string; type: string; }

// ── Hero spotlight ──
function useSpotlight() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  }, []);
  return { ref, pos, onMove };
}

// ── Tilt card ──
function TiltCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glow, setGlow] = useState({ x: 0.5, y: 0.5 });

  const onMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ rx: (y - 0.5) * -8, ry: (x - 0.5) * 8 });
    setGlow({ x, y });
  };

  const onLeave = () => { setTilt({ rx: 0, ry: 0 }); setGlow({ x: 0.5, y: 0.5 }); };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border border-[rgba(255,255,255,.06)] transition-shadow duration-500 ${className}`}
      style={{
        transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease-out, box-shadow 0.4s ease',
        boxShadow: tilt.rx !== 0
          ? `0 40px 80px rgba(0,0,0,.5), 0 0 120px rgba(61,214,200,.08)`
          : '0 20px 60px rgba(0,0,0,.4)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(380px circle at ${glow.x * 100}% ${glow.y * 100}%, rgba(61,214,200,.07), transparent 50%)`,
          opacity: tilt.rx !== 0 ? 1 : 0,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── Reveal text ──
const revealVariants = {
  hidden: { opacity: 0, y: 42, rotateX: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Page ──
export default function HomePage() {
  const nav = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const spotlight = useSpotlight();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => {});
    setHeroVisible(true);
  }, []);

  const features = [
    { icon: '🎤', title: '语音交互', desc: 'Web Speech API 原生支持，按住说话松开发送' },
    { icon: '📋', title: '截图识岗', desc: '粘贴 BOSS 直聘截图，AI 自动提取岗位要求' },
    { icon: '📊', title: 'STAR 评分', desc: '每题实时评估回答结构，针对性追问补短板' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <div
        ref={spotlight.ref}
        onMouseMove={spotlight.onMove}
        className="relative min-h-[90dvh] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Spotlight glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(640px circle at ${spotlight.pos.x * 100}% ${spotlight.pos.y * 100}%, rgba(61,214,200,.06), transparent 50%)`,
          }}
        />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[.018]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 text-center max-w-3xl px-6">
          {/* Eyebrow — the only one on the page */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={heroVisible ? { opacity: 1 } : {}}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-xs text-iron uppercase tracking-[.22em] mb-6"
          >
            AI-Powered Interview Practice
          </motion.p>

          {/* Headline — staggered word reveal */}
          <h1 className="text-[clamp(40px,8vw,88px)] font-extrabold leading-[.92] tracking-[-.03em] mb-6">
            {['面', '试', '不', '再', '是', '盲', '盒'].map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                initial="hidden"
                animate={heroVisible ? 'visible' : 'hidden'}
                variants={revealVariants}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-mist max-w-lg mx-auto leading-relaxed mb-10"
          >
            AI 面试官洞悉岗位，追问细节，实时评分。
            <br />
            把每一次练习变成进步的阶梯。
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-4 justify-center"
          >
            <button onClick={() => nav('/interview/new')} className="btn-primary text-base px-8 py-3.5">
              开始模拟面试
            </button>
            <button onClick={() => nav('/prep/new')} className="btn-secondary text-base px-8 py-3.5">
              生成面试准备
            </button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroVisible ? { opacity: 1 } : {}}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border border-[rgba(255,255,255,.12)] flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-1 h-2 rounded-full bg-mist"
            />
          </div>
        </motion.div>
      </div>

      {/* ── MODE CARDS ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Interview card */}
          <TiltCard
            onClick={() => nav('/interview/new')}
            className="p-8 flex flex-col justify-between min-h-[320px] bg-[linear-gradient(160deg,#0F1F29_0%,#0A151C_100%)]"
          >
            <div>
              <div className="text-5xl mb-6">🎙️</div>
              <h2 className="text-3xl font-bold tracking-[-.02em] mb-3">模拟面试</h2>
              <p className="text-mist text-sm leading-relaxed max-w-sm">
                AI 面试官根据岗位 JD 动态提问，语音或文字作答，每轮回答实时 STAR 评分。面试记录自动保存到 Obsidian。
              </p>
            </div>
            <div className="flex items-center gap-3 text-pulse text-sm font-medium mt-6">
              进入模拟面试 <span className="text-base">→</span>
            </div>
          </TiltCard>

          {/* Prep card */}
          <TiltCard
            onClick={() => nav('/prep/new')}
            className="p-8 flex flex-col justify-between min-h-[320px] bg-[linear-gradient(160deg,#1A2218_0%,#0F1710_100%)]"
          >
            <div>
              <div className="text-5xl mb-6">📝</div>
              <h2 className="text-3xl font-bold tracking-[-.02em] mb-3">面试准备</h2>
              <p className="text-mist text-sm leading-relaxed">
                粘贴 JD 和简历，AI 生成 STAR 故事银行、预测问题库、自我介绍脚本。带着准备上战场。
              </p>
            </div>
            <div className="flex items-center gap-3 text-ember text-sm font-medium mt-6">
              生成准备文档 <span className="text-base">→</span>
            </div>
          </TiltCard>

          {/* Resume card */}
          <TiltCard
            onClick={() => nav('/resume')}
            className="p-8 flex flex-col justify-between min-h-[320px] bg-[linear-gradient(160deg,#1C1830_0%,#0F0D18_100%)]"
          >
            <div>
              <div className="text-5xl mb-6">📑</div>
              <h2 className="text-3xl font-bold tracking-[-.02em] mb-3">简历定制</h2>
              <p className="text-mist text-sm leading-relaxed">
                上传简历 + 岗位 JD，AI 解析岗位要求与你的匹配度，输出定制方向与修改建议。
              </p>
            </div>
            <div className="flex items-center gap-3 text-pulse text-sm font-medium mt-6">
              定制简历 <span className="text-base">→</span>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <div key={f.title} className="card !bg-[#0C0F14] !p-6 hover:border-[rgba(255,255,255,.12)] transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-mist leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── RECENT SESSIONS ── */}
      {sessions.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 pb-32">
          <h3 className="text-xs text-iron uppercase tracking-[.2em] mb-5">最近记录</h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <motion.button
                key={s.id}
                onClick={() => nav(s.type === 'prep' ? `/prep/${s.id}` : `/interview/${s.id}`)}
                whileHover={{ x: 4 }}
                className="w-full text-left bg-surface border rounded-lg px-4 py-3.5 flex items-center gap-3.5 hover:border-[rgba(255,255,255,.14)] transition-colors"
              >
                <span className="text-lg">{s.type === 'prep' ? '📝' : '📄'}</span>
                <div>
                  <div className="text-sm font-medium">{s.company} {s.position}</div>
                  <div className="text-xs text-iron mt-0.5">{s.date} · {s.type === 'prep' ? '面试准备' : '模拟面试'}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-[rgba(255,255,255,.05)] py-8 text-center">
        <button
          onClick={() => nav('/settings')}
          className="text-iron hover:text-mist text-sm transition-colors"
        >
          ⚙️ 面试官人格设置
        </button>
        <p className="text-xs text-iron/60 mt-3">AI 面试官 · 本地运行 · 数据安全</p>
      </footer>
    </div>
  );
}
