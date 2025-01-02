import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';

// Supported languages
export const supportedLanguages = ['en', 'es', 'fr', 'de'];

// Default language
export const defaultLanguage = 'en';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize i18next
const i18n = i18next.createInstance();

// Function to detect user's language
export function detectLanguage(): string {
  if (!isBrowser) {
    return defaultLanguage;
  }

  const storedLanguage = localStorage.getItem('language');
  if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
    return storedLanguage;
  }

  const browserLanguage = navigator.language.split('-')[0];
  return supportedLanguages.includes(browserLanguage) 
    ? browserLanguage 
    : defaultLanguage;
}

// Initialize with detected language
const initialLanguage = isBrowser ? detectLanguage() : defaultLanguage;

i18n
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations }
    },
    lng: initialLanguage,
    fallbackLng: defaultLanguage,
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: isBrowser ? ['localStorage'] : []
    }
  });

// Create Svelte store
export const i18nStore = createI18nStore(i18n);

// Function to change language
export function changeLanguage(lng: string) {
  if (!isBrowser) {
    return;
  }

  if (supportedLanguages.includes(lng)) {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  }
}

export default i18n; 