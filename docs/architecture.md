# 架构决策、CI/CD 与生产映射

## 1. 技术选型

| 决策 | 选择 | 理由 | 放弃的方案 |
| --- | --- | --- | --- |
| 站点形态 | Astro 5 SSG（`output: "static"`） | 内容型官网，零交互水合需求；构建期渲染 HTML，SEO 最优，可部署到任何静态托管 | Next.js（SSG 亦可，但引入 React 运行时与 node server 心智负担）；WordPress（运维成本高） |
| 部署 | 原站：Cloudflare Workers；本仓库：GitHub Pages | 同一套 Astro 产物两种出口，证明架构无环境锁定 | Vercel（国内访问不稳定） |
| CSS | 原生 CSS + 设计令牌 | 移动优先重写需要完全控制每个声明；设计令牌保证与原站视觉一致 | Tailwind（原站为原生 CSS，作品集需延续同源架构） |
| i18n | 自研单字典 + 客户端切换 | 双语内容量小，构建期出英文 HTML，中文客户端切换 | react-i18next（无 React）；外部 i18n 服务（引入网络依赖） |
| 动效 | 原生 WAAPI + IntersectionObserver | 全站 JS 约 6KB | GSAP/Framer Motion（为一个 hover 动画引入 50KB） |
| 类型 | TypeScript strict | 字典键的类型安全（`I18nKey` 编译期校验） | 纯 JS |

## 2. 目录结构与职责

```
mobile-first-storefront-portfolio/
├── .github/workflows/
│   ├── ci.yml              # build + tsc + i18n 键完整性校验
│   └── deploy-pages.yml    # push main → GitHub Pages
├── docs/                   # 案例文档（本目录）
├── public/
│   ├── brand/mark.svg      # 品牌标记（脱敏文案）
│   ├── favicon.svg
│   ├── robots.txt
│   └── review-brief.txt    # 脱敏版需求模板
├── src/
│   ├── components/         # BaseHead/Header/Footer/StickyCta/InteractiveReview/DeliverableSection
│   ├── i18n/               # en+zh 字典（7 文件）+ 合并入口与类型
│   ├── layouts/Site.astro  # 页面骨架 + head 内联脚本（data-js / pending-lang）
│   ├── pages/              # 7 路由：index/sample/about/contact/privacy/terms/404
│   ├── scripts/            # lang.ts（切换总线）/ ui.ts（导航+CTA）/ reveal.ts（滚动显现）
│   └── styles/             # global.css → base.css + home.css + pages.css（按职责分层）
├── astro.config.mjs
└── tsconfig.json
```

分层逻辑：**样式按职责分层**（base=令牌+骨架 / home=首页组件 / pages=内页），
组件自带 frontmatter 数据，页面只做组装。每个交互脚本是独立模块，
只在 `<script>` 打包层引入，不污染组件模板。

## 3. i18n 架构

单字典数据源，类型驱动：

```ts
// src/i18n/index.ts
export const dictionaries = { en: {...}, zh: {...} } as const;
export type I18nKey = keyof typeof dictionaries.en;   // 189 个键
export function t(key: I18nKey): string { ... }      // 构建期取英文
export function dictFor(lang: Lang): Record<I18nKey, string>;
```

渲染管线分两段，解决三个问题：

1. **SEO 可抓取**：Astro 模板用 `t()` 取英文，构建期渲染进 HTML，
   爬虫与无 JS 用户看到完整内容（不是空壳等 JS 填）。
2. **无闪烁切换**：`<head>` 内联脚本在首帧前给 `<html>` 打
   `data-pending-lang="zh"`，配合 `[data-i18n]{visibility:hidden}` 隐藏未替换文本，
   避免"先英后中"闪一下就跳。
3. **交互组件同步**：切换语言 dispatch `langchange` CustomEvent，
   InteractiveReview（前后对比 Demo）与 DeliverableSection（交付物面板）
   订阅后重渲染动态文案——不整页刷新。

三类文本节点由 `swapText()` 统一处理：`data-i18n`（textContent）、
`data-i18n-html`（innerHTML，仅限含 `<strong>` 的少量键）、
`data-i18n-aria`（无障碍标签）。

## 4. CI/CD

### ci.yml（每次 push / PR）

```yaml
- npm ci
- npm run build                    # Astro 构建
- npm run types                    # tsc --noEmit，strict
- node i18n 完整性校验              # 提取 dist HTML 的 data-i18n* 键，比对字典
```

i18n 校验用意：字典与模板脱钩是 i18n 的经典腐化点——模板加了 `data-i18n="x.y"`，
字典忘了补，线上静默显示 key 本身。CI 直接把 `dist/` 产物当事实源比对
`src/i18n` 字典，**现状：HTML 使用 176 键，字典定义 189 键，零缺失。**

### deploy-pages.yml（仅 main）

`actions/configure-pages` → `upload-pages-artifact` → `deploy-pages`。
与原站 Cloudflare Workers 部署解耦——这里是 GitHub Pages，
但产物完全相同，只是上传目标不同。

## 5. 与原站（生产）的映射关系

| 层 | 原站 | 本仓库 |
| --- | --- | --- |
| 框架 | Astro 5 static | 同 |
| 适配器 | `@astrojs/cloudflare`（Workers） | 无适配器（Pages 纯静态） |
| 策略 | desktop-first + max-width | mobile-first + min-width |
| 资产 | woff 字体 + 位图 | 系统字体栈 + SVG only |
| 部署 | Cloudflare Workers | GitHub Pages |
| i18n | 同架构（自研字典） | 同 |
| 分析 | GA4 + Clarity 真实 ID | 不含 ID，见 performance-seo.md 接入示例 |
| 内容 | 真实诊所数据 | 脱敏占位 |

一句话：**同一套信息架构与视觉令牌，一次策略反转 + 一次内容脱敏 + 一次部署目标更换。**

## 6. 可复现性

```bash
npm ci
npm run build       # → dist/（7 路由 + sitemap.xml + robots.txt）
npm run preview     # 本地起 http://localhost:4321/mobile-first-storefront-portfolio/
```

`package-lock.json` 随仓库提交，锁定 astro@5.1.3 / sitemap@3.2.1 / typescript@5.7.2。
Node ≥ 18.17 即可构建。
