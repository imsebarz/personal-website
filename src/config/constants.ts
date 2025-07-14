export const APP_CONFIG = {
  PATHS: {
    FONTS: '/fonts/Recoleta.otf',
    IMAGES: '/images/',
  },
  
  NAVIGATION: {
    SCROLL_OFFSET: 100,
    MOBILE_BREAKPOINT: 900,
  },
  
  ANIMATION: {
    DURATION: {
      FAST: 0.2,
      NORMAL: 0.3,
      SLOW: 0.5,
    },
    EASING: 'ease',
  },
  
  SOCIAL_LINKS: {
    GITHUB: 'https://github.com/imsebarz',
    LINKEDIN: 'https://linkedin.com/in/imsebarz',
    TWITTER: 'https://twitter.com/imsebarz',
    INSTAGRAM: 'https://instagram.com/imsebarz',
  },
  
  CONTACT: {
    EMAIL: 'sebastian@example.com',
    RESUME_LINK: '#',
  },
} as const
export type SocialPlatform = keyof typeof APP_CONFIG.SOCIAL_LINKS
export type AnimationDuration = keyof typeof APP_CONFIG.ANIMATION.DURATION
