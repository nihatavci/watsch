import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import trTranslations from './locales/tr.json';

// Supported languages
export const supportedLanguages = ['en', 'es', 'fr', 'de', 'tr'];

// Default language
export const defaultLanguage = 'en';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize i18next
const i18n = i18next.createInstance();

// Function to detect user's language
export async function detectLanguage(): Promise<string> {
    if (!isBrowser) {
        return defaultLanguage;
    }

    // Check localStorage first
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
        return storedLanguage;
    }

    try {
        // Get geolocation-based language
        const response = await fetch('/api/geolocation');
        const { language } = await response.json();
        
        if (supportedLanguages.includes(language)) {
            return language;
        }
    } catch (error) {
        console.error('Error detecting location:', error);
    }

    // Fallback to browser language
    const browserLanguage = navigator.language.split('-')[0];
    return supportedLanguages.includes(browserLanguage) 
        ? browserLanguage 
        : defaultLanguage;
}

// Initialize with default language first
i18n.use(LanguageDetector).init({
    resources: {
        en: { translation: enTranslations },
        es: { translation: esTranslations },
        fr: { translation: frTranslations },
        de: { translation: deTranslations },
        tr: { translation: trTranslations }
    },
    lng: defaultLanguage,
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

// Create store immediately
export const i18nStore = createI18nStore(i18n);

// Initialize language asynchronously
if (isBrowser) {
    detectLanguage().then(language => {
        if (language !== i18n.language) {
            changeLanguage(language);
        }
    });
}

// Function to change language
export function changeLanguage(lng: string) {
    if (!isBrowser) return;
    
    if (supportedLanguages.includes(lng)) {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    }
}

export default i18n; 