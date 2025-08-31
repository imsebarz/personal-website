'use client'

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import '@/styles/featuredprojects.scss'
import { ContainerVariants } from '@/lib/animation'
import { useProjects, useSections } from '@/hooks/useData'
import { useLocale } from '@/contexts/LocaleContext'
import FeaturedProject from './FeaturedProject'

const FeaturedProjects: React.FC = () => {
  const { projects } = useProjects()
  const { sections } = useSections()
  useLocale() // ensure subscription so re-render on locale change (data hook already handles locales)
  const [ref, inView] = useInView()
  const animation = useAnimation()

  useEffect(() => {
    if (inView) {
      animation.start('visible')
    } else {
      animation.start('hidden')
    }
  }, [inView, animation])

  return (
    <section className="featuredProjects" id="featuredProjects" ref={ref}>
      <motion.h1
        className="title"
        variants={ContainerVariants}
        initial="hidden"
        animate={animation}
      >
  {sections ? sections.featuredProjects : ''}
      </motion.h1>
      <motion.div
        className="featuredProjects-container"
        variants={ContainerVariants}
        initial="hidden"
        animate={animation}
      >
  {sections && projects.map((item, index) => {
          if (item.featured) {
            return <FeaturedProject {...item} key={item.id} index={index} />
          }
          return null
        })}
      </motion.div>
    </section>
  )
}

export default FeaturedProjects
