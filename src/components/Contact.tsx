'use client'

import { motion, useInView } from 'framer-motion'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import '@/styles/contact.scss'
import { ContainerVariants } from '@/lib/animation'
import stringsEn from '@/data/contact.json'
import stringsEs from '@/data/contact.es.json'
import { useLocale } from '@/contexts/LocaleContext'

const Contact: React.FC = () => {
  const { locale } = useLocale()
  type ContactStrings = typeof stringsEn & typeof stringsEs
  const strings = (locale === 'es' ? stringsEs : stringsEn) as ContactStrings

  const titleRef = useRef<HTMLHeadingElement>(null)
  const isInView = useInView(titleRef, { once: true, amount: 0.5 })
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [doneTyping, setDoneTyping] = useState(false)

  const fullTitle = strings.contactTitle

  const startTyping = useCallback(() => {
    setShowCursor(true)
    setDisplayedText('')
    setDoneTyping(false)

    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayedText(fullTitle.slice(0, i))
      if (i >= fullTitle.length) {
        clearInterval(interval)
        setDoneTyping(true)
        setTimeout(() => setShowCursor(false), 2000)
      }
    }, 80)

    return () => clearInterval(interval)
  }, [fullTitle])

  useEffect(() => {
    if (isInView) {
      const cleanup = startTyping()
      return cleanup
    }
  }, [isInView, startTyping])

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
      <h1 className="title" id="contact" ref={titleRef}>
        {isInView ? displayedText : '\u00A0'}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '1em',
              backgroundColor: 'currentColor',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              animation: doneTyping ? 'blink 0.8s step-end infinite' : 'none',
            }}
          />
        )}
      </h1>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <p dangerouslySetInnerHTML={{ __html: sanitize(strings.contactText) }} />
      <a href={`mailto:${strings.socials.mail}`}>
        <button>{strings.contactButton}</button>
      </a>
    </motion.section>
  )
}

export default Contact
