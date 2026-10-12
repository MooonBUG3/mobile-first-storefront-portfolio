// Bilingual dictionary — single source of truth.
// Build-time: pages render English via t(); the client swaps to Chinese
// in place (progressive enhancement: no-JS visitors keep the English DOM).
import { enCommon } from "./en.common";
import { enHome } from "./en.home";
import { enPages } from "./en.pages";
import { zhCommon } from "./zh.common";
import { zhHome } from "./zh.home";
import { zhPages } from "./zh.pages";

export const dictionaries = {
  en: { ...enCommon, ...enHome, ...enPages },
  zh: { ...zhCommon, ...zhHome, ...zhPages },
} as const;

export type Lang = keyof typeof dictionaries;
export type I18nKey = keyof typeof dictionaries.en;

/** Build-time lookup for the default (English) DOM. */
export function t(key: I18nKey): string {
  return dictionaries.en[key] ?? key;
}

/** Full dictionary for a language, used by the client-side language switch. */
export function dictFor(lang: Lang): Record<I18nKey, string> {
  return dictionaries[lang];
}

export const LANG_STORAGE_KEY = "storefront-clinic:lang";
