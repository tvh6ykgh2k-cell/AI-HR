import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImagePaste from '../components/ImagePaste';
import { usePrepStore } from '../stores/prepStore';
import { api } from '../lib/api';

export default function PrepPage() {
  const nav = useNavigate();
  const store = usePrepStore();

  const handleImage = async (base64: string) => {
    store.setLoading(true);
    try {
      const jd = await api.recognizeJD(base64);
      store.setJdText(jd.rawText || JSON.stringify(jd, null, 2));
    } catch (err: any) { store.setError(err.message); }
    finally { store.setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!store.jdText.trim()) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const doc = await api.generatePrep(store.jdText, store.resumeText || undefined);
      store.setPrepDoc(doc);
      nav(`/prep/${doc.sessionId}`);
    } catch (err: any) { store.setError(err.message); }
    finally { store.setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <button onClick={() => nav('/')} className="absolute top-4 left-4 text-iron hover:text-ink transition-colors">← 返回</button>
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">📝 面试准备 · 三步生成</h1>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Step 1: 岗位信息</h2>
          <ImagePaste onImage={handleImage} loading={store.loading} />
          <textarea value={store.jdText} onChange={(e) => store.setJdText(e.target.value)} placeholder="或直接粘贴 JD 文字..."
            className="input-field w-full h-32 mt-3 resize-none" />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Step 2: 个人简历（可选）</h2>
          <textarea value={store.resumeText} onChange={(e) => store.setResumeText(e.target.value)}
            placeholder="粘贴你的简历文字，生成个性化的 STAR 故事...&#10;留空则生成通用 STAR 框架"
            className="input-field w-full h-28 resize-none" />
        </div>

        {store.error && <div className="mb-4 p-3 bg-[rgba(239,68,68,.15)] border border-[rgba(239,68,68,.3)] rounded-lg text-sm text-error">{store.error}</div>}

        <button onClick={handleGenerate} disabled={!store.jdText.trim() || store.loading} className="btn-primary w-full">
          {store.loading ? '⏳ 生成中...' : '生成面试准备文档 →'}
        </button>

        <div className="mt-6 p-4 bg-surface border rounded-lg">
          <h3 className="text-sm text-iron mb-2">生成内容预览：</h3>
          <div className="space-y-1 text-sm text-mist">
            <div>✅ 角色能力分析 → 提取 5 大核心考察维度</div>
            <div>✅ 预测问题库 → 高/中/低概率分类 15-20 题</div>
            <div>✅ STAR 故事银行 → 8-10 个结构化故事</div>
            <div>✅ 自我介绍脚本 → 2分钟定制版本</div>
            <div>✅ 反问问题清单 → 按面试官角色分类</div>
            <div>✅ 难点应对策略 → 弱点/失败/离职 回答公式</div>
          </div>
        </div>
      </div>
    </div>
  );
}
