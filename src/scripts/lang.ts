// Client-side language switch. Progressive enhancement:
// - the DOM ships in English (crawlable, works without JS)
// - on load we restore localStorage / navigator preference and swap in place
// - html[data-js="on"][data-lang="zh"] keeps [data-i18n] nodes invisible
//   until the swap completes, so Chinese readers never see an English flash
import { dictionaries, LANG_STORAGE_KEY, type Lang, type I18nKey } from "../i18n";

const isLang = (v: unknown): v is Lang => v === "en" || v === "zh";

function swapText(lang: Lang) {
  const d = dictionaries[lang] as Record<I18nKey, string>;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const value = d[el.getAttribute("data-i18n") as I18nKey];
    if (value !== undefined) el.textContent = value;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const value = d[el.getAttribute("data-i18n-html") as I18nKey];
    if (value !== undefined) el.innerHTML = value;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    const value = d[el.getAttribute("data-i18n-aria") as I18nKey];
    if (value !== undefined) el.setAttribute("aria-label", value);
  });
}

export function applyLang(lang: Lang) {
  // Clear the pending flag first so swapped text becomes visible immediately.
  delete document.documentElement.dataset.pendingLang;
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  swapText(lang);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function initLang() {
  let initial: Lang = "en";
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) initial = saved;
    else if (/^zh\b/i.test(navigator.language || "")) initial = "zh";
  } catch {
    /* storage unavailable */
  }

  document.querySelectorAll<HTMLButtonElement>(".lang-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next: Lang = (document.documentElement.dataset.lang as Lang) === "zh" ? "en" : "zh";
      applyLang(next);
    });
  });

  if (initial !== "en") applyLang(initial);
  else {
    // English is the shipped DOM: nothing is hidden, just announce for the
    // components that re-render dynamic copy.
    delete document.documentElement.dataset.pendingLang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: "en" } }));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLang, { once: true });
} else {
  initLang();
}
