import { usePostHog } from '@posthog/react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
} from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Check,
  CheckCircle,
  Clock,
  Compass,
  ExternalLink,
  Lightbulb,
  MapPin,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'
import { formatDeadline, formatPostedAt } from '~/lib/formatDeadline'
import { useAgentSidebar } from '~/components/agent-sidebar/AgentSidebarProvider'

export const Route = createFileRoute('/matches/$id')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.matches.getMatchById, {
        matchId: params.id as Id<'matches'>,
      }),
    )
  },
  component: MatchDetailPage,
})

function MatchDetailPage() {
  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      <AuthLoading>
        <LoadingState />
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <MatchDetailContent />
      </Authenticated>
    </GradientBg>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  )
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    void navigate({ to: '/login' })
  }, [navigate])
  return <LoadingState />
}

const tierConfig = {
  great: {
    label: 'Great match',
    color: 'bg-emerald-100 text-emerald-800',
    icon: Sparkles,
  },
  good: {
    label: 'Good match',
    color: 'bg-blue-100 text-blue-800',
    icon: ThumbsUp,
  },
  exploring: {
    label: 'Worth exploring',
    color: 'bg-amber-100 text-amber-800',
    icon: Compass,
  },
}

function DeadlineBanner({
  deadline,
  postedAt,
  opportunityType,
}: {
  deadline?: number
  postedAt?: number
  opportunityType?: string
}) {
  if (!deadline && !postedAt) return null
  // Don't show posted date for events
  if (!deadline && opportunityType === 'event') return null

  if (!deadline && postedAt) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {formatPostedAt(postedAt)}
        </p>
      </div>
    )
  }

  if (!deadline) return null

  const now = new Date()
  const daysUntil = Math.ceil(
    (deadline - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  const absoluteDate = new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  let borderBg: string
  let text: string
  if (daysUntil < 0) {
    borderBg = 'border-slate-200 bg-slate-50'
    text = `Applications closed (${absoluteDate})`
  } else if (daysUntil <= 3) {
    borderBg = 'border-red-200 bg-red-50'
    text = `${formatDeadline(deadline)} — ${absoluteDate}`
  } else if (daysUntil <= 7) {
    borderBg = 'border-amber-200 bg-amber-50'
    text = `${formatDeadline(deadline)} — ${absoluteDate}`
  } else {
    borderBg = 'border-border bg-muted/50'
    text = `Deadline: ${absoluteDate}`
  }

  return (
    <div
      className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${borderBg}`}
    >
      <Clock className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

function MatchDetailContent() {
  const { id } = Route.useParams()
  const posthog = usePostHog()

  // Data is synchronously available - preloaded by route loader
  const { data: match } = useSuspenseQuery(
    convexQuery(api.matches.getMatchById, {
      matchId: id as Id<'matches'>,
    }),
  )

  const { openWithMessage } = useAgentSidebar()
  const markAsApplied = useMutation(api.matches.markAsApplied)
  const saveMatch = useMutation(api.matches.saveMatch)
  const isApplied = !!match?.appliedAt
  const isSaved = match?.status === 'saved'

  // Track match detail viewed (once match data loads)
  useEffect(() => {
    if (match) {
      posthog.capture('match_detail_viewed', {
        match_id: match._id,
        opportunity_title: match.opportunity.title,
        organization: match.opportunity.organization,
        tier: match.tier,
        is_applied: !!match.appliedAt,
        is_saved: match.status === 'saved',
      })
    }
    // We intentionally only fire this once when a match loads (not on every render)
    // match?._id is the stable dependency that tells us a new match was loaded
  }, [match?._id])

  const handleToggleApplied = useCallback(async () => {
    if (!match) return
    const wasApplied = !!match.appliedAt
    await markAsApplied({ matchId: match._id })
    if (!wasApplied) {
      toast.success('Nice work! Application tracked.', {
        description: match.opportunity.organization,
      })
      posthog.capture('match_applied', {
        match_id: match._id,
        opportunity_title: match.opportunity.title,
        organization: match.opportunity.organization,
        tier: match.tier,
      })
    }
  }, [match, markAsApplied, posthog])

  if (match === null) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Match Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This match may have been updated or removed.
          </p>
          <Button asChild>
            <Link to="/matches">Back to Matches</Link>
          </Button>
        </Card>
      </main>
    )
  }

  const tier = tierConfig[match.tier]
  const TierIcon = tier.icon

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/matches"
          className="inline-flex items-center text-sm text-slate-500 hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to matches
        </Link>

        {/* Opportunity header */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={tier.color}>
                  <TierIcon className="size-3 mr-1" />
                  {tier.label}
                </Badge>
                {match.isNew && <Badge variant="secondary">New</Badge>}
              </div>

              <h1
                style={{ viewTransitionName: 'match-title' }}
                className="text-xl sm:text-2xl font-display font-semibold text-foreground break-words"
              >
                {match.opportunity.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-1">
                {match.opportunity.organization}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="size-4 shrink-0" />
                  <span className="truncate">{match.opportunity.location}</span>
                  {match.opportunity.isRemote && (
                    <Badge variant="outline" className="ml-1 shrink-0">
                      Remote
                    </Badge>
                  )}
                </div>
                {match.opportunity.salaryRange &&
                  match.opportunity.salaryRange !== 'Not Found' && (
                    <div className="flex items-center gap-1">
                      <span>{match.opportunity.salaryRange}</span>
                    </div>
                  )}
                {match.opportunity.experienceLevel && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="shrink-0">
                      {match.opportunity.experienceLevel === 'entry'
                        ? 'Entry Level'
                        : match.opportunity.experienceLevel === 'mid'
                          ? 'Mid Level'
                          : match.opportunity.experienceLevel === 'senior'
                            ? 'Senior'
                            : match.opportunity.experienceLevel === 'lead'
                              ? 'Lead'
                              : match.opportunity.experienceLevel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              <Button asChild className="w-full sm:w-auto">
                <a
                  href={match.opportunity.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    posthog.capture('match_external_apply_clicked', {
                      match_id: match._id,
                      opportunity_title: match.opportunity.title,
                      organization: match.opportunity.organization,
                      tier: match.tier,
                      source_url: match.opportunity.sourceUrl,
                    })
                  }
                >
                  <ExternalLink className="size-4 mr-2" />
                  Apply
                </a>
              </Button>
              <Button
                variant={isApplied ? 'secondary' : 'outline'}
                className={
                  isApplied
                    ? 'w-full sm:w-auto bg-violet-100 text-violet-800 hover:bg-violet-200'
                    : 'w-full sm:w-auto'
                }
                onClick={handleToggleApplied}
              >
                <Check className="size-4 mr-2" />
                {isApplied ? 'Applied' : 'Mark as Applied'}
              </Button>
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                className={
                  isSaved
                    ? 'w-full sm:w-auto bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'w-full sm:w-auto'
                }
                onClick={() => saveMatch({ matchId: match._id })}
              >
                <Bookmark
                  className={`size-4 mr-2 ${isSaved ? 'fill-current' : ''}`}
                />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="detail-content-reveal">
          {/* AI discussion prompt */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground mr-auto">
              <Sparkles className="size-4 inline-block mr-1.5 -mt-0.5 text-primary" />
              Want to talk about this match?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openWithMessage(
                    `I'd like to discuss this match with ${match.opportunity.organization} for the "${match.opportunity.title}" role. What do you think about my fit?`,
                  )
                  posthog.capture('match_ai_discuss_clicked', {
                    match_id: match._id,
                    opportunity_title: match.opportunity.title,
                    organization: match.opportunity.organization,
                    tier: match.tier,
                  })
                }}
              >
                <MessageSquare className="size-4 mr-1.5" />
                Discuss match
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() =>
                  openWithMessage(
                    `This match with ${match.opportunity.organization} for the "${match.opportunity.title}" role doesn't seem right for me.`,
                  )
                }
              >
                <ThumbsDown className="size-4 mr-1.5" />
                Not for me
              </Button>
            </div>
          </div>

          {/* Deadline / Posted date banner */}
          <DeadlineBanner
            deadline={match.opportunity.deadline}
            postedAt={match.opportunity.postedAt}
            opportunityType={match.opportunity.opportunityType}
          />

          {/* Opportunity description */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              About This Opportunity
            </h2>

            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap">
                {match.opportunity.description}
              </p>
            </div>

            {match.opportunity.requirements &&
              match.opportunity.requirements.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium text-foreground mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {match.opportunity.requirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-slate-600"
                      >
                        <span className="text-slate-400">-</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Card>

          {/* Why this matches */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              Why This Fits You
            </h2>

            <ul className="space-y-3">
              {match.explanation.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    +
                  </span>
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>

            {match.explanation.gap && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  To strengthen your application
                </h3>
                <p className="text-slate-600 pl-6">{match.explanation.gap}</p>
              </div>
            )}
          </Card>

          {/* Recommendations */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="size-5 text-primary" />
              Recommendations
            </h2>

            <div className="space-y-4">
              {match.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    rec.type === 'specific' ? 'bg-primary/5' : 'bg-slate-50'
                  }`}
                >
                  <Badge
                    variant="outline"
                    className={
                      rec.priority === 'high'
                        ? 'border-primary text-primary'
                        : rec.priority === 'medium'
                          ? 'border-blue-500 text-blue-500'
                          : 'border-slate-400 text-slate-400'
                    }
                  >
                    {rec.type === 'specific' ? 'For this role' : rec.type}
                  </Badge>
                  <span className="text-slate-700">{rec.action}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
