'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import '@/styles/aboutme.scss'
import { ContainerVariants } from '@/lib/animation'
import stringsEn from '@/data/aboutme.json'
import stringsEs from '@/data/aboutme.es.json'
import { useLocale } from '@/contexts/LocaleContext'

const AboutMe: React.FC = () => {
  const { locale } = useLocale()
  type AboutStrings = typeof stringsEn & typeof stringsEs
  const strings = (locale === 'es' ? stringsEs : stringsEn) as AboutStrings

  return (
    <motion.section
      className="aboutme"
      id="aboutme"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.h1 className="title" variants={ContainerVariants}>
        {strings.aboutMeTitle}
      </motion.h1>
      <motion.div className="aboutme-container" variants={ContainerVariants}>
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
