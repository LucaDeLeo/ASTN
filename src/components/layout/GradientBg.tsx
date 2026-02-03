import { cn } from '~/lib/utils'

interface GradientBgProps {
  variant?: 'radial' | 'linear' | 'subtle'
  children: React.ReactNode
  className?: string
}

// CSS class names for each variant - respond to .dark class via CSS
const variantToClass = {
  radial: 'gradient-bg-radial',
  linear: 'gradient-bg-linear',
  subtle: 'gradient-bg-subtle',
} as const

export function GradientBg({
  variant = 'radial',
  children,
  className,
}: GradientBgProps) {
  return (
    <div className={cn('min-h-screen', variantToClass[variant], className)}>
      {children}
    </div>
  )
}
