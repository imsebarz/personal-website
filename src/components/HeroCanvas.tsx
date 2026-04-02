'use client'

import { useEffect, useRef } from 'react'

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationId: number
    let mouseX = 0
    let mouseY = 0

    // Dynamically load Three.js
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

      // Particles
      const particleCount = 80
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const particles: Array<{ mesh: any; speed: { x: number; y: number; rotX: number; rotY: number } }> = []
      const geometries = [
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.OctahedronGeometry(0.15),
        new THREE.TetrahedronGeometry(0.13),
      ]

      for (let i = 0; i < particleCount; i++) {
        const geo = geometries[Math.floor(Math.random() * geometries.length)]
        const isMint = Math.random() > 0.5
        const mat = new THREE.MeshBasicMaterial({
          color: isMint ? 0xeefff3 : 0x00a89d,
          transparent: true,
          opacity: 0.15 + Math.random() * 0.35,
          wireframe: Math.random() > 0.6,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20
        )
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
        const speed = {
          x: (Math.random() - 0.5) * 0.003,
          y: 0.002 + Math.random() * 0.006,
          rotX: (Math.random() - 0.5) * 0.005,
          rotY: (Math.random() - 0.5) * 0.005,
        }
        scene.add(mesh)
        particles.push({ mesh, speed })
      }

      // Connections (lines between nearby particles)
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00a89d, transparent: true, opacity: 0.06 })
      const lineGroup = new THREE.Group()
      scene.add(lineGroup)

      function updateLines() {
        lineGroup.clear()
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const d = particles[i].mesh.position.distanceTo(particles[j].mesh.position)
            if (d < 6) {
              const geo = new THREE.BufferGeometry().setFromPoints([
                particles[i].mesh.position,
                particles[j].mesh.position,
              ])
              const line = new THREE.Line(geo, lineMat)
              lineGroup.add(line)
            }
          }
        }
      }

      let frame = 0
      function animate() {
        animationId = requestAnimationFrame(animate)
        frame++

        particles.forEach(({ mesh, speed }) => {
          mesh.position.y += speed.y
          mesh.position.x += speed.x
          mesh.rotation.x += speed.rotX
          mesh.rotation.y += speed.rotY

          // Reset when out of view
          if (mesh.position.y > 18) {
            mesh.position.y = -18
            mesh.position.x = (Math.random() - 0.5) * 50
          }
        })

        // Update connections every 3 frames for performance
        if (frame % 3 === 0) updateLines()

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
