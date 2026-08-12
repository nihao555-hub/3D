# CADAM 本地启动指南（中文）

本仓库基于开源项目 [Adam-CAD/CADAM](https://github.com/Adam-CAD/CADAM)（GPL-3.0，约 5000 star）搭建，
是一个「自然语言 → 参数化工业级 3D 模型」的全栈 Web 应用：

- AI 将自然语言/图片转换为 **OpenSCAD 参数化代码**
- 浏览器内通过 **OpenSCAD WebAssembly** 实时编译渲染（Three.js 预览）
- 支持参数滑块微调尺寸，导出 **.STL / .SCAD / .DXF**
- 内置 BOSL / BOSL2 / MCAD 机械零件库（齿轮、螺纹、轴承座等）

> 引入自上游 commit `d75f68ca22efc26882ea41137c7fad0240213ed8`。

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
# 访问 http://localhost:3000/cadam
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

模型路由规则（见 `src/server/aiChat.ts`）：

| 界面模型                                 | 走哪个密钥           | 说明                                                   |
| ---------------------------------------- | -------------------- | ------------------------------------------------------ |
| GPT‑5.6 Sol（**默认**）、Grok、Kimi、GLM | `OPENROUTER_API_KEY` | OpenAI 及其他厂商统一走 OpenRouter 中转                |
| Claude 系列（Fable/Opus/Sonnet）         | `ANTHROPIC_API_KEY`  | 直连 Anthropic；支持 `ANTHROPIC_BASE_URL` 指向兼容代理 |
| Gemini 系列                              | `GOOGLE_API_KEY`     | 直连 Google                                            |

- 只配 `ANTHROPIC_API_KEY` 也可以：在界面右下角模型选择器中切换到 Claude 模型即可。
- 未配置时提交生成请求会返回 500，服务端日志报 `OPENROUTER_API_KEY is not set`。

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
