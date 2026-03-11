import { Sparkles } from 'lucide-react'

export function SpotlightBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ${className ?? ''}`}
    >
      <Sparkles className="h-3 w-3" />
      Spotlighted
    </span>
  )
}
