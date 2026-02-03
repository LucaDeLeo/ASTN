import { createFileRoute } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from 'convex/react'
import { Building2, MapPin, UserPlus } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { GuestSignupForm } from '~/components/guest/GuestSignupForm'
import { VisitApplicationForm } from '~/components/guest/VisitApplicationForm'
import { Card } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/org/$slug/visit')({
  component: VisitPage,
})

function VisitPage() {
  const { slug } = Route.useParams()

  // Public query - no auth required
  const spaceInfo = useQuery(api.coworkingSpaces.getSpaceBySlug, { slug })

  // Loading state
  if (spaceInfo === undefined) {
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

  // Space not found or guest access disabled
  if (spaceInfo === null) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <SpaceNotFound />
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
          <SignupPrompt
            orgName={spaceInfo.orgName}
            spaceName={spaceInfo.spaceName}
          />
        </Unauthenticated>

        <Authenticated>
          <VisitApplicationForm spaceInfo={spaceInfo} />
        </Authenticated>
      </main>
    </GradientBg>
  )
}

function SpaceNotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <MapPin className="size-8 text-slate-400" />
      </div>
      <h1 className="text-2xl font-display text-foreground mb-4">
        Space Not Available
      </h1>
      <p className="text-slate-600">
        This organization doesn&apos;t have guest access enabled or the space
        doesn&apos;t exist.
      </p>
    </div>
  )
}

interface SignupPromptProps {
  orgName: string
  spaceName: string
}

function SignupPrompt({ orgName, spaceName }: SignupPromptProps) {
  return (
    <div className="max-w-lg mx-auto">
      {/* Space info header */}
      <Card className="p-6 mb-6 text-center">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-2">
          Visit {orgName}
        </h1>
        <p className="text-slate-600 flex items-center justify-center gap-2">
          <MapPin className="size-4" />
          {spaceName}
        </p>
      </Card>

      {/* Auth form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="size-5 text-primary" />
          <h2 className="text-lg font-medium">Sign in to apply</h2>
        </div>
        <p className="text-slate-600 text-sm mb-6">
          Create an account or sign in to submit your visit application.
          We&apos;ll notify you when your application is reviewed.
        </p>
        <GuestSignupForm />
      </Card>
    </div>
  )
}
