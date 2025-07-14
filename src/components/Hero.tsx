'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import '@/styles/hero.scss'
import { ContainerVariants } from '@/utils/animation'
import strings from '@/data/aboutme.json'

const Hero: React.FC = () => {
  useEffect(() => {
    const hero = document.querySelector('.hero') as HTMLElement
    function handleResize() {
      if (hero) {
        console.log(hero.clientHeight)
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

  return (
    <section className="hero">
      <Image 
        className="hero-bg" 
        src="/images/wave-bg.svg" 
        alt="Sebarz Background" 
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
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
        variants={ContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <Image
          src="/images/hero.webp"
          id="hero-img"
          alt="Sebarz Profile Photo"
          width={500}
          height={600}
          priority
        />
      </motion.div>
    </section>
  )
}

export default Hero
