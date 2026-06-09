<div align="center">

**中文** | [English](README_EN.md)

# JsonStudio Web

### 纯前端、可离线、可一键部署的 JSON 工作台

格式化、对比、转换、校验，从混合日志里挑出 JSON —— 全部在浏览器里完成，**无需后端**。

**在线试用：[json.zoxii.xyz](https://json.zoxii.xyz/)**

<p align="center">
  <a href="https://json.zoxii.xyz/">
    <img src="https://img.shields.io/badge/在线试用-json.zoxii.xyz-10b981?style=flat-square&logo=cloudflare&logoColor=white" alt="Live demo">
  </a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/SvelteKit-static-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="SvelteKit static">
  <img src="https://img.shields.io/badge/Monaco-Editor-0078D4?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Monaco">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Pages">
  <img src="https://img.shields.io/badge/License-Apache--2.0-166534?style=flat-square" alt="License">
</p>

<sub>Fork 自 <a href="https://github.com/sundegan/JsonStudio">sundegan/JsonStudio</a> · 由桌面端 (Tauri) 移植到纯前端</sub>

</div>

## 这是什么

[sundegan/JsonStudio](https://github.com/sundegan/JsonStudio) 是一个非常好用的 JSON 桌面工具。本仓库在此基础上 fork，把原本由 Rust 后端承担的能力**全部用纯前端 JS/TS 重新实现**，移除了 Tauri 桌面壳，使其可以直接部署到 Cloudflare Pages、Vercel、GitHub Pages 等静态托管平台。

适用于：

- 想把团队内部 JSON 工具放到一个 URL 后面供所有人使用
- 不希望敏感 JSON 数据离开浏览器（所有处理都在本地完成）
- 喜欢 JsonStudio 的体验，但偏好 Web 形态而不是装一个桌面应用

## 在线试用

公共实例：**<https://json.zoxii.xyz/>**（部署在 Cloudflare 上，所有数据仅在你的浏览器里处理，不会上传任何服务器）。

你也可以 fork 本仓库部署到自己的 Cloudflare Pages / Vercel / GitHub Pages 域名。

## 主要功能

继承自上游的能力，全部已用纯前端实现：

- **强大的 JSON 编辑**：基于 Monaco Editor，语法高亮、代码折叠、查找替换、明暗主题、10+ 配色。
- **多形态 JSON 输入**：标准 JSON、JSON5、被转义的 JSON 字符串、带尾逗号 / 未加引号 key 的 JSON、`Infinity`/`NaN` 等非标准字面量都能解析；接收日志类文本时自动挑出其中的 JSON 片段。
- **树形 / 表格视图 + 搜索**：左侧编辑、右侧浏览，支持 JMESPath 和 JSONPath 查询。
- **多标签 + 持久化**：所有标签内容、设置、快捷键都存在 `localStorage`，刷新不丢。
- **对比 / 转换 / 代码生成 / Schema**：
  - JSON Diff（基于 Monaco diff）
  - YAML / XML / TOML / CSV 双向转换（`js-yaml` / `fast-xml-parser` / `@iarna/toml` / `papaparse`，按需懒加载）
  - 类型代码生成：TypeScript / Go / Rust / Python / Swift / Kotlin / C# / Java / Ruby / Dart / C++ / Scala / Elm / Haskell / Crystal / Elixir / Pike 等 19 种语言（基于 `quicktype-core`）
  - JSON Schema 生成与校验（`AJV`）
- **导出图片**：直接把当前编辑器渲染为 PNG / JPEG 触发浏览器下载（`html-to-image`）。

## 上游的哪些功能被移除了

为了适配浏览器环境，以下桌面专属能力**已在 Web 版中删除**：

- 打开 / 保存本地文件（包括拖拽打开 .json）—— 改为粘贴板 + 浏览器下载
- 文件夹侧边栏与文件监听
- 应用自动更新、退出 / 重启 / 打开开发者工具按钮
- 窗口置顶、原生菜单、全局快捷键、单实例锁
- protobuf / thrift 代码生成与代码反推回 JSON（无成熟 JS 实现）
- macOS Finder / Windows 资源管理器集成（如"在文件夹中显示"）

如果你需要这些能力，请继续使用[上游桌面版](https://github.com/sundegan/JsonStudio)。

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # node --test 单元测试
pnpm check        # svelte-check 类型检查
pnpm build        # 产物输出到 build/
pnpm preview      # 本地预览生产构建
```

要求：Node.js ≥ 22（用到了 `--experimental-strip-types` 来直接执行 .ts 测试）。

## 部署到 Cloudflare Pages

构建命令、输出目录、SPA fallback 已全部配好：

| 字段 | 值 |
|---|---|
| 构建命令 | `pnpm install && pnpm build` |
| 输出目录 | `build` |
| Node 版本 | `22` 或更高 |
| SPA fallback | `static/_redirects`（已包含 `/*  /index.html  200`） |

在 Cloudflare Pages 控制台 → Pages → Create project → Connect to Git → 选择仓库 → 按上表填写即可。

也可以一键部署到 Vercel / Netlify / GitHub Pages，只要支持 SPA fallback 即可。

## 技术栈

- **Svelte 5** + **SvelteKit**（`@sveltejs/adapter-static`）
- **Monaco Editor** —— 文本编辑核心
- **TailwindCSS 4** —— 样式
- 一组针对各类数据的纯 JS 库：`json5`、`@mischnic/json-sourcemap`、`js-yaml`、`fast-xml-parser`、`@iarna/toml`、`papaparse`、`jsonrepair`、`jmespath`、`jsonpath-plus`、`ajv`、`quicktype-core`、`html-to-image`、`jspdf`

## 致谢

- [@sundegan](https://github.com/sundegan) —— [JsonStudio](https://github.com/sundegan/JsonStudio) 的原作者，本项目的所有产品设计、UI 与绝大部分前端代码都来自上游。
- Monaco Editor、Svelte、Tailwind、quicktype 及上面列出的所有库的维护者。

## 许可证

本项目使用 [Apache License 2.0](LICENSE)，与上游保持一致。请同时阅读 [NOTICE](NOTICE) 了解 fork 起点与改动摘要。

如果你 fork 或再分发本项目，请保留 `LICENSE` 和 `NOTICE` 文件，并在你自己的 README 中标注上游与本项目的归属。
