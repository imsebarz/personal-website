'use client'

import React from 'react'
import '@/styles/floatmail.scss'
import strings from '@/data/contact.json'

const FloatMail: React.FC = () => {
  return (
    <div className="floating-mail">
      <div className="floating-line"></div>
      <a className="mail" href={`mailto:${strings.socials.mail}`}>
        {strings.socials.mail}
      </a>
    </div>
  )
}

export default FloatMail
