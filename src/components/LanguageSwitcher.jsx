"use client";

import { useLanguage, SUPPORTED_LOCALES } from "@/lib/context/language-context";

export default function LanguageSwitcher({ style }) {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      style={{
        height: "36px",
        padding: "0 10px",
        border: "2px solid #000",
        background: "#fff",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        fontFamily: "Arial, Helvetica, sans-serif",
        ...style,
      }}
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map(({ code, label, flag }) => (
        <option key={code} value={code}>
          {flag} {label}
        </option>
      ))}
    </select>
  );
}
