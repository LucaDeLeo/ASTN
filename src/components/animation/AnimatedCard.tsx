import { cn } from "~/lib/utils"

interface AnimatedCardProps {
  index: number
  children: React.ReactNode
  className?: string
}

/**
 * AnimatedCard wraps content with entrance animation and stagger support.
 * Uses tw-animate-css utilities for fade + slide animation.
 *
 * @param index - Position in list for stagger delay calculation (capped at 9)
 * @param children - Content to animate
 * @param className - Additional classes to merge
 */
export function AnimatedCard({ index, children, className }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
      style={{
        animationDelay: `${Math.min(index, 9) * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {children}
    </div>
  )
}
