import { create } from 'zustand';
import { api } from '../lib/api';

interface SliderSettings {
  followUpDepth: number;
  questionPace: number;
  strictness: number;
  hintFrequency: number;
  technicalDepth: number;
}

interface SettingsState {
  personality: string;
  sliders: SliderSettings;
  apiKey: string;
  model: string;
  obsidianPath: string;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (data: Partial<SettingsState>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  personality: '',
  sliders: { followUpDepth: 3, questionPace: 3, strictness: 3, hintFrequency: 3, technicalDepth: 3 },
  apiKey: '',
  model: '',
  obsidianPath: '',
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true });
    try {
      const data = await api.getSettings();
      set({
        personality: data.personality,
        sliders: data.sliders,
        apiKey: data.apiKey,
        model: data.model,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  save: async (partial) => {
    set({ loading: true });
    try {
      const current = get();
      const updated = { ...current, ...partial };
      await api.updateSettings({
        personality: updated.personality,
        sliders: updated.sliders,
        apiKey: updated.apiKey,
        model: updated.model,
      });
      set({ ...partial, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
