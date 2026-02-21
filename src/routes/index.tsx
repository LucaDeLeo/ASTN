import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  Building2,
  Calendar,
  FileText,
  MapPin,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { ActionCard } from '~/components/actions/ActionCard'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { OnboardingGuard } from '~/components/auth/onboarding-guard'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { EventCard } from '~/components/events/EventCard'
import { MatchCard } from '~/components/matches/MatchCard'
import { OrgCarousel } from '~/components/org/OrgCarousel'
import { useIsMobile } from '~/hooks/use-media-query'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { clearPendingInvite, getPendingInvite } from '~/lib/pendingInvite'
import {
  clearPendingGuestApplication,
  getPendingGuestApplication,
} from '~/lib/pendingGuestApplication'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const isMobile = useIsMobile()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const user = profile ? { name: profile.name || 'User' } : null

  const loadingContent = (
    <main className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    </main>
  )

  const pageContent = (
    <>
      <AuthLoading>{loadingContent}</AuthLoading>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
      <Authenticated>
        <PostAuthSetup />
        <OnboardingGuard>
          <Dashboard />
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

const clerkAppearance = {
  variables: {
    colorPrimary: 'oklch(0.7 0.16 30)',
    borderRadius: '0.75rem',
    fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  },
  layout: {
    socialButtonsVariant: 'blockButton' as const,
    socialButtonsPlacement: 'top' as const,
    logoPlacement: 'none' as const,
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { boxShadow: 'none' },
    card: {
      boxShadow: 'none',
      backgroundColor: 'transparent',
      border: 'none',
    },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    footer: { display: 'none' },
  },
}

function AuthPanel() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [fading, setFading] = useState(false)
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const switchMode = useCallback(
    (newMode: 'sign-in' | 'sign-up') => {
      if (newMode === mode) return
      const container = containerRef.current
      // Lock container to current height so transition has a start value
      if (container) {
        container.style.height = `${container.offsetHeight}px`
      }
      // Enable transitions from now on
      setAnimated(true)
      setFading(true)
      setTimeout(() => {
        setMode(newMode)
        setFading(false)
        // Double-rAF ensures the browser has painted the new content
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container && contentRef.current) {
              container.style.height = `${contentRef.current.scrollHeight}px`
            }
          })
        })
      }, 150)
    },
    [mode],
  )

  // Sync container height as Clerk renders asynchronously
  useEffect(() => {
    const el = contentRef.current
    const container = containerRef.current
    if (!el || !container) return

    const observer = new ResizeObserver(() => {
      // During initial load, just set height instantly (no transition)
      // After a toggle, animated=true and CSS handles the transition
      container.style.height = `${el.scrollHeight}px`
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode])

  return (
    <div className="w-full max-w-sm shrink-0">
      <div
        ref={containerRef}
        className={`overflow-hidden ${animated ? 'transition-[height] duration-300 ease-in-out' : ''}`}
      >
        <div
          ref={contentRef}
          className={
            animated ? 'transition-opacity duration-150 ease-in-out' : ''
          }
          style={{ opacity: fading ? 0 : 1 }}
        >
          {mode === 'sign-in' ? (
            <SignIn routing="hash" appearance={clerkAppearance} />
          ) : (
            <SignUp routing="hash" appearance={clerkAppearance} />
          )}
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        {mode === 'sign-in' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('sign-up')}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('sign-in')}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}

function PostAuthSetup() {
  const navigate = useNavigate()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const claimGuestApplications = useMutation(
    api.opportunityApplications.claimGuestApplications,
  )

  useEffect(() => {
    if (profile === undefined) return

    claimGuestApplications().catch(() => {})

    const pendingGuest = getPendingGuestApplication()
    if (pendingGuest) {
      clearPendingGuestApplication()
    }

    const pendingInvite = getPendingInvite()
    if (pendingInvite) {
      clearPendingInvite()
      navigate({
        to: '/org/$slug/join',
        params: { slug: pendingInvite.slug },
        search: { token: pendingInvite.token || '' },
      })
    }
  }, [profile, navigate, claimGuestApplications])

  return null
}

function LandingPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Profile Enrichment',
      description:
        'Conversational AI that understands your background and goals',
    },
    {
      icon: FileText,
      title: 'Resume Upload',
      description: 'Upload your CV and auto-populate your profile',
    },
    {
      icon: Target,
      title: 'Smart Matching',
      description:
        'Get matched to relevant roles from across the AI safety ecosystem',
    },
    {
      icon: Sparkles,
      title: 'Match Explanations',
      description: 'See your strengths, gaps, and probability for each role',
    },
    {
      icon: Zap,
      title: 'Career Actions',
      description: 'Personalized next steps tailored to your goals',
    },
    {
      icon: Building2,
      title: 'Organizations & Events',
      description:
        'Discover AI safety orgs, join events, connect with community',
    },
  ]

  return (
    <main className="container mx-auto px-4 py-12 md:py-16">
      {/* Hero — side-by-side: text left, sign-in right */}
      <section className="max-w-5xl mx-auto mb-16 md:mb-20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Left: Hero text */}
          <div className="flex-1 text-center md:text-left">
            <Badge variant="secondary" className="mb-4">
              Prototype
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-semibold text-foreground mb-4 tracking-tight">
              AI Safety Talent Network
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Your career command center for AI safety. Get matched to
              opportunities and receive AI-powered career guidance — all in one
              place.
            </p>
          </div>
          {/* Right: Auth */}
          <AuthPanel />
        </div>
      </section>

      {/* What is ASTN */}
      <section
        id="about"
        className="max-w-3xl mx-auto text-center mb-16 md:mb-20"
      >
        <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
          What is ASTN?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          ASTN is a matching platform for AI safety talent. Build your profile
          through AI-powered conversations, get matched to open roles, and
          receive personalized career actions to close your skill gaps. Started
          as a pilot for BAISH (Buenos Aires AI Safety Hub), ASTN is designed to
          connect the right people with the right opportunities in AI safety.
        </p>
      </section>

      {/* What's Built */}
      <section className="max-w-4xl mx-auto mb-16 md:mb-20">
        <h2 className="text-2xl font-display font-semibold text-foreground text-center mb-8">
          What's Built
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.title} index={index}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </AnimatedCard>
          ))}
        </div>
      </section>
    </main>
  )
}

function Dashboard() {
  const suggestedOrgs = useQuery(api.orgs.discovery.getSuggestedOrgs)
  const locationPrivacy = useQuery(api.profiles.getLocationPrivacy)
  const dashboardEvents = useQuery(api.events.queries.getDashboardEvents)
  const matchesData = useQuery(api.matches.getMyMatches)
  const actionsData = useQuery(api.careerActions.queries.getMyActions)

  // Action mutations for dashboard cards
  const saveActionMut = useMutation(api.careerActions.mutations.saveAction)
  const dismissActionMut = useMutation(
    api.careerActions.mutations.dismissAction,
  )
  const startActionMut = useMutation(api.careerActions.mutations.startAction)

  // Determine if user has location discovery enabled
  const locationEnabled = locationPrivacy?.locationDiscoverable ?? false

  // Extract saved + top matches for dashboard preview (great first, then good)
  const savedMatches = matchesData?.savedMatches ?? []
  const topMatches = [
    ...(matchesData?.matches.great ?? []),
    ...(matchesData?.matches.good ?? []),
  ].slice(0, 3)

  // Top 2 active actions for dashboard preview
  const topActions = actionsData?.active.slice(0, 2) ?? []

  // Group user's org events by org for display
  const eventsByOrg = dashboardEvents?.userOrgEvents.reduce(
    (acc, event) => {
      const orgName = event.org.name
      if (!acc[orgName]) {
        acc[orgName] = []
      }
      acc[orgName].push(event)
      return acc
    },
    {} as Record<string, typeof dashboardEvents.userOrgEvents | undefined>,
  )

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Saved & Top Matches */}
      {(savedMatches.length > 0 || topMatches.length > 0) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">
              Your Top Matches
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/matches">View all</Link>
            </Button>
          </div>

          {savedMatches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="size-4 text-emerald-600 fill-emerald-600" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Saved ({savedMatches.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedMatches.slice(0, 3).map((match, index) => (
                  <AnimatedCard key={match._id} index={index}>
                    <MatchCard match={match} isSaved />
                  </AnimatedCard>
                ))}
              </div>
            </div>
          )}

          {topMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-emerald-600" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Best Matches
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topMatches.map((match, index) => (
                  <AnimatedCard key={match._id} index={index}>
                    <MatchCard match={match} />
                  </AnimatedCard>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Your Next Moves - top 2 career actions */}
      {topActions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">
              Your Next Moves
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/matches">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topActions.map((action, index) => (
              <AnimatedCard key={action._id} index={index}>
                <ActionCard
                  action={action}
                  onSave={() => saveActionMut({ actionId: action._id })}
                  onDismiss={() => dismissActionMut({ actionId: action._id })}
                  onStart={() => startActionMut({ actionId: action._id })}
                />
              </AnimatedCard>
            ))}
          </div>
        </section>
      )}

      {/* Org Suggestions Section */}
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Suggested Organizations
        </h2>
        <p className="text-muted-foreground mb-4">
          Organizations near you or with global presence
        </p>

        {suggestedOrgs === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : suggestedOrgs.length > 0 ? (
          <OrgCarousel orgs={suggestedOrgs} />
        ) : (
          <EmptyStatePrompt locationEnabled={locationEnabled} />
        )}
      </section>

      {/* Upcoming Events Section */}
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Upcoming Events
        </h2>
        <p className="text-muted-foreground mb-4">
          Events from your organizations
        </p>

        {dashboardEvents === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : dashboardEvents.userOrgEvents.length > 0 ? (
          // Show events grouped by org
          <div className="space-y-6">
            {eventsByOrg &&
              Object.entries(eventsByOrg).map(([orgName, events]) => {
                if (!events) return null
                return (
                  <div key={orgName}>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                      {orgName} Events
                    </h3>
                    <div className="space-y-3">
                      {events.slice(0, 5).map((event, index) => (
                        <AnimatedCard key={event._id} index={index}>
                          <EventCard event={event} />
                        </AnimatedCard>
                      ))}
                      {events.length > 5 && (
                        <p className="text-sm text-slate-500 pl-1">
                          +{events.length - 5} more events
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : dashboardEvents.otherOrgEvents.length > 0 ? (
          // No org events but other events exist
          <div className="space-y-4">
            <Card className="p-4 text-center bg-slate-50">
              <p className="text-slate-600 text-sm">
                No events from your organizations.{' '}
                <Link
                  to="/orgs"
                  className="text-primary hover:underline font-medium"
                >
                  Join organizations
                </Link>{' '}
                to see their events here.
              </p>
            </Card>
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Discover Events
              </h3>
              <div className="space-y-3">
                {dashboardEvents.otherOrgEvents
                  .slice(0, 3)
                  .map((event, index) => (
                    <AnimatedCard key={event._id} index={index}>
                      <EventCard event={event} />
                    </AnimatedCard>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          // No events at all
          <EventsEmptyState />
        )}
      </section>

      {/* Browse Opportunities CTA */}
      <section className="text-center py-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Explore Opportunities
        </h2>
        <p className="text-muted-foreground mb-4">
          Find AI safety roles that match your skills and interests
        </p>
        <Button
          asChild
          size="lg"
          className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link to="/opportunities">Browse Opportunities</Link>
        </Button>
      </section>
    </main>
  )
}

function EmptyStatePrompt({ locationEnabled }: { locationEnabled: boolean }) {
  if (locationEnabled) {
    // User has location enabled but no orgs matched
    return (
      <Card className="p-6 text-center">
        <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <MapPin className="size-6 text-coral-400" />
        </div>
        <h3 className="text-lg font-display font-medium text-foreground mb-2">
          No organizations near you yet
        </h3>
        <p className="text-muted-foreground text-sm">
          We are still growing our network. Check back later for organizations
          in your area.
        </p>
      </Card>
    )
  }

  // User has not enabled location discovery
  return (
    <Card className="p-6 text-center">
      <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        <MapPin className="size-6 text-coral-400" />
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-2">
        Enable location-based suggestions
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        Discover AI safety organizations near you. Your exact location is never
        shared with organizations.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/settings" className="inline-flex items-center gap-2">
          <Settings className="size-4" />
          Enable in Settings
        </Link>
      </Button>
    </Card>
  )
}

function EventsEmptyState() {
  return (
    <Card className="p-6 text-center">
      <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        <Calendar className="size-6 text-coral-400" />
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-2">
        No upcoming events
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        Join organizations to see their events here.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/orgs">Browse Organizations</Link>
      </Button>
    </Card>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className="size-10 rounded-full bg-coral-100 flex items-center justify-center shrink-0">
        <Icon className="size-5 text-coral-600" />
      </div>
      <div>
        <h3 className="font-display font-medium text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  )
}
