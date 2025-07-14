import { APP_CONFIG } from '@/config/constants'

/**
 * Genera clases CSS condicionales
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Genera estilos de transición consistentes
 */
export const getTransition = (duration: keyof typeof APP_CONFIG.ANIMATION.DURATION = 'NORMAL'): string => {
  return `all ${APP_CONFIG.ANIMATION.DURATION[duration]}s ${APP_CONFIG.ANIMATION.EASING}`
}

/**
 * Verifica si es un dispositivo móvil basado en el ancho
 */
export const isMobile = (width: number): boolean => {
  return width < APP_CONFIG.NAVIGATION.MOBILE_BREAKPOINT
}

/**
 * Genera URL de imagen optimizada
 */
export const getImageUrl = (imageName: string): string => {
  return `${APP_CONFIG.PATHS.IMAGES}${imageName}`
}

/**
 * Verifica si una URL es externa
 */
export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Formatea texto para SEO (slug)
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

/**
 * Debounce function para optimización de performance
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Hook personalizado para media queries
 */
import { useState, useEffect } from 'react'

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

/**
 * Hook para detectar dispositivos móviles
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${APP_CONFIG.NAVIGATION.MOBILE_BREAKPOINT}px)`)
}
