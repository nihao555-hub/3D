<div align="center">

# 智造3D

**AI 工业级三维建模平台 —— 用一句话，生成可制造的 3D 模型**

</div>

---

## 产品简介

智造3D 是一个「自然语言 → 参数化 3D 模型」的全栈 Web 平台：

- 🗣️ **自然语言建模**：用中文描述目标（支持图片参考），AI 自动生成参数化 CAD 代码
- ⚙️ **真·参数化**：生成的不是死网格，而是带尺寸参数的工程模型，滑块实时调整
- 🖥️ **浏览器实时渲染**：模型在浏览器内本地编译渲染（WebAssembly），预览即所得
- 📦 **工业格式导出**：一键导出 `.STL`（3D 打印）/ `.SCAD`（源码）/ `.DXF`（2D 工程图投影）
- 🧩 **机械零件库**：内置齿轮、螺纹、轴承座等机械零件生成能力
- 🎨 **AI 网格工作流**：文字/图片生成有机形态 3D 网格（可选，需配置 FAL 密钥）

## 快速启动

环境要求：Node.js ≥ 22.12、Docker、npm ≥ 10

```bash
# 1. 安装依赖
npm ci

# 2. 启动本地数据栈（Postgres / Auth / Storage / Realtime）
npx supabase start -x edge-runtime

# 3. 配置环境变量（复制模板后按注释填写）
cp .env.local.template .env.local

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000/studio
```

## 环境变量配置

| 变量                                                                         | 必需         | 说明                                             |
| ---------------------------------------------------------------------------- | ------------ | ------------------------------------------------ |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | ✅           | 本地栈启动后由 `npx supabase status -o env` 获取 |
| `ENVIRONMENT`                                                                | ✅           | 本地开发填 `local`（自动跳过计费）               |
| `OPENROUTER_API_KEY` + `OPENROUTER_BASE_URL`                                 | ✅（三选一） | OpenAI 兼容中转/网关（走 Responses API）         |
| `ANTHROPIC_API_KEY` + `ANTHROPIC_BASE_URL`                                   | ✅（三选一） | Anthropic 协议直连或中转                         |
| `GOOGLE_API_KEY` + `GOOGLE_BASE_URL`                                         | ✅（三选一） | Gemini 协议直连或中转                            |
| `VITE_ENABLED_MODELS`                                                        | 建议         | 模型白名单（逗号分隔），界面只展示可用模型       |
| `VITE_DEFAULT_MODEL`                                                         | 建议         | 新会话默认模型                                   |
| `FAL_KEY`                                                                    | 可选         | AI 网格工作流（图片→3D 网格）                    |
| `WEBHOOK_BASE_URL` / `NGROK_URL`                                             | 可选         | 网格工作流的公网回调地址（本地开发用隧道）       |

部署与排障细节见 [`docs/DEPLOY.zh-CN.md`](docs/DEPLOY.zh-CN.md)。

## 技术架构

- **前端**：React 19 + TypeScript + TanStack Start + Vite + Tailwind CSS
- **3D 渲染**：Three.js + React Three Fiber
- **CAD 内核**：OpenSCAD（WebAssembly，浏览器本地执行）
- **后端**：TanStack Start 服务端路由 + Supabase（PostgreSQL / Auth / Storage）
- **AI 接入**：多模型可插拔（OpenAI / Anthropic / Google 协议，支持自定义中转网关）

## 许可

本项目基于 GPL-3.0 开源组件构建（包含 OpenSCAD WASM 及相关开源代码），
完整许可条款见 [`LICENSE`](LICENSE)，上游组件版权归其原作者所有。
