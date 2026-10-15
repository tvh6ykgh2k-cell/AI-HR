import { motion } from 'framer-motion';

interface Props { coverage: { s: number; t: number; a: number; r: number }; onClose: () => void; }

export default function StarPanel({ coverage, onClose }: Props) {
  const dims = [
    { key: 's', label: 'Situation', desc: '场景背景', value: coverage.s },
    { key: 't', label: 'Task', desc: '任务职责', value: coverage.t },
    { key: 'a', label: 'Action', desc: '个人行动', value: coverage.a },
    { key: 'r', label: 'Result', desc: '量化结果', value: coverage.r },
  ];
  const weakest = dims.reduce((min, d) => d.value < min.value ? d : min);

  return (
    <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} transition={{ ease: [0.16,1,0.3,1], duration: 0.4 }}
      className="fixed right-0 top-0 h-full w-80 bg-surface border-l shadow-2xl p-6 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-6"><h3 className="font-bold">📊 STAR 覆盖</h3><button onClick={onClose} className="text-iron hover:text-ink">✕</button></div>
      {dims.map((dim) => (
        <div key={dim.key} className="mb-4">
          <div className="flex justify-between text-sm mb-1"><span>{dim.label}</span><span className="text-iron">{dim.desc}</span></div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${dim.value * 100}%` }} className={`h-full rounded-full ${dim.value < 0.5 ? 'bg-ember' : 'bg-pulse'}`} />
          </div>
        </div>
      ))}
      <div className="mt-6 p-4 bg-surface rounded-lg"><p className="text-sm text-mist">完整度最低的是 <span className="text-ember font-bold">{weakest.label}</span>，面试官会重点追问此维度。</p></div>
    </motion.div>
  );
}
