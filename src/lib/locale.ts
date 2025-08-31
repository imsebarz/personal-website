// Deprecated direct detection; kept for backward compatibility in utility usages.
export const getLocale = (): 'en' | 'es' => {
  if (typeof window === 'undefined') {
    return 'en'
  }
  const stored = window.localStorage.getItem('locale')
  if (stored === 'es' || stored === 'en') return stored
  if (navigator.language.toLowerCase().startsWith('es')) return 'es'
  return 'en'
}

export const setLocale = (locale: 'en' | 'es') => {
  try { if (typeof window !== 'undefined') window.localStorage.setItem('locale', locale) } catch {}
}
