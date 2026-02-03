import * as React from 'react'
import { cn } from '~/lib/utils'

type EmptyVariant =
  | 'no-data' // Generic fallback
  | 'no-results' // Search/filter returned nothing
  | 'error' // Something went wrong
  | 'success' // All done/completed
  | 'no-matches' // No opportunity matches yet
  | 'no-opportunities' // No opportunities available
  | 'no-events' // No upcoming events
  | 'profile-incomplete' // Profile needs completion for matches

interface EmptyProps extends React.ComponentProps<'div'> {
  variant?: EmptyVariant
  title?: string
  description?: string
  action?: React.ReactNode
}

const defaultTitles: Record<EmptyVariant, string> = {
  'no-data': 'Nothing here yet',
  'no-results': 'No matches found',
  error: 'Something went wrong',
  success: 'All done!',
  'no-matches': 'No matches yet',
  'no-opportunities': 'No opportunities right now',
  'no-events': 'No upcoming events',
  'profile-incomplete': 'Complete your profile',
}

const defaultDescriptions: Record<EmptyVariant, string> = {
  'no-data': 'Great things take time. Check back soon!',
  'no-results': 'Try adjusting your filters or search terms.',
  error: "We're looking into it. Please try again.",
  success: "You're all caught up.",
  'no-matches':
    "Complete your profile and we'll find opportunities that fit your skills and goals.",
  'no-opportunities':
    'New AI Safety opportunities are added regularly. Check back soon!',
  'no-events':
    'No events are scheduled yet. Follow organizations to get notified.',
  'profile-incomplete':
    'Add your experience and goals to unlock personalized job matches.',
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
          'flex flex-col items-center justify-center text-center',
          className,
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
        'flex flex-col items-center justify-center py-12 text-center',
        className,
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
    case 'no-matches':
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
          {/* Target with dotted line - waiting for match */}
          <circle cx="60" cy="60" r="35" />
          <circle cx="60" cy="60" r="20" />
          <circle cx="60" cy="60" r="5" fill="currentColor" />
          <path d="M95 95 L80 80" strokeWidth="3" strokeDasharray="4 4" />
        </svg>
      )
    case 'no-opportunities':
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
          {/* Briefcase with clock - opportunities coming */}
          <rect x="25" y="45" width="70" height="50" rx="4" />
          <path d="M45 45 L45 35 Q45 30 50 30 L70 30 Q75 30 75 35 L75 45" />
          <circle cx="85" cy="35" r="15" fill="none" />
          <path d="M85 28 L85 35 L90 38" />
        </svg>
      )
    case 'no-events':
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
          {/* Calendar with empty day */}
          <rect x="20" y="30" width="80" height="70" rx="4" />
          <path d="M20 50 L100 50" />
          <path d="M40 20 L40 40" strokeWidth="3" />
          <path d="M80 20 L80 40" strokeWidth="3" />
          <circle cx="60" cy="72" r="12" strokeDasharray="4 4" />
        </svg>
      )
    case 'profile-incomplete':
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
          {/* User with progress indicator */}
          <circle cx="60" cy="40" r="20" />
          <path d="M30 95 Q30 70 60 70 Q90 70 90 95" />
          <path d="M20 105 L100 105" strokeWidth="4" />
          <path
            d="M20 105 L60 105"
            strokeWidth="4"
            stroke="currentColor"
            opacity="0.4"
          />
        </svg>
      )
  }
}

// Compound components for backward compatibility
function EmptyIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('mb-4 text-coral-300', className)} {...props}>
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

function EmptyTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-foreground font-display mb-1',
        className,
      )}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground max-w-sm', className)}
      {...props}
    />
  )
}

Empty.Icon = EmptyIcon
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription

export { Empty }
export type { EmptyVariant }
