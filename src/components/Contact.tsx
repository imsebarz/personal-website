'use client'

import { motion, useAnimation } from 'framer-motion'
import React, { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import '@/styles/contact.scss'
import { ContainerVariants } from '@/lib/animation'
import stringsEn from '@/data/contact.json'
import stringsEs from '@/data/contact.es.json'
import { useLocale } from '@/contexts/LocaleContext'

const Contact: React.FC = () => {
  const [ref, inView] = useInView()
  const animation = useAnimation()

  useEffect(() => {
    if (inView) {
      animation.start('visible')
    } else {
      animation.start('hidden')
    }
  }, [inView, animation])

  const { locale } = useLocale()
  type ContactStrings = typeof stringsEn & typeof stringsEs
  const strings = (locale === 'es' ? stringsEs : stringsEn) as ContactStrings
  // Allow only <strong> tags from translation content; escape everything else.
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
      ref={ref}
      variants={ContainerVariants}
      initial="hidden"
      animate={animation}
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
