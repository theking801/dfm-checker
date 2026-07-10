/**
 * StarBorder — Composant React Bits adapté en TypeScript
 * Bordure étoilée animée avec gradient qui bouge
 */
import './StarBorder.css'

interface StarBorderProps {
  as?: React.ElementType
  className?: string
  color?: string
  speed?: string
  thickness?: number
  children: React.ReactNode
  onClick?: () => void
}

export default function StarBorder({
  as: Component = 'button',
  className = '',
  color = '#7c3aed',
  speed = '6s',
  thickness = 1,
  children,
  onClick,
  ...rest
}: StarBorderProps & Omit<React.ComponentPropsWithoutRef<'button'>, 'color' | 'as'>) {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as any).style,
      }}
      onClick={onClick}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="inner-content">{children}</div>
    </Component>
  )
}
