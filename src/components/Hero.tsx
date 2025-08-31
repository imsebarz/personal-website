'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import '@/styles/hero.scss'
import { ContainerVariants } from '@/lib/animation'
import stringsEn from '@/data/aboutme.json'
import stringsEs from '@/data/aboutme.es.json'
import { useLocale } from '@/contexts/LocaleContext'

const Hero: React.FC = () => {
  useEffect(() => {
    const hero = document.querySelector('.hero') as HTMLElement
    function handleResize() {
      if (hero) {
        // Height is handled by CSS
      }
    }
    setTimeout(() => {
      handleResize()
    }, 0)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const { locale } = useLocale()
  type HeroStrings = typeof stringsEn & typeof stringsEs
  const strings = (locale === 'es' ? stringsEs : stringsEn) as HeroStrings
  return (
    <section className="hero">
      <div className="hero-inner">
        <motion.div
          className="hero-info"
          variants={ContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={ContainerVariants}>
            {strings.hero.greeting}
          </motion.p>
            <motion.h1 variants={ContainerVariants}>
              {strings.hero.name}
            </motion.h1>
            <motion.h2
              variants={ContainerVariants}
              dangerouslySetInnerHTML={{ __html: strings.hero.description }}
            />
            <motion.a href="#featuredProjects">
              <motion.button variants={ContainerVariants}>
                {strings.hero.buttonText}
              </motion.button>
            </motion.a>
        </motion.div>
        <motion.div
          className="hero-image-wrapper"
          variants={ContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <Image
            src="/images/hero.webp"
            id="hero-img"
            alt="Profile photo"
            width={500}
            height={600}
            sizes="(max-width: 905px) 70vw, 500px"
            priority
          />
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
