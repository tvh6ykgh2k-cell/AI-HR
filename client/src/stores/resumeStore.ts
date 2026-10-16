import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 前端类型镜像 server/types.ts 的 M1 部分
export interface JdAnalysis {
  role: string;
  company?: string;
  keywords: string[];
  mustHave: string[];
  niceToHave: string[];
  top3Focus: string[];
  isCareerChange: boolean;
  transferableHints?: string[];
  matchBand: 'strong' | 'possible' | 'weak';
  applicationPriority: 'high' | 'medium' | 'low';
  redFlags: string[];
  strategy: string;
}

export interface ResumeExperience {
  company?: string;
  role?: string;
  period?: string;
  bullets: string[];
}

export interface ParsedResume {
  rawText: string;
  name?: string;
  title?: string;
  summary?: string;
  experience: ResumeExperience[];
  skills: string[];
  education?: string[];
  projects?: string[];
  certifications?: string[];
}

// 匹配报告（M2）
export interface MatchReport {
  score: number;
  hitKeywords: string[];
  missingKeywords: string[];
  atsChecks: { item: string; pass: boolean; note: string }[];
  gaps: string[];
  suggestions: {
    id: string;
    current: string;
    suggested: string;
    reason: string;
    priority: 'P0' | 'P1' | 'P2';
  }[];
}

// 定制简历（M3）
export interface TailoredExperience {
  company?: string;
  role?: string;
  period?: string;
  tag?: string;
  bullets: string[];
}
export interface TailoredResume {
  name?: string;
  englishName?: string;
  targetTitle: string;
  contact: { phone?: string; email?: string; location?: string; website?: string };
  summary: string;
  highlights: { value: string; unit?: string; label: string }[];
  experience: TailoredExperience[];
  skills: { label: string; body: string }[];
  education?: string[];
  certifications?: string[];
  changes: { section: string; change: string; reason: string }[];
  placeholders: string[];
}

// 排版结果（M3）
export interface LayoutResult {
  html: string;
  fileName: string;
  placeholderCount: number;
  usedTemplate?: boolean;
  unfilledTokens?: string[];
}

// 面试逐字稿（M5）
export interface InterviewFollowUp {
  question: string;
  answer: string;
}
export interface InterviewTurn {
  question: string;
  answer: string;
  followUps: InterviewFollowUp[];
  tip?: string;
}
export interface InterviewScript {
  title: string;
  meta: {
    duration: string;
    format: string;
    focus: string[];
  };
  selfIntro: {
    prompt: string;
    script: string;
  };
  rounds: { name: string; turns: InterviewTurn[] }[];
  questionsToAsk: string[];
  pitfalls: string[];
  tips: string[];
  sessionId?: string;   // 生成即自动存档到 Obsidian 后的工单号
}

// 面试准备文档（M4，复用 /api/prep/generate）
export interface PrepDocument {
  competencies: { name: string; evidence: string; weight: string }[];
  questions: { question: string; category: string; probability: string }[];
  starStories: {
    name: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    fullVersion?: string;
    shortVersion?: string;
    oneLiner?: string;
  }[];
  selfIntroFull: string;
  selfIntroShort: string;
  questionsToAsk: { category: string; questions: string[] }[];
  difficultAnswers: { scenario: string; formula: string }[];
  sessionId?: string;
}

// 存档结果（M4）
export interface ArchiveResult {
  sessionId: string;
  filePath: string;
  saved: boolean;
  hasPlaceholders: boolean;
  interviewPrepSessionId: string | null;
}

type Phase =
  | 'idle'
  | 'parsing-resume'
  | 'parsing-jd'
  | 'matching'
  | 'tailoring'
  | 'preparing'
  | 'interview-script'
  | 'archiving';

interface ResumeState {
  resumeText: string;
  resumeParsed: ParsedResume | null;
  jdText: string;
  jdAnalysis: JdAnalysis | null;
  match: MatchReport | null;
  tailored: TailoredResume | null;
  layout: LayoutResult | null;
  prep: PrepDocument | null;
  interviewScript: InterviewScript | null;
  archive: ArchiveResult | null;
  resumeTemplateHtml: string;   // 用户上传的排版模板（.html，含 {{占位符}}），持久化
  resumeTemplateName: string;   // 模板文件名
  phase: Phase;
  error: string | null;
  setResumeText: (t: string) => void;
  setJdText: (t: string) => void;
  setResumeParsed: (r: ParsedResume | null) => void;
  setJdAnalysis: (a: JdAnalysis | null) => void;
  setMatch: (m: MatchReport | null) => void;
  setTailored: (t: TailoredResume | null) => void;
  setLayout: (l: LayoutResult | null) => void;
  setPrep: (p: PrepDocument | null) => void;
  setInterviewScript: (s: InterviewScript | null) => void;
  setArchive: (a: ArchiveResult | null) => void;
  setResumeTemplate: (html: string, name?: string) => void;
  clearResumeTemplate: () => void;
  setPhase: (p: Phase) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeText: '',
      resumeParsed: null,
      jdText: '',
      jdAnalysis: null,
      match: null,
      tailored: null,
      layout: null,
      prep: null,
      interviewScript: null,
      archive: null,
      resumeTemplateHtml: '',
      resumeTemplateName: '',
      phase: 'idle',
      error: null,
      setResumeText: (t) => set({ resumeText: t }),
      setJdText: (t) => set({ jdText: t }),
      setResumeParsed: (r) => set({ resumeParsed: r }),
      setJdAnalysis: (a) => set({ jdAnalysis: a }),
      setMatch: (m) => set({ match: m }),
      setTailored: (t) => set({ tailored: t }),
      setLayout: (l) => set({ layout: l }),
      setPrep: (p) => set({ prep: p }),
      setInterviewScript: (s) => set({ interviewScript: s }),
      setArchive: (a) => set({ archive: a }),
      setResumeTemplate: (html, name = '') =>
        set({ resumeTemplateHtml: html, resumeTemplateName: name }),
      clearResumeTemplate: () => set({ resumeTemplateHtml: '', resumeTemplateName: '' }),
      setPhase: (p) => set({ phase: p }),
      setError: (e) => set({ error: e }),
      reset: () =>
        set({
          resumeText: '',
          resumeParsed: null,
          jdText: '',
          jdAnalysis: null,
          match: null,
          tailored: null,
          layout: null,
          prep: null,
          interviewScript: null,
          archive: null,
          phase: 'idle',
          error: null,
        }),
    }),
    {
      name: 'ai-hr-resume',
      storage: createJSONStorage(() => localStorage),
      // 只持久化业务数据；phase/error 是瞬态，恢复时回到 idle
      partialize: (s) => ({
        resumeText: s.resumeText,
        resumeParsed: s.resumeParsed,
        jdText: s.jdText,
        jdAnalysis: s.jdAnalysis,
        match: s.match,
        tailored: s.tailored,
        layout: s.layout,
        prep: s.prep,
        interviewScript: s.interviewScript,
        archive: s.archive,
        resumeTemplateHtml: s.resumeTemplateHtml,
        resumeTemplateName: s.resumeTemplateName,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        phase: 'idle',
        error: null,
      }),
    }
  )
);
