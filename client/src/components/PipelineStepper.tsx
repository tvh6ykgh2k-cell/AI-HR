import { useResumeStore } from '../stores/resumeStore';

// 流水线状态轨：M1 输入解析 → M2 匹配 → M3 定制排版 → M4 准备存档
// finesse · product register：紧凑高密度，首屏可见进度，不做装饰性动效（仅 breath 呼吸点标记当前步）
type StepKey = 'm1' | 'm2' | 'm3' | 'm4';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'm1', label: 'M1 · 输入解析' },
  { key: 'm2', label: 'M2 · 匹配分析' },
  { key: 'm3', label: 'M3 · 定制排版' },
  { key: 'm4', label: 'M4 · 准备存档' },
];

export default function PipelineStepper() {
  const s = useResumeStore();
  const inputReady = s.resumeText.trim().length >= 10 && s.jdText.trim().length >= 10;

  const isDone = (key: StepKey): boolean => {
    switch (key) {
      case 'm1': return inputReady || Boolean(s.resumeParsed || s.jdAnalysis);
      case 'm2': return Boolean(s.match);
      case 'm3': return Boolean(s.tailored);
      case 'm4': return Boolean(s.archive?.saved);
    }
  };

  const currentKey: StepKey | null =
    s.phase === 'parsing-resume' || s.phase === 'parsing-jd' ? 'm1'
    : s.phase === 'matching' ? 'm2'
    : s.phase === 'tailoring' ? 'm3'
    : s.phase === 'preparing' || s.phase === 'archiving' ? 'm4'
    : null;

  return (
    <div
      aria-label="流水线进度"
      className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border bg-surface/60 px-4 py-3"
    >
      {STEPS.map((st, i) => {
        const done = isDone(st.key);
        const cur = currentKey === st.key;
        return (
          <div key={st.key} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <div aria-hidden className={`h-px w-4 sm:w-8 ${done ? 'bg-pulse/40' : 'bg-iron/40'}`} />
            )}
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                  done
                    ? 'border border-pulse/40 bg-pulse/15 text-pulse'
                    : cur
                      ? 'border border-pulse bg-pulse/20 text-ink ring-4 ring-pulse/15'
                      : 'border border bg-void text-iron'
                }`}
              >
                {done ? '✓' : cur ? <span className="animate-breath leading-none">●</span> : i + 1}
              </span>
              <span className={`text-xs whitespace-nowrap ${cur ? 'font-medium text-ink' : done ? 'text-mist' : 'text-iron'}`}>
                {st.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
