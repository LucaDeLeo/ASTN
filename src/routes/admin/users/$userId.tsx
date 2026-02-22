import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export const Route = createFileRoute('/admin/users/$userId')({
  component: UserDetailPage,
})

function UserDetailPage() {
  const { userId } = Route.useParams()
  const isPlatformAdmin = useQuery(api.orgApplications.checkPlatformAdmin)

  if (isPlatformAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (!isPlatformAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-4">
          Platform Admin Access Required
        </h1>
        <p className="text-slate-600">
          You need platform admin access to view user details.
        </p>
      </div>
    )
  }

  return <UserDetail userId={userId} />
}

function UserDetail({ userId }: { userId: string }) {
  const profile = useQuery(api.platformAdmin.users.getProfileDetail, { userId })

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h1 className="text-2xl font-display text-foreground mb-4">
          User Not Found
        </h1>
        <p className="text-slate-600 mb-4">
          No profile found for this user ID.
        </p>
        <Link
          to="/admin/users"
          className="text-primary hover:underline text-sm"
        >
          Back to Users
        </Link>
      </div>
    )
  }

  const hasAgent = !!profile.agentThreadId
  const hasLegacyEnrichment = !!profile.hasEnrichmentConversation

  return (
    <div>
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display text-foreground">
          {profile.name || 'Unnamed User'}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
          {profile.email && <span>{profile.email}</span>}
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {profile.location}
            </span>
          )}
          <span>
            Joined {formatDistanceToNow(profile.createdAt, { addSuffix: true })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {profile.orgMemberships.map(
            (org: {
              orgId: string
              orgName: string
              role: string
              joinedAt: number
            }) => (
              <Badge key={org.orgId} variant="secondary">
                <Building2 className="size-3 mr-1" />
                {org.orgName}{' '}
                <span className="text-muted-foreground ml-1">({org.role})</span>
              </Badge>
            ),
          )}
          <Badge variant="outline">
            Matches: {profile.matchCounts.great}G / {profile.matchCounts.good}
            Ok / {profile.matchCounts.exploring}E
          </Badge>
          <Badge
            variant={
              profile.completeness.percentage >= 80
                ? 'default'
                : profile.completeness.percentage >= 40
                  ? 'secondary'
                  : 'outline'
            }
          >
            {profile.completeness.percentage}% complete
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="matches">
            Matches (
            {profile.matchCounts.great +
              profile.matchCounts.good +
              profile.matchCounts.exploring}
            )
          </TabsTrigger>
          <TabsTrigger value="agent" disabled={!hasAgent}>
            Agent Chat
          </TabsTrigger>
          {hasLegacyEnrichment && (
            <TabsTrigger value="enrichment">Legacy Enrichment</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab profile={profile} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesTab profileId={profile._id} />
        </TabsContent>

        <TabsContent value="agent">
          {hasAgent ? (
            <AgentChatTab threadId={profile.agentThreadId!} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No agent conversation found for this user.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {hasLegacyEnrichment && (
          <TabsContent value="enrichment">
            <EnrichmentTab profileId={profile._id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function ProfileTab({ profile }: { profile: Record<string, any> }) {
  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Name" value={profile.name} />
            <Field label="Email" value={profile.email} />
            <Field label="Pronouns" value={profile.pronouns} />
            <Field label="Location" value={profile.location} />
            <Field label="Headline" value={profile.headline} />
            <Field label="LinkedIn" value={profile.linkedinUrl} />
            <Field label="Language" value={profile.preferredLanguage} />
            <Field label="Seeking" value={profile.seeking} />
          </dl>
        </CardContent>
      </Card>

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4" />
              Education ({profile.education.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.education.map(
                (
                  edu: {
                    institution: string
                    degree?: string
                    field?: string
                    startYear?: number
                    endYear?: number
                    current?: boolean
                  },
                  i: number,
                ) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{edu.institution}</p>
                    <p className="text-muted-foreground">
                      {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                      {edu.startYear && (
                        <span className="ml-2">
                          ({edu.startYear}
                          {edu.current
                            ? ' - Present'
                            : edu.endYear
                              ? ` - ${edu.endYear}`
                              : ''}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work History */}
      {profile.workHistory && profile.workHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4" />
              Work History ({profile.workHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.workHistory.map(
                (
                  work: {
                    organization: string
                    title: string
                    startDate?: number
                    endDate?: number
                    current?: boolean
                    description?: string
                  },
                  i: number,
                ) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">
                      {work.title} at {work.organization}
                    </p>
                    {work.description && (
                      <p className="text-muted-foreground line-clamp-2">
                        {work.description}
                      </p>
                    )}
                    {work.current && (
                      <Badge variant="outline" className="mt-1">
                        Current
                      </Badge>
                    )}
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4" />
              Skills ({profile.skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Goals & AI Safety Interests */}
      {(profile.careerGoals || profile.aiSafetyInterests?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Career Goals & AI Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.careerGoals && (
              <div>
                <p className="font-medium mb-1">Career Goals</p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.careerGoals}
                </p>
              </div>
            )}
            {profile.aiSafetyInterests?.length > 0 && (
              <div>
                <p className="font-medium mb-1">AI Safety Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.aiSafetyInterests.map((interest: string) => (
                    <Badge key={interest} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match Preferences */}
      {profile.matchPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field
                label="Remote Preference"
                value={profile.matchPreferences.remotePreference?.replace(
                  /_/g,
                  ' ',
                )}
              />
              <Field
                label="Availability"
                value={profile.matchPreferences.availability?.replace(
                  /_/g,
                  ' ',
                )}
              />
              <Field
                label="Willing to Relocate"
                value={
                  profile.matchPreferences.willingToRelocate === true
                    ? 'Yes'
                    : profile.matchPreferences.willingToRelocate === false
                      ? 'No'
                      : undefined
                }
              />
              <Field
                label="Work Authorization"
                value={profile.matchPreferences.workAuthorization}
              />
              <Field
                label="Min Salary (USD)"
                value={profile.matchPreferences.minimumSalaryUSD?.toLocaleString()}
              />
              {profile.matchPreferences.roleTypes?.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Role Types</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {profile.matchPreferences.roleTypes.map((r: string) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              {profile.matchPreferences.commitmentTypes?.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Commitment Types</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {profile.matchPreferences.commitmentTypes.map(
                      (c: string) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c.replace(/_/g, ' ')}
                        </Badge>
                      ),
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      {profile.privacySettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field
                label="Default Visibility"
                value={profile.privacySettings.defaultVisibility}
              />
              <Field
                label="Location Discoverable"
                value={
                  profile.privacySettings.locationDiscoverable ? 'Yes' : 'No'
                }
              />
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Enrichment Summary */}
      {profile.enrichmentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrichment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile.enrichmentSummary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
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
} as const

function MatchesTab({ profileId }: { profileId: Id<'profiles'> }) {
  const matches = useQuery(api.platformAdmin.users.getUserMatches, {
    profileId,
  })

  if (matches === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Target className="size-8 mx-auto mb-2 text-muted-foreground/50" />
          No matches computed for this user yet.
        </CardContent>
      </Card>
    )
  }

  // Group by tier
  const grouped = {
    great: matches.filter((m: { tier: string }) => m.tier === 'great'),
    good: matches.filter((m: { tier: string }) => m.tier === 'good'),
    exploring: matches.filter((m: { tier: string }) => m.tier === 'exploring'),
  }

  return (
    <div className="space-y-6">
      {(['great', 'good', 'exploring'] as const).map((tier) => {
        const items = grouped[tier]
        if (items.length === 0) return null
        const config = tierConfig[tier]
        const TierIcon = config.icon

        return (
          <div key={tier}>
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <TierIcon className="size-4" />
              {config.label} ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map((match: any) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MatchCard({ match }: { match: any }) {
  const config = tierConfig[match.tier as keyof typeof tierConfig]

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge className={config.color}>{config.label}</Badge>
              <Badge variant="outline">Score: {match.score}</Badge>
              {match.status !== 'active' && (
                <Badge
                  variant={match.status === 'saved' ? 'secondary' : 'outline'}
                >
                  {match.status}
                </Badge>
              )}
              {match.isNew && <Badge variant="secondary">New</Badge>}
            </div>
            <p className="font-medium text-foreground">
              {match.opportunity.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {match.opportunity.organization}
            </p>
          </div>
          {match.opportunity.sourceUrl && (
            <a
              href={match.opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {match.opportunity.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {match.opportunity.location}
            </span>
          )}
          {match.opportunity.isRemote && (
            <Badge variant="outline" className="text-xs py-0">
              Remote
            </Badge>
          )}
          {match.opportunity.roleType && (
            <span>{match.opportunity.roleType}</span>
          )}
          {match.opportunity.experienceLevel && (
            <Badge variant="outline" className="text-xs py-0">
              {match.opportunity.experienceLevel}
            </Badge>
          )}
          {match.opportunity.salaryRange &&
            match.opportunity.salaryRange !== 'Not Found' && (
              <span>{match.opportunity.salaryRange}</span>
            )}
          {match.opportunity.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(match.opportunity.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Strengths */}
        {match.explanation.strengths.length > 0 && (
          <div>
            <ul className="space-y-1">
              {match.explanation.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="size-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    +
                  </span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gap */}
        {match.explanation.gap && (
          <div className="flex items-start gap-2 text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 p-2">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-amber-800 dark:text-amber-200">
              {match.explanation.gap}
            </span>
          </div>
        )}

        {/* Recommendations */}
        {match.recommendations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {match.recommendations.map(
              (
                rec: { type: string; priority: string; action: string },
                i: number,
              ) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-xs ${
                    rec.priority === 'high'
                      ? 'border-primary/50 text-primary'
                      : rec.priority === 'medium'
                        ? 'border-blue-400/50 text-blue-600'
                        : ''
                  }`}
                >
                  {rec.type === 'specific' ? 'Role-specific' : rec.type}:{' '}
                  {rec.action}
                </Badge>
              ),
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1 border-t">
          <span>
            Computed{' '}
            {formatDistanceToNow(match.computedAt, { addSuffix: true })}
          </span>
          <span>Model: {match.modelVersion}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | undefined | null
}) {
  if (!value) return null
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}

function AgentChatTab({ threadId }: { threadId: string }) {
  const messages = useQuery(api.platformAdmin.users.getAgentMessages, {
    threadId,
  })
  const toolCalls = useQuery(api.platformAdmin.users.getAgentToolCalls, {
    threadId,
  })

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/50" />
          No messages in this thread.
        </CardContent>
      </Card>
    )
  }

  // Build a map of tool calls by threadId for display
  const toolCallMap = new Map<string, string>()
  if (toolCalls) {
    for (const tc of toolCalls) {
      toolCallMap.set(tc.toolName, tc.displayText)
    }
  }

  return (
    <div className="space-y-3">
      {messages.map((msg: Record<string, any>) => {
        const role = msg.message?.role
        if (!role) return null

        const text = extractMessageText(msg.message?.content)
        const toolCallParts = extractToolCalls(msg.message?.content)

        if (!text && toolCallParts.length === 0) return null

        return (
          <div
            key={msg._id}
            className={`rounded-lg border p-3 text-sm ${
              role === 'user'
                ? 'bg-muted/50 border-muted'
                : 'bg-background border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {role === 'user' ? (
                <User className="size-3.5 text-muted-foreground" />
              ) : (
                <Bot className="size-3.5 text-muted-foreground" />
              )}
              <span className="font-medium text-xs uppercase text-muted-foreground">
                {role}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(msg._creationTime, { addSuffix: true })}
              </span>
            </div>
            {text && (
              <p className="whitespace-pre-wrap text-foreground">{text}</p>
            )}
            {toolCallParts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {toolCallParts.map((tc, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Wrench className="size-3 mr-1" />
                    {tc}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function extractMessageText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(
        (part: { type: string }) =>
          part.type === 'text' || part.type === 'reasoning',
      )
      .map((part: { text: string }) => part.text)
      .join('\n')
  }
  return ''
}

function extractToolCalls(content: unknown): Array<string> {
  if (!content || !Array.isArray(content)) return []
  return content
    .filter(
      (part: { type: string }) =>
        part.type === 'tool-call' || part.type === 'tool-result',
    )
    .map((part: { toolName?: string; type: string }) =>
      part.type === 'tool-call' ? (part.toolName ?? 'tool') : 'result',
    )
}

function EnrichmentTab({ profileId }: { profileId: Id<'profiles'> }) {
  const messages = useQuery(api.platformAdmin.users.getEnrichmentMessages, {
    profileId,
  })

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No enrichment messages found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map(
        (msg: {
          _id: string
          role: 'user' | 'assistant'
          content: string
          createdAt: number
        }) => (
          <div
            key={msg._id}
            className={`rounded-lg border p-3 text-sm ${
              msg.role === 'user'
                ? 'bg-muted/50 border-muted'
                : 'bg-background border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.role === 'user' ? (
                <User className="size-3.5 text-muted-foreground" />
              ) : (
                <Bot className="size-3.5 text-muted-foreground" />
              )}
              <span className="font-medium text-xs uppercase text-muted-foreground">
                {msg.role}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-foreground">{msg.content}</p>
          </div>
        ),
      )}
    </div>
  )
}
