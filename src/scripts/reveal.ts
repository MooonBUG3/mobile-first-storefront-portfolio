// Scroll-reveal via IntersectionObserver. Elements only ever start hidden
// when JS is confirmed available (CSS guard in base.css), and
// prefers-reduced-motion disables the transform entirely.
function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal");
  if (!targets.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((el) => observer.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal, { once: true });
} else {
  initReveal();
}
