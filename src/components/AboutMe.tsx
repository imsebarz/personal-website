'use client'

import React, { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, useAnimation } from 'framer-motion'
import Image from 'next/image'
import '@/styles/aboutme.scss'
import { ContainerVariants } from '@/lib/animation'
import strings from '@/data/aboutme.json'

const AboutMe: React.FC = () => {
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
    <motion.section className="aboutme" id="aboutme" ref={ref}>
      <motion.h1
        className="title"
        animate={animation}
        variants={ContainerVariants}
        initial="hidden"
      >
        {strings.aboutMeTitle}
      </motion.h1>
      <motion.div
        className="aboutme-container"
        animate={animation}
        variants={ContainerVariants}
        initial="hidden"
      >
        <motion.div className="aboutme-image" variants={ContainerVariants}>
          <Image 
            src="/images/sebas.webp" 
            alt="Sebastian Ruiz" 
            width={400}
            height={500}
            style={{ objectFit: 'cover' }}
          />
        </motion.div>
        <div className="aboutme-text">
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText1 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText2 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText3 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText4 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText5 }} />
          
          <motion.h3 variants={ContainerVariants} className="technologies-title">
            {strings.someTechnologiesTitle}
          </motion.h3>
          <motion.div variants={ContainerVariants} className="technologies-grid">
            {strings.technologies.map((tech: string, index: number) => (
              <motion.span key={index} className="tech-badge">{tech}</motion.span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  )
}

export default AboutMe
