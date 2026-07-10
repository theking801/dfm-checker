/**
 * LanguageContext — Gère la langue de l'application (fr/en)
 * Persistance : localStorage
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import fr from '../i18n/fr'
import en from '../i18n/en'

type Language = 'fr' | 'en'
type Translations = typeof fr

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
  toggleLang: () => void
}

const translations: Record<Language, Translations> = { fr, en }

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'dfm-checker-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
    return navigator.language.startsWith('en') ? 'en' : 'fr'
  })

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr')
  }, [lang, setLang])

  const t = useCallback(
    (key: string): string => {
      return (translations[lang] as Record<string, string>)[key] ?? key
    },
    [lang]
  )

  // Sync <html lang> attribute
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider')
  return { t: ctx.t, lang: ctx.lang, toggleLang: ctx.toggleLang, setLang: ctx.setLang }
}
