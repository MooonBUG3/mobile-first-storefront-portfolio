# 移动优先改造完整清单

> 这是本案例的核心。原站是**桌面优先**（desktop-first）站点：基线样式写给桌面，
> 用 `max-width` 媒体查询逐级降级适配移动端。本仓库将其反转为**移动优先**（mobile-first）：
> 基线样式写给 360px 小屏，用 `min-width` 渐进增强。

## 1. 两种策略的真实差别

| 维度 | 桌面优先（原站） | 移动优先（本仓库） |
| --- | --- | --- |
| 断点方向 | `max-width` 向下降级 | `min-width` 向上增强 |
| 断点数量 | 5 个（覆盖 1200/1024/768/480/360） | 4 个（30em/40em/48em/64em） |
| 移动端 CSS | 桌面样式 + 覆盖层 | 原生样式，无覆盖 |
| 未覆盖断点的表现 | 桌面样式泄漏到小屏 | 优雅降级为单列堆叠 |
| 触控目标 | 后补 `padding` 修正 | 基线即 44px |
| 单位 | px | em（随用户字体缩放自适应） |

桌面优先的典型故障：查询覆盖不到的中间宽度上出现横向滚动、触控目标过小、
组件按桌面模型换行错乱。移动优先天然规避——**没有匹配任何断点时，页面就是可用的单列布局。**

## 2. 改造清单（16 项）

以下每一项都在本仓库源码中可定位，括号内为文件位置。

### 布局与断点

| # | 改造 | 位置 |
| --- | --- | --- |
| 1 | 断点策略反转：基线 360px + `min-width` 渐进增强 | `src/styles/*.css` 全部 |
| 2 | 断点单位 px → em（16px 基准，考虑浏览器字体缩放） | 同上 |
| 3 | 流式容器：`width: min(1160px, calc(100% - 2*gutter))` 取代固定宽度 + `max-width` | `base.css` `.wrap` |
| 4 | 流式字号：`h1: clamp(2.05rem, 9vw, 3rem)`，视口缩放无跳变 | `base.css` |
| 5 | 区块增强节奏：hero 64em 双栏、对比 Demo 30em 双栏、案例卡 40em 双栏 | `home.css` `pages.css` |

### 触控与交互

| # | 改造 | 位置 |
| --- | --- | --- |
| 6 | 触控目标底线 44×44px（链接、按钮、热点全部达标） | `base.css` `home.css` |
| 7 | `touch-action: manipulation` 全局启用，消除 300ms 点击延迟与双击缩放 | `base.css` |
| 8 | 汉堡导航：44px 触发按钮，三杠→X 动画，Escape/外点关闭，焦点管理 | `src/scripts/ui.ts` `src/components/Header.astro` |
| 9 | 吸底 CTA：下滑 120px 后出现、再下滑隐藏防遮挡，48em 以上不显示 | `src/components/StickyCta.astro` `src/scripts/ui.ts` |
| 10 | 抽屉滚动隔离：抽屉打开时背后页面不可滚动 | `ui.ts` + `base.css` |

### 系统适配

| # | 改造 | 位置 |
| --- | --- | --- |
| 11 | 安全区：`env(safe-area-inset-*)` 适配刘海、圆角与 Home 指示条 | `base.css`（header/sticky CTA） |
| 12 | 渐进增强导航：`html[data-js="on"]` 由 head 内联脚本提前设置；无 JS 时静态堆叠导航 | `src/layouts/Site.astro` `BaseHead.astro` |
| 13 | 系统字体栈：零字体下载（无 woff、无 FOIT/FOUT、无 preload 争议） | `base.css` |
| 14 | CLS 防护：动态内容区块预留高度（对比结论 132px、交付物面板 300px） | `home.css` |

### 动效与性能

| # | 改造 | 位置 |
| --- | --- | --- |
| 15 | 动效零框架：WAAPI + IntersectionObserver，`prefers-reduced-motion` 全局熔断 | `src/scripts/reveal.ts` `InteractiveReview.astro` |
| 16 | 图片策略：站内无位图（SVG + CSS 绘制），从根本上消除 LCP 图片风险 | `public/brand/` |

## 3. 关键实现解析

### 3.1 渐进增强导航（无 JS 可用）

```
html[data-js="on"] .site-nav  → 汉堡抽屉（默认 display:none）
html[data-js="off"] .site-nav → 静态堆叠垂直导航（永远可见可点）
```

`data-js` 在 `<head>` 内联脚本中于首帧前设置，不存在"导航闪烁"。
键盘用户可用 Tab 走完导航；Escape 关抽屉；打开抽屉时 `aria-expanded` 同步。
≥48em 时强制横排并忽略抽屉状态——桌面宽度拖拽窗口不残留抽屉 bug。

### 3.2 吸底 CTA 的隐藏策略

移动端固定 CTA 会遮挡页脚内容。策略是：**向下滚动出现（用户表达意图）、
继续向下或快速回滚时隐藏**，只在其最可能被点击的"浏览中途"出现。
桌面宽度直接 `display: none`——桌面首屏已有一等公民级 CTA 按钮。

### 3.3 为什么用 em 而不是 px

浏览器"字体放大"会等比放大 px 断点，导致某些缩放级别下 `min-width: 768px`
的实际像素跨度变化，但 em 断点随根字号缩放，**布局跳变点始终对应内容宽度而非设备宽度**。
这是 WCAG 1.4.4（调整文字大小）的工程化回应。

## 4. 验证方法与结果

验证在真实浏览器完成（Chrome headless + agent-browser 脚本化）：

| 检查项 | 方法 | 结果 |
| --- | --- | --- |
| 横向溢出 | 390px 视口逐页面量 `scrollWidth` vs `clientWidth` | 7 个路由全部零溢出 |
| 触控目标 | 遍历全部可交互元素量尺寸 | 全部 ≥ 44px |
| 汉堡菜单 | 点击开合、Escape、外点、断点强制横排 | 全部通过 |
| 双语切换 | `.lang-toggle` 点击 + localStorage 持久化 + 刷新恢复 | 通过 |
| Demo 交互 | 前后对比切换、笔记文案、reduced-motion | 通过 |
| 桌面视口 | 1440px 全页面走查 | 布局正常，双栏成立 |
| 键盘可达 | Tab 顺序、焦点可见 | 通过 |

截图存档于仓库根目录（`verify-mobile-*.png`），为本地产物，未随仓库推送。

## 5. 面试讲述建议

讲这个案例时最有信息量的一句话：

> "原站在移动端的问题不是'样式没适配'，而是桌面优先的策略决定了它永远在追赶小屏。
> 我把策略反转后，移动端从'覆盖层'变成'基线'，桌面增强变成了加法而不是减法。"

可展开讲的具体决策：断点为什么是这四个（30em 起始卡片类双栏、40em 表单类、
48em 导航类、64em hero 类——以**内容在什么宽度下开始显得拥挤**为依据，而非设备清单驱动）。
