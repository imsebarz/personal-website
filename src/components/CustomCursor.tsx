'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const mouse = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Only show on devices with hover capability (no touch)
    const hasHover = window.matchMedia('(hover: hover)').matches
    if (!hasHover) return

    setVisible(true)

    // Hide default cursor
    document.body.style.cursor = 'none'
    const style = document.createElement('style')
    style.textContent = `
      @media (hover: hover) {
        *, *::before, *::after { cursor: none !important; }
      }
    `
    document.head.appendChild(style)

    let rafId: number

    function onMouseMove(e: MouseEvent) {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`
      }
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [role="button"], input, textarea, select, label')) {
        setHovering(true)
      }
    }

    function onMouseOut(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [role="button"], input, textarea, select, label')) {
        setHovering(false)
      }
    }

    function animate() {
      rafId = requestAnimationFrame(animate)
      // Lerp the ring toward the mouse
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15

      if (ringRef.current) {
        const size = hovering ? 50 : 30
        ringRef.current.style.width = `${size}px`
        ringRef.current.style.height = `${size}px`
        ringRef.current.style.transform = `translate(${ring.current.x - size / 2}px, ${ring.current.y - size / 2}px)`
        ringRef.current.style.opacity = hovering ? '0.5' : '0.3'
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    animate()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      cancelAnimationFrame(rafId)
      document.body.style.cursor = ''
      if (style.parentNode) style.parentNode.removeChild(style)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering])

  if (!visible) return null

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#004747',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1px solid #004747',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
        }}
      />
    </>
  )
}
