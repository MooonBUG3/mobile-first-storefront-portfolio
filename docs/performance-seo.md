# 性能预算、SEO 与数据埋点

## 1. 性能预算

移动优先的硬约束是：**低端安卓 + 3G**。预算如下（gzip 后，构建期实测）：

| 指标 | 预算 | 本仓库现状 |
| --- | --- | --- |
| HTML（首屏） | ≤ 60 KB | 约 15–20 KB |
| CSS 总量 | ≤ 12 KB | 约 7 KB |
| JS 总量 | ≤ 10 KB | 约 6 KB（三个模块，零框架） |
| LCP | < 2.5s | < 1.5s（无图片、无字体下载、无渲染阻塞 JS） |
| CLS | < 0.1 | ≈ 0（动态区块预留高度、系统字体栈） |
| INP | < 200ms | 交互仅少量 DOM 操作 |

预算为什么是这些数字：内容型独立站的转化率对加载延迟极敏感
（每 100ms 延迟的转化损失以百分点计），而 3G 仍是多地下沉市场的现实网络。
把预算写死，任何"加个轮播库"的 PR 都会先撞墙。

### 预算的工程保障

- **零水合**：Astro static 输出 HTML+CSS，JS 只做三件小事（语言切换、导航、滚动显现）。
- **零字体请求**：系统字体栈（`-apple-system / Segoe UI / Roboto / PingFang SC / Microsoft YaHei`），
  中英文都覆盖，不下载一个字节的字体文件。
- **零位图**：装饰全部 CSS/SVG，LCP 元素就是 H1 文本。
- **CLS 双保险**：`min-height` 预留 + 位图缺席。

## 2. SEO 实现

| 项 | 实现 | 位置 |
| --- | --- | --- |
| 结构化数据 | JSON-LD：Organization + WebSite + Service | `BaseHead.astro` / `index.astro` |
| canonical | 每页自指 | `BaseHead.astro` |
| sitemap | `@astrojs/sitemap` 生成 `sitemap-index.xml` | `astro.config.mjs` |
| robots | 显式 sitemap 指向 | `public/robots.txt` |
| 语义化 | `header/main/footer/section` + 标题层级 | 全部页面 |
| 元信息 | title/description/OG（无 og:image，因无位图资产） | `BaseHead.astro` |
| i18n SEO | 构建期英文入 HTML（可抓取）；中文运行时切换 | 见 architecture.md §3 |

**无 og:image 的取舍**：本仓库刻意不含二进制，社交分享卡片因此无图。
生产站应补 OG 图（1200×630 PNG），此处为作品集约束下的显式取舍，
不是遗漏——见 README 诚实边界。

## 3. 埋点方案（GA4 + Clarity）

**脱敏仓库不含真实 ID。** 以下是在原站使用的接入模型，作品集中给出代码位置与事件设计，
供面试官评估数据能力（对应 JD 中"数据分析、埋点、周报"职责）。

### 接入点

```html
<!-- BaseHead.astro 中预留位置（脱敏，不含真实 Measurement ID） -->
<!-- Google Analytics GA4：<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"> -->
<!-- Microsoft Clarity：<script>clarity("consent","...")</script> -->
```

生产接入时：GA4 的 `G-` ID 与 Clarity project ID 作为构建期环境变量注入，
不硬编码在源码（与本仓库"敏感信息不入库"同一原则）。

### 事件模型（转化漏斗）

独立站技术运营的核心工作是把"浏览"翻译成"线索"。漏斗四层：

| 层 | 事件 | 参数 |
| --- | --- | --- |
| 曝光 | `page_view`（GA4 自动） | page_location, device_category |
| 兴趣 | `cta_view` | cta_name: sticky_bottom / hero_primary / nav |
| 意向 | `cta_click` | cta_name, lang, viewport |
| 转化 | `generate_lead` / `contact_submit` | service_item, page_referrer |

三个洞察点：

1. **`cta_view` 用 IntersectionObserver 而非 scroll 深度**——吸底 CTA"出现"才是曝光。
2. **全部事件带 `lang` 参数**——中英用户可能转化率差异巨大，不分语种看漏斗会掩盖问题。
3. **`service_item` 参数**——服务页卡片点击按服务项聚合，直接回答"哪个服务带来线索"。

Clarity 补充定性面：录屏 + 热图回答"用户在哪一段流失"，与 GA4 的量化漏斗互证。

## 4. 周度运营报告模板

JD 要求数据驱动的周期性复盘。实际使用的模板：

```markdown
## W{n} 周报（{date range}）

### 流量
- 自然搜索 sessions：{n}（WoW {±%}）
- Top 5 着陆页：{page} / sessions / bounce rate
- 设备分布：mobile {n}% / desktop {n}%
- 语言分布：en {n}% / zh {n}%

### 性能（PageSpeed Insights / CrUX 中位数）
- LCP {n}s / CLS {n} / INP {n}ms；mobie 与 desktop 分列

### 转化漏斗
- cta_view → cta_click：{n}%（弱：曝光够但点击低 → 改文案/位置）
- cta_click → generate_lead：{n}%（弱：意向有但提交断 → 简化表单）

### Clarity 洞察
-  rage/dead click 集中的区块；滚动深度中位数

### 下周实验
- 假设：______ 预期指标：______ 样本量/周期：______
```

模板的意图：**每一行数据都挂钩一个决策**。例如"sticky CTA 点击率低"
不写"继续观察"，而是写"假设：CTA 文案与服务页不一致 → 实验：A/B 文案 → 周期 7 天"。
