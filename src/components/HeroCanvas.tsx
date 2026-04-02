'use client'

import { useEffect, useRef } from 'react'

const TECH_LABELS = [
  'React', 'TypeScript', 'Next.js', 'GraphQL', 'Node.js', 'Tailwind',
  'Supabase', 'PostgreSQL', 'Jest', 'WCAG', 'Vercel', 'Docker',
  'Git', 'Webpack', 'AI/LLMs', 'MCP',
]

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationId: number
    let mouseX = 0
    let mouseY = 0

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js'
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as unknown as Record<string, any>).THREE
      if (!THREE) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
      camera.position.z = 30

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      // Create text sprite from 2D canvas
      function createTextSprite(text: string, color: string, opacity: number) {
        const cvs = document.createElement('canvas')
        const ctx = cvs.getContext('2d')!
        const fontSize = 24
        const font = `bold ${fontSize}px sans-serif`
        ctx.font = font
        const metrics = ctx.measureText(text)
        const textWidth = metrics.width
        const padding = 8

        cvs.width = Math.ceil(textWidth + padding * 2)
        cvs.height = Math.ceil(fontSize * 1.4 + padding * 2)

        ctx.font = font
        ctx.fillStyle = color
        ctx.globalAlpha = 1
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.fillText(text, cvs.width / 2, cvs.height / 2)

        const texture = new THREE.CanvasTexture(cvs)
        texture.needsUpdate = true

        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity,
          depthWrite: false,
        })
        const sprite = new THREE.Sprite(spriteMat)

        const aspect = cvs.width / cvs.height
        const scale = 2.5
        sprite.scale.set(scale * aspect, scale, 1)

        return sprite
      }

      // Create floating labels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labels: Array<{ sprite: any; speed: number; rotSpeed: number }> = []

      for (let i = 0; i < TECH_LABELS.length; i++) {
        const text = TECH_LABELS[i]
        const isMint = i % 2 === 0
        const color = isMint ? '#eefff3' : '#00a89d'
        const opacity = 0.15 + Math.random() * 0.35

        const sprite = createTextSprite(text, color, opacity)
        sprite.position.set(
          (Math.random() - 0.5) * 45,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 15
        )

        const speed = 0.005 + Math.random() * 0.015
        const rotSpeed = (Math.random() - 0.5) * 0.003

        scene.add(sprite)
        labels.push({ sprite, speed, rotSpeed })
      }

      // Duplicate some labels to fill the space
      for (let i = 0; i < 16; i++) {
        const text = TECH_LABELS[i % TECH_LABELS.length]
        const isMint = i % 2 !== 0
        const color = isMint ? '#eefff3' : '#00a89d'
        const opacity = 0.15 + Math.random() * 0.35

        const sprite = createTextSprite(text, color, opacity)
        sprite.position.set(
          (Math.random() - 0.5) * 45,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 15
        )

        const speed = 0.005 + Math.random() * 0.015
        const rotSpeed = (Math.random() - 0.5) * 0.003

        scene.add(sprite)
        labels.push({ sprite, speed, rotSpeed })
      }

      function animate() {
        animationId = requestAnimationFrame(animate)

        labels.forEach(({ sprite, speed, rotSpeed }) => {
          sprite.position.y += speed

          // Subtle Y-axis rotation via slight x oscillation
          sprite.position.x += rotSpeed

          // Recycle when out of view
          if (sprite.position.y > 18) {
            sprite.position.y = -18
            sprite.position.x = (Math.random() - 0.5) * 45
          }
        })

        // Mouse parallax
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.02
        camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02
        camera.lookAt(0, 0, 0)

        renderer.render(scene, camera)
      }

      animate()

      function onResize() {
        if (!canvas) return
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      function onMouseMove(e: MouseEvent) {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1
        mouseY = (e.clientY / window.innerHeight) * 2 - 1
      }

      window.addEventListener('resize', onResize)
      window.addEventListener('mousemove', onMouseMove)

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('mousemove', onMouseMove)
        cancelAnimationFrame(animationId)
        renderer.dispose()
      }
    }

    document.head.appendChild(script)

    return () => {
      cancelAnimationFrame(animationId)
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
