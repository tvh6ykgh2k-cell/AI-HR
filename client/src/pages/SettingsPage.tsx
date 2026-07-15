import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { api } from '../lib/api';

const SLIDER_CONFIGS = [
  { key: 'followUpDepth', label: '追问深度', left: '浅', right: '深' },
  { key: 'questionPace', label: '提问节奏', left: '慢', right: '快' },
  { key: 'strictness', label: '严格程度', left: '温和', right: '严格' },
  { key: 'hintFrequency', label: '提示频率', left: '少', right: '多' },
  { key: 'technicalDepth', label: '技术深度', left: '基础', right: '底层' },
] as const;

export default function SettingsPage() {
  const nav = useNavigate();
  const store = useSettingsStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => { store.load(); }, []);

  const handleSlider = (key: string, value: number) => {
    store.save({ sliders: { ...store.sliders, [key]: value } } as any);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection();
      setTestResult(res.success ? `✅ 连接成功: ${res.response}` : `❌ 连接失败: ${res.error}`);
    } catch (err: any) {
      setTestResult(`❌ ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => nav('/')} className="text-iron hover:text-ink mb-6 inline-block transition-colors">← 返回</button>
      <h1 className="text-3xl font-bold mb-8">⚙️ 面试官设置</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">人格描述</h2>
        <textarea value={store.personality} onChange={(e) => store.save({ personality: e.target.value })}
          placeholder="描述面试官的人设和风格..." className="input-field w-full h-32 resize-none" />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">风格滑块</h2>
        <div className="space-y-5">
          {SLIDER_CONFIGS.map(({ key, label, left, right }) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-iron">{(store.sliders as any)[key]} / 5</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-iron w-8 text-right">{left}</span>
                <input type="range" min="1" max="5" value={(store.sliders as any)[key]}
                  onChange={(e) => handleSlider(key, Number(e.target.value))}
                  className="flex-1 accent-[#3DD6C8] h-2 rounded-full appearance-none bg-surface cursor-pointer" />
                <span className="text-xs text-iron w-8">{right}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">连接配置</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-mist block mb-1">API Key（覆盖 .env.local）</label>
            <input type="password" value={store.apiKey} onChange={(e) => store.save({ apiKey: e.target.value })}
              placeholder="sk-agnes-..." className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm text-mist block mb-1">文本模型</label>
            <input type="text" value={store.model} onChange={(e) => store.save({ model: e.target.value })}
              placeholder="agnes-2.0-flash" className="input-field w-full" />
          </div>
          <div>
            <label className="text-sm text-mist block mb-1">图片模型（JD 截图识别）</label>
            <input type="text" value={store.visionModel} onChange={(e) => store.save({ visionModel: e.target.value })}
              placeholder="agnes-image-2.1-flash" className="input-field w-full" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleTest} disabled={testing} className="btn-secondary">{testing ? '⏳ 测试中...' : '🔌 测试连接'}</button>
            <button onClick={() => store.save({})} className="btn-primary">💾 保存设置</button>
          </div>
          {testResult && (
            <div className={`text-sm p-3 rounded-lg border ${testResult.startsWith('✅') ? 'bg-[rgba(34,197,94,.1)] border-[rgba(34,197,94,.3)] text-success' : 'bg-[rgba(239,68,68,.1)] border-[rgba(239,68,68,.3)] text-error'}`}>{testResult}</div>
          )}
        </div>
      </section>
    </div>
  );
}
