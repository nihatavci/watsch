import { Capacitor } from '@capacitor/core';

interface EnvPlugin {
    getEnvVariables(): Promise<{
        TMDB_API_KEY: string;
        OPENAI_API_KEY: string;
    }>;
}

let envVariables: { [key: string]: string } | null = null;

export async function getEnvVariables() {
    if (envVariables) return envVariables;

    if (Capacitor.isNativePlatform()) {
        const plugin = (Capacitor as any).Plugins.Env as EnvPlugin;
        envVariables = await plugin.getEnvVariables();
    } else {
        // For web development
        envVariables = {
            TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY,
            OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY
        };
    }
    
    return envVariables;
} 