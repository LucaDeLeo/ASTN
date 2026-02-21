import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { Sparkles } from 'lucide-react'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { ProfileWizard } from '~/components/profile/wizard/ProfileWizard'
import { useAgentSidebar } from '~/components/agent-sidebar/AgentSidebarProvider'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

const stepSchema = z.enum([
  'basic',
  'education',
  'work',
  'goals',
  'skills',
  'privacy',
])

const searchSchema = z.object({
  step: stepSchema.optional().default('basic'),
})

export const Route = createFileRoute('/profile/edit')({
  validateSearch: searchSchema,
  component: ProfileEditPage,
})

function ProfileEditPage() {
  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
    </GradientBg>
  )
}

function AuthenticatedContent() {
  const { step } = Route.useSearch()
  const navigate = useNavigate()
  const { open } = useAgentSidebar()

  type StepId = 'basic' | 'education' | 'work' | 'goals' | 'skills' | 'privacy'

  const handleStepChange = (newStep: StepId) => {
    navigate({ to: '/profile/edit', search: { step: newStep } })
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Edit Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete your profile to unlock smart matching and connect with
            opportunities
          </p>
        </div>
        <Button variant="outline" onClick={open} className="shrink-0">
          <Sparkles className="size-4 mr-2" />
          Open Agent
        </Button>
      </div>

      <ProfileWizard currentStep={step} onStepChange={handleStepChange} />
    </main>
  )
}
