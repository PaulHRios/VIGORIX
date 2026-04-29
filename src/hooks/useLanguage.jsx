import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, DEFAULT_LANG, LANGS } from '../data/translations.js';
import { getLanguage, setLanguage as persistLanguage } from '../services/storageService.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = getLanguage();
    if (stored && LANGS.includes(stored)) return stored;
    // Browser-detect once on first load.
    if (typeof navigator !== 'undefined') {
      const browser = (navigator.language || '').slice(0, 2).toLowerCase();
      if (LANGS.includes(browser)) return browser;
    }
    return DEFAULT_LANG;
  });

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    persistLanguage(next);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'en' ? 'es' : 'en');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      t: translations[lang] || translations[DEFAULT_LANG],
      setLang,
      toggle,
    }),
    [lang, setLang, toggle]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
