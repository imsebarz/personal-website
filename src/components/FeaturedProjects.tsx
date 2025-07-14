'use client'

import React, { useEffect } from 'react'
import FeaturedProject from './FeaturedProject'
import '@/styles/featuredprojects.scss'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ContainerVariants } from '@/utils/animation'
import Projects from '@/data/projects.json'

interface ProjectType {
  id: number
  featured: boolean
  [key: string]: any
}

const { projects }: { projects: ProjectType[] } = Projects

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
