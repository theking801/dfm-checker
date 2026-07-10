/**
 * CursorGlow — Effet de lueur violette suivant le curseur
 * Alternative ultra-légère au SplashCursor (WebGL).
 * Utilise CSS transforms et requestAnimationFrame optimisé.
 * Aucune surcharge GPU — que du composite.
 */

import { useEffect, useRef } from 'react'

interface CursorGlowProps {
  color?: string
  size?: number
  blur?: number
}

export default function CursorGlow({
  color = 'rgba(124, 58, 237, 0.35)',
  size = 300,
  blur = 120,
}: CursorGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: -999, y: -999 })

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    let hasShown = false

    const onMouseMove = (e: MouseEvent) => {
      // Premier mouvement → afficher la lueur (gère le cas où mouseenter
      // n'a pas eu lieu car la souris était déjà dans la fenêtre au load)
      if (!hasShown) {
        hasShown = true
        glow.style.opacity = '1'
      }
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition)
      }
    }

    const updatePosition = () => {
      if (!glow) return
      glow.style.transform = `translate(${mouseRef.current.x - size / 2}px, ${mouseRef.current.y - size / 2}px)`
      rafRef.current = 0
    }

    const onMouseLeave = () => {
      glow.style.opacity = '0'
    }

    const onMouseEnter = () => {
      glow.style.opacity = '1'
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [size])

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: `blur(${blur}px)`,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        willChange: 'transform',
        transform: 'translate(-999px, -999px)',
      }}
    />
  )
}
