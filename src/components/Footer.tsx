'use client'

import React from 'react'
import '@/styles/footer.scss'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>
        Made with 💛 by{' '}
        <a 
          href="https://github.com/imsebarz" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          @imsebarz
        </a>
      </p>
    </footer>
  )
}

export default Footer
