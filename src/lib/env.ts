import { Capacitor } from '@capacitor/core';
import { env } from '$env/dynamic/private';

interface EnvVariables {
    TMDB_API_KEY: string;
    OPENAI_API_KEY: string;
    RAPID_API_KEY: string;
}

let envVariables: { [key: string]: string } | null = null;

export async function getEnvVariables(): Promise<EnvVariables> {
    return {
        TMDB_API_KEY: process.env.TMDB_API_KEY || env.TMDB_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY,
        RAPID_API_KEY: process.env.RAPID_API_KEY || env.RAPID_API_KEY
    };
}
