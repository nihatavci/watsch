import { Capacitor } from '@capacitor/core';
import { env } from '$env/dynamic/private';

interface EnvPlugin {
    getEnvVariables(): Promise<{
        TMDB_API_KEY: string;
        OPENAI_API_KEY: string;
    }>;
}

let envVariables: { [key: string]: string } | null = null;

export async function getEnvVariables() {
    return {
        TMDB_API_KEY: process.env.TMDB_API_KEY || env.TMDB_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY
    };
}
