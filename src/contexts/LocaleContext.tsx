"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'en' | 'es'
interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}
const LocaleContext = createContext<LocaleContextValue | null>(null)

export const LocaleProvider: React.FC<{ initialLocale: Locale; children: React.ReactNode }> = ({ initialLocale, children }) => {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  // Sync with localStorage after mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('locale') as Locale | null
      if (stored && stored !== locale) setLocale(stored)
      else window.localStorage.setItem('locale', locale)
    } catch {}
  }, [locale])
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext)
  if (!ctx) return { locale: 'en', setLocale: () => {} }
  return ctx
}