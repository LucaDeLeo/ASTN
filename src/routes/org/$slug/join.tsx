import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import { Building2, Eye, EyeOff, Link2Off, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { savePendingInvite } from '~/lib/pendingInvite'

export const Route = createFileRoute('/org/$slug/join')({
  component: JoinOrgPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
})

function JoinOrgPage() {
  const { slug } = Route.useParams()
  const { token } = Route.useSearch()

  // If token provided, validate it
  const validation = useQuery(
    api.orgs.directory.validateInviteToken,
    token ? { token } : 'skip',
  )

  // If no token, look up org by slug directly
  const orgBySlug = useQuery(
    api.orgs.directory.getOrgBySlug,
    !token ? { slug } : 'skip',
  )

  // No token: use slug-based lookup
  if (!token) {
    if (orgBySlug === undefined) {
      return (
        <GradientBg>
          <AuthHeader />
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Spinner />
            </div>
          </main>
        </GradientBg>
      )
    }

    if (orgBySlug === null) {
      return (
        <GradientBg>
          <AuthHeader />
          <main className="container mx-auto px-4 py-8">
            <InvalidTokenMessage message="Organization not found. Please check the link and try again." />
          </main>
        </GradientBg>
      )
    }

    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <AuthLoading>
            <div className="flex items-center justify-center min-h-[60vh]">
              <Spinner />
            </div>
          </AuthLoading>

          <Unauthenticated>
            <SignInPrompt orgName={orgBySlug.name} slug={slug} />
          </Unauthenticated>

          <Authenticated>
            <JoinForm
              orgId={orgBySlug._id}
              orgName={orgBySlug.name}
              orgSlug={slug}
            />
          </Authenticated>
        </main>
      </GradientBg>
    )
  }

  // Token-based flow
  if (validation === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Spinner />
          </div>
        </main>
      </GradientBg>
    )
  }

  if (!validation.valid) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <InvalidTokenMessage message="This invite link is invalid or has expired. Please request a new link from an organization admin." />
        </main>
      </GradientBg>
    )
  }

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <AuthLoading>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Spinner />
          </div>
        </AuthLoading>

        <Unauthenticated>
          <SignInPrompt
            orgName={validation.orgName}
            slug={slug}
            token={token}
          />
        </Unauthenticated>

        <Authenticated>
          <JoinForm
            token={token}
            orgId={validation.orgId}
            orgName={validation.orgName}
            orgSlug={validation.orgSlug}
          />
        </Authenticated>
      </main>
    </GradientBg>
  )
}

function InvalidTokenMessage({ message }: { message: string }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Link2Off className="size-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-display text-foreground mb-4">
        Invalid Invite Link
      </h1>
      <p className="text-slate-600">{message}</p>
    </div>
  )
}

function SignInPrompt({
  orgName,
  slug,
  token,
}: {
  orgName: string
  slug: string
  token?: string
}) {
  const navigate = useNavigate()

  const handleSignIn = () => {
    savePendingInvite({ slug, token: token || undefined })
    navigate({ to: '/login' })
  }

  return (
    <Card className="max-w-md mx-auto p-8 text-center">
      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Building2 className="size-8 text-primary" />
      </div>
      <h1 className="text-2xl font-display text-foreground mb-2">
        Join {orgName}
      </h1>
      <p className="text-slate-600 mb-6">
        Sign in to join this organization and access the member directory.
      </p>
      <Button onClick={handleSignIn}>Sign In to Continue</Button>
    </Card>
  )
}

interface JoinFormProps {
  token?: string
  orgId: Id<'organizations'>
  orgName: string
  orgSlug?: string
}

function JoinForm({ token, orgId, orgName, orgSlug }: JoinFormProps) {
  const navigate = useNavigate()
  const joinOrg = useMutation(api.orgs.membership.joinOrg)
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const existingMembership = useQuery(api.orgs.membership.getMembership, {
    orgId,
  })

  const [visibility, setVisibility] = useState<'visible' | 'hidden' | null>(
    null,
  )
  const [isJoining, setIsJoining] = useState(false)

  // Already a member
  if (existingMembership) {
    return (
      <Card className="max-w-md mx-auto p-8 text-center">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Building2 className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-2">
          Already a Member
        </h1>
        <p className="text-slate-600 mb-6">
          You&apos;re already a member of {orgName}.
        </p>
        <Button
          onClick={() =>
            navigate({
              to: '/org/$slug',
              params: { slug: orgSlug || 'unknown' },
            })
          }
        >
          View Organization
        </Button>
      </Card>
    )
  }

  const handleJoin = async () => {
    if (!visibility) return

    setIsJoining(true)
    try {
      await joinOrg({
        orgId,
        inviteToken: token,
        directoryVisibility: visibility,
      })
      toast.success(`Welcome to ${orgName}!`)

      // Redirect based on profile status
      if (!profile || profile.hasEnrichmentConversation !== true) {
        navigate({ to: '/profile/edit' })
      } else {
        navigate({
          to: '/org/$slug',
          params: { slug: orgSlug || 'unknown' },
        })
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join organization',
      )
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Card className="max-w-lg mx-auto p-8">
      <div className="text-center mb-6">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-2">
          Join {orgName}
        </h1>
        <p className="text-slate-600">
          Choose how you want to appear in the member directory.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <VisibilityOption
          value="visible"
          selected={visibility === 'visible'}
          onSelect={() => setVisibility('visible')}
          icon={Eye}
          title="Visible in Directory"
          description="Your name and profile summary appear in the member directory. Other members can see you're part of the organization."
        />

        <VisibilityOption
          value="hidden"
          selected={visibility === 'hidden'}
          onSelect={() => setVisibility('hidden')}
          icon={EyeOff}
          title="Hidden from Directory"
          description="You're a member but won't appear in the public directory. Only organization admins can see your membership."
        />
      </div>

      <Button
        className="w-full"
        disabled={!visibility || isJoining}
        onClick={handleJoin}
      >
        {isJoining ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          'Join Organization'
        )}
      </Button>
    </Card>
  )
}

interface VisibilityOptionProps {
  value: 'visible' | 'hidden'
  selected: boolean
  onSelect: () => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function VisibilityOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
}: VisibilityOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
            selected ? 'bg-primary/10' : 'bg-slate-100'
          }`}
        >
          <Icon
            className={`size-5 ${selected ? 'text-primary' : 'text-slate-500'}`}
          />
        </div>
        <div>
          <h3
            className={`font-medium ${selected ? 'text-primary' : 'text-foreground'}`}
          >
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}
