import { useRef, useState } from 'react';
import { File } from 'lucide-react';

interface Props {
  title: string;            // 区块标题，如 "上传简历"
  hint?: string;            // 说明
  accept?: string;          // 文件类型
  onText: (text: string, fileName?: string) => void;
  loading?: boolean;
  initialValue?: string;
}

// 浏览器端把不同文件类型转成纯文本
async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return text.trim();
  }

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth/mammoth.browser');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }

  // .txt / .md / 其它纯文本
  return file.text();
}

export default function FileUpload({ title, hint, accept, onText, loading, initialValue = '' }: Props) {
  const [text, setText] = useState(initialValue);
  const [fileName, setFileName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const t = await fileToText(file);
      setText(t);
      setFileName(file.name);
      onText(t, file.name);
    } catch (e: any) {
      alert(`解析文件失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-ink">{title}</h3>
        {fileName && <span className="text-xs text-pulse flex items-center gap-1"><File size={12} /> {fileName}</span>}
      </div>

      {/* 文件选择 / 拖拽 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-pulse bg-pulse/5'
            : 'border hover:border-iron'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {busy || loading ? (
          <div className="animate-pulse text-mist text-sm">{loading ? '解析中...' : '读取文件...'}</div>
        ) : (
          <>
            <div className="text-2xl mb-1">📎</div>
            <p className="text-mist text-sm">点击选择或拖入文件</p>
            <p className="text-iron text-xs mt-1">{hint || '支持 .pdf / .docx / .txt / .md'}</p>
          </>
        )}
      </div>

      {/* 直接粘贴文本（可编辑，方便手动修正） */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); onText(e.target.value); }}
        placeholder="或直接在这里粘贴文本…"
        rows={Math.max(5, Math.min(12, text.split('\n').length))}
        className="w-full bg-surface border border rounded-lg p-3 text-sm text-ink placeholder:text-iron resize-y focus:border-pulse focus:outline-none transition-colors"
      />
    </div>
  );
}
