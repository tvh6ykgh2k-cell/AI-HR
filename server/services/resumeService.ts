import type {
  JdAnalysis,
  ParsedResume,
  MatchReport,
  MatchRequest,
  TailoredResume,
  TailorRequest,
  InterviewScript,
  InterviewScriptRequest,
} from '../types.js';

const BASE_URL = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const API_KEY = process.env.AGNES_API_KEY || '';
const TEXT_MODEL = process.env.AGNES_TEXT_MODEL || 'agnes-3.0-flash';

function getApiKey(overrideKey?: string): string {
  // ESM: 必须在调用时实时读 process.env（dotenv 在 index.ts 顶层才加载，
  // 而 import 会被提升到它之前执行 → 模块加载期捕获的常量恒为 ''）
  return overrideKey || process.env.AGNES_API_KEY || API_KEY;
}

// 截断 JSON 兜底修复：模型输出被砍断时，闭合未结束的字符串与花/方括号
function repairTruncatedJson(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;
  const body = raw.slice(start);
  let inStr = false;
  let esc = false;
  const stack: string[] = [];
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  // 逐字符回退到最后一个合法边界（去掉悬空的冒号/逗号/残词）
  let s = body;
  if (inStr) s += '"'; // 闭合未结束的字符串
  // 去掉尾部的悬挂分隔符
  s = s.replace(/[\s,]+$/, '');
  // 若尾字符是 `:` 或 `"`（残缺键值），丢弃最后不完整的键值对
  s = s.replace(/:["\s]?$/, '');
  while (stack.length) s += stack.pop()!;
  return s;
}

async function agnesJson<T>(
  prompt: string,
  apiKeyOverride?: string,
  modelOverride?: string,
  label = 'request'
): Promise<T> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey(apiKeyOverride)}`,
    },
    body: JSON.stringify({
      model: modelOverride || TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      max_tokens: 8192,                    // M2 等大 JSON 输出别被默认上限砍断
      response_format: { type: 'json_object' }, // 强制 JSON 输出
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${label} failed: ${response.status} — ${errText}`);
  }

  const data = (await response.json()) as any;
  let content: string = data.choices[0].message.content;
  content = content.replace(/```(?:json)?\s*\n?/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(content) as T;
  } catch {
    // 兜底：被截断的 JSON 做括号配平修复后再试
    const repaired = repairTruncatedJson(content);
    if (repaired) {
      try {
        return JSON.parse(repaired) as T;
      } catch {
        /* fallthrough */
      }
    }
    throw new Error(`${label}: 模型未返回合法 JSON。原始输出：${content.slice(0, 300)}...`);
  }
}

// ─────────────────────────────────────────────
// ① JD 解析（tailored-resume-generator + job-description-analyzer 方法论）
// 抽关键词/硬性要求/加分项/重点3件事 + 匹配策略/红旗信号
// ─────────────────────────────────────────────
export async function analyzeJD(
  jdText: string,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<JdAnalysis> {
  const prompt = `你是一位资深招聘专家和求职策略顾问。请分析以下岗位 JD，从"求职者决策"视角输出严格 JSON（不要 markdown 代码块，只要纯 JSON）：

JD 内容：
"""
${jdText}
"""

请分析并返回：
{
  "role": "岗位名称（从 JD 中识别）",
  "company": "公司名（若 JD 未提及则留空字符串）",
  "keywords": ["JD 中反复出现或明确要求的技能/工具/方法关键词，8-15 个，按重要度排序"],
  "mustHave": ["硬性要求：不满足就基本不会被约面（学历/年限/核心技能/证书），逐条列出"],
  "niceToHave": ["加分项：有则更好，无也不卡（'优先''熟悉''了解'类措辞）"],
  "top3Focus": ["雇主最重视的 3 件事：从 JD 措辞强度、描述篇幅、岗位名推断，每条一句话并说明判断依据"],
  "isCareerChange": false,
  "transferableHints": ["若该岗位常见由相关领域转岗者申请，列出可迁移技能；否则空数组"],
  "matchBand": "strong|possible|weak（对市场上一般候选人的匹配难度分档：strong=门槛常规，容易匹配；weak=门槛高/组合罕见/要求苛刻）",
  "applicationPriority": "high|medium|low（综合成长性与市场热度，建议投递优先级）",
  "redFlags": ["JD 中的风险/异常信号：如薪资面议、高频加班暗示、职责与岗位名不符、'接受无经验'但要求资深技能等。没有则空数组"],
  "strategy": "针对该岗位的投递策略一句话（例如：突出哪 1-2 项能力最容易过筛）"
}

分析规则：
- keywords 必须是 JD 原文出现或明确等价表述，不要发明 JD 没有的技能。
- top3Focus 恰好 3 条，必须附判断依据（"因 JD 中多次强调 X / X 出现在职责首条"）。
- matchBand 判断依据：硬性要求的年限/稀缺技能数量/学历门槛。
- redFlags 要具体引用 JD 原文措辞，不要空泛。`;

  return agnesJson<JdAnalysis>(prompt, apiKeyOverride, modelOverride, 'JD 解析');
}

// ─────────────────────────────────────────────
// ② 简历结构化解析
// 把粘贴/文件读出的简历文本 → 结构化
// ─────────────────────────────────────────────
export async function parseResume(
  resumeText: string,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<ParsedResume> {
  const prompt = `你是简历解析引擎。请把以下简历文本解析成严格 JSON（不要 markdown 代码块，只要纯 JSON）。

简历原文：
"""
${resumeText}
"""

请返回：
{
  "rawText": "",            // 保持原样，置空（由调用方回填）
  "name": "姓名（若可识别，否则空字符串）",
  "title": "求职意向或当前最高头衔",
  "summary": "个人总结/自我评价（原文提炼，没有则空字符串）",
  "experience": [
    {"company": "公司", "role": "职位", "period": "起止时间（如 2021.07-2023.12）", "bullets": ["该段经历下的所有 bullet，逐条保留原文要点"]}
  ],
  "skills": ["技能/工具/技术词，按简历原文归类去重"],
  "education": ["学历条目：学校 + 专业 + 学历 + 时间"],
  "projects": ["项目条目：名称 + 一句话描述"],
  "certifications": ["证书/认证条目"]
}

解析规则：
- 只提取简历里真实存在的内容，缺的字段给空字符串或空数组，禁止补全或虚构。
- experience 按时间倒序；bullets 保留可量化数据。
- 若简历文本本身不是简历（如乱码、与求职无关），skills 和 experience 给空数组，并在 summary 注明"输入不像有效简历"。`;

  const parsed = await agnesJson<Omit<ParsedResume, 'rawText'>>(
    prompt,
    apiKeyOverride,
    modelOverride,
    '简历解析'
  );
  return { rawText: resumeText, ...parsed };
}

// ─────────────────────────────────────────────
// ③ 简历 × JD 匹配分析（resume-ats-optimizer 方法论）
// ─────────────────────────────────────────────

// 确定性关键词命中/缺失（可单测，不依赖 LLM）
// 规则：resumeText 包含 JD 关键词（大小写不敏感、去标点干扰）即命中
export function keywordMatch(jdKeywords: string[], resumeText: string): {
  hitKeywords: string[];
  missingKeywords: string[];
} {
  const normalizedResume = resumeText.toLowerCase().replace(/\s+/g, ' ');
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff+.-\s]/g, ' ').trim();

  const hitKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of jdKeywords) {
    const k = normalize(kw);
    if (!k) continue;
    // 对每个词元（关键词可含空格，如 "user research"）逐段匹配
    const tokens = k.split(/\s+/).filter(Boolean);
    const present = tokens.every((t) => normalizedResume.includes(t));
    if (present) hitKeywords.push(kw);
    else missingKeywords.push(kw);
  }
  return { hitKeywords, missingKeywords };
}

// 匹配评分 + ATS 体检 + 建议 + 缺口（LLM，喂入确定性关键词结果）
export async function matchResume(
  req: MatchRequest,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<MatchReport> {
  const { jdText, resumeText, jdAnalysis } = req;

  // 确定性关键词匹配：若调用方没给 JD 关键词（首次调用未先跑 analyze-jd），退化为让 LLM 从 JD 提取
  const kwSource = jdAnalysis ? jdAnalysis.keywords : null;
  const kwResult = kwSource
    ? keywordMatch(kwSource, resumeText)
    : { hitKeywords: [] as string[], missingKeywords: [] as string[] };

  const prompt = `你是资深简历顾问 + ATS 专家。请基于以下岗位 JD 与候选人简历，输出严格 JSON（不要 markdown 代码块，只要纯 JSON）。

【岗位 JD】
"""
${jdText}
"""

【候选人简历】
"""
${resumeText}
"""

【已确定性检测到的关键词覆盖】
- 已命中：${JSON.stringify(kwResult.hitKeywords)}
- 未命中：${JSON.stringify(kwResult.missingKeywords)}
${jdAnalysis ? `【JD 解析结果（可复用）】mustHave=${JSON.stringify(jdAnalysis.mustHave)} niceToHave=${JSON.stringify(jdAnalysis.niceToHave)} top3Focus=${JSON.stringify(jdAnalysis.top3Focus)}` : ''}

请分析并返回：
{
  "score": 0,                        // 0-100 匹配度综合分（关键词覆盖 + 经验年限 + 技能相关性 + 经历相关度）
  "hitKeywords": ${JSON.stringify(kwResult.hitKeywords)},   // 原样保留
  "missingKeywords": ${JSON.stringify(kwResult.missingKeywords)}, // 原样保留
  "atsChecks": [
    {"item": "文件格式/可解析性", "pass": true/false, "note": "说明"},
    {"item": "无表格/分栏布局风险", "pass": true/false, "note": "说明"},
    {"item": "标准栏目命名", "pass": true/false, "note": "说明"},
    {"item": "日期格式一致性", "pass": true/false, "note": "说明"},
    {"item": "联系方式完整性", "pass": true/false, "note": "说明"}
  ],
  "gaps": ["简历完全没有、但岗位 mustHave 要求的能力（语义级缺口，逐条）"],
  "suggestions": [
    {"id": "s1", "current": "简历现状片段（可空字符串表示无现状，如补全新内容）", "suggested": "具体建议改法", "reason": "为什么（关联到 JD 哪条要求）", "priority": "P0"}
  ]
}

要求：
- suggestions 5-10 条，P0（必须改：缺 mustHave 关键词/核心经历不突出）> P1（建议改：量化不足/措辞弱）> P2（可选改：打磨）
- 每条建议可执行，指向具体措辞或内容，不空泛
- gaps 与 missingKeywords 的区别：missingKeywords 是字面关键词缺失，gaps 是"岗位要的能力但你整份简历都没体现"
- score 参考：关键词命中率（missing 多则扣分）+ mustHave 覆盖度 + 经历与岗位相关性`;

  const raw = await agnesJson<MatchReport>(prompt, apiKeyOverride, modelOverride, '匹配分析');
  // 强制确定性字段不被 LLM 篡改（LLM 可能自作主张改动 hit/missing）
  return {
    ...raw,
    hitKeywords: kwResult.hitKeywords,
    missingKeywords: kwResult.missingKeywords,
  };
}

// ─────────────────────────────────────────────
// ④ 定制简历生成（tailored-resume-generator 方法论）
// 不造假原则：所有事实/数字必须来自原简历，缺数据用 [待补充: xxx] 占位，绝不虚构
// ─────────────────────────────────────────────
export async function tailorResume(
  req: TailorRequest,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<TailoredResume> {
  const { resumeText, jdText, jdAnalysis, match } = req;

  const jdCtx = jdAnalysis
    ? `【JD 解析】岗位=${jdAnalysis.role} 硬性要求=${JSON.stringify(jdAnalysis.mustHave)} 加分项=${JSON.stringify(jdAnalysis.niceToHave)} 雇主重点=${JSON.stringify(jdAnalysis.top3Focus)}`
    : '';
  const matchCtx = match
    ? `【匹配分析】匹配度=${match.score} 缺失关键词=${JSON.stringify(match.missingKeywords)} P0 建议=${JSON.stringify(match.suggestions?.filter((s) => s.priority === 'P0')?.map((s) => s.suggested))}`
    : '';

  const prompt = `你是资深简历定制专家。请把候选人**原始简历**按目标岗位重新定制，输出一份**针对该岗位优化**的简历。

【目标岗位 JD】
"""
${jdText}
"""
${jdCtx}

【候选人原始简历（事实的唯一来源）】
"""
${resumeText}
"""
${matchCtx}

请输出严格 JSON（不要 markdown 代码块）：
{
  "name": "姓名（原简历有则原样，否则空）",
  "englishName": "英文名（原简历有则原样，否则空）",
  "targetTitle": "求职意向：${jdAnalysis?.role ?? '目标岗位名称'}",
  "contact": {
    "phone": "原简历电话，无则空", "email": "原简历邮箱，无则空",
    "location": "原简历城市，无则空", "website": "原简历个人站/GitHub，无则空"
  },
  "summary": "80 字内个人简介，围绕目标岗位重写（突出与该岗位相关的经历，删除无关内容）。缺具体数字时用 [待补充: 具体数字] 占位，绝不编造数字。",
  "highlights": [
    {"value": "最强数字（取自原简历，如无则留占位 [待补充]）", "unit": "单位（可空）", "label": "标签（如'产品 GMV 提升'）"}
  ],  // 3-4 个
  "experience": [
    {"company": "公司", "role": "职位", "period": "起止时间", "tag": "角色定位（如'方向主导'）",
     "bullets": ["成果导向 bullet：动词开头 + 量化结果。优先保留与目标岗位相关的经历，弱化或删除无关项。每条可含 [待补充: 具体数据] 占位"]}
  ],
  "skills": [
    {"label": "技能分组（如'产品/数据/工具'）", "body": "该组技能，按岗位相关性排序，命中 JD 关键词"}
  ],
  "education": ["学历条目（原样保留）"],
  "certifications": ["证书条目（原样保留，无则空数组）"],
  "changes": [
    {"section": "改动所在栏目（如'工作经历-某段'）", "change": "具体改了什么（删除/重排/强化措辞/补关键词）", "reason": "为什么（对应岗位哪条要求）"}
  ],
  "placeholders": ["所有 [待补充: xxx] 的位置清单，逐条列出，供人工补数据"]
}

铁律（必须遵守）：
1. 事实与数字**只能取自原简历**，禁止发明任何原简历没有的公司/职位/数字/证书。
2. 原简历没数据的地方，用 "[待补充: 说明缺什么]" 占位，并在 placeholders 里登记。
3. 定制=**重排 + 补 JD 关键词 + 强化量化措辞 + 删无关项**，不是编造经历。
4. changes 至少 3 条，解释每处关键改动对应岗位哪条要求。
5. 经验条数不超过原简历（删可以，凭空加不行）。`;

  const tailored = await agnesJson<TailoredResume>(prompt, apiKeyOverride, modelOverride, '定制简历');
  // 兜底：LLM 漏掉 placeholders 收集时，从正文扫描 [待补充 回填
  const scanned: string[] = [];
  const collect = (s: string) => { if (s && /待补充/.test(s)) scanned.push(s); };
  collect(tailored.summary);
  tailored.experience?.forEach((e) => e.bullets?.forEach(collect));
  (tailored.highlights ?? []).forEach((h) => collect(`${h.value} ${h.label ?? ''}`));
  tailored.placeholders = [...new Set([...(tailored.placeholders ?? []), ...scanned])];
  return tailored;
}

// ─────────────────────────────────────────────
// ⑦ 面试逐字稿（M5，LLM，不造假：候选人回答只基于原简历事实，缺数据用 [待补充] 占位）
// 产出「可直接照念」的模拟面试对话体：开场自我介绍 + 分轮问答（含追问）+ 反问 + 高风险题 + 备考要点
// ─────────────────────────────────────────────
export async function generateInterviewScript(
  req: InterviewScriptRequest,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<InterviewScript> {
  const { jdText, resumeText, jdAnalysis, match } = req;

  const jdCtx = jdAnalysis
    ? `【JD 解析】岗位=${jdAnalysis.role} 硬性要求=${JSON.stringify(jdAnalysis.mustHave)} 加分项=${JSON.stringify(jdAnalysis.niceToHave)} 雇主重点=${JSON.stringify(jdAnalysis.top3Focus)}`
    : '';
  const matchCtx = match
    ? `【匹配分析】匹配度=${match.score} 缺失关键词=${JSON.stringify(match.missingKeywords)} 内容缺口=${JSON.stringify(match.gaps)}`
    : '';

  const prompt = `你是资深面试官兼面试教练。请基于岗位 JD 与候选人简历，写一份**可直接照着念的面试逐字稿**（模拟面试对话）。

【岗位 JD】
"""
${jdText}
"""
${jdCtx}

【候选人简历（事实的唯一来源）】
"""
${resumeText}
"""
${matchCtx}

请输出严格 JSON（不要 markdown 代码块，只要纯 JSON）：
{
  "title": "模拟面试标题（如：XX 岗位 · 模拟面试逐字稿）",
  "meta": {
    "duration": "预计时长（如 45-60 分钟）",
    "format": "面试形式（如：一面 · 技术/项目面，1 对 1）",
    "focus": ["面试官最可能深挖的 3-5 个点（来自岗位 mustHave/雇主重点/匹配缺口）"]
  },
  "selfIntro": {
    "prompt": "面试官开场（逐字，如：'先请做一个自我介绍吧。'）",
    "script": "候选人自我介绍逐字稿（90-180 字，口语化，围绕该岗位定制，可直接照念）"
  },
  "rounds": [
    {
      "name": "轮次名（如：项目经验深挖 / 专业能力 / 行为面试 / 动机与文化匹配 / 反问环节）",
      "turns": [
        {
          "question": "面试官提问（逐字，口语化）",
          "answer": "候选人参考回答（口语化、有结构、可直接照念；优先用简历里真实的项目/数字；缺具体数字写 [待补充]）",
          "followUps": [
            {"question": "追问（逐字）", "answer": "追问参考回答（逐字稿；缺数据写 [待补充]）"}
          ],
          "tip": "一条提示（得分点 / 风险点 / 容易被戳的软肋，供候选人备考）"
        }
      ]
    }
  ],
  "questionsToAsk": ["候选人反问面试官的逐字稿（可直接说出口，围绕岗位真实关心点，3-5 条）"],
  "pitfalls": ["高风险/陷阱题 + 应对（如 '你的离职原因 / 为什么 2 年换 3 次工作 / 期望薪资'，逐字给应对话术）"],
  "tips": ["备考注意（如：哪些数字现在必须补上、哪个项目要被问到就要主动展开、着装/时间等 3-5 条）"]
}

要求：
- rounds 覆盖 3-4 个轮次，每个轮次 2-4 个 turns；整体 10-14 个 questions。
- 问题必须**由该 JD + 这份简历**驱动：优先深挖简历里最相关的经历、以及匹配分析暴露的缺口/缺失关键词。
- 候选人回答一律**口语化、第一人称、可直接照念**；结构上先给结论/框架再给例子。
- **不造假铁律**：回答里的事实、项目、数字只能来自原简历；原简历没有的具体数字，写 [待补充: 说明缺什么]，绝不编造。
- followUps 每个 turn 至少 1 条，深挖型 turn 可 2-3 条。`;

  const script = await agnesJson<InterviewScript>(prompt, apiKeyOverride, modelOverride, '面试逐字稿');

  // 兜底补全：LLM 偶发漏字段时不炸前端
  script.rounds ??= [];
  script.rounds.forEach((r) => {
    r.turns ??= [];
    r.turns.forEach((t) => {
      t.followUps ??= [];
      t.question = t.question || '';
      t.answer = t.answer || '';
    });
  });
  script.questionsToAsk ??= [];
  script.pitfalls ??= [];
  script.tips ??= [];
  script.meta ??= { duration: '', format: '', focus: [] };
  script.meta.focus ??= [];
  script.selfIntro ??= { prompt: '', script: '' };
  return script;
}
