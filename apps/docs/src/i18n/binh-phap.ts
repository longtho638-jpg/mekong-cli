/**
 * Binh Pháp i18n Utility
 * Load localized content for the 13 chapters
 */

// Import locale files
import enCommon from "../../../locales/en/common.json";
import viCommon from "../../../locales/vi/common.json";
import jaBinhPhap from "../../../locales/ja/binh-phap.json";
import koBinhPhap from "../../../locales/ko/binh-phap.json";

export type Locale = "en" | "vi" | "ja" | "ko";

export interface BinhPhapChapter {
  chinese: string;
  name: string;
  purpose: string;
  commands: string[];
  style?: "default" | "highlight" | "danger" | "fire" | "intel";
}

export interface BinhPhapLocale {
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  quote_original: string;
  chapters: Record<string, BinhPhapChapter>;
  wisdom: {
    quote1_original: string;
    quote1_translation: string;
    quote2_original: string;
    quote2_translation: string;
  };
  cta: {
    title: string;
    button: string;
  };
}

const locales: Record<Locale, BinhPhapLocale> = {
  en: enCommon.binh_phap as unknown as BinhPhapLocale,
  vi: viCommon.binh_phap as unknown as BinhPhapLocale,
  ja: jaBinhPhap.binh_phap as unknown as BinhPhapLocale,
  ko: koBinhPhap.binh_phap as unknown as BinhPhapLocale,
};

export function getBinhPhapLocale(locale: Locale = "en"): BinhPhapLocale {
  return locales[locale] || locales.en;
}

export function getChapters(locale: Locale = "en"): BinhPhapChapter[] {
  const data = getBinhPhapLocale(locale);
  return Object.entries(data.chapters).map(([num, chapter]) => ({
    number: parseInt(num),
    ...chapter,
  }));
}

export function detectLocaleFromPath(path: string): Locale {
  if (path.startsWith("/vi/")) return "vi";
  if (path.startsWith("/ja/")) return "ja";
  if (path.startsWith("/ko/")) return "ko";
  return "en";
}

export const supportedLocales: Locale[] = ["en", "vi", "ja", "ko"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  ja: "日本語",
  ko: "한국어",
};
