'use client'
import React, { useState, useEffect } from 'react'
import { getLocale, setLocale } from '@/lib/locale'

interface Props { initialLocale?: 'en' | 'es' }
const LanguageSwitch: React.FC<Props> = ({ initialLocale = 'en' }) => {
  const [locale, setLocal] = useState<'en' | 'es'>(initialLocale)

  useEffect(() => {
    const detected = getLocale()
    if (detected !== locale) setLocal(detected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = () => {
    const next = locale === 'en' ? 'es' : 'en'
  setLocale(next)
  try { document.cookie = `locale=${next};path=/;max-age=31536000` } catch {}
    setLocal(next)
    const hash = window.location.hash
    window.location.href = next === 'es' ? `/es${hash}` : `/${hash}`
  }

  return (
    <button aria-label="Switch language" onClick={toggle} style={{ position: 'fixed', top: 12, right: 12, background: 'var(--color-green)', color: '#fff', border: 'none', padding: '0.45em 0.8em', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.5px', zIndex: 1100 }}>
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  )
}

export default LanguageSwitch
