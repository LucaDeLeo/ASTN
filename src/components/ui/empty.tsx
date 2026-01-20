import * as React from "react"
import { cn } from "~/lib/utils"

type EmptyVariant = 'no-data' | 'no-results' | 'error' | 'success'

interface EmptyProps extends React.ComponentProps<"div"> {
  variant?: EmptyVariant
  title?: string
  description?: string
  action?: React.ReactNode
}

const defaultTitles: Record<EmptyVariant, string> = {
  'no-data': "Nothing here yet",
  'no-results': "No matches found",
  'error': "Something went wrong",
  'success': "All done!"
}

const defaultDescriptions: Record<EmptyVariant, string> = {
  'no-data': "Great things take time. Check back soon!",
  'no-results': "Try adjusting your filters or search terms.",
  'error': "We're looking into it. Please try again.",
  'success': "You're all caught up."
}

function Empty({
  variant = 'no-data',
  title,
  description,
  action,
  className,
  children,
  ...props
}: EmptyProps) {
  // If children provided, use compound component pattern (backward compat)
  if (children) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  // New variant-based API
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      {...props}
    >
      <div className="mb-6 text-coral-400">
        <EmptyIllustration variant={variant} />
      </div>
      <h3 className="font-display text-lg font-medium text-foreground">
        {title || defaultTitles[variant]}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description || defaultDescriptions[variant]}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// SVG illustrations using currentColor for theme adaptation
function EmptyIllustration({ variant }: { variant: EmptyVariant }) {
  switch (variant) {
    case 'no-data':
      return (
        <svg
          viewBox="0 0 120 120"
          className="h-24 w-24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Inbox/folder illustration */}
          <rect x="20" y="45" width="80" height="55" rx="4" />
          <path d="M20 60 L60 80 L100 60" />
          <circle cx="60" cy="30" r="10" />
          <path d="M56 30 L64 30" />
        </svg>
      )
    case 'no-results':
      return (
        <svg
          viewBox="0 0 120 120"
          className="h-24 w-24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Magnifying glass with question mark */}
          <circle cx="52" cy="52" r="28" />
          <path d="M72 72 L95 95" strokeWidth="4" />
          <path d="M45 42 Q45 35 52 35 Q59 35 59 42 Q59 48 52 50 L52 55" />
          <circle cx="52" cy="62" r="2" fill="currentColor" />
        </svg>
      )
    case 'error':
      return (
        <svg
          viewBox="0 0 120 120"
          className="h-24 w-24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Warning triangle */}
          <path d="M60 20 L100 95 L20 95 Z" />
          <path d="M60 45 L60 65" strokeWidth="3" />
          <circle cx="60" cy="78" r="3" fill="currentColor" />
        </svg>
      )
    case 'success':
      return (
        <svg
          viewBox="0 0 120 120"
          className="h-24 w-24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Checkmark in circle */}
          <circle cx="60" cy="60" r="40" />
          <path d="M40 60 L55 75 L80 45" strokeWidth="3" />
        </svg>
      )
  }
}

// Compound components for backward compatibility
function EmptyIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mb-4 text-coral-300", className)} {...props}>
      <svg
        viewBox="0 0 120 120"
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="20" y="45" width="80" height="55" rx="4" />
        <path d="M20 60 L60 80 L100 60" />
        <circle cx="60" cy="30" r="10" />
        <path d="M56 30 L64 30" />
      </svg>
    </div>
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold text-foreground font-display mb-1", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground max-w-sm", className)} {...props} />
  )
}

Empty.Icon = EmptyIcon
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription

export { Empty }
export type { EmptyVariant }
