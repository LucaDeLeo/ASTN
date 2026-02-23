import { useEffect, useState } from 'react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { cva } from 'class-variance-authority'
import type { ComponentType, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const triggerVariants = cva(
  'w-full flex items-center justify-between gap-2 p-3 rounded-lg transition-colors text-left',
  {
    variants: {
      variant: {
        default: 'border bg-card hover:bg-accent/50',
        emerald:
          'bg-emerald-50 border border-emerald-200 hover:bg-emerald-50/70',
        violet: 'bg-violet-50 border border-violet-200 hover:bg-violet-50/70',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const iconColorMap = {
  default: 'text-primary',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
} as const

const titleColorMap = {
  default: 'text-foreground',
  emerald: 'text-emerald-800',
  violet: 'text-violet-800',
} as const

const subtitleColorMap = {
  default: 'text-muted-foreground',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
} as const

const chevronColorMap = {
  default: 'text-muted-foreground',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
} as const

interface CollapsibleSectionProps extends VariantProps<typeof triggerVariants> {
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  title: string
  count?: number
  subtitle?: ReactNode
  defaultOpen?: boolean
  storageKey?: string
  itemCount?: number
  children: ReactNode
  className?: string
}

export function CollapsibleSection({
  icon: Icon,
  iconClassName,
  title,
  count,
  subtitle,
  variant = 'default',
  defaultOpen = false,
  storageKey,
  itemCount,
  children,
  className,
}: CollapsibleSectionProps) {
  const v = variant ?? 'default'

  const [open, setOpen] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(storageKey)
      if (stored !== null) return stored === 'true'
    }
    return defaultOpen
  })

  // Persist to sessionStorage
  useEffect(() => {
    if (storageKey) {
      sessionStorage.setItem(storageKey, String(open))
    }
  }, [open, storageKey])

  // Presence fade: animate in/out based on itemCount
  const [isVisible, setIsVisible] = useState(
    itemCount != null ? itemCount > 0 : true,
  )

  useEffect(() => {
    if (itemCount == null) return
    if (itemCount > 0 && !isVisible) {
      requestAnimationFrame(() => setIsVisible(true))
    } else if (itemCount === 0 && isVisible) {
      setIsVisible(false)
    }
  }, [itemCount, isVisible])

  // Don't render if presence-managed and never had items
  if (itemCount != null && itemCount === 0 && !isVisible) return null

  const hasPresence = itemCount != null
  const isPresent = !hasPresence || (isVisible && itemCount > 0)
  const isThemed = v !== 'default'

  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen} asChild>
      <section
        className={cn(
          hasPresence && 'overflow-hidden transition-all duration-300 ease-out',
          hasPresence && (isPresent ? 'opacity-100' : 'opacity-0'),
          className,
        )}
        style={
          hasPresence ? { maxHeight: isPresent ? '2000px' : '0px' } : undefined
        }
      >
        <CollapsiblePrimitive.CollapsibleTrigger
          className={cn(triggerVariants({ variant }))}
        >
          {isThemed ? (
            /* Themed: single-row layout */
            <>
              <div className="flex items-center gap-2">
                <Icon
                  className={cn('size-5', iconColorMap[v], iconClassName)}
                />
                <span className={cn('font-medium', titleColorMap[v])}>
                  {count != null ? `${count} ${title}` : title}
                </span>
                {subtitle && (
                  <span className={cn('text-sm', subtitleColorMap[v])}>
                    {subtitle}
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Default: stacked layout */
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon
                  className={cn(
                    'size-5 shrink-0',
                    iconColorMap[v],
                    iconClassName,
                  )}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>
            </>
          )}
          <ChevronDown
            suppressHydrationWarning
            className={cn(
              'size-5 shrink-0 transition-transform duration-200',
              chevronColorMap[v],
              open && 'rotate-180',
            )}
          />
        </CollapsiblePrimitive.CollapsibleTrigger>

        {/* CSS grid-rows animation instead of Radix CollapsibleContent (display:none) */}
        <div
          suppressHydrationWarning
          className={cn(
            'grid mt-4 will-change-[grid-template-rows]',
            'transition-[grid-template-rows] duration-200 ease-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      </section>
    </CollapsiblePrimitive.Root>
  )
}
