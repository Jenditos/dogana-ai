import type { Language } from '@/types'
import sq from '@/locales/sq.json'
import en from '@/locales/en.json'

const translations: Record<Language, typeof sq> = { sq, en }

export function t(lang: Language, key: string): string {
  const keys = key.split('.')
  let result: unknown = translations[lang]
  for (const k of keys) {
    if (result && typeof result === 'object' && k in (result as object)) {
      result = (result as Record<string, unknown>)[k]
    } else {
      // Fallback to Albanian
      let fallback: unknown = translations['sq']
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in (fallback as object)) {
          fallback = (fallback as Record<string, unknown>)[fk]
        } else return key
      }
      return typeof fallback === 'string' ? fallback : key
    }
  }
  return typeof result === 'string' ? result : key
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'sq'
  return (localStorage.getItem('dudi_language') as Language) || 'sq'
}

export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('dudi_language', lang)
}
