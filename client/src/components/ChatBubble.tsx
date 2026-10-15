import { motion } from 'framer-motion';
import { Crosshair, Bot, User } from 'lucide-react';

interface Props {
  role: 'interviewer' | 'user';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  starScore?: any;
}

export default function ChatBubble({ role, content, timestamp, isStreaming, starScore }: Props) {
  const isAI = role === 'interviewer';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[75%] ${isAI ? 'bg-surface' : 'bg-blue-50'} rounded-2xl px-5 py-3 border ${isAI ? 'border' : 'border-blue-100'}`}>
        <div className="flex items-center gap-2 mb-1"><span className="text-[13px] flex items-center gap-1 text-ink">{isAI ? <><Bot size={13} /> 面试官</> : <><User size={13} /> 你</>}</span><span className="text-xs text-iron font-mono">{timestamp}</span></div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}{isStreaming && <span className="inline-block w-1.5 h-4 bg-pulse ml-0.5 animate-pulse rounded-sm" />}</p>
        {starScore && (
          <div className="mt-3 pt-3 border-t border">
            <div className="text-xs text-iron mb-1 flex items-center gap-1"><Crosshair size={12} /> STAR 评估</div>
            <div className="grid grid-cols-4 gap-2 text-xs mb-1">
              {(['s','t','a','r'] as const).map((dim) => (
                <div key={dim} className={starScore[dim].complete ? 'text-pulse' : 'text-ember'}>{dim.toUpperCase()}: {starScore[dim].complete ? '✅' : '⚠️'}</div>
              ))}
            </div>
            <p className="text-xs text-mist">{starScore.overall}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
