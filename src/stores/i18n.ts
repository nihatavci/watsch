import { writable } from 'svelte/store';

interface I18nState {
    language: string;
    t: (key: string, params?: Record<string, string>) => string;
}

function createI18nStore() {
    const { subscribe, set, update } = writable<I18nState>({
        language: 'en',
        t: (key: string, params: Record<string, string> = {}) => {
            // Basic translation function - replace with your translation logic
            return key.split('.').pop() || key;
        }
    });

    return {
        subscribe,
        setLanguage: (lang: string) => update(state => ({ ...state, language: lang }))
    };
}

export const i18nStore = createI18nStore(); 