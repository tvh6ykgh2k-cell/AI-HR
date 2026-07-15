import { create } from 'zustand';

interface PrepState {
  jdText: string;
  resumeText: string;
  prepDoc: any | null;
  loading: boolean;
  error: string | null;
  setJdText: (text: string) => void;
  setResumeText: (text: string) => void;
  setPrepDoc: (doc: any) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const usePrepStore = create<PrepState>((set) => ({
  jdText: '',
  resumeText: '',
  prepDoc: null,
  loading: false,
  error: null,
  setJdText: (text) => set({ jdText: text }),
  setResumeText: (text) => set({ resumeText: text }),
  setPrepDoc: (doc) => set({ prepDoc: doc }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  reset: () => set({ jdText: '', resumeText: '', prepDoc: null, loading: false, error: null }),
}));
