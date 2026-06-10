const SUPPORTED_LANGUAGES = ['en', 'zh', 'fr', 'ru', 'ja', 'vi'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function normalizeLanguage(language?: string | null) {
  const code = language?.split('-')[0]
  if (code && SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)) {
    return code as SupportedLanguage
  }
  return null
}

export function saveLanguagePreference(language: string) {
  const normalized = normalizeLanguage(language)
  if (!normalized || typeof window === 'undefined') return

  window.localStorage.setItem('i18nextLng', normalized)
}
