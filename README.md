# AI 面试助手 · 岗位 × 简历定制平台

面向「转型产品经理」的端到端 AI 工作台：粘贴一份 JD + 一份简历，自动完成 **岗位解析 → 截图识别 → 匹配诊断 → 定制简历 → 排版预览/导出 → 面试逐字稿**，并自动把交付物存档到你的 Obsidian vault。

- 前端：React 18 + Vite + Zustand（persist 到 localStorage）
- 后端：Hono + TypeScript（`tsx` 直跑，无需预编译）
- 模型：Agnes（OpenAI 兼容端点）文本 `agnes-3.0-flash`、图像 `agnes-image-2.5-flash`
- UI：方案 B · Linear/Vercel 暗色极简（`#0A0A0A` 底、indigo 强调、零阴影、无 emoji）

## 快速上手

```bash
# 1. 装依赖（根目录一次性安装，server/client 为子包）
npm install

# 2. 配置环境（敏感信息不入库，务必复制后填写）
copy .env.example .env.local
#    编辑 .env.local：填 AGNES_API_KEY 与你的 OBSIDIAN_VAULT_PATH

# 3. 启动（前后端并发；前端 5173、后端 3001）
npm run dev
#    浏览器打开 http://localhost:5173

# 生产形态
npm run build     # 前端产出 client/dist
npm run start     # 仅起后端（可静态托管 client/dist）
npm run test       # 确定性单测（关键词匹配 + 排版引擎，不依赖 LLM）
```

> Windows 下 `copy .env.example .env.local`；Linux/macOS 用 `cp`。
> 后端启动时自动读取**项目根**的 `.env.local`（缺失会告警但继续跑，LLM 功能会失败）。

## 流水线（M1–M5）

| 阶段 | 能力 | 产物 |
|------|------|------|
| M1 | 粘贴/截图识别 JD + 简历，结构化解析岗位画像 | JD 画像、简历字段 |
| M2 | 确定性关键词匹配 + LLM 诊断，量化匹配度 | 匹配报告（硬/加分项命中、缺口） |
| M3 | 简历定制 + **用户上传 `.html` 模板**（`{{占位符}}` 确定性填充） | 定制简历、排版 HTML 预览/导出 |
| M4 | 面试准备 + 整单存档 | 面试准备工单、Obsidian 会话文件 |
| M5 | **面试逐字稿**（结构化对话：开场 / 分轮问答 / 追问 / 反问 / 高风险题 / 备考要点），生成即自动存档 | 逐字稿 `.md`（Obsidian `sessions\`） |

- 零造假原则：定制简历与逐字稿缺失数据一律用 `[待补充]` 占位，不编造数字。
- M5 存档文件名：`逐字稿-<岗位>-<日期>.md`（岗位取 JD 解析的 `role`；未解析则从 LLM 标题首段提取；同目录重名自动 `-2`/`-3`）。
- M4 整单存档会**关联 M5 逐字稿工单号**，并在 markdown 里写出对应段落。

## API（`/api/*`）

| 方法 & 路径 | 说明 |
|-------------|------|
| `GET /api/health` | 探活 |
| `POST /api/resume/analyze-jd` | M1 JD 解析 |
| `POST /api/resume/parse` | M1 简历解析 |
| `POST /api/resume/match` | M2 匹配诊断 |
| `POST /api/resume/tailor` | M3 简历定制 |
| `POST /api/resume/layout` | M3 排版（确定性；传 `templateHtml` 则按用户模板） |
| `POST /api/resume/interview-script` | M5 逐字稿（成功即自动存 Obsidian） |
| `POST /api/resume/session` | M4 整单存档（关联 M4 prep + M5 逐字稿工单） |
| `POST /api/recognize-resume` | M2 简历截图 OCR（图像模型） |
| `POST /api/recognize-jd` | JD 截图识别 |
| `POST /api/prep` | M4 面试准备生成 |
| `GET /api/sessions` | 会话/工单列表 |
| `GET /api/settings` · `POST /api/test-connection` | 模型连通性 |

## 环境变量

见 `.env.example`。关键项：

- `AGNES_BASE_URL` / `AGNES_API_KEY` / `AGNES_TEXT_MODEL` / `AGNES_IMAGE_MODEL`
- `OBSIDIAN_VAULT_PATH`：指向含 `.obsidian/` 的 vault **根目录**；M4/M5 存档写入其下 `sessions\`。

## 目录

```
client/   React + Vite 前端（src/components 各面板、stores/resumeStore persist）
server/   Hono 后端（routes/、services/：resumeService、obsidian）
docs/     设计说明与计划（superpowers/specs、plans）
e2e/      本地测试载荷（已 gitignore）
.env.example  环境模板（入库）
.env.local    你的真实配置（gitignore，勿提交）
```

## 已知事项

- 低内存机器上整项目 `tsc` 可能 OOM；运行时用 `tsx` 即可。
- 后端重启后 auth token 会失效（`SECRET_KEY` 变化），前端需清 localStorage 重新登录（若有）；本项目 MVP 暂不走 token 鉴权。
