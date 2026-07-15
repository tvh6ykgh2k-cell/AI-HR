import { useState, useCallback, DragEvent } from 'react';

interface Props { onImage: (base64: string) => void; loading?: boolean; }

export default function ImagePaste({ onImage, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { const base64 = (reader.result as string).split(',')[1]; onImage(base64); };
    reader.readAsDataURL(file);
  }, [onImage]);

  return (
    <div
      onPaste={(e) => { const items = e.clipboardData?.items; if (items) for (const item of items) { if (item.type.startsWith('image/')) { processFile(item.getAsFile()!); break; } } }}
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-pulse bg-[rgba(61,214,200,.05)]' : 'border-[rgba(255,255,255,.12)] hover:border-[rgba(255,255,255,.2)]'}`}
    >
      {loading ? <div className="animate-pulse text-mist">🔍 识别中...</div> : (
        <><div className="text-3xl mb-2">📋</div><p className="text-mist">粘贴或拖入 BOSS直聘 岗位截图</p><p className="text-iron text-sm mt-1">Ctrl+V · JPG/PNG</p></>
      )}
    </div>
  );
}
