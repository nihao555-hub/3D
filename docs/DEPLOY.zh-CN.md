# 智造3D 部署与排障指南

本项目基于开源项目 [Adam-CAD/CADAM](https://github.com/Adam-CAD/CADAM)（GPL-3.0，
上游 commit `d75f68ca`）二次开发。以下为本地/云端环境的完整部署记录与排障方案。

---

## 一、环境要求

| 依赖         | 版本                 | 说明                                    |
| ------------ | -------------------- | --------------------------------------- |
| Node.js      | ^20.19.0 或 ≥22.12.0 | npm ≥ 10                                |
| Docker       | 任意近期版本         | 供 Supabase 本地栈使用                  |
| Supabase CLI | 已内置               | 作为 devDependency，直接 `npx supabase` |

## 二、启动步骤

```bash
# 1. 安装依赖
npm ci

# 2. 启动 Supabase 本地栈（Postgres/Auth/Storage/Realtime）
#    本仓库没有 edge functions，跳过 edge-runtime
npx supabase start -x edge-runtime

# 3. 配置环境变量（见下节）
cp .env.local.template .env.local  # 然后按下文填写

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000/studio
```

## 三、必需配置清单

### 1. Supabase 密钥（本地开发直接可用，无需申请）

`npx supabase start` 输出中包含本地通用密钥（所有本地实例相同的公开演示密钥）。
也可以随时用 `npx supabase status -o env` 再次查看：

```env
VITE_SUPABASE_URL='http://127.0.0.1:54321'
VITE_SUPABASE_ANON_KEY="<status 输出中的 ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<status 输出中的 SERVICE_ROLE_KEY>"
ENVIRONMENT="local"        # local 模式自动绕过计费服务，无需 BILLING_* 配置
ADAM_URL="http://localhost:3000"
WEBHOOK_BASE_URL="http://localhost:3000"
```

### 2. AI 模型密钥（⚠️ 生成功能必需，至少配一个）

模型路由规则（见 `src/server/aiChat.ts`），三条通道均支持自定义 base URL 接入中转：

| 界面模型                                     | 密钥                 | Base URL 覆盖         | 说明                                                                                     |
| -------------------------------------------- | -------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| Claude 系列（Fable 5 / Opus 4.8 / Sonnet 5） | `ANTHROPIC_API_KEY`  | `ANTHROPIC_BASE_URL`  | Anthropic 兼容协议（`/v1/messages`），带不带 `/v1` 均可                                  |
| GPT‑5.6 Sol（**出厂默认**）、Grok、Kimi、GLM | `OPENROUTER_API_KEY` | `OPENROUTER_BASE_URL` | OpenRouter/OpenAI 兼容协议，模型名带厂商前缀（如 `openai/gpt-5.6-sol`），base 填完整路径 |
| Gemini 系列                                  | `GOOGLE_API_KEY`     | `GOOGLE_BASE_URL`     | Gemini 原生协议                                                                          |

- 新会话默认模型可用 `VITE_DEFAULT_MODEL` 指定（如 `anthropic/claude-fable-5`），非法值自动回退。
- 辅助功能（自动会话标题、后续建议提示）固定调用 **Claude Haiku 4.5**
  （`claude-haiku-4-5` / `claude-haiku-4-5-20251001`），仅在配置了 `ANTHROPIC_API_KEY` 时启用；
  中转若不支持该模型，这两个辅助功能会失败但不影响核心生成。
- 未配置任何密钥时提交生成请求会返回 500，服务端日志报 `OPENROUTER_API_KEY is not set`。

#### 使用「中转/API 代理」接入（推荐路径）

```env
# 方式A：Anthropic 兼容中转（上游项目即针对 Claude 优化）
ANTHROPIC_API_KEY="sk-xxx（中转发的 key）"
ANTHROPIC_BASE_URL="https://你的中转域名"          # 带不带 /v1 都可以
VITE_DEFAULT_MODEL="anthropic/claude-fable-5"     # 新会话默认用最强模型

# 方式B：OpenAI 兼容中转（「中转模式」，已实测 grsai.ai）
# 设置 OPENROUTER_BASE_URL 后，所有模型统一经该中转的 OpenAI Responses API
# （/v1/responses）调用，并自动去掉厂商前缀（openai/gpt-5.6-sol -> gpt-5.6-sol）
OPENROUTER_API_KEY="sk-xxx"
OPENROUTER_BASE_URL="https://你的中转域名/v1"      # 填到 /v1 完整路径
VITE_ENABLED_MODELS="openai/gpt-5.6-sol"          # 只展示中转真正支持函数调用的模型
VITE_DEFAULT_MODEL="openai/gpt-5.6-sol"
```

> **为什么走 Responses API？** 实测部分中转（如 grsai.ai）的 `/v1/chat/completions`
> 端点会丢失 `tool_calls`（请求里的 tools 不透传、响应里的函数调用被剥离），
> 而 智造3D 的参数化建模流程完全依赖函数调用。这类中转的 `/v1/responses`
> 端点则完整透传函数调用、流式与自定义系统提示词。
>
> **模型启用建议**：接入前先验证中转对目标模型的「函数调用」支持
> （向 `/v1/responses` 发一个带 tools 的请求，确认响应包含 `function_call`），
> 只把验证通过的模型加入 `VITE_ENABLED_MODELS`。例如 grsai 中转上
> Gemini 系列未在 responses 端点注册、chat 端点又丢工具调用，故不启用。

**grsai.ai 中转实测结论**（2026-08）：`gpt-5.6-sol`（应用默认 CAD 主力模型）经
`/v1/responses` 全流程可用——流式 ✓、函数调用 ✓、系统提示词覆盖 ✓；
端到端生成参数化法兰（9 个可调参数、STL/SCAD/DXF 导出）约 50 秒。

### 3. 可选功能密钥

| 变量                                           | 功能                          | 不配的后果                                                       |
| ---------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `FAL_KEY`                                      | fal.ai 图片→3D 网格、图像生成 | Mesh 工作流不可用，文本→CAD 不受影响                             |
| `OPENAI_API_KEY`                               | mesh 流程中的 OpenAI 视觉调用 | 同上                                                             |
| `NGROK_URL`                                    | 本地开发时让 fal.ai 回调可达  | 仅 Mesh 工作流需要                                               |
| `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET`           | Google OAuth 登录             | 只能用邮箱注册登录（本地栈默认关闭邮件确认，注册后直接登录即可） |
| `VITE_POSTHOG_PROJECT_KEY` / `VITE_SENTRY_DSN` | 遥测                          | 无影响                                                           |

## 四、云端/容器化 VM 的已知问题与修复

在嵌套容器环境（如 Cloud Agent VM）中运行 Docker + Supabase 需要两个修复：

```bash
# 1. 根文件系统是 overlay 时，Docker 无法再叠 overlay
#    → 给 /var/lib/docker 挂 ext4 回环镜像
sudo truncate -s 40G /docker-store.img
sudo mkfs.ext4 -q /docker-store.img
sudo mount -o loop /docker-store.img /var/lib/docker

# 2. 自定义 bridge 网络容器间流量被丢弃（DNS 通、ping 不通）
#    → 关闭 bridge-nf-call-iptables
sudo sysctl -w net.bridge.bridge-nf-call-iptables=0 net.bridge.bridge-nf-call-ip6tables=0

# 然后启动 dockerd 并运行 supabase
sudo dockerd &   # 无 systemd 环境手动拉起
npx supabase start -x edge-runtime
```

## 五、已验证的功能（本环境实测）

- ✅ 首页/落地页正常渲染（暗色主题、无资源加载失败）
- ✅ 邮箱注册 + 登录（本地栈免邮件确认）
- ✅ 编辑器界面：提示词输入、3D 视口、参数面板、会话历史
- ✅ 模型选择器：Gemini 3.1 Pro / 3.5 Flash、Claude Fable 5 / Opus 4.8 / Sonnet 5、GPT‑5.6 Sol、Grok 4.5、Kimi K3、GLM 5.2
- ✅ 生成请求正确到达服务端（未配 AI Key 时按预期报 500：`OPENROUTER_API_KEY is not set`）
- ⏳ 配置任一 AI Key 后即可端到端生成 3D 模型
