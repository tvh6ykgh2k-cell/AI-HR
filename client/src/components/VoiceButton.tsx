import { useState, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';

interface Props { onResult: (text: string) => void; }

export default function VoiceButton({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'hold' | 'toggle'>('hold');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('浏览器不支持语音识别，请使用 Chrome 或 Edge'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; e.results[i].isFinal ? (final += t) : (interim += t); }
      setInterim(interim);
      if (final) onResult(final.trim());
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [onResult]);

  const stopRecognition = useCallback(() => { recognitionRef.current?.stop(); setRecording(false); setInterim(''); }, []);

  return (
    <div className="relative">
      {recording && interim && <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface border rounded-lg px-3 py-2 text-sm text-mist">{interim}...</div>}
      <button
        onMouseDown={mode === 'hold' ? startRecognition : undefined}
        onMouseUp={mode === 'hold' ? stopRecognition : undefined}
        onMouseLeave={mode === 'hold' && recording ? stopRecognition : undefined}
        onDoubleClick={() => setMode(mode === 'hold' ? 'toggle' : 'hold')}
        onClick={mode === 'toggle' ? () => recording ? stopRecognition() : startRecognition() : undefined}
        className={`p-3 rounded-full transition-all ${recording ? 'bg-error animate-pulse' : 'bg-surface border hover:border-border-hover'}`}
        title={mode === 'hold' ? '按住说话 · 双击切换模式' : '点击开始/结束 · 双击切换模式'}
      ><Mic size={18} /> </button>
    </div>
  );
}
