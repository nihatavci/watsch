import { initializeI18n } from '$lib/i18n';

export const ssr = false;

export async function load() {
    await initializeI18n();
    return {};
} 