import { create } from 'zustand';

interface Message {
  id: string;
  role: 'interviewer' | 'user';
  content: string;
  timestamp: string;
  starScore?: {
    s: { complete: boolean; feedback: string };
    t: { complete: boolean; feedback: string };
    a: { complete: boolean; feedback: string };
    r: { complete: boolean; feedback: string };
  };
}

interface InterviewState {
  sessionId: string;
  jdContext: string;
  jdRaw: any;
  messages: Message[];
  isStreaming: boolean;
  isPaused: boolean;
  starCoverage: { s: number; t: number; a: number; r: number };
  elapsedTime: number;
  setJd: (jd: any) => void;
  addMessage: (msg: Message) => void;
  appendToken: (id: string, token: string) => void;
  setStreaming: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setStarScore: (msgId: string, score: any) => void;
  updateStarCoverage: () => void;
  reset: () => void;
}

let msgCounter = 0;
function newId() { return `msg-${++msgCounter}-${Date.now()}`; }

export const useInterviewStore = create<InterviewState>((set, get) => ({
  sessionId: `interview-${Date.now()}`,
  jdContext: '',
  jdRaw: null,
  messages: [],
  isStreaming: false,
  isPaused: false,
  starCoverage: { s: 0, t: 0, a: 0, r: 0 },
  elapsedTime: 0,

  setJd: (jd) => set({ jdContext: jd.rawText || `${jd.company} - ${jd.position}`, jdRaw: jd }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendToken: (id, token) => set((s) => ({
    messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)),
  })),

  setStreaming: (v) => set({ isStreaming: v }),
  setPaused: (v) => set({ isPaused: v }),

  setStarScore: (msgId, score) => set((s) => ({
    messages: s.messages.map((m) => (m.id === msgId ? { ...m, starScore: score } : m)),
  })),

  updateStarCoverage: () => {
    const msgs = get().messages.filter((m) => m.role === 'user' && m.starScore);
    if (msgs.length === 0) return;
    const total = msgs.length;
    const s = msgs.filter((m) => m.starScore!.s.complete).length / total;
    const t = msgs.filter((m) => m.starScore!.t.complete).length / total;
    const a = msgs.filter((m) => m.starScore!.a.complete).length / total;
    const r = msgs.filter((m) => m.starScore!.r.complete).length / total;
    set({ starCoverage: { s, t, a, r } });
  },

  reset: () => set({
    sessionId: `interview-${Date.now()}`,
    messages: [],
    isStreaming: false,
    isPaused: false,
    starCoverage: { s: 0, t: 0, a: 0, r: 0 },
    elapsedTime: 0,
  }),
}));
