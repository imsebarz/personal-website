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
    <button aria-label="Switch language" onClick={toggle} style={{ position: 'fixed', top: 10, right: 60, background: 'rgba(0, 71, 71, 0.9)', color: '#eefff3', border: '1px solid rgba(238, 255, 243, 0.2)', padding: '0.35em 0.7em', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', zIndex: 15 }}>
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  )
}

export default LanguageSwitch
