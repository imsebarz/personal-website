import { Variants } from 'framer-motion'

export const ContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      type: 'tween',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}
