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
  model: string;            // 文本对话模型
  visionModel: string;      // 图片识别模型
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
  model: 'agnes-3.0-flash',
  visionModel: 'agnes-image-2.5-flash',
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
  type: 'interview' | 'prep' | 'resume';
  tags: string[];
}

// ========== Resume 定制流水线（M1: JD 解析 + 简历解析）==========

// ① JD 解析 —— tailored-resume-generator + job-description-analyzer 逻辑
export interface JdAnalysis {
  role: string;                        // 岗位名称
  company?: string;                    // 公司名（若 JD 中提到）
  keywords: string[];                  // skills/tools 关键词
  mustHave: string[];                  // 硬性要求
  niceToHave: string[];                // 加分项
  top3Focus: string[];                 // 雇主最重视的 3 件事
  isCareerChange: boolean;             // JD 是否暗示职业转换场景（对求职者而言）
  transferableHints?: string[];        // 可迁移技能提示
  // —— job-description-analyzer 匹配策略 ——
  matchBand: 'strong' | 'possible' | 'weak';   // 是否值得投分档（对典型候选人）
  applicationPriority: 'high' | 'medium' | 'low';
  redFlags: string[];                  // JD 风险提示（薪资面议/高频加班/职责漂移等）
  strategy: string;                    // 投递策略一句话
}

// resume/analyze-jd 请求/响应
export interface JdAnalyzeRequest {
  jdText: string;
}

// ② 简历结构化解析
export interface ResumeExperience {
  company?: string;
  role?: string;
  period?: string;
  bullets: string[];
}

export interface ParsedResume {
  rawText: string;
  name?: string;
  title?: string;                     // 求职意向/当前头衔
  summary?: string;
  experience: ResumeExperience[];
  skills: string[];
  education?: string[];
  projects?: string[];
  certifications?: string[];
}

export interface ResumeParseRequest {
  resumeText: string;
}

// ③ 简历 × JD 匹配分析 —— resume-ats-optimizer 逻辑
// 关键词命中/缺失为确定性算法产出（可单测），评分/ATS体检/建议/缺口由 LLM 产出
export interface MatchReport {
  score: number;                       // 0-100 匹配度
  hitKeywords: string[];              // JD 关键词中简历已覆盖
  missingKeywords: string[];          // JD 关键词中简历未覆盖（确定性，单测断言）
  atsChecks: { item: string; pass: boolean; note: string }[];
  gaps: string[];                     // 简历完全没覆盖、但岗位要求的能力（语义缺口）
  suggestions: {
    id: string;
    current: string;                  // 简历现状片段
    suggested: string;                // 建议改法
    reason: string;                   // 理由
    priority: 'P0' | 'P1' | 'P2';
  }[];
}

export interface MatchRequest {
  jdText: string;
  resumeText: string;
  jdAnalysis?: JdAnalysis;            // 已有 JD 解析则复用，避免重复 LLM 调用
}

// ④ 定制简历生成 —— tailored-resume-generator 逻辑
// 不造假原则：所有事实/数字必须来自原简历，缺数据用 [待补充: xxx] 占位，绝不虚构
export interface TailoredExperience {
  company?: string;
  role?: string;
  period?: string;
  tag?: string;                  // 角色定位（如"方向主导"）
  bullets: string[];             // 定制后的成果导向 bullet（可含 [待补充] 占位）
}

export interface TailoredSkillRow {
  label: string;                 // 技能分组，如"产品"/"数据"/"工具"
  body: string;
}

export interface TailoredResume {
  name?: string;
  englishName?: string;
  targetTitle: string;           // 求职意向（目标岗位）
  contact: {
    phone?: string;
    email?: string;
    location?: string;
    website?: string;
  };
  summary: string;               // 定制后的个人简介（可含 [待补充]）
  highlights: { value: string; unit?: string; label: string }[];  // 3-4 个最强数字标签
  experience: TailoredExperience[];
  skills: TailoredSkillRow[];
  education?: string[];
  certifications?: string[];
  changes: { section: string; change: string; reason: string }[]; // 修改日志（每处改动 + 理由）
  placeholders: string[];        // 需要人工补数据的位置清单
}

export interface TailorRequest {
  resumeText: string;
  jdText: string;
  jdAnalysis?: JdAnalysis;
  match?: MatchReport;           // 已有匹配报告则复用，聚焦改 P0 项
}

// ⑥ 面试逐字稿（M5，LLM，不造假：候选人回答只基于原简历事实，缺数据用 [待补充] 占位）
export interface InterviewFollowUp {
  question: string;             // 追问
  answer: string;              // 追问参考回答（逐字稿）
}

export interface InterviewTurn {
  question: string;            // 面试官提问（逐字）
  answer: string;              // 候选人参考回答（口语化，可直接照念；缺具体数据含 [待补充]）
  followUps: InterviewFollowUp[];
  tip?: string;                // 一条：得分点/风险点/注意点
}

export interface InterviewScript {
  title: string;               // 模拟面试标题
  meta: {
    duration: string;          // 预计时长
    format: string;            // 面试形式
    focus: string[];          // 面试官最可能深挖的 3-5 点
  };
  selfIntro: {
    prompt: string;           // 面试官开场（如"请做个自我介绍"）
    script: string;          // 自我介绍逐字稿
  };
  rounds: { name: string; turns: InterviewTurn[] }[];
  questionsToAsk: string[];   // 候选人反问逐字稿（可直接说出口）
  pitfalls: string[];         // 高风险/陷阱题 + 应对
  tips: string[];            // 备考注意
  sessionId?: string;         // 自动存档到 Obsidian 后的工单号（后端回填）
}

export interface InterviewScriptRequest {
  jdText: string;
  resumeText: string;
  jdAnalysis?: JdAnalysis;
  match?: MatchReport;
}

// ⑤ 排版（确定性，无 LLM）
export interface LayoutResult {
  html: string;                  // 完整可交付 HTML（内嵌版式 CSS，可下载/打印为 PDF）
  fileName: string;
  placeholderCount: number;      // [待补充] 占位数量（>0 时前端提示补数据）
  usedTemplate?: boolean;        // true = 用了用户自带模板
  unfilledTokens?: string[];     // 模板里没匹配到数据的占位符
}

export interface LayoutRequest {
  resume: TailoredResume;
  templateHtml?: string; // 用户自带模板（.html，含 {{占位符}}）；不传则用默认 kami 版式
}

// ⑥ 整条流水线存档（M4）
export interface ResumeSessionPayload {
  jdText: string;
  jdAnalysis?: JdAnalysis;
  match?: MatchReport;
  tailored?: TailoredResume;
  interviewPrepSessionId?: string;   // 若已生成面试准备文档
  notes?: string;
}
