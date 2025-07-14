'use client'

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import '@/styles/featuredprojects.scss'
import { ContainerVariants } from '@/utils/animation'
import Projects from '@/data/projects.json'
import type { Project } from '@/types'
import FeaturedProject from './FeaturedProject'

const { projects }: { projects: Project[] } = Projects

const FeaturedProjects: React.FC = () => {
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
        Featured Projects
      </motion.h1>
      <motion.div
        className="featuredProjects-container"
        variants={ContainerVariants}
        initial="hidden"
        animate={animation}
      >
        {projects.map((item, index) => {
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
