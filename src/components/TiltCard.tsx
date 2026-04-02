'use client'

import React, { useRef, useCallback } from 'react'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateX = (-mouseY / (rect.height / 2)) * 8
    const rotateY = (mouseX / (rect.width / 2)) * 8

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`

    if (glareRef.current) {
      const percentX = ((e.clientX - rect.left) / rect.width) * 100
      const percentY = ((e.clientY - rect.top) / rect.height) * 100
      glareRef.current.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
      glareRef.current.style.opacity = '1'
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'

    if (glareRef.current) {
      glareRef.current.style.opacity = '0'
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.5s ease',
        transformStyle: 'preserve-3d',
        position: 'relative',
      }}
    >
      {children}
      <div
        ref={glareRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 2,
        }}
      />
    </div>
  )
}

export default TiltCard
