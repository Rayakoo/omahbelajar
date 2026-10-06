"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type Locale = "id" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "id",
  setLocale: () => {},
  toggleLanguage: () => {},
});

const STORAGE_KEY = "omahnalar-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "id") {
      setLocaleState(saved);
      document.documentElement.lang = saved === "en" ? "en" : "id";
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "id";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l === "en" ? "en" : "id";
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "id" ? "en" : "id";
      document.documentElement.lang = next === "en" ? "en" : "id";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
