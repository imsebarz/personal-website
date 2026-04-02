'use client'

import { motion } from 'framer-motion'
import React from 'react'
import '@/styles/contact.scss'
import { ContainerVariants } from '@/lib/animation'
import stringsEn from '@/data/contact.json'
import stringsEs from '@/data/contact.es.json'
import { useLocale } from '@/contexts/LocaleContext'

const Contact: React.FC = () => {
  const { locale } = useLocale()
  type ContactStrings = typeof stringsEn & typeof stringsEs
  const strings = (locale === 'es' ? stringsEs : stringsEn) as ContactStrings

  const sanitize = (raw: string): string => {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return escaped
      .replace(/&lt;strong&gt;/g, '<strong>')
      .replace(/&lt;\/strong&gt;/g, '</strong>')
  }

  return (
    <motion.section
      className="contact"
      variants={ContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <h1 className="title" id="contact">
        {strings.contactTitle}
      </h1>
      <p dangerouslySetInnerHTML={{ __html: sanitize(strings.contactText) }} />
      <a href={`mailto:${strings.socials.mail}`}>
        <button>{strings.contactButton}</button>
      </a>
    </motion.section>
  )
}

export default Contact
