import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Banknote, CalendarDays } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { formatLocation } from '~/lib/formatLocation'
import { formatDeadline, getDeadlineUrgency } from '~/lib/formatDeadline'
import { EVENT_TYPE_COLORS, ROLE_TYPE_COLORS } from '~/lib/roleTypes'

const ACTIVE_OPPORTUNITY_KEY = 'view-transition-opportunity-id'

type Opportunity = {
  _id: Id<'opportunities'>
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  salaryRange?: string
  deadline?: number
  opportunityType?: string
  eventType?: string
  startDate?: number
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
}

export function OpportunityCard({
  opportunity,
  index = 0,
}: {
  opportunity: Opportunity
  index?: number
}) {
  const isEvent = opportunity.opportunityType === 'event'
  const roleColorClass =
    ROLE_TYPE_COLORS[opportunity.roleType] || ROLE_TYPE_COLORS.other
  const eventColorClass = opportunity.eventType
    ? EVENT_TYPE_COLORS[opportunity.eventType] || EVENT_TYPE_COLORS.conference
    : undefined

  // Check if this card should have view-transition-name (for back navigation)
  const isActiveTransitionRef = useRef(
    typeof window !== 'undefined' &&
      sessionStorage.getItem(ACTIVE_OPPORTUNITY_KEY) === opportunity._id,
  )
  const isActiveTransition = isActiveTransitionRef.current

  // Clear sessionStorage after mount — the viewTransitionName was already captured
  useEffect(() => {
    if (isActiveTransitionRef.current) {
      sessionStorage.removeItem(ACTIVE_OPPORTUNITY_KEY)
      isActiveTransitionRef.current = false
    }
  }, [])

  return (
    <Link
      to="/opportunities/$id"
      params={{ id: opportunity._id }}
      viewTransition
      preload="render"
      onClick={(e) => {
        // Clear existing view-transition-names to prevent duplicates, then set on clicked card
        document
          .querySelectorAll<HTMLElement>("[style*='view-transition-name']")
          .forEach((el) => {
            el.style.viewTransitionName = ''
          })

        sessionStorage.setItem(ACTIVE_OPPORTUNITY_KEY, opportunity._id)

        const h3 = e.currentTarget.querySelector('h3') as HTMLElement | null
        if (h3) h3.style.viewTransitionName = 'opportunity-title'
      }}
    >
      <Card
        className="
          hover:shadow-lg transition-all duration-200 cursor-pointer
          border-slate-200 dark:border-border hover:border-primary/30
          hover:-translate-y-0.5 active:translate-y-0
          rounded-none sm:rounded-sm
        "
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <CardContent className="p-5">
          {/* Row 1: Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isEvent && eventColorClass ? (
              <Badge
                className={`${eventColorClass} capitalize flex-shrink-0 rounded-sm border`}
              >
                {opportunity.eventType}
              </Badge>
            ) : (
              <Badge
                className={`${roleColorClass} capitalize flex-shrink-0 rounded-sm border`}
              >
                {opportunity.roleType}
              </Badge>
            )}
            {isEvent && (
              <Badge
                variant="outline"
                className="text-xs rounded-sm border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400"
              >
                Event
              </Badge>
            )}
            {opportunity.isRemote && (
              <Badge variant="outline" className="text-xs rounded-sm">
                Remote
              </Badge>
            )}
            {opportunity.experienceLevel &&
              EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel] && (
                <Badge variant="outline" className="text-xs rounded-sm">
                  {EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel]}
                </Badge>
              )}
          </div>

          {/* Row 2: Title */}
          <h3
            suppressHydrationWarning
            style={
              isActiveTransition
                ? { viewTransitionName: 'opportunity-title' }
                : undefined
            }
            className="font-semibold text-foreground leading-tight"
          >
            {opportunity.title}
          </h3>

          {/* Row 3: Org + Location */}
          <p className="text-sm text-muted-foreground mt-0.5">
            {opportunity.organization} · {formatLocation(opportunity.location)}
          </p>

          {/* Row 4: Dates / Salary + Deadline */}
          {(opportunity.salaryRange ||
            opportunity.deadline ||
            (isEvent && opportunity.startDate)) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-sm">
              {isEvent && opportunity.startDate && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(opportunity.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}

              {opportunity.salaryRange &&
                opportunity.salaryRange !== 'Not Found' && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Banknote className="w-3.5 h-3.5" />
                    {opportunity.salaryRange}
                  </span>
                )}

              {opportunity.deadline && (
                <span className={getDeadlineUrgency(opportunity.deadline)}>
                  {formatDeadline(opportunity.deadline)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
