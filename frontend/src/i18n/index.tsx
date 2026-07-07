import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocaleCode, localeStorage, messages, resolveLocale, getMessage, getStatusLabel, getStepStatusLabel, getStepTypeLabel, getStepTypeOptions, type Locale } from "./messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string) => string;
  localeCode: string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "vi";
  }

  return resolveLocale(window.localStorage.getItem(localeStorage.key));
}

function writeStoredLocale(locale: Locale) {
  window.localStorage.setItem(localeStorage.key, locale);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    writeStoredLocale(locale);
    document.documentElement.lang = locale;
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (path: string) => {
      const localized = locale === "vi" ? messages.vi : messages.en;
      const parts = path.split(".");
      let current: unknown = localized;
      for (const part of parts) {
        if (!current || typeof current !== "object" || !(part in current)) {
          current = undefined;
          break;
        }
        current = (current as Record<string, unknown>)[part];
      }

      if (typeof current === "string") {
        return current;
      }

      const fallback = path.split(".").reduce<unknown>((node, part) => {
        if (!node || typeof node !== "object" || !(part in node)) {
          return undefined;
        }
        return (node as Record<string, unknown>)[part];
      }, messages.en as unknown as Record<string, unknown>);

      return typeof fallback === "string" ? fallback : path;
    };

    return {
      locale,
      setLocale: (nextLocale: Locale) => setLocaleState(nextLocale),
      toggleLocale: () => setLocaleState((current) => (current === "vi" ? "en" : "vi")),
      t,
      localeCode: getLocaleCode(locale),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}

export { resolveLocale, getLocaleCode, getMessage, getStatusLabel, getStepStatusLabel, getStepTypeLabel, getStepTypeOptions, messages, localeStorage };
export type { Locale };

