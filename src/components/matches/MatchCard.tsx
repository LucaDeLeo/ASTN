import { Link } from '@tanstack/react-router'
import { Bookmark, BookmarkX, Check, Clock, X } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { formatLocation } from '~/lib/formatLocation'
import { formatDeadline, getDeadlineUrgency } from '~/lib/formatDeadline'
import { ROLE_TYPE_COLORS } from '~/lib/roleTypes'
import { computeGlobalFitScore, getFitScoreColor } from '~/lib/matchScoring'

const ACTIVE_MATCH_KEY = 'view-transition-match-id'

interface MatchCardProps {
  match: {
    _id: string
    tier: 'great' | 'good' | 'exploring'
    score: number
    isNew: boolean
    appliedAt?: number
    explanation: {
      strengths: Array<string>
    }
    opportunity: {
      _id: string
      title: string
      organization: string
      location: string
      isRemote: boolean
      roleType: string
      experienceLevel?: string
      salaryRange?: string
      deadline?: number
    }
  }
  /** Whether this match is saved/bookmarked */
  isSaved?: boolean
  /** Callback to unsave this match */
  onUnsave?: () => void
  /** Callback to save/bookmark this match (desktop hover action) */
  onSave?: () => void
  /** Callback to dismiss this match (desktop hover action) */
  onDismiss?: () => void
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
}

export function MatchCard({
  match,
  isSaved,
  onUnsave,
  onSave,
  onDismiss,
}: MatchCardProps) {
  const roleColorClass =
    ROLE_TYPE_COLORS[match.opportunity.roleType] || ROLE_TYPE_COLORS.other
  const fitScore = computeGlobalFitScore(match.tier, match.score)

  // Check if this card should have view-transition-name (for back navigation)
  // Must be synchronous so the name is set during first render for view transition capture
  const isActiveTransition =
    typeof window !== 'undefined' &&
    sessionStorage.getItem(ACTIVE_MATCH_KEY) === match._id

  return (
    <Link
      to="/matches/$id"
      params={{ id: match._id }}
      viewTransition
      className="block"
      onClick={(e) => {
        // Clear existing view-transition-names to prevent duplicates, then set on clicked card
        document
          .querySelectorAll<HTMLElement>("[style*='view-transition-name']")
          .forEach((el) => {
            el.style.viewTransitionName = ''
          })

        sessionStorage.setItem(ACTIVE_MATCH_KEY, match._id)

        const card = e.currentTarget
        const h3 = card.querySelector('h3')
        const strength = card.querySelector<HTMLElement>(
          "[data-morph='strength']",
        )
        if (h3) h3.style.viewTransitionName = 'match-title'
        if (strength) strength.style.viewTransitionName = 'match-strength'
      }}
    >
      <Card className="group/card relative p-4 transition-shadow hover:shadow-md cursor-pointer">
        {/* Desktop hover actions: save & dismiss */}
        {(onSave || onDismiss) && (
          <div className="absolute top-2 right-2 hidden items-center gap-1 group-hover/card:flex">
            {onSave && !isSaved && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSave()
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                title="Save match"
              >
                <Bookmark className="size-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDismiss()
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-700 transition-colors"
                title="Dismiss match"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Row 1: Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            className={`${roleColorClass} capitalize flex-shrink-0 rounded-sm border`}
          >
            {match.opportunity.roleType}
          </Badge>
          {match.opportunity.isRemote && (
            <Badge variant="outline" className="text-xs">
              Remote
            </Badge>
          )}
          {isSaved && onUnsave && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onUnsave()
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800 transition-colors group"
            >
              <Bookmark className="size-3 fill-current group-hover:hidden" />
              <BookmarkX className="size-3 hidden group-hover:block" />
              <span className="group-hover:hidden">Saved</span>
              <span className="hidden group-hover:inline">Unsave</span>
            </button>
          )}
          {isSaved && !onUnsave && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800"
            >
              <Bookmark className="mr-1 size-3 fill-current" />
              Saved
            </Badge>
          )}
          {match.isNew && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800"
            >
              New
            </Badge>
          )}
          {match.appliedAt && (
            <Badge
              variant="secondary"
              className="bg-violet-100 text-violet-800"
            >
              <Check className="mr-1 size-3" />
              Applied
            </Badge>
          )}
          <span
            className={`ml-auto text-xs font-medium tabular-nums transition-opacity group-hover/card:opacity-0 ${getFitScoreColor(fitScore)}`}
          >
            {fitScore}% fit
          </span>
        </div>

        {/* Row 2: Title */}
        <div className="group">
          <h3
            suppressHydrationWarning
            style={
              isActiveTransition
                ? { viewTransitionName: 'match-title' }
                : undefined
            }
            className="font-semibold text-foreground group-hover:text-primary"
          >
            {match.opportunity.title}
          </h3>

          {/* Row 3: Org + Location */}
          <p className="text-sm text-muted-foreground">
            {match.opportunity.organization} ·{' '}
            {formatLocation(match.opportunity.location)}
          </p>
        </div>

        {/* Row 4: Deadline (promoted) */}
        {match.opportunity.deadline && (
          <div
            className={`flex items-center gap-1.5 mt-1.5 text-sm font-medium ${getDeadlineUrgency(match.opportunity.deadline)}`}
          >
            <Clock className="size-3.5" />
            {formatDeadline(match.opportunity.deadline)}
          </div>
        )}

        {/* Row 5: Salary + Experience */}
        {(match.opportunity.salaryRange ||
          match.opportunity.experienceLevel) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-sm text-muted-foreground">
            {match.opportunity.salaryRange &&
              match.opportunity.salaryRange !== 'Not Found' && (
                <span>{match.opportunity.salaryRange}</span>
              )}
            {match.opportunity.salaryRange &&
              match.opportunity.salaryRange !== 'Not Found' &&
              match.opportunity.experienceLevel &&
              EXPERIENCE_LEVEL_LABELS[match.opportunity.experienceLevel] && (
                <span>·</span>
              )}
            {match.opportunity.experienceLevel &&
              EXPERIENCE_LEVEL_LABELS[match.opportunity.experienceLevel] && (
                <span>
                  {EXPERIENCE_LEVEL_LABELS[match.opportunity.experienceLevel]}
                </span>
              )}
          </div>
        )}

        {/* Row 6: One key strength (truncated to 1 line) */}
        {match.explanation.strengths[0] && (
          <p
            suppressHydrationWarning
            data-morph="strength"
            style={
              isActiveTransition
                ? { viewTransitionName: 'match-strength' }
                : undefined
            }
            className="mt-2 text-sm text-muted-foreground line-clamp-1"
          >
            <span className="text-emerald-500">+</span>{' '}
            {match.explanation.strengths[0]}
          </p>
        )}
      </Card>
    </Link>
  )
}
