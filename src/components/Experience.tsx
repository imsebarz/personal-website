'use client'

import React from 'react'
import { motion } from 'framer-motion'
import '@/styles/experience.scss'
import { ContainerVariants } from '@/lib/animation'
import expEn from '@/data/experience.json'
import expEs from '@/data/experience.es.json'
import { useLocale } from '@/contexts/LocaleContext'

interface Position {
  id: number
  company: string
  role: string
  client: string
  period: string
  location: string
  description: string
  highlights: string[]
  tags: string[]
}

interface ExperienceData {
  sectionTitle: string
  positions: Position[]
}

const Experience: React.FC = () => {
  const { locale } = useLocale()
  const data = (locale === 'es' ? expEs : expEn) as ExperienceData

  return (
    <section className="experience" id="experience">
      <motion.h1
        className="title"
        variants={ContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {data.sectionTitle}
      </motion.h1>
      <div className="experience-timeline">
        {data.positions.map((pos) => (
          <motion.div
            key={pos.id}
            className="experience-card"
            variants={ContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <div className="experience-card__header">
              <div className="experience-card__titles">
                <h3 className="experience-card__role">{pos.role}</h3>
                <h4 className="experience-card__company">
                  {pos.company}
                  {pos.client && <span className="experience-card__client"> · {pos.client}</span>}
                </h4>
              </div>
              <div className="experience-card__meta">
                <span className="experience-card__period">{pos.period}</span>
                <span className="experience-card__location">{pos.location}</span>
              </div>
            </div>
            <p className="experience-card__description">{pos.description}</p>
            <ul className="experience-card__highlights">
              {pos.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <div className="experience-card__tags">
              {pos.tags.map((tag, i) => (
                <span key={i} className="experience-tag">{tag}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Experience
