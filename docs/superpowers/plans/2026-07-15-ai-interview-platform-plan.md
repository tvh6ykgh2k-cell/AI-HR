# AI 面试官平台 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建本地运行的 AI 面试网站，Agnes AI 扮演面试官，支持 JD 截图识别、STAR 面试准备、语音输入、Obsidian 自动保存。

**Architecture:** Vite + React 前端（:5173）+ Hono Node.js 后端（:3001）。前端通过 fetch 调后端 API，后端代理 Agnes AI 并写文件到 Obsidian Vault。一个 `npm run dev` 同时启动两个服务。

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Framer Motion 10, Zustand 4, Hono 4, Web Speech API

## Global Constraints

- 纯本地运行，不部署公网
- Agnes AI endpoint: `https://apihub.agnes-ai.com/v1/chat/completions` (OpenAI 兼容)
- Obsidian Vault: `C:\Users\Administrator\Documents\Obsidian Vault\PM 面试`
- API Key: `.env.local` 默认 + 设置页覆盖
- 保存策略: 每题实时追加 + 面试结束后生成完整总结版
- 面试形式: 文字为主 + 可选语音输入 (Web Speech API)
- 面试官人格: 自然语言描述 + 5 维滑块
- 前端 React 路由: react-router-dom v6
- 后端端口 3001，前端端口 5173，Vite 代理 `/api` → `:3001`

### Finesse Design System (non-negotiable)

**Register:** product · **SOUL=6 SPECTACLE=3 DENSITY=7**

**Palette (NO raw Tailwind colors — use these tokens only):**
| Token | Hex | Role |
|-------|-----|------|
| `void` | `#08090D` | Page bg — near-black, 2° blue-gray tint |
| `surface` | `#111318` | Cards, inputs |
| `ink` | `#ECEEF5` | Primary text — not pure white |
| `mist` | `#84889A` | Muted/secondary text |
| `iron` | `#3E4050` | Hairlines/tertiary/disabled |
| `pulse` | `#3DD6C8` | PRIMARY ACCENT — teal precision |
| `ember` | `#F0A050` | SECONDARY ACCENT — warm amber (STAR scores, CTAs) |

**Font stack:** `ui: -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif` · `mono: 'JetBrains Mono', monospace`

**Substrate (already in index.css):**
- Grain overlay (`body::before` with SVG feTurbulence at opacity .028)
- Content layer z-index:5 above grain z-index:1
- Translucent borders only (`rgba(255,255,255,.08)`) — never hard `#333`
- Custom scrollbar, `::selection` in pulse tint
- `prefers-reduced-motion` fallback mandatory on all animations

**Finesse Cheapness Blacklist (DO NOT USE):**
- ❌ AI purple glow (`#6366f1`, `#8B5CF6`, purple gradients)
- ❌ Glassmorphism / backdrop-blur cards
- ❌ Gradient text on headings
- ❌ Gradient border animations
- ❌ Inter as only font (system stack is fine, but never import Inter alone)
- ❌ Eyebrow labels on every section
- ❌ Bouncing/elastic spring animations (use `cubic-bezier(0.16,1,0.3,1)` instead)
- ❌ Hard `#333` or `#666` borders
- ❌ Pure `#fff` or `#000` anywhere
- ❌ Spinner-only loading (use skeleton matching final shape)

---

## Phase 1: Project Scaffolding

### Task 1: Root monorepo setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `.gitignore`

**Produces:** `npm run dev` script that starts both servers, `npm run dev:server`, `npm run dev:client`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "pm-interview",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npx tsx watch index.ts",
    "dev:client": "cd client && npx vite --port 5173",
    "build": "cd client && npx vite build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create .env.local**

```
AGNES_API_KEY=sk-agnes-your-key-here
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
OBSIDIAN_VAULT_PATH=C:\\Users\\Administrator\\Documents\\Obsidian Vault\\PM 面试
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env.local
*.log
```

- [ ] **Step 5: Install root dependencies and verify**

```bash
cd "f:/pm agent" && npm install
```

Expected: `concurrently` installed, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json .env.local .gitignore
git commit -m "feat: root monorepo scaffold with concurrently"
```

---

### Task 2: Server scaffold (Hono)

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/index.ts`

**Produces:** A running Hono server on :3001 with a `/api/health` endpoint.

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "pm-interview-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "hono": "^4.6.5",
    "@hono/node-server": "^1.13.7"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "@types/node": "^22.7.5"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 3: Create server/index.ts**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono();

app.use('/*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
```

- [ ] **Step 4: Install server dependencies and test**

```bash
cd "f:/pm agent/server" && npm install
npx tsx index.ts
```

Expected: `Server running on http://localhost:3001`. Visit `http://localhost:3001/api/health` → `{"status":"ok",...}`

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat: Hono server scaffold with health endpoint"
```

---

### Task 3: Client scaffold (Vite + React + Tailwind)

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/tailwind.config.ts`
- Create: `client/postcss.config.js`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/index.css`

**Produces:** A running Vite dev server on :5173 with React + Tailwind, proxying `/api` to `:3001`.

- [ ] **Step 1: Create client/package.json**

```json
{
  "name": "pm-interview-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0",
    "zustand": "^4.5.5",
    "framer-motion": "^10.18.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vite": "^5.4.9"
  }
}
```

- [ ] **Step 2: Create client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Create client/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Create client/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI 面试官</title>
  </head>
  <body class="bg-gray-950 text-gray-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create client/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { @apply border-gray-800; }
  body { @apply bg-gray-950 text-gray-100 antialiased; }
}
```

- [ ] **Step 7: Create client/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 8: Create client/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<div className="p-8 text-center text-2xl">AI 面试官 🎯</div>} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 9: Create client/tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 10: Install client deps and verify**

```bash
cd "f:/pm agent/client" && npm install
npx vite --port 5173
```

Expected: Vite dev server runs, visit `http://localhost:5173` → shows "AI 面试官 🎯"

- [ ] **Step 11: Test full-stack integration**

```bash
cd "f:/pm agent" && npm run dev
```

Expected: Both servers start. `http://localhost:5173/api/health` → `{"status":"ok",...}` (Vite proxies to Hono).

- [ ] **Step 12: Commit**

```bash
git add client/
git commit -m "feat: Vite + React + Tailwind client scaffold"
```

---

## Phase 2: Backend Foundation

### Task 4: Shared types

**Files:**
- Create: `server/types.ts`

**Produces:** TypeScript types used by all backend services and routes.

- [ ] **Step 1: Create server/types.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add server/types.ts
git commit -m "feat: shared types for settings, chat, prep, STAR scoring"
```

---

### Task 5: Agnes AI service

**Files:**
- Create: `server/services/agnes.ts`

**Consumes:** `types.ts` (ChatMessage)
**Produces:** `sendChat(messages, options)`, `recognizeJD(imageBase64)`, `generatePrep(jdText, resumeText?)`, `scoreStar(question, answer, jdContext)`, `generateSummary(sessionContent)`

- [ ] **Step 1: Create server/services/agnes.ts**

```typescript
import type { ChatMessage, PrepDocument, StarScore } from '../types.js';

const BASE_URL = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const API_KEY = process.env.AGNES_API_KEY || '';

function getApiKey(overrideKey?: string): string {
  return overrideKey || API_KEY;
}

const VISION_MODEL = 'agnes-vision';    // 多模态模型
const CHAT_MODEL = 'agnes-chat';        // 文本对话模型

interface SendChatOptions {
  stream?: boolean;
  apiKeyOverride?: string;
  modelOverride?: string;
}

export async function* sendChat(
  messages: ChatMessage[],
  options: SendChatOptions = {}
): AsyncGenerator<string> {
  const apiKey = getApiKey(options.apiKeyOverride);
  const model = options.modelOverride || CHAT_MODEL;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream !== false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Agnes AI error: ${response.status} ${err}`);
  }

  if (options.stream === false) {
    const data = await response.json() as any;
    yield data.choices[0].message.content;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch { /* skip malformed chunks */ }
    }
  }
}

export async function recognizeJD(
  imageBase64: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = getApiKey(apiKeyOverride);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请提取这张 BOSS直聘截图中的招聘信息，返回严格的 JSON 格式（不要 markdown 代码块）：

{
  "company": "公司名称",
  "position": "岗位名称",
  "salary": "薪资范围",
  "responsibilities": ["岗位职责1", "岗位职责2"],
  "requirements": ["任职要求1", "任职要求2"],
  "bonuses": ["加分项1", "加分项2"],
  "rawText": "原始JD文本"
}

如果某项信息未找到，填空字符串或空数组。务必只返回 JSON。`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${imageBase64}` },
          },
        ],
      }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`JD recognition failed: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

export async function generatePrep(
  jdText: string,
  resumeText?: string,
  apiKeyOverride?: string
): Promise<PrepDocument> {
  const apiKey = getApiKey(apiKeyOverride);

  const resumeSection = resumeText
    ? `\n\n候选人简历：\n${resumeText}`
    : '\n\n（候选人未提供简历，请生成通用 STAR 框架，S/T/A/R 各段留空供候选人自行填充）';

  const prompt = `你是一位专业的面试准备顾问。根据以下 JD 和候选人的简历，请生成完整的面试准备文档。

JD 内容：
${jdText}
${resumeSection}

请严格按照以下 JSON Schema 返回（不要 markdown 代码块，只要纯 JSON）：

{
  "competencies": [
    {"name": "能力名称", "evidence": "JD中的证据", "weight": "高/中/低"}
  ],
  "questions": [
    {"question": "面试问题", "category": "技术深挖/项目经验/行为题/系统设计/开放题", "probability": "高/中/低"}
  ],
  "starStories": [
    {
      "name": "故事名称",
      "situation": "具体场景",
      "task": "你的任务",
      "action": "你的行动（3-4个具体步骤）",
      "result": "量化成果",
      "fullVersion": "2分钟完整叙述",
      "shortVersion": "60秒精简版",
      "oneLiner": "15秒一句话版",
      "coversCompetencies": ["覆盖的能力名称"]
    }
  ],
  "selfIntroFull": "2分钟自我介绍脚本（与JD高度匹配）",
  "selfIntroShort": "30秒电梯游说版本",
  "questionsToAsk": [
    {"category": "Hiring Manager/技术Leader/团队成员", "questions": ["问题1", "问题2"]}
  ],
  "difficultAnswers": [
    {"scenario": "你的弱点是什么/为什么离职/失败经历", "formula": "公式化回答模板"}
  ]
}

要求：
- 提取 4-6 个核心能力维度
- 生成 15-20 个预测问题，按高/中/低概率分类
- 如有简历，每个简历要点生成一个完整 STAR 故事；如无，生成 6-8 个通用 STAR 框架
- 问题分布：技术深挖 35%、项目经验 25%、行为题 20%、系统设计 15%、开放题 5%`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prep generation failed: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;

  // Agnes AI may return JSON with markdown wrapping
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr) as PrepDocument;
}

export async function scoreStar(
  question: string,
  answer: string,
  jdContext: string
): Promise<StarScore> {
  const prompt = `评估以下面试回答的 STAR 结构完整性：

面试问题：${question}
候选人回答：${answer}
岗位背景：${jdContext}

返回 JSON（不要 markdown）：
{
  "s": {"complete": true/false, "feedback": "Situation 评估反馈"},
  "t": {"complete": true/false, "feedback": "Task 评估反馈"},
  "a": {"complete": true/false, "feedback": "Action 评估反馈"},
  "r": {"complete": true/false, "feedback": "Result 评估反馈"},
  "overall": "整体 STAR 结构评价和改进建议"
}

判断标准：
- S (Situation): 是否说明了具体场景和背景？
- T (Task): 是否明确了个人职责和任务？
- A (Action): 是否描述了具体的个人行动和技术决策？
- R (Result): 是否有量化数据和业务成果？`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`STAR scoring failed: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr) as StarScore;
}

export async function generateSummary(
  sessionContent: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = getApiKey(apiKeyOverride);
  const prompt = `以下是完整的面试记录。请生成面试总结：

${sessionContent}

返回 Markdown 格式的面试总结：
- **优点：** 2-3 条
- **待提升：** 2-3 条
- **总体评价：** X/10，一段话
- **建议：** 下次面试重点准备方向`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Summary generation failed: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/agnes.ts
git commit -m "feat: Agnes AI service — chat, JD recognition, prep, STAR scoring, summary"
```

---

### Task 6: Obsidian service

**Files:**
- Create: `server/services/obsidian.ts`

**Consumes:** `types.ts` (AppSettings, SessionMeta)
**Produces:** `readSettings()`, `writeSettings(s)`, `createSessionFile(meta, content)`, `appendToSession(path, content)`, `listSessions()`, `readSession(id)`, `deleteSession(id)`, `updateFrontmatter(path, updates)`

- [ ] **Step 1: Create server/services/obsidian.ts**

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppSettings, SessionMeta } from '../types.js';
import { DEFAULT_SETTINGS } from '../types.js';

function vaultPath(): string {
  return process.env.OBSIDIAN_VAULT_PATH || '';
}

function settingsPath(): string {
  return path.join(vaultPath(), 'settings.json');
}

function sessionsDir(): string {
  return path.join(vaultPath(), 'sessions');
}

// ========== Settings ==========

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // First run: write defaults
    await writeSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(vaultPath(), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

// ========== Sessions ==========

function sessionFileName(meta: SessionMeta): string {
  const suffix = meta.type === 'prep' ? '-准备' : '';
  return `${meta.id}${suffix}.md`;
}

function sessionFilePath(meta: SessionMeta): string {
  return path.join(sessionsDir(), sessionFileName(meta));
}

export async function ensureSessionsDir(): Promise<void> {
  await fs.mkdir(sessionsDir(), { recursive: true });
}

export async function createSessionFile(meta: SessionMeta, content: string): Promise<string> {
  await ensureSessionsDir();
  const filePath = sessionFilePath(meta);

  const tags = ['面试', ...meta.tags].map(t => `"${t}"`).join(', ');

  const frontmatter = `---
date: ${meta.date}
company: ${meta.company}
position: ${meta.position}
type: ${meta.type}
tags: [${tags}]
---

${content}`;

  await fs.writeFile(filePath, frontmatter, 'utf-8');
  return filePath;
}

export async function appendToSession(meta: SessionMeta, content: string): Promise<void> {
  const filePath = sessionFilePath(meta);
  await fs.appendFile(filePath, content, 'utf-8');
}

export async function listSessions(): Promise<SessionMeta[]> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const sessions: SessionMeta[] = [];
    for (const file of mdFiles) {
      const filePath = path.join(sessionsDir(), file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const fm = fmMatch[1];
      const get = (key: string) => fm.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim() || '';

      sessions.push({
        id: file.replace('-准备.md', '').replace('.md', ''),
        date: get('date'),
        company: get('company'),
        position: get('position'),
        type: (get('type') as 'interview' | 'prep') || 'interview',
        tags: get('tags').replace(/[[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean),
      });
    }

    return sessions.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function readSession(id: string): Promise<string | null> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const target = files.find(f => f.startsWith(id) && f.endsWith('.md'));
    if (!target) return null;
    return await fs.readFile(path.join(sessionsDir(), target), 'utf-8');
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const targets = files.filter(f => f.startsWith(id) && f.endsWith('.md'));
    for (const f of targets) {
      await fs.unlink(path.join(sessionsDir(), f));
    }
    return targets.length > 0;
  } catch {
    return false;
  }
}

export async function sessionExists(meta: SessionMeta): Promise<boolean> {
  try {
    await fs.access(sessionFilePath(meta));
    return true;
  } catch {
    return false;
  }
}

export async function readSessionContent(meta: SessionMeta): Promise<string> {
  try {
    return await fs.readFile(sessionFilePath(meta), 'utf-8');
  } catch {
    return '';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/obsidian.ts
git commit -m "feat: Obsidian service — settings and session file CRUD"
```

---

## Phase 3: Backend API Routes

### Task 7: Settings API

**Files:**
- Create: `server/routes/settings.ts`
- Modify: `server/index.ts` (mount route)

**Produces:** `GET /api/settings` returns current settings, `PUT /api/settings` updates them.

- [ ] **Step 1: Create server/routes/settings.ts**

```typescript
import { Hono } from 'hono';
import { readSettings, writeSettings } from '../services/obsidian.js';
import type { AppSettings } from '../types.js';

export const settingsRoute = new Hono();

settingsRoute.get('/', async (c) => {
  try {
    const settings = await readSettings();
    return c.json(settings);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

settingsRoute.put('/', async (c) => {
  try {
    const body = await c.req.json<Partial<AppSettings>>();
    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      ...body,
      sliders: { ...current.sliders, ...body.sliders },
    };
    await writeSettings(updated);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
```

- [ ] **Step 2: Mount in server/index.ts — add import and route**

```typescript
// Add after existing imports:
import { settingsRoute } from './routes/settings.js';

// Add after app.get('/api/health', ...):
app.route('/api/settings', settingsRoute);
```

- [ ] **Step 3: Test with curl**

```bash
curl http://localhost:3001/api/settings
```

Expected: Returns default settings JSON.

- [ ] **Step 4: Commit**

```bash
git add server/routes/settings.ts server/index.ts
git commit -m "feat: settings API — read and update interviewer settings"
```

---

### Task 8: Chat API with SSE

**Files:**
- Create: `server/routes/chat.ts`
- Modify: `server/index.ts` (mount route)

**Produces:** `POST /api/chat` with SSE streaming, builds system prompt from settings + JD + STAR context.

- [ ] **Step 1: Create server/routes/chat.ts**

```typescript
import { Hono } from 'hono';
import { sendChat } from '../services/agnes.js';
import { readSettings } from '../services/obsidian.js';
import { readSessionContent, appendToSession } from '../services/obsidian.js';
import type { ChatMessage, ChatRequest, SliderSettings } from '../types.js';

export const chatRoute = new Hono();

function sliderInstructions(s: SliderSettings): string {
  const lines: string[] = [];
  if (s.followUpDepth >= 4) lines.push('- 对每个技术回答至少追问2-3层深度');
  if (s.followUpDepth <= 2) lines.push('- 每个问题只问一层，回答后即进入下一题');
  if (s.questionPace >= 4) lines.push('- 快速抛出下一个问题，保持高压节奏');
  if (s.questionPace <= 2) lines.push('- 给候选人充足的思考时间，不要催促');
  if (s.strictness >= 4) lines.push('- 直接指出错误，毫不妥协');
  if (s.strictness <= 2) lines.push('- 鼓励为主，委婉指出问题');
  if (s.hintFrequency >= 4) lines.push('- 察觉候选人犹豫时主动引导和提示');
  if (s.hintFrequency <= 2) lines.push('- 仅在候选人明确表示不会时才给出提示');
  if (s.technicalDepth >= 4) lines.push('- 追问源码级实现和底层原理');
  if (s.technicalDepth <= 2) lines.push('- 聚焦实际项目经验和应用层面');
  return lines.join('\n');
}

function buildSystemPrompt(
  personality: string,
  sliders: SliderSettings,
  jdContext: string,
  starContext: string
): string {
  return `${personality}

## 面试风格指令
${sliderInstructions(sliders)}

## 岗位要求
${jdContext}

## 题型覆盖（来自 interview-prep-generator 框架）
请按以下比例出题：技术深挖 35%、项目经验 25%、行为题 20%、系统设计 15%、开放题 5%。

## STAR 追问指令
${starContext || '（首轮面试，暂无 STAR 评分数据）'}

## 面试流程
1. 自然开始，先让候选人做自我介绍
2. 根据 JD 和候选人回答动态调整问题方向
3. 当候选人回答缺少量化结果时，追问具体数据
4. 当候选人回答过于概括时，追问技术决策细节
5. 面试结束时给予总体反馈`;
}

chatRoute.post('/', async (c) => {
  const { sessionId, message, jdContext, starContext } = await c.req.json<ChatRequest & { jdContext?: string; starContext?: string }>();

  const settings = await readSettings();
  const systemPrompt = buildSystemPrompt(
    settings.personality,
    settings.sliders,
    jdContext || '',
    starContext || ''
  );

  // Build message history from saved session
  const savedContent = await readSessionContent({
    id: sessionId,
    date: new Date().toISOString().slice(0, 10),
    company: '', position: '', type: 'interview', tags: [],
  });

  const historyMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // Parse saved Q&A pairs (simple regex-based extraction)
  if (savedContent) {
    const qaMatches = savedContent.matchAll(/\*\*🤖 面试官：\*\*\s*(.+?)\n\n\*\*👤 我：\*\*\s*(.+?)\n/g);
    for (const m of qaMatches) {
      historyMessages.push({ role: 'assistant', content: m[1].trim() });
      historyMessages.push({ role: 'user', content: m[2].trim() });
    }
  }

  // Add current user message
  historyMessages.push({ role: 'user', content: message });

  const apiKey = settings.apiKey || undefined;
  const model = settings.model || undefined;

  return c.newResponse(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const token of sendChat(historyMessages, { apiKeyOverride: apiKey, modelOverride: model })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
});

// Non-streaming endpoint for saving
chatRoute.post('/save-qa', async (c) => {
  const { sessionId, question, answer } = await c.req.json<{
    sessionId: string; question: string; answer: string;
  }>();

  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const qaBlock = `\n### Q${timestamp}\n**🤖 面试官：** ${question}\n\n**👤 我：** ${answer}\n`;

  const meta = {
    id: sessionId,
    date: new Date().toISOString().slice(0, 10),
    company: '', position: '', type: 'interview' as const, tags: [],
  };

  await appendToSession(meta, qaBlock);

  return c.json({ success: true });
});
```

- [ ] **Step 2: Mount chat route in server/index.ts**

```typescript
// Add import:
import { chatRoute } from './routes/chat.js';
// Add route:
app.route('/api/chat', chatRoute);
```

- [ ] **Step 3: Test SSE endpoint**

```bash
curl -N -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-001","message":"你好，请做个自我介绍","jdContext":"前端工程师，要求React","starContext":""}'
```

Expected: SSE tokens stream back.

- [ ] **Step 4: Commit**

```bash
git add server/routes/chat.ts server/index.ts
git commit -m "feat: chat API with SSE streaming and Q&A saving"
```

---

### Task 9: JD Recognition API

**Files:**
- Create: `server/routes/recognize-jd.ts`
- Modify: `server/index.ts` (mount)

- [ ] **Step 1: Create server/routes/recognize-jd.ts**

```typescript
import { Hono } from 'hono';
import { recognizeJD } from '../services/agnes.js';
import { readSettings } from '../services/obsidian.js';
import type { JobDescription } from '../types.js';

export const recognizeJdRoute = new Hono();

recognizeJdRoute.post('/', async (c) => {
  try {
    const { imageBase64 } = await c.req.json<{ imageBase64: string }>();
    const settings = await readSettings();

    const rawJson = await recognizeJD(imageBase64, settings.apiKey || undefined);
    const jd: JobDescription = JSON.parse(rawJson);

    // Also store raw JD text for session context
    jd.rawText = jd.rawText || `${jd.company} - ${jd.position}\n${jd.responsibilities.join('\n')}\n${jd.requirements.join('\n')}`;

    return c.json(jd);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
```

- [ ] **Step 2: Mount in server/index.ts**

```typescript
import { recognizeJdRoute } from './routes/recognize-jd.js';
app.route('/api/recognize-jd', recognizeJdRoute);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/recognize-jd.ts server/index.ts
git commit -m "feat: JD recognition API — screenshot to structured job description"
```

---

### Task 10: Prep Generation & STAR Scoring API

**Files:**
- Create: `server/routes/prep.ts`
- Modify: `server/index.ts` (mount)

- [ ] **Step 1: Create server/routes/prep.ts**

```typescript
import { Hono } from 'hono';
import { generatePrep, scoreStar } from '../services/agnes.js';
import { readSettings, createSessionFile } from '../services/obsidian.js';
import type { PrepGenerateRequest, StarScoreRequest } from '../types.js';

export const prepRoute = new Hono();

prepRoute.post('/generate', async (c) => {
  try {
    const { jdText, resumeText } = await c.req.json<PrepGenerateRequest>();
    const settings = await readSettings();
    const prepDoc = await generatePrep(jdText, resumeText, settings.apiKey || undefined);

    // Save prep document to Obsidian
    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `${today}-prep-${Date.now()}`;

    const markdown = generatePrepMarkdown(prepDoc, jdText);
    await createSessionFile(
      { id: sessionId, date: today, company: '', position: '', type: 'prep', tags: ['面试准备'] },
      markdown
    );

    return c.json({ ...prepDoc, sessionId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

prepRoute.post('/score-star', async (c) => {
  try {
    const { question, answer, jdContext } = await c.req.json<StarScoreRequest>();
    const score = await scoreStar(question, answer, jdContext);
    return c.json(score);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

function generatePrepMarkdown(doc: any, jdText: string): string {
  let md = `# 📝 面试准备文档\n\n`;
  md += `## 📋 岗位要求\n\n> ${jdText.replace(/\n/g, '\n> ')}\n\n`;
  md += `## 🎯 核心能力维度\n\n`;
  doc.competencies.forEach((comp: any) => {
    md += `- **${comp.name}** (${comp.weight}) — ${comp.evidence}\n`;
  });
  md += `\n## 📖 预测问题库\n\n`;
  const categories = ['技术深挖', '项目经验', '行为题', '系统设计', '开放题'];
  categories.forEach(cat => {
    const qs = doc.questions.filter((q: any) => q.category === cat);
    if (qs.length === 0) return;
    md += `### ${cat}\n\n`;
    qs.forEach((q: any) => {
      md += `- [${q.probability}] ${q.question}\n`;
    });
    md += '\n';
  });
  md += `## 📖 STAR 故事银行\n\n`;
  doc.starStories.forEach((story: any, i: number) => {
    md += `### 故事 ${i + 1}: ${story.name}\n\n`;
    md += `**覆盖能力：** ${story.coversCompetencies.join(', ')}\n\n`;
    md += `| 版本 | 内容 |\n|------|------|\n`;
    md += `| 完整版 (2min) | ${story.fullVersion} |\n`;
    md += `| 精简版 (60s) | ${story.shortVersion} |\n`;
    md += `| 一句话 (15s) | ${story.oneLiner} |\n\n`;
    md += `<details><summary>完整 STAR</summary>\n\n`;
    md += `- **S:** ${story.situation}\n`;
    md += `- **T:** ${story.task}\n`;
    md += `- **A:** ${story.action}\n`;
    md += `- **R:** ${story.result}\n`;
    md += `</details>\n\n`;
  });
  md += `## 🎤 自我介绍脚本\n\n### 2分钟版本\n\n${doc.selfIntroFull}\n\n### 30秒版本\n\n${doc.selfIntroShort}\n\n`;
  md += `## ❓ 反问问题库\n\n`;
  doc.questionsToAsk.forEach((group: any) => {
    md += `### ${group.category}\n\n`;
    group.questions.forEach((q: string) => { md += `- ${q}\n`; });
    md += '\n';
  });
  md += `## ⚠️ 难点应对策略\n\n`;
  doc.difficultAnswers.forEach((item: any) => {
    md += `### ${item.scenario}\n\n${item.formula}\n\n`;
  });
  return md;
}
```

- [ ] **Step 2: Mount in server/index.ts**

```typescript
import { prepRoute } from './routes/prep.js';
app.route('/api/prep', prepRoute);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/prep.ts server/index.ts
git commit -m "feat: prep API — generate interview prep doc and STAR scoring"
```

---

### Task 11: Sessions & Test Connection API

**Files:**
- Create: `server/routes/sessions.ts`
- Modify: `server/index.ts` (mount + /api/test-connection)

- [ ] **Step 1: Create server/routes/sessions.ts**

```typescript
import { Hono } from 'hono';
import { listSessions, readSession, deleteSession } from '../services/obsidian.js';

export const sessionsRoute = new Hono();

sessionsRoute.get('/', async (c) => {
  try {
    const sessions = await listSessions();
    return c.json(sessions);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

sessionsRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const content = await readSession(id);
    if (!content) return c.json({ error: 'Session not found' }, 404);
    return c.json({ id, content });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

sessionsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deleted = await deleteSession(id);
    if (!deleted) return c.json({ error: 'Session not found' }, 404);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
```

- [ ] **Step 2: Add test-connection endpoint in server/index.ts**

```typescript
// Add with other imports:
import { sessionsRoute } from './routes/sessions.js';
import { sendChat } from './services/agnes.js';
import { readSettings } from './services/obsidian.js';

// Add route mounts:
app.route('/api/sessions', sessionsRoute);

// Add test connection endpoint:
app.post('/api/test-connection', async (c) => {
  try {
    const settings = await readSettings();
    const apiKey = settings.apiKey || undefined;
    // Send a quick test message
    const tokens: string[] = [];
    for await (const token of sendChat(
      [{ role: 'user', content: 'Ping. Reply with only "pong".' }],
      { apiKeyOverride: apiKey, modelOverride: settings.model || undefined }
    )) {
      tokens.push(token);
    }
    return c.json({ success: true, response: tokens.join('').trim() });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/sessions.ts server/index.ts
git commit -m "feat: sessions API + test-connection endpoint"
```

---

The server/index.ts should now have all routes mounted. Verify final structure:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { sendChat } from './services/agnes.js';
import { readSettings } from './services/obsidian.js';
import { settingsRoute } from './routes/settings.js';
import { chatRoute } from './routes/chat.js';
import { recognizeJdRoute } from './routes/recognize-jd.js';
import { prepRoute } from './routes/prep.js';
import { sessionsRoute } from './routes/sessions.js';

const app = new Hono();
app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route('/api/settings', settingsRoute);
app.route('/api/chat', chatRoute);
app.route('/api/recognize-jd', recognizeJdRoute);
app.route('/api/prep', prepRoute);
app.route('/api/sessions', sessionsRoute);
app.post('/api/test-connection', async (c) => {
  try {
    const settings = await readSettings();
    const tokens: string[] = [];
    for await (const token of sendChat(
      [{ role: 'user', content: 'Ping. Reply with only "pong".' }],
      { apiKeyOverride: settings.apiKey || undefined, modelOverride: settings.model || undefined }
    )) { tokens.push(token); }
    return c.json({ success: true, response: tokens.join('').trim() });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

serve({ fetch: app.fetch, port: 3001 });
console.log('Server running on http://localhost:3001');
```

---

## Phase 4: Frontend Foundation

### Task 12: Router, Layout & API Client

**Files:**
- Create: `client/src/lib/api.ts`
- Modify: `client/src/App.tsx`
- Create: `client/src/pages/HomePage.tsx` (placeholder)
- Create: `client/src/pages/InterviewPage.tsx` (placeholder)
- Create: `client/src/pages/PrepPage.tsx` (placeholder)
- Create: `client/src/pages/PrepResultPage.tsx` (placeholder)
- Create: `client/src/pages/SettingsPage.tsx` (placeholder)

- [ ] **Step 1: Create API client lib — client/src/lib/api.ts**

```typescript
const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  testConnection: () => request<any>('/test-connection', { method: 'POST' }),

  // Chat
  saveQA: (sessionId: string, question: string, answer: string) =>
    request<any>('/chat/save-qa', { method: 'POST', body: JSON.stringify({ sessionId, question, answer }) }),

  // JD
  recognizeJD: (imageBase64: string) =>
    request<any>('/recognize-jd', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),

  // Prep
  generatePrep: (jdText: string, resumeText?: string) =>
    request<any>('/prep/generate', { method: 'POST', body: JSON.stringify({ jdText, resumeText }) }),
  scoreStar: (question: string, answer: string, jdContext: string) =>
    request<any>('/prep/score-star', { method: 'POST', body: JSON.stringify({ question, answer, jdContext }) }),

  // Sessions
  listSessions: () => request<any[]>('/sessions'),
  getSession: (id: string) => request<any>(`/sessions/${id}`),
  deleteSession: (id: string) => request<any>(`/sessions/${id}`, { method: 'DELETE' }),
};

// SSE helper for streaming chat
export function streamChat(
  sessionId: string,
  message: string,
  jdContext: string,
  starContext: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, jdContext, starContext }),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    if (!reader) { onError(new Error('No body')); return; }
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) onToken(parsed.token);
          if (parsed.error) onError(new Error(parsed.error));
        } catch {}
      }
    }
    onDone();
  }).catch(onError);

  return controller;
}
```

- [ ] **Step 2: Update client/src/App.tsx with routing**

```tsx
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const PrepPage = lazy(() => import('./pages/PrepPage'));
const PrepResultPage = lazy(() => import('./pages/PrepResultPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-gray-400">加载中...</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview/new" element={<InterviewPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/prep/new" element={<PrepPage />} />
        <Route path="/prep/:id" element={<PrepResultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 3: Create placeholder pages (each minimal so router works)**

`client/src/pages/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <div className="p-8">Home Page</div>;
}
```

Same pattern for InterviewPage, PrepPage, PrepResultPage, SettingsPage.

- [ ] **Step 4: Test routing**

```bash
cd "f:/pm agent" && npm run dev
```

Visit `/`, `/interview/new`, `/prep/new`, `/settings` — each shows its placeholder.

- [ ] **Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: router, API client, placeholder pages"
```

---

### Task 13: Zustand Stores

**Files:**
- Create: `client/src/stores/settingsStore.ts`
- Create: `client/src/stores/interviewStore.ts`
- Create: `client/src/stores/prepStore.ts`

- [ ] **Step 1: Create settings store — client/src/stores/settingsStore.ts**

```typescript
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
```

- [ ] **Step 2: Create interview store — client/src/stores/interviewStore.ts**

```typescript
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
```

- [ ] **Step 3: Create prep store — client/src/stores/prepStore.ts**

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add client/src/stores/
git commit -m "feat: Zustand stores — settings, interview, prep"
```

---

## Phase 5: Frontend Pages

### Task 14: Home Page

**Files:**
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Implement HomePage with dual-mode cards**

```tsx
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

interface SessionMeta { id: string; date: string; company: string; position: string; type: string; }

export default function HomePage() {
  const nav = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-2"
      >
        🎯 今天想做什么？
      </motion.h1>
      <p className="text-gray-400 mb-10">选择模式，开始你的面试之旅</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full mb-12">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => nav('/interview/new')}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-left hover:from-blue-500 hover:to-blue-700 transition-all shadow-xl"
        >
          <div className="text-4xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold mb-2">模拟面试</h2>
          <p className="text-blue-200 text-sm">
            AI 面试官实战 · 语音+文字交互 · 实时保存 Obsidian
          </p>
          <div className="mt-4 inline-block bg-white/10 rounded-full px-4 py-1 text-sm">
            进入 →
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => nav('/prep/new')}
          className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-left hover:from-emerald-500 hover:to-emerald-700 transition-all shadow-xl"
        >
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">面试准备</h2>
          <p className="text-emerald-200 text-sm">
            生成 STAR 故事库 · 预测面试问题 · 输出 Prep 文档
          </p>
          <div className="mt-4 inline-block bg-white/10 rounded-full px-4 py-1 text-sm">
            进入 →
          </div>
        </motion.button>
      </div>

      {sessions.length > 0 && (
        <div className="max-w-2xl w-full">
          <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-3">最近记录</h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => nav(s.type === 'prep' ? `/prep/${s.id}` : `/interview/${s.id}`)}
                className="w-full text-left bg-gray-900 hover:bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 transition-colors"
              >
                <span>{s.type === 'prep' ? '📝' : '📄'}</span>
                <div>
                  <div className="text-sm">{s.date} {s.company} {s.position}</div>
                  <div className="text-xs text-gray-500">{s.type === 'prep' ? '面试准备文档' : '模拟面试'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => nav('/settings')}
        className="mt-8 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        ⚙️ 设置面试官人格 & 连接配置
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/HomePage.tsx
git commit -m "feat: home page with dual-mode entry cards and recent sessions"
```

---

### Task 15: Interview Flow Pages (JD Input → Chat → STAR)

**Files:**
- Modify: `client/src/pages/InterviewPage.tsx`
- Create: `client/src/components/ImagePaste.tsx`
- Create: `client/src/components/ChatBubble.tsx`
- Create: `client/src/components/VoiceButton.tsx`
- Create: `client/src/components/StarPanel.tsx`

- [ ] **Step 1: ImagePaste component — handles screenshot paste/drop**

```tsx
// client/src/components/ImagePaste.tsx
import { useState, useCallback, DragEvent } from 'react';

interface Props {
  onImage: (base64: string) => void;
  loading?: boolean;
}

export default function ImagePaste({ onImage, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onImage(base64);
    };
    reader.readAsDataURL(file);
  }, [onImage]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        processFile(item.getAsFile()!);
        break;
      }
    }
  }, [processFile]);

  return (
    <div
      onPaste={handlePaste}
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-400/10' : 'border-gray-700 hover:border-gray-500'}`}
    >
      {loading ? (
        <div className="animate-pulse">🔍 识别中...</div>
      ) : (
        <>
          <div className="text-3xl mb-2">📋</div>
          <p className="text-gray-400">粘贴或拖入 BOSS直聘 岗位截图</p>
          <p className="text-gray-600 text-sm mt-1">支持 Ctrl+V 粘贴 · JPG/PNG</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ChatBubble component**

```tsx
// client/src/components/ChatBubble.tsx
import { motion } from 'framer-motion';

interface Props {
  role: 'interviewer' | 'user';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  starScore?: any;
}

export default function ChatBubble({ role, content, timestamp, isStreaming, starScore }: Props) {
  const isAI = role === 'interviewer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`max-w-[75%] ${isAI ? 'bg-gray-800' : 'bg-blue-600'} rounded-2xl px-5 py-3`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{isAI ? '🤖 面试官' : '👤 你'}</span>
          <span className="text-xs text-gray-400">{timestamp}</span>
        </div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />}
        </p>

        {starScore && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-gray-400 mb-1">🎯 STAR 评估</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['s', 't', 'a', 'r'] as const).map((dim) => (
                <div key={dim} className={starScore[dim].complete ? 'text-green-400' : 'text-yellow-400'}>
                  {dim.toUpperCase()}: {starScore[dim].complete ? '✅' : '⚠️'}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{starScore.overall}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: VoiceButton component**

```tsx
// client/src/components/VoiceButton.tsx
import { useState, useRef, useCallback } from 'react';

interface Props {
  onResult: (text: string) => void;
}

export default function VoiceButton({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'hold' | 'toggle'>('hold');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('浏览器不支持语音识别'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      setInterim(interim);
      if (final) onResult(final.trim());
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [onResult]);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim('');
  }, []);

  const handleClick = () => {
    if (mode === 'toggle') {
      recording ? stopRecognition() : startRecognition();
    }
  };

  return (
    <div className="relative">
      {recording && interim && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300">
          {interim}...
        </div>
      )}
      <button
        onMouseDown={mode === 'hold' ? startRecognition : undefined}
        onMouseUp={mode === 'hold' ? stopRecognition : undefined}
        onMouseLeave={mode === 'hold' && recording ? stopRecognition : undefined}
        onDoubleClick={() => setMode(mode === 'hold' ? 'toggle' : 'hold')}
        onClick={handleClick}
        className={`p-3 rounded-full transition-all ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}
        title={mode === 'hold' ? '按住说话 · 双击切换' : '点击开始/结束 · 双击切换'}
      >
        🎤
      </button>
    </div>
  );
}
```

- [ ] **Step 4: StarPanel component**

```tsx
// client/src/components/StarPanel.tsx
import { motion } from 'framer-motion';

interface Props {
  coverage: { s: number; t: number; a: number; r: number };
  onClose: () => void;
}

export default function StarPanel({ coverage, onClose }: Props) {
  const dims = [
    { key: 's', label: 'Situation', desc: '场景背景', value: coverage.s },
    { key: 't', label: 'Task', desc: '任务职责', value: coverage.t },
    { key: 'a', label: 'Action', desc: '个人行动', value: coverage.a },
    { key: 'r', label: 'Result', desc: '量化结果', value: coverage.r },
  ];

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      exit={{ x: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold">📊 STAR 覆盖</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {dims.map((dim) => (
        <div key={dim.key} className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{dim.label}</span>
            <span className="text-gray-400">{dim.desc}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dim.value * 100}%` }}
              className={`h-full rounded-full ${dim.value < 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
            />
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-300">
          完整度最低的是 <span className="text-yellow-400 font-bold">
            {dims.reduce((min, d) => d.value < min.value ? d : min).label}
          </span>，面试官会重点追问此维度。
        </p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 5: Implement InterviewPage (two-phase: JD input → Chat)**

Due to complexity, here's the full page structure. The page has two phases:
- Phase 1: JD input (screenshot paste or text)
- Phase 2: Chat interface with STAR scoring

```tsx
// client/src/pages/InterviewPage.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImagePaste from '../components/ImagePaste';
import ChatBubble from '../components/ChatBubble';
import VoiceButton from '../components/VoiceButton';
import StarPanel from '../components/StarPanel';
import { useInterviewStore } from '../stores/interviewStore';
import { api, streamChat } from '../lib/api';

type Phase = 'input' | 'chat';

export default function InterviewPage() {
  const nav = useNavigate();
  const { id: existingId } = useParams();
  const [phase, setPhase] = useState<Phase>(existingId ? 'chat' : 'input');
  const [jdText, setJdText] = useState('');
  const [jdParsed, setJdParsed] = useState<any>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showStarPanel, setShowStarPanel] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const store = useInterviewStore();
  const { messages, isStreaming, starCoverage, jdContext } = store;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // JD Image Recognition
  const handleImage = async (base64: string) => {
    setRecognizing(true);
    try {
      const jd = await api.recognizeJD(base64);
      setJdParsed(jd);
      setJdText(jd.rawText || `${jd.company} - ${jd.position}\n\n岗位职责:\n${jd.responsibilities?.join('\n')}\n\n任职要求:\n${jd.requirements?.join('\n')}`);
    } catch (err: any) {
      alert('JD 识别失败: ' + err.message);
    } finally {
      setRecognizing(false);
    }
  };

  // Start Interview
  const startInterview = () => {
    store.reset();
    store.setJd(jdParsed || { rawText: jdText, company: '', position: '' });
    // Send first message to AI
    sendMessage('你好，我准备好了，请开始面试。', true);
    setPhase('chat');
  };

  // Send message to AI
  const sendMessage = useCallback((text: string, isInit = false) => {
    if (!text.trim() || isStreaming) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    store.addMessage(userMsg);

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg = {
      id: aiMsgId,
      role: 'interviewer' as const,
      content: '',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    store.addMessage(aiMsg);
    store.setStreaming(true);

    // Build STAR context for system prompt
    const starMsgs = store.messages.filter((m) => m.role === 'user' && m.starScore);
    let starContext = '';
    if (starMsgs.length > 0) {
      const weakDims = starCoverage.s < 0.5 ? 'Situation' : starCoverage.t < 0.5 ? 'Task' : starCoverage.a < 0.5 ? 'Action' : starCoverage.r < 0.5 ? 'Result' : '';
      starContext = weakDims ? `候选人 STAR 回答中「${weakDims}」维度普遍缺失，请针对性追问。` : '候选人的 STAR 结构整体良好，继续深入技术细节。';
    }

    streamChat(
      store.sessionId,
      text,
      jdContext,
      starContext,
      (token) => store.appendToken(aiMsgId, token),
      async () => {
        store.setStreaming(false);
        // Save Q&A to Obsidian
        const fullMsg = store.messages.find((m) => m.id === aiMsgId);
        if (fullMsg) {
          api.saveQA(store.sessionId, fullMsg.content, text).catch(() => {});
          // Score STAR for user's answer
          if (!isInit) {
            try {
              const score = await api.scoreStar(fullMsg.content, text, jdContext);
              store.setStarScore(userMsg.id, score);
              store.updateStarCoverage();
            } catch {}
          }
        }
      },
      (err) => {
        store.setStreaming(false);
        console.error('Chat error:', err);
      },
    );

    setInputText('');
  }, [isStreaming, store, jdContext, starCoverage]);

  // Phase 1: JD Input
  if (phase === 'input') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <button onClick={() => nav('/')} className="absolute top-4 left-4 text-gray-400 hover:text-white">← 返回</button>
        <div className="max-w-xl w-full">
          <h1 className="text-3xl font-bold mb-8 text-center">🎙️ 模拟面试 · 选择岗位</h1>

          <ImagePaste onImage={handleImage} loading={recognizing} />

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-500 text-sm">或者直接描述</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="粘贴 BOSS直聘 JD 文本，例如：&#10;腾讯前端高级工程师&#10;要求精通 React、TypeScript..."
            className="w-full h-40 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />

          {/* Hot tags */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {['前端', '后端', '产品经理', '算法', '设计', '运营'].map((tag) => (
              <button
                key={tag}
                onClick={() => setJdText((prev) => prev + ` ${tag}工程师`)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            onClick={startInterview}
            disabled={!jdText.trim()}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl py-3 font-medium transition-colors"
          >
            开始面试 →
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: Chat
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => nav('/')} className="text-gray-400 hover:text-white text-sm">← 退出</button>
        <div className="text-center">
          <div className="text-sm font-medium">🎙️ 面试进行中...</div>
          <div className="text-xs text-gray-500">{jdParsed?.position || '模拟面试'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStarPanel(!showStarPanel)} className="p-2 text-gray-400 hover:text-white">📊</button>
          <button onClick={() => store.setPaused(true)} className="p-2 text-gray-400 hover:text-white">⏸️</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'interviewer'}
            starScore={msg.starScore}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Status bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500 shrink-0">
        <span>💾 已自动保存到 Obsidian</span>
        <span>STAR覆盖: {Math.round((starCoverage.s + starCoverage.t + starCoverage.a + starCoverage.r) / 4 * 100)}%</span>
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(inputText);
            }
          }}
          placeholder="输入你的回答... (Enter 发送, Shift+Enter 换行)"
          className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
          rows={2}
          disabled={isStreaming}
        />
        <VoiceButton onResult={(text) => { setInputText((prev) => prev + text); }} />
        <button
          onClick={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isStreaming}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl px-4 py-3 font-medium transition-colors"
        >
          发送
        </button>
      </div>

      {/* STAR Panel Slide-out */}
      <AnimatePresence>
        {showStarPanel && <StarPanel coverage={starCoverage} onClose={() => setShowStarPanel(false)} />}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/InterviewPage.tsx client/src/components/
git commit -m "feat: interview page — JD input + chat + voice + STAR scoring"
```

---

### Task 16: Prep Pages (Input + Results)

**Files:**
- Modify: `client/src/pages/PrepPage.tsx`
- Modify: `client/src/pages/PrepResultPage.tsx`

- [ ] **Step 1: PrepPage — Input form**

```tsx
// client/src/pages/PrepPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImagePaste from '../components/ImagePaste';
import { usePrepStore } from '../stores/prepStore';
import { api } from '../lib/api';

export default function PrepPage() {
  const nav = useNavigate();
  const store = usePrepStore();
  const [step, setStep] = useState(1);

  const handleImage = async (base64: string) => {
    store.setLoading(true);
    try {
      const jd = await api.recognizeJD(base64);
      store.setJdText(jd.rawText || JSON.stringify(jd, null, 2));
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!store.jdText.trim()) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const doc = await api.generatePrep(store.jdText, store.resumeText || undefined);
      store.setPrepDoc(doc);
      nav(`/prep/${doc.sessionId}`);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <button onClick={() => nav('/')} className="absolute top-4 left-4 text-gray-400 hover:text-white">← 返回</button>
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">📝 面试准备 · 三步生成</h1>

        {/* Step 1: JD */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Step 1: 岗位信息</h2>
          <ImagePaste onImage={handleImage} loading={store.loading} />
          <textarea
            value={store.jdText}
            onChange={(e) => store.setJdText(e.target.value)}
            placeholder="或直接粘贴 JD 文字..."
            className="w-full h-32 mt-3 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-emerald-500 placeholder-gray-600"
          />
        </div>

        {/* Step 2: Resume */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Step 2: 个人简历（可选）</h2>
          <textarea
            value={store.resumeText}
            onChange={(e) => store.setResumeText(e.target.value)}
            placeholder="粘贴你的简历文字，生成个性化的 STAR 故事...&#10;留空则生成通用 STAR 框架"
            className="w-full h-28 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-emerald-500 placeholder-gray-600"
          />
        </div>

        {/* Generate */}
        {store.error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-300">
            {store.error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!store.jdText.trim() || store.loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl py-3 font-medium transition-colors"
        >
          {store.loading ? '⏳ 生成中...' : '生成面试准备文档 →'}
        </button>

        {/* Preview of what will be generated */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-2">生成内容预览：</h3>
          <div className="space-y-1 text-sm text-gray-500">
            <div>✅ 角色能力分析 → 提取 5 大核心考察维度</div>
            <div>✅ 预测问题库 → 高/中/低概率分类 15-20 题</div>
            <div>✅ STAR 故事银行 → 8-10 个结构化故事</div>
            <div>✅ 自我介绍脚本 → 2分钟定制版本</div>
            <div>✅ 反问问题清单 → 按面试官角色分类</div>
            <div>✅ 难点应对策略 → 弱点/失败/离职 回答公式</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: PrepResultPage — Result display with sidebar**

```tsx
// client/src/pages/PrepResultPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { usePrepStore } from '../stores/prepStore';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PrepResultPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const store = usePrepStore();
  const [activeSection, setActiveSection] = useState('competencies');
  const doc = store.prepDoc;

  // If loaded via URL directly, fetch session content
  useEffect(() => {
    if (!doc && id) {
      api.getSession(id).then((data) => {
        // Parse content if needed
      }).catch(() => {});
    }
  }, [id, doc]);

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">加载准备文档...</div>
      </div>
    );
  }

  const sections = [
    { key: 'competencies', label: '📊 能力分析', icon: '📊' },
    { key: 'questions', label: '📋 预测问题', icon: '📋', count: doc.questions?.length },
    { key: 'stories', label: '📖 STAR 故事库', icon: '📖', count: doc.starStories?.length },
    { key: 'intro', label: '🎤 自我介绍', icon: '🎤' },
    { key: 'askQuestions', label: '❓ 反问问题', icon: '❓' },
    { key: 'difficult', label: '⚠️ 难点应对', icon: '⚠️' },
  ];

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col shrink-0">
        <h2 className="font-bold mb-4">📝 面试准备文档</h2>
        <nav className="flex-1 space-y-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.key ? 'bg-emerald-600/20 text-emerald-400' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              {s.icon} {s.label}
              {s.count != null && <span className="ml-2 text-xs text-gray-500">({s.count})</span>}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-800 space-y-2">
          <div className="text-xs text-gray-500">💾 已保存到 Obsidian</div>
          <button
            onClick={() => {
              usePrepStore.getState().reset();
              nav('/interview/new');
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            开始模拟面试 →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'competencies' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📊 核心能力维度</h2>
            <div className="space-y-4">
              {doc.competencies?.map((comp: any, i: number) => (
                <div key={i} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{comp.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${comp.weight === '高' ? 'bg-red-900/50 text-red-400' : comp.weight === '中' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                      {comp.weight}优先级
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{comp.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'questions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📋 预测问题库 ({doc.questions?.length || 0} 题)</h2>
            {['技术深挖', '项目经验', '行为题', '系统设计', '开放题'].map((cat) => {
              const qs = doc.questions?.filter((q: any) => q.category === cat) || [];
              if (qs.length === 0) return null;
              return (
                <div key={cat} className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-300">{cat} ({qs.length})</h3>
                  <div className="space-y-2">
                    {qs.map((q: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded-lg px-4 py-3 flex items-start gap-3">
                        <span className={`text-xs mt-0.5 px-2 py-0.5 rounded-full ${q.probability === '高' ? 'bg-red-900/50 text-red-400' : q.probability === '中' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                          {q.probability}
                        </span>
                        <span className="text-sm">{q.question}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSection === 'stories' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📖 STAR 故事银行 ({doc.starStories?.length || 0} 个)</h2>
            <div className="space-y-6">
              {doc.starStories?.map((story: any, i: number) => (
                <div key={i} className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-lg font-medium mb-1">{story.name}</h3>
                  <div className="flex gap-2 mb-3">
                    {story.coversCompetencies?.map((c: string) => (
                      <span key={c} className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-gray-400">Situation</dt><dd className="text-gray-200 mt-1">{story.situation}</dd></div>
                    <div><dt className="text-gray-400">Task</dt><dd className="text-gray-200 mt-1">{story.task}</dd></div>
                    <div><dt className="text-gray-400">Action</dt><dd className="text-gray-200 mt-1">{story.action}</dd></div>
                    <div><dt className="text-gray-400">Result</dt><dd className="text-gray-200 mt-1">{story.result}</dd></div>
                  </dl>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
                      <span className="text-gray-400">60s精简版：</span>{story.shortVersion}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
                      <span className="text-gray-400">15s一句话：</span>{story.oneLiner}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'intro' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">🎤 自我介绍脚本</h2>
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <h3 className="font-medium mb-2">2分钟完整版</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{doc.selfIntroFull}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="font-medium mb-2">30秒电梯游说</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{doc.selfIntroShort}</p>
            </div>
          </div>
        )}

        {activeSection === 'askQuestions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">❓ 反问问题库</h2>
            {doc.questionsToAsk?.map((group: any, i: number) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 mb-4">
                <h3 className="font-medium mb-3">{group.category}</h3>
                <ul className="space-y-2">
                  {group.questions?.map((q: string, j: number) => (
                    <li key={j} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-emerald-400">•</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'difficult' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">⚠️ 难点应对策略</h2>
            {doc.difficultAnswers?.map((item: any, i: number) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 mb-4">
                <h3 className="font-medium mb-2">{item.scenario}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.formula}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/PrepPage.tsx client/src/pages/PrepResultPage.tsx
git commit -m "feat: prep pages — input form with screenshot + results with sidebar navigation"
```

---

### Task 17: Settings Page

**Files:**
- Modify: `client/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Implement SettingsPage**

```tsx
// client/src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { api } from '../lib/api';

const SLIDER_CONFIGS = [
  { key: 'followUpDepth', label: '追问深度', left: '浅', right: '深' },
  { key: 'questionPace', label: '提问节奏', left: '慢', right: '快' },
  { key: 'strictness', label: '严格程度', left: '温和', right: '严格' },
  { key: 'hintFrequency', label: '提示频率', left: '少', right: '多' },
  { key: 'technicalDepth', label: '技术深度', left: '基础', right: '底层' },
] as const;

export default function SettingsPage() {
  const nav = useNavigate();
  const store = useSettingsStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => { store.load(); }, []);

  const handleSlider = (key: string, value: number) => {
    store.save({ sliders: { ...store.sliders, [key]: value } } as any);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection();
      setTestResult(res.success ? `✅ 连接成功: ${res.response}` : `❌ 连接失败: ${res.error}`);
    } catch (err: any) {
      setTestResult(`❌ ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => nav('/')} className="text-gray-400 hover:text-white mb-6 inline-block">← 返回</button>
      <h1 className="text-3xl font-bold mb-8">⚙️ 面试官设置</h1>

      {/* Personality */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">人格描述</h2>
        <textarea
          value={store.personality}
          onChange={(e) => store.save({ personality: e.target.value })}
          placeholder="描述面试官的人设和风格..."
          className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-blue-500"
        />
      </section>

      {/* Sliders */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">风格滑块</h2>
        <div className="space-y-5">
          {SLIDER_CONFIGS.map(({ key, label, left, right }) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-gray-500">{store.sliders[key as keyof typeof store.sliders]} / 5</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-8 text-right">{left}</span>
                <input
                  type="range"
                  min="1" max="5"
                  value={store.sliders[key as keyof typeof store.sliders]}
                  onChange={(e) => handleSlider(key, Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-xs text-gray-600 w-8">{right}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connection Config */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">连接配置</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">API Key（覆盖 .env.local）</label>
            <input
              type="password"
              value={store.apiKey}
              onChange={(e) => store.save({ apiKey: e.target.value })}
              placeholder="sk-agnes-..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">模型名称</label>
            <input
              type="text"
              value={store.model}
              onChange={(e) => store.save({ model: e.target.value })}
              placeholder="留空使用默认模型"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl px-4 py-2 text-sm transition-colors"
            >
              {testing ? '⏳ 测试中...' : '🔌 测试连接'}
            </button>
            <button
              onClick={() => store.save({})}
              className="bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2 text-sm transition-colors"
            >
              💾 保存设置
            </button>
          </div>
          {testResult && (
            <div className={`text-sm p-3 rounded-lg ${testResult.startsWith('✅') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {testResult}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/SettingsPage.tsx
git commit -m "feat: settings page — personality, sliders, API key, test connection"
```

---

## Phase 6: Integration & Polish

### Task 18: Full-stack integration test & dev workflow

- [ ] **Step 1: Verify full-stack startup**
  ```bash
  cd "f:/pm agent" && npm run dev
  ```
  Expected: Both Vite (:5173) and Hono (:3001) start. Vite proxies /api to Hono.

- [ ] **Step 2: Smoke test each API endpoint**
  ```bash
  # Health
  curl http://localhost:5173/api/health
  # Settings
  curl http://localhost:5173/api/settings
  # Test connection (requires valid API key)
  curl -X POST http://localhost:5173/api/test-connection
  # Sessions
  curl http://localhost:5173/api/sessions
  ```

- [ ] **Step 3: Smoke test each page route**
  - `/` → Home page with dual mode cards
  - `/interview/new` → JD input with paste area
  - `/prep/new` → Prep input with 2-step form
  - `/settings` → Settings with sliders

- [ ] **Step 4: Create Obsidian vault directory if not exists**

  ```bash
  mkdir -p "C:/Users/Administrator/Documents/Obsidian Vault/PM 面试/sessions"
  ```

- [ ] **Step 5: End-to-end test**
  1. Open `http://localhost:5173`
  2. Click 「📝 面试准备」→ paste JD text → click generate → verify prep doc appears
  3. Click 「开始模拟面试」→ verify chat UI loads
  4. Type a message → verify SSE streaming response
  5. Check Obsidian vault for saved `.md` files
  6. Click STAR panel → verify coverage bars display

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: integration verification and smoke tests complete"
```

---

## Spec Coverage Checklist

| Spec Section | Covered By |
|---|---|
| 1.2 关键决策汇总 | Global Constraints |
| 2.1 架构图 | Tasks 1-3 (scaffold), Task 12 (router + proxy) |
| 3.1 首页双模式 | Task 14 (HomePage) |
| 3.2 模拟面试 JD 输入 | Task 15 (InterviewPage phase 1) |
| 3.3 面试准备输入 | Task 16 (PrepPage) |
| 3.4 面试准备结果 | Task 16 (PrepResultPage) |
| 3.5 面试页 + STAR | Task 15 (InterviewPage phase 2 + StarPanel) |
| 3.6 设置页 | Task 17 (SettingsPage) |
| 4.1 人格描述 | Task 13 (settingsStore) + Task 17 (SettingsPage) |
| 4.2 风格滑块 | Task 13 + Task 17 |
| 4.3 System Prompt 组装 | Task 8 (chat.ts buildSystemPrompt) |
| 4B 面试准备系统 | Task 10 (prep.ts) + Task 5 (agnes.ts generatePrep) |
| 4C STAR 评分 | Task 15 (StarPanel) + Task 10 (scoreStar) |
| 4D 增强 System Prompt | Task 8 (chat.ts 五源合一) |
| 5.1 Q&A 链路 | Task 8 (chat.ts POST) + Task 15 (streamChat) |
| 5.2 API 端点 | Tasks 7-11 (all routes) |
| 5.3 上下文管理 | Task 8 (sliding window in chat.ts) |
| 5.4 SSE 格式 | Task 5 (agnes.ts yield) + Task 12 (api.ts streamChat) |
| 6.1-6.4 Obsidian | Task 6 (obsidian.ts) + Task 10 (prep.ts markdown gen) |
| 7 语音交互 | Task 15 (VoiceButton) |
| 8 截图识别 | Task 9 (recognize-jd.ts) + Task 15 (ImagePaste) |
| 9 配置管理 | Task 7 (settings.ts) + Task 17 (SettingsPage) |
| 10 非功能需求 | Tasks 18 (integration test) |
