<script lang="ts">
    import { onMount } from 'svelte';
    import { i18nStore, changeLanguage, supportedLanguages, detectLanguage, defaultLanguage } from './i18n';
    import { fade } from 'svelte/transition';

    type Language = 'en' | 'es' | 'fr' | 'de';
    let currentLanguage = defaultLanguage as Language;
    let mounted = false;
    let isOpen = false;

    const languageNames: Record<Language, string> = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch'
    };

    const languageFlags: Record<Language, string> = {
        'en': '🇬🇧',
        'es': '🇪🇸',
        'fr': '🇫🇷',
        'de': '🇩🇪'
    };

    function handleLanguageChange(lang: Language) {
        if (!mounted) return;
        currentLanguage = lang;
        changeLanguage(lang);
        isOpen = false;
    }

    onMount(() => {
        mounted = true;
        // Set initial language from detection
        const detectedLang = detectLanguage();
        if (isValidLanguage(detectedLang)) {
            currentLanguage = detectedLang;
            changeLanguage(currentLanguage);
        }
    });

    // Type guard to check if a string is a valid Language
    function isValidLanguage(lang: string): lang is Language {
        return supportedLanguages.includes(lang);
    }

    const validLanguages = supportedLanguages.filter(isValidLanguage);

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.language-switcher')) {
            isOpen = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside}/>

<div class="language-switcher relative">
    <button
        on:click|stopPropagation={toggleDropdown}
        class="px-3 py-1.5 rounded-lg bg-[#E50914]/10 backdrop-blur-sm border border-[#E50914]/20 hover:bg-[#E50914]/20 transition-all duration-300 text-white/90 hover:text-white flex items-center gap-2"
    >
        <span class="text-base">{languageFlags[currentLanguage]}</span>
        <span>{languageNames[currentLanguage]}</span>
        <svg
            class={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </button>

    {#if isOpen}
        <div
            class="absolute top-full right-0 mt-2 py-2 bg-[#1A1A1A] rounded-lg shadow-lg border border-[#E50914]/20"
            transition:fade={{ duration: 150 }}
        >
            {#each validLanguages as lang}
                <button
                    class={`w-full px-4 py-2 text-left hover:bg-[#E50914]/10 transition-colors flex items-center gap-2
                        ${currentLanguage === lang ? 'text-[#E50914]' : 'text-white/90'}`}
                    on:click={() => handleLanguageChange(lang)}
                >
                    <span class="text-base">{languageFlags[lang]}</span>
                    {languageNames[lang]}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .language-switcher {
        z-index: 100;
    }
</style> 