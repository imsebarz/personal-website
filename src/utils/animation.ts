import { Variants } from 'framer-motion'
import { APP_CONFIG } from '@/config/constants'

// Configuración base de animaciones
const ANIMATION_CONFIG = {
  duration: APP_CONFIG.ANIMATION.DURATION.NORMAL,
  ease: APP_CONFIG.ANIMATION.EASING,
  staggerChildren: 0.1,
  offset: 50,
}

// Variantes de animación reutilizables
export const ContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: ANIMATION_CONFIG.offset,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
      when: 'beforeChildren',
      staggerChildren: ANIMATION_CONFIG.staggerChildren,
    },
  },
}

export const FadeInVariants: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}

export const SlideUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: ANIMATION_CONFIG.offset 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}

export const SlideInLeftVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -ANIMATION_CONFIG.offset 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}

export const SlideInRightVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: ANIMATION_CONFIG.offset 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}

export const ScaleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}

// Variantes específicas para diferentes secciones
export const HeroVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: ANIMATION_CONFIG.offset * 2 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration * 2,
      type: 'tween',
      when: 'beforeChildren',
      staggerChildren: ANIMATION_CONFIG.staggerChildren * 2,
    },
  },
}

export const ProjectCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: ANIMATION_CONFIG.offset,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      type: 'tween',
    },
  },
}
