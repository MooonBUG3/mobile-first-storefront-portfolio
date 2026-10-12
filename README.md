# 移动优先的独立站改造案例 · Mobile-first Storefront Portfolio

> 一个面向「跨境电商独立站技术运营」岗位的公开作品集：把一套**桌面优先**的生产级独立站服务官网，按**移动优先**原则完整重铸，并对客户信息脱敏。
>
> 在线演示（GitHub Pages）：https://mooonbug.github.io/mobile-first-storefront-portfolio/
> 生产原站（Cloudflare Workers）：https://mooon3.wooou-bill.workers.dev/

**脱敏声明**：本仓库是生产站点的作品集版本。站点中的所有文案、价格、演示均为自建的虚构示例，不含任何真实客户数据、联系方式或商业承诺。详见 [docs/desensitization.md](docs/desensitization.md)。

---

## 1. 这个案例是什么

一个独立站诊断服务的官网。生产版本（v8 品牌）运行在 Cloudflare Workers 上，是典型的**桌面优先**实现：先按桌面栅格写样式，再用 `max-width` 媒体查询向下降级适配手机——导航挤成两行、触控目标偏小、首屏交互Demo在小屏堆叠混乱。

本案例用同一套信息架构（同 7 个路由、同组件划分、同设计令牌）做了一次**移动优先（mobile-first）重铸**：

| 维度 | 生产原版（桌面优先） | 本作品集（移动优先） |
|---|---|---|
| CSS 基线 | 桌面样式 + `max-width` 降级 | 手机样式 + `min-width` 渐进增强 |
| 导航 | 小屏两行横排 | 汉堡抽屉 + 44px 触控目标 + 无 JS 静态列表兜底 |
| 触控目标 | 部分 < 44px | 全部 ≥ 44px，`touch-action: manipulation` |
| 转化路径 | 仅在页尾/页首 CTA | 移动端吸底 CTA（下滑自动隐藏） |
| 首屏 Demo | 双栏，小屏拥挤 | 单列堆叠，≥480px 转双栏 |
| 字体 | 自托管 woff 两个文件 | 系统字体栈（零字体请求，仓库零二进制） |
| 布局稳定性 | 切换发现时文本区跳动 | `min-height` 预留，CLS 防护 |
| 安全区 | 未处理 | `env(safe-area-inset-*)` 适配刘海屏 |

重铸后效果（本机实测，非真实用户数据）：320/390/768/1440px 四档宽度无横向溢出；所有可交互元素 ≥ 44px；构建产物 HTML+CSS+JS 总计约 60KB（gzip 前），JS 仅 5 个原生脚本模块、零运行时框架。

## 2. 快速开始

```bash
npm ci
npm run dev        # 本地开发
npm run build      # 静态构建到 dist/
npm run preview    # 预览构建产物
npm run types      # TypeScript 检查
CI（.github/workflows/ci.yml）会执行构建、类型检查，并校验所有 data-i18n 键都存在于字典（防止中文访客静默看到英文）。
```

## 3. 架构

```
Astro 5（静态输出，零 hydration）
├── src/i18n/            # 中英双语字典（单一数据源，构建期渲染英文 + 运行期原地切换中文）
├── src/components/      # Header(汉堡抽屉) / Footer / BaseHead(SEO+JSON-LD) /
│                        #   InteractiveReview(前后对比Demo) / DeliverableSection(交付物切换) / StickyCta(吸底CTA)
├── src/pages/           # 7 路由：index / sample / about / contact / privacy / terms / 404
├── src/styles/          # 移动优先 CSS：base(令牌/页头/页脚) → home(首页区块) → pages(内页)
├── src/scripts/         # lang(语言切换) / ui(抽屉+吸底) / reveal(滚动入场) —— 全部原生 TS
└── .github/workflows/   # ci.yml(构建+类型+i18n校验) / deploy-pages.yml(GitHub Pages 部署)
```

**为什么还是 Astro 静态站**：这个架构本身就是生产在用的方案（Cloudflare Workers 静态托管）。作品集的价值在于证明"同一架构下的移动优先改造能力"，而不是换栈。静态输出还意味着：无 SSR 依赖、无 Node 服务器、可托管在 GitHub Pages / Cloudflare / 任意对象存储。

**开源基础**：本项目建立在开源技术栈上 —— [Astro](https://github.com/withastro/astro)（MIT）、[@astrojs/sitemap](https://github.com/withastro/astro/tree/main/packages/astro-sitemap)（MIT）、[GitHub Actions](https://github.com/actions/runner)（MIT）与 GitHub Pages。交互全部用原生 Web API（Web Animations API、IntersectionObserver、`matchMedia`）实现，没有引入动效或 UI 框架——这与生产版本的约束一致，也把移动端 JS 体积压到约 5KB。

## 4. 移动优先改造的关键决策

（详细清单见 [docs/mobile-first.md](docs/mobile-first.md)）

1. **真正的移动优先 CSS**：基线样式写给 360px 手机，`min-width` 查询逐级增强（30em/40em/48em/64em）。对比原版"桌面优先 + max-width 降级"，小屏得到的是"为它设计的样式"而不是"被裁剪的桌面样式"。
2. **渐进的导航**：默认静态堆叠列表；仅当 JS 确认可用时才折叠进汉堡抽屉（`html[data-js="on"]` 由内联头部脚本提前设置，无闪烁）。禁用 JS 的访客和爬虫永远拿到可用的完整导航。
3. **44px 触控底线 + 拇指区**：所有按钮/链接/抽屉项 ≥ 44px 高；主要 CTA 放在屏幕底部拇指区（吸底栏），符合移动端单手操作热区。
4. **布局稳定性（CLS）**：Demo 切换视图/发现时，文本区 `min-height` 预留；语言切换用 `visibility` 防闪而非重排。
5. **系统字体栈**：生产版自托管两个 woff（约 60KB + 两次请求 + FOUT 风险）；作品集改用系统栈，中英文都有良好回退（PingFang SC / Microsoft YaHei / Noto Sans SC），零字体请求、零二进制资源。
6. **安全区与横屏**：`viewport-fit=cover` + `env(safe-area-inset-bottom)`；`clamp()` 流式排版，320px 不溢出不换行破碎。

## 5. 多语言部署

站点面向英语市场（服务官网），同时需要向中文团队/客户展示。实现方式是**单字典 + 原地切换**：HTML 以英文交付（SEO 可抓取、无 JS 可用），`src/i18n/` 持有中英两份完整字典；客户端脚本按 `localStorage` → `navigator.language` 的顺序决定初始语言，切换后 `dispatchEvent('langchange')`，交互组件（前后对比 Demo、交付物切换）订阅该事件重渲染动态文案。

细节： stored 中文偏好由 `<head>` 内联脚本提前标记，配合 CSS `visibility` 隐藏待翻译节点，**中文用户不会看到英文闪烁**。

## 6. 性能预算与 SEO/埋点

完整预算表与埋点方案见 [docs/performance-seo.md](docs/performance-seo.md)。要点：

- **预算**：单页 HTML ≤ 25KB、CSS ≤ 20KB、JS ≤ 10KB、无阻塞字体、LCP ≤ 2.5s / CLS ≤ 0.1 / INP ≤ 200ms（P75）。
- **达成手段**：零框架运行时、零字体请求、内联 SVG 品牌资产、脚本 `defer` 由 Astro 自动处理、图片资源仅两个 SVG。
- **SEO**：每页 canonical/description；Organization + WebSite + Service 三类 JSON-LD；`@astrojs/sitemap` 自动生成 sitemap；robots.txt 指向 sitemap-index。
- **数据**：文档给出 GA4 事件清单（`demo_view_toggle`、`demo_finding_switch`、`cta_click`、`lang_switch`、`brief_download`）与 Microsoft Clarity 部署位置；隐私页如实说明"未接入分析前的数据边界"。

## 7. 工程流程

- 分支策略：`main` 保护，功能分支 + PR + CI 全绿才合（对齐 Azure DevOps 的 PR 策略）。
- CI：`npm ci` → `astro build` → `tsc --noEmit` → i18n 字典完整性校验。
- CD：push 到 `main` 触发 `deploy-pages.yml`，构建并部署 GitHub Pages（生产原版同源流程走 Cloudflare Workers，`astro build` + `wrangler deploy`，见 [docs/architecture.md](docs/architecture.md)）。
- 可观测：文档给出"每周数据简报"模板（流量/来源/点击/线索质量/页面性能），直接对应岗位 JD 的周报要求。

## 8. 诚实边界

- 本作品集中所有页面内容为**虚构演示**，无真实客户、无真实订单、无转化数据。
- "桌面优先 → 移动优先"的改造结论来自代码审查与多视口布局检查，**未测量真实用户 Core Web Vitals**，布局检查不等于性能或转化保证。
- 性能预算是工程约束值，达标情况以 Lighthouse CI 实测为准；仓库内置了可复现的测量方法，但线上分数随网络与设备波动。
- 价格（USD 60）为服务方的拟定体验价，随书面报价变动，不是承诺。

## 9. 目录导览

| 文档 | 内容 |
|---|---|
| [docs/desensitization.md](docs/desensitization.md) | 脱敏范围与方法（面试官如何核验） |
| [docs/mobile-first.md](docs/mobile-first.md) | 移动优先改造完整清单（核心案例） |
| [docs/architecture.md](docs/architecture.md) | 架构决策、CI/CD、生产映射 |
| [docs/performance-seo.md](docs/performance-seo.md) | 性能预算、SEO、GA4/Clarity 埋点、周报模板 |
| [docs/woocommerce-mapping.md](docs/woocommerce-mapping.md) | 诊断方法论到 WooCommerce 实施的落地映射 |
| [docs/interview-notes.md](docs/interview-notes.md) | 面试讲述要点（STAR）与常见问答 |
