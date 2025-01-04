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

    try {
        // First try geolocation
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        
        if (data.language && supportedLanguages.includes(data.language)) {
            console.log('Language detected from geolocation:', data.language);
            return data.language;
        }

        // If geolocation fails, check localStorage
        const storedLanguage = localStorage.getItem('language');
        if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
            console.log('Language detected from localStorage:', storedLanguage);
            return storedLanguage;
        }

        // Finally, try browser language
        const browserLanguage = navigator.language.split('-')[0];
        if (supportedLanguages.includes(browserLanguage)) {
            console.log('Language detected from browser:', browserLanguage);
            return browserLanguage;
        }

        console.log('Falling back to default language:', defaultLanguage);
        return defaultLanguage;
    } catch (error) {
        console.error('Error in language detection:', error);
        return defaultLanguage;
    }
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