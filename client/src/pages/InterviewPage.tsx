import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImagePaste from '../components/ImagePaste';
import ChatBubble from '../components/ChatBubble';
import VoiceButton from '../components/VoiceButton';
import StarPanel from '../components/StarPanel';
import { useInterviewStore } from '../stores/interviewStore';
import { api, streamChat } from '../lib/api';

type Phase = 'input' | 'chat';

export default function InterviewPage() {
  const nav = useNavigate();
  const { id: existingId } = useParams();
  const [phase, setPhase] = useState<Phase>(existingId ? 'chat' : 'input');
  const [jdText, setJdText] = useState('');
  const [jdParsed, setJdParsed] = useState<any>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showStarPanel, setShowStarPanel] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const store = useInterviewStore();
  const { messages, isStreaming, starCoverage, jdContext } = store;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleImage = async (base64: string) => {
    setRecognizing(true);
    try {
      const jd = await api.recognizeJD(base64);
      setJdParsed(jd);
      setJdText(jd.rawText || `${jd.company} - ${jd.position}\n\n${jd.responsibilities?.join('\n')}\n\n${jd.requirements?.join('\n')}`);
    } catch (err: any) { alert('JD 识别失败: ' + err.message); }
    finally { setRecognizing(false); }
  };

  const startInterview = () => {
    store.reset();
    store.setJd(jdParsed || { rawText: jdText, company: '', position: '' });
    sendMessage('你好，我准备好了，请开始面试。', true);
    setPhase('chat');
  };

  const sendMessage = useCallback((text: string, isInit = false) => {
    if (!text.trim() || (isStreaming && !isInit)) return;
    const userMsg = { id: `user-${Date.now()}`, role: 'user' as const, content: text, timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    store.addMessage(userMsg);
    const aiMsgId = `ai-${Date.now()}`;
    store.addMessage({ id: aiMsgId, role: 'interviewer' as const, content: '', timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
    store.setStreaming(true);

    const starMsgs = messages.filter(m => m.role === 'user' && m.starScore);
    let starContext = '';
    if (starMsgs.length > 0) {
      const weakDims = Object.entries(starCoverage).filter(([_,v]) => v < 0.5).map(([k]) => k).join('、');
      starContext = weakDims ? `候选人 STAR 回答中「${weakDims}」维度普遍缺失，请针对性追问。` : '候选人的 STAR 结构整体良好，继续深入技术细节。';
    }

    streamChat(store.sessionId, text, jdContext, starContext,
      (token) => store.appendToken(aiMsgId, token),
      async () => {
        store.setStreaming(false);
        const fullMsg = store.messages.find(m => m.id === aiMsgId);
        if (fullMsg) {
          api.saveQA(store.sessionId, fullMsg.content, text).catch(() => {});
          if (!isInit) {
            try {
              const score = await api.scoreStar(fullMsg.content, text, jdContext);
              store.setStarScore(userMsg.id, score);
              store.updateStarCoverage();
            } catch {}
          }
        }
      },
      (err) => { store.setStreaming(false); console.error('Chat error:', err); },
    );
    setInputText('');
  }, [isStreaming, store, jdContext, starCoverage, messages]);

  if (phase === 'input') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <button onClick={() => nav('/')} className="absolute top-4 left-4 text-iron hover:text-ink transition-colors">← 返回</button>
        <div className="max-w-xl w-full">
          <h1 className="text-3xl font-bold mb-8 text-center">🎙️ 模拟面试 · 选择岗位</h1>
          <ImagePaste onImage={handleImage} loading={recognizing} />
          <div className="my-6 flex items-center gap-4"><div className="flex-1 h-px bg-void" /><span className="text-iron text-sm">或直接描述</span><div className="flex-1 h-px bg-void" /></div>
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="粘贴 JD 文本，例如：&#10;腾讯前端高级工程师&#10;要求精通 React、TypeScript..."
            className="input-field w-full h-40 resize-none" />
          <div className="flex gap-2 mt-3 flex-wrap">
            {['前端','后端','产品经理','算法','设计','运营'].map(tag => (
              <button key={tag} onClick={() => setJdText(p => p + ` ${tag}工程师`)} className="px-3 py-1 bg-surface border rounded-full text-xs text-mist hover:text-ink hover:border-iron transition-colors">{tag}</button>
            ))}
          </div>
          <button onClick={startInterview} disabled={!jdText.trim()} className="btn-primary w-full mt-6">开始面试 →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-surface border-b px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => nav('/')} className="text-iron hover:text-ink text-sm transition-colors">← 退出</button>
        <div className="text-center"><div className="text-sm font-medium">🎙️ 面试进行中...</div><div className="text-xs text-iron">{jdParsed?.position || '模拟面试'}</div></div>
        <div className="flex gap-2">
          <button onClick={() => setShowStarPanel(!showStarPanel)} className="p-2 text-iron hover:text-ink transition-colors">📊</button>
          <button onClick={() => store.setPaused(true)} className="p-2 text-iron hover:text-ink transition-colors">⏸️</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'interviewer'}
            starScore={msg.starScore} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-surface border-t px-4 py-2 flex items-center justify-between text-xs text-iron shrink-0">
        <span>💾 已自动保存到 Obsidian</span>
        <span>STAR覆盖: {Math.round((starCoverage.s + starCoverage.t + starCoverage.a + starCoverage.r) / 4 * 100)}%</span>
      </div>

      <div className="bg-surface border-t px-4 py-3 flex items-center gap-3 shrink-0">
        <input value={inputText} onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
          placeholder="输入你的回答... (Enter 发送)" className="flex-1 input-field" disabled={isStreaming} />
        <VoiceButton onResult={(text) => setInputText(p => p + text)} />
        <button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isStreaming} className="btn-primary !px-4">发送</button>
      </div>

      <AnimatePresence>
        {showStarPanel && <StarPanel coverage={starCoverage} onClose={() => setShowStarPanel(false)} />}
      </AnimatePresence>
    </div>
  );
}
