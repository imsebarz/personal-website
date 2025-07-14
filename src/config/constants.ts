// Configuraciones compartidas de la aplicación
export const APP_CONFIG = {
  // Rutas de archivos
  PATHS: {
    FONTS: '/fonts/Recoleta.otf',
    IMAGES: '/images/',
  },
  
  // Configuraciones de navegación
  NAVIGATION: {
    SCROLL_OFFSET: 100,
    MOBILE_BREAKPOINT: 900,
  },
  
  // Configuraciones de animación
  ANIMATION: {
    DURATION: {
      FAST: 0.2,
      NORMAL: 0.3,
      SLOW: 0.5,
    },
    EASING: 'ease',
  },
  
  // Configuraciones de redes sociales
  SOCIAL_LINKS: {
    GITHUB: 'https://github.com/imsebarz',
    LINKEDIN: 'https://linkedin.com/in/imsebarz',
    TWITTER: 'https://twitter.com/imsebarz',
    INSTAGRAM: 'https://instagram.com/imsebarz',
  },
  
  // Configuraciones de contacto
  CONTACT: {
    EMAIL: 'sebastian@example.com',
    RESUME_LINK: '#',
  },
} as const

// Tipos derivados de la configuración
export type SocialPlatform = keyof typeof APP_CONFIG.SOCIAL_LINKS
export type AnimationDuration = keyof typeof APP_CONFIG.ANIMATION.DURATION
