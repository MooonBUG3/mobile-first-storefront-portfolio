// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Portfolio edition: static output, hosted on GitHub Pages (project site),
// which requires the repository name as the base path. The production
// original runs as a Cloudflare Worker at the domain root — see
// docs/architecture.md for the deployment mapping.
export default defineConfig({
  site: "https://mooonbug.github.io/mobile-first-storefront-portfolio/",
  // NOTE: keep the trailing slash — Astro does not add it for an explicit base.
  base: "/mobile-first-storefront-portfolio/",
  devToolbar: { enabled: false },
  output: "static",
  integrations: [sitemap()],
  build: {
    // Keep the portfolio dependency-free: no framework runtime, no web fonts,
    // no client-side hydration. Interactive parts are plain <script> modules.
    inlineStylesheets: "auto",
  },
});
