// language context - supports English and German
"use client";

import { createContext, useContext, useEffect, useState } from "react";

import en from "@/lib/i18n/messages/en.json";
import de from "@/lib/i18n/messages/de.json";

const MESSAGES = { en, de };
const STORAGE_KEY = "uaams_locale";
const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

const LanguageContext = createContext(null);

function resolve(messages, key) {
  const parts = key.split(".");
  let value = messages;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MESSAGES[saved]) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (code) => {
    if (!MESSAGES[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLocaleState(code);
  };

  const t = (key) => {
    const localeMessages = MESSAGES[locale];
    const result = resolve(localeMessages, key);
    if (result !== undefined) return result;
    const fallback = resolve(MESSAGES[DEFAULT_LOCALE], key);
    return fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir: "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
