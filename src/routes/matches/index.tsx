import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useAction,
  useQuery,
} from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { AlertTriangle, RefreshCw, Sparkles, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { OnboardingGuard } from '~/components/auth/onboarding-guard'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { useIsMobile } from '~/hooks/use-media-query'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Empty } from '~/components/ui/empty'
import { Spinner } from '~/components/ui/spinner'
import { PullToRefresh } from '~/components/ui/pull-to-refresh'
import { MatchTierSection } from '~/components/matches/MatchTierSection'
import { SavedMatchesSection } from '~/components/matches/SavedMatchesSection'
import { CareerActionsSection } from '~/components/actions/CareerActionsSection'
import { GrowthAreas } from '~/components/matches/GrowthAreas'

// Aggregate recommendations into growth areas
function aggregateGrowthAreas(
  recommendations: Array<{ type: string; action: string }> | undefined,
) {
  if (!recommendations || !Array.isArray(recommendations)) {
    return []
  }

  const byType: Record<string, Set<string>> = {
    skill: new Set(),
    experience: new Set(),
  }

  for (const rec of recommendations) {
    // Skip "specific" type as those are per-match, not general growth areas
    if (rec.type === 'skill' || rec.type === 'experience') {
      byType[rec.type].add(rec.action)
    }
  }

  const areas: Array<{ theme: string; items: Array<string> }> = []

  if (byType.skill.size > 0) {
    areas.push({
      theme: 'Skills to build',
      items: [...byType.skill].slice(0, 5),
    })
  }
  if (byType.experience.size > 0) {
    areas.push({
      theme: 'Experience to gain',
      items: [...byType.experience].slice(0, 5),
    })
  }

  return areas
}

export const Route = createFileRoute('/matches/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.matches.getMyMatches, {}),
    )
  },
  component: MatchesPage,
})

function MatchesPage() {
  const isMobile = useIsMobile()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const user = profile ? { name: profile.name || 'User' } : null

  const pageContent = (
    <>
      <AuthLoading>
        <LoadingState />
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <OnboardingGuard>
          <MatchesContent />
        </OnboardingGuard>
      </Authenticated>
    </>
  )

  if (isMobile) {
    return (
      <MobileShell user={user}>
        <GradientBg variant="subtle">{pageContent}</GradientBg>
      </MobileShell>
    )
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      {pageContent}
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
    navigate({ to: '/login' })
  }, [navigate])
  return <LoadingState />
}

function MatchesContent() {
  // Data is synchronously available - preloaded by route loader
  const { data: matchesData } = useSuspenseQuery(
    convexQuery(api.matches.getMyMatches, {}),
  )
  const triggerComputation = useAction(api.matches.triggerMatchComputation)
  const markViewed = useAction(api.matches.markMatchesViewed)
  const [isComputing, setIsComputing] = useState(false)
  const [computeError, setComputeError] = useState<string | null>(null)
  // Track the computedAt value when refresh was triggered to detect when fresh results arrive
  const [waitingForComputedAt, setWaitingForComputedAt] = useState<
    number | null
  >(null)

  // Mark matches as viewed on mount
  useEffect(() => {
    if (
      matchesData &&
      !matchesData.needsProfile &&
      !matchesData.needsComputation
    ) {
      markViewed().catch(console.error)
    }
  }, [matchesData?.needsComputation, matchesData?.needsProfile, markViewed])

  const handleCompute = async () => {
    setIsComputing(true)
    setComputeError(null)
    // Remember current computedAt - we'll clear loading when it changes
    setWaitingForComputedAt(matchesData?.computedAt ?? -1)
    try {
      await triggerComputation()
      // Don't clear isComputing here - wait for matches to actually update
    } catch (err) {
      setComputeError(
        err instanceof Error ? err.message : 'Failed to compute matches',
      )
      setIsComputing(false)
      setWaitingForComputedAt(null)
    }
  }

  // Clear computing state when fresh matches arrive (computedAt changes)
  useEffect(() => {
    if (
      waitingForComputedAt !== null &&
      matchesData &&
      !matchesData.needsComputation &&
      matchesData.computedAt != null &&
      matchesData.computedAt !== waitingForComputedAt
    ) {
      setIsComputing(false)
      setWaitingForComputedAt(null)
    }
  }, [
    matchesData?.computedAt,
    waitingForComputedAt,
    matchesData?.needsComputation,
  ])

  // Safety timeout - if matches don't update within 90s, stop loading
  useEffect(() => {
    if (waitingForComputedAt === null) return
    const timer = setTimeout(() => {
      setIsComputing(false)
      setWaitingForComputedAt(null)
    }, 90_000)
    return () => clearTimeout(timer)
  }, [waitingForComputedAt])

  // Auto-trigger computation if needed (ref prevents runaway re-triggers)
  const hasAutoTriggered = useRef(false)
  useEffect(() => {
    if (
      matchesData?.needsComputation &&
      !isComputing &&
      !hasAutoTriggered.current
    ) {
      hasAutoTriggered.current = true
      handleCompute()
    }
    if (!matchesData?.needsComputation) {
      hasAutoTriggered.current = false
    }
  }, [matchesData?.needsComputation, isComputing])

  // Aggregate growth areas from ALL matches (including dismissed) - React hooks rule
  const growthAreas = useMemo(() => {
    return aggregateGrowthAreas(matchesData?.allRecommendations)
  }, [matchesData?.allRecommendations])

  if (matchesData === null) {
    return <LoadingState />
  }

  // No profile yet
  if (matchesData.needsProfile) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Create Your Profile First
          </h1>
          <p className="text-muted-foreground mb-6">
            Complete your profile to get matched with AI safety opportunities
            tailored to your background and goals.
          </p>
          <Button asChild>
            <Link to="/profile/edit">Create Profile</Link>
          </Button>
        </Card>
      </main>
    )
  }

  // Computing matches
  if (isComputing) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="size-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Finding Your Matches
          </h1>
          <p className="text-muted-foreground mb-4">
            Our AI is analyzing opportunities against your profile...
          </p>
          <Spinner />
        </Card>
      </main>
    )
  }

  // Compute error
  if (computeError) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-red-500 mb-6">{computeError}</p>
          <Button onClick={handleCompute}>Try Again</Button>
        </Card>
      </main>
    )
  }

  const { matches, savedMatches, computedAt, matchesStaleAt } = matchesData
  const hasMatches =
    matches.great.length + matches.good.length + matches.exploring.length > 0
  const hasSavedMatches = savedMatches.length > 0

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              Your Matches
            </h1>
            <p className="text-muted-foreground mt-1">
              Opportunities matched to your profile and goals
            </p>
            {computedAt !== null && computedAt !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(computedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleCompute}
            disabled={isComputing}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="size-4 mr-2" />
            Refresh Matches
          </Button>
        </div>

        {/* Staleness banner */}
        {matchesStaleAt && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
              Your profile has changed since these matches were computed.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompute}
              disabled={isComputing}
              className="shrink-0"
            >
              <RefreshCw className="size-3 mr-1.5" />
              Refresh
            </Button>
          </div>
        )}

        <PullToRefresh
          onRefresh={handleCompute}
          enabled={!isComputing}
          className="min-h-[200px]"
        >
          {/* No matches state (only show if no active AND no saved matches) */}
          {!hasMatches && !hasSavedMatches && (
            <Card className="p-8">
              <Empty
                variant="no-matches"
                description="We couldn't find strong matches right now. Try completing more of your profile or check back when new opportunities are posted."
                action={
                  <div className="flex gap-3 justify-center">
                    <Button asChild variant="outline">
                      <Link to="/profile/edit">Improve Profile</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/opportunities">Browse All Opportunities</Link>
                    </Button>
                  </div>
                }
              />
            </Card>
          )}

          {/* Saved matches section (animates in/out, collapsed by default) */}
          <SavedMatchesSection matches={savedMatches} />

          {/* Match sections by tier */}
          {hasMatches && (
            <>
              <MatchTierSection tier="great" matches={matches.great} />
              <MatchTierSection tier="good" matches={matches.good} />
              <MatchTierSection tier="exploring" matches={matches.exploring} />
            </>
          )}

          {/* Career actions - "Your Next Moves" between tiers and growth areas */}
          <CareerActionsSection />

          {/* Growth areas - keep visible even when all matches dismissed */}
          {growthAreas.length > 0 && (
            <div className="mt-8">
              <GrowthAreas areas={growthAreas} />
            </div>
          )}
        </PullToRefresh>
      </div>
    </main>
  )
}
