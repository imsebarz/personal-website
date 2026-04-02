'use client'

import React from 'react'
import { motion } from 'framer-motion'
import '@/styles/featuredprojects.scss'
import { ContainerVariants } from '@/lib/animation'
import { useProjects, useSections } from '@/hooks/useData'
import { useLocale } from '@/contexts/LocaleContext'
import FeaturedProject from './FeaturedProject'

const FeaturedProjects: React.FC = () => {
  const { projects } = useProjects()
  const { sections } = useSections()
  useLocale()

  return (
    <section className="featuredProjects" id="featuredProjects">
      <motion.h1
        className="title"
        variants={ContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {sections ? sections.featuredProjects : ''}
      </motion.h1>
      <motion.div
        className="featuredProjects-container"
        variants={ContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
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
