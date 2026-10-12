# Mobile-first Storefront Portfolio (English summary)

An interview case for a cross-border e-commerce tech-operations role: a **desensitized, mobile-first rebuild** of a production storefront-review service site.

- Live demo: https://mooonbug.github.io/mobile-first-storefront-portfolio/
- Production original: https://mooon3.wooou-bill.workers.dev/ (Cloudflare Workers, desktop-first)
- Full case write-up (Chinese): [README.md](README.md)

## What was done

The original site was built desktop-first (base styles for desktop, `max-width` queries degrade downward). This portfolio rebuilds the same information architecture — same 7 routes, same component split, same design tokens — **mobile-first**:

- Base CSS written for 360px phones; `min-width` queries enhance upward (30/40/48/64em).
- Hamburger drawer with 44px touch targets, progressive enhancement (no-JS gets a static stacked nav).
- Persistent bottom CTA on mobile (auto-hides on scroll-down), respectful of the thumb zone.
- Single-column hero/demo below 480px; layout-stable switches (reserved `min-height`, CLS guards).
- System font stack: zero font requests, zero binary assets in the repo.
- Safe-area insets, fluid `clamp()` typography, 320px→1440px verified with no horizontal overflow.

## Stack (all open source)

[Astro 5](https://github.com/withastro/astro) static output · [@astrojs/sitemap](https://github.com/withastro/astro/tree/main/packages/astro-sitemap) · native Web APIs (WAAPI, IntersectionObserver) for interactions · GitHub Actions + GitHub Pages for CI/CD. No UI/animation framework, no client-side hydration.

## Engineering highlights

- **i18n**: single dictionary source (`src/i18n/`), English shipped in HTML (crawlable, no-JS safe), Chinese swapped in place on `langchange` events with a no-flash `visibility` guard; CI validates every `data-i18n` key exists.
- **SEO**: canonical + description per page, Organization/WebSite/Service JSON-LD, sitemap, robots.txt.
- **Process**: PR + green CI (build, typecheck, i18n audit) before merge; deploy on push to `main`.

## Honesty

All content is self-created fictional demonstration. No client data, no real orders, no measured user Core Web Vitals. Layout checks are not performance or conversion guarantees.
