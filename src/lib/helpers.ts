import { useState, useEffect } from 'react'
import { APP_CONFIG } from '@/config/constants'

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export const getTransition = (duration: keyof typeof APP_CONFIG.ANIMATION.DURATION = 'NORMAL'): string => {
  return `all ${APP_CONFIG.ANIMATION.DURATION[duration]}s ${APP_CONFIG.ANIMATION.EASING}`
}

export const isMobile = (width: number): boolean => {
  return width < APP_CONFIG.NAVIGATION.MOBILE_BREAKPOINT
}

export const getImageUrl = (imageName: string): string => {
  return `${APP_CONFIG.PATHS.IMAGES}${imageName}`
}

export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://')
}

export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

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

export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${APP_CONFIG.NAVIGATION.MOBILE_BREAKPOINT}px)`)
}
