import { useState, useCallback } from 'react';
import { Language, translations } from './translations';

const STORAGE_KEY = 'sueca-language';

/**
 * Helper function to replace placeholders in translation strings
 */
const replacePlaceholders = (str: string, replacements: Record<string, string | number>): string => {
  let result = str;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
};

/**
 * Custom hook for language management
 * Provides current language, translations, and language switching
 */
export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'pt' || saved === 'en') ? saved : 'pt';
  });

  const t = translations[language];

  // Helper to get translated string with replacements
  const tReplace = useCallback((key: string, replacements: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) {
      value = value[k];
    }
    if (typeof value === 'string') {
      return replacePlaceholders(value, replacements);
    }
    return value;
  }, [t]);

  const changeLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  return {
    language,
    setLanguage: changeLanguage,
    t,
    tReplace
  };
};
