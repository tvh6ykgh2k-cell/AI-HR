// ========== Settings ==========
export interface SliderSettings {
  followUpDepth: number;    // 1-5 追问深度
  questionPace: number;     // 1-5 提问节奏
  strictness: number;       // 1-5 严格程度
  hintFrequency: number;    // 1-5 提示频率
  technicalDepth: number;   // 1-5 技术深度
}

export interface AppSettings {
  personality: string;
  sliders: SliderSettings;
  apiKey: string;           // 覆盖 .env 的值，为空则使用 env
  model: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  personality: '你是一个专业、公正的面试官。你会根据岗位要求提问，深入追问技术细节，同时也关注候选人的项目经验和软技能。',
  sliders: {
    followUpDepth: 3,
    questionPace: 3,
    strictness: 3,
    hintFrequency: 3,
    technicalDepth: 3,
  },
  apiKey: '',
  model: '',
};

// ========== JD ==========
export interface JobDescription {
  company: string;
  position: string;
  salary: string;
  responsibilities: string[];
  requirements: string[];
  bonuses: string[];
  rawText: string;
}

// ========== Chat ==========
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

// ========== Prep ==========
export interface Competency {
  name: string;
  evidence: string;
  weight: '高' | '中' | '低';
}

export interface PredictedQuestion {
  question: string;
  category: '技术深挖' | '项目经验' | '行为题' | '系统设计' | '开放题';
  probability: '高' | '中' | '低';
}

export interface StarStory {
  name: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  fullVersion: string;    // 2 分钟版
  shortVersion: string;   // 60 秒版
  oneLiner: string;       // 15 秒版
  coversCompetencies: string[];
}

export interface PrepDocument {
  competencies: Competency[];
  questions: PredictedQuestion[];
  starStories: StarStory[];
  selfIntroFull: string;
  selfIntroShort: string;
  questionsToAsk: { category: string; questions: string[] }[];
  difficultAnswers: { scenario: string; formula: string }[];
}

export interface PrepGenerateRequest {
  jdText: string;
  resumeText?: string;
}

// ========== STAR Scoring ==========
export interface StarScore {
  s: { complete: boolean; feedback: string };
  t: { complete: boolean; feedback: string };
  a: { complete: boolean; feedback: string };
  r: { complete: boolean; feedback: string };
  overall: string;
}

export interface StarScoreRequest {
  question: string;
  answer: string;
  jdContext: string;
}

// ========== Sessions ==========
export interface SessionMeta {
  id: string;
  date: string;
  company: string;
  position: string;
  type: 'interview' | 'prep';
  tags: string[];
}
