// Header drawer behaviour (mobile) + sticky-CTA reveal, all progressive:
// the CSS only ever *collapses* the nav when html[data-js="on"] is set by an
// inline head script, so no-JS visitors keep a plain stacked navigation.

function initNav() {
  const header = document.getElementById("site-header");
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  const setOpen = (open: boolean) => {
    header.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    setOpen(header.dataset.open !== "true");
  });

  // Close after choosing a destination, on Escape, or on outside click.
  nav.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!(event.target as Element).closest(".header")) setOpen(false);
  });

  // Leaving the mobile breakpoint with the drawer open would trap it open.
  const desktop = window.matchMedia("(min-width: 48em)");
  desktop.addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

function initStickyCta() {
  const cta = document.querySelector<HTMLElement>(".sticky-cta");
  if (!cta) return;
  let lastY = window.scrollY;
  let hidden = false;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const goingDown = y > lastY && y > 120;
      if (goingDown !== hidden) {
        hidden = goingDown;
        cta.dataset.hidden = String(goingDown);
      }
      lastY = y;
    },
    { passive: true },
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initStickyCta();
  }, { once: true });
} else {
  initNav();
  initStickyCta();
}
