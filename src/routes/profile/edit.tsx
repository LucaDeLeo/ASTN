import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { ProfileCreationWizard } from '~/components/profile/wizard/ProfileCreationWizard'
import { ProfileWizard } from '~/components/profile/wizard/ProfileWizard'
import { Spinner } from '~/components/ui/spinner'

const stepSchema = z.enum([
  'input', // Entry point selection (new wizard flow)
  'basic',
  'education',
  'work',
  'goals',
  'skills',
  'enrichment',
  'privacy',
])

const searchSchema = z.object({
  step: stepSchema.optional().default('input'),
  fromExtraction: z.string().optional(),
  chatFirst: z.string().optional(),
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
  const { step, fromExtraction, chatFirst } = Route.useSearch()
  const navigate = useNavigate()

  // Type guard for manual wizard steps
  type ManualStepId =
    | 'basic'
    | 'education'
    | 'work'
    | 'goals'
    | 'skills'
    | 'enrichment'
    | 'privacy'
  const isManualStep = (s: string): s is ManualStepId =>
    [
      'basic',
      'education',
      'work',
      'goals',
      'skills',
      'enrichment',
      'privacy',
    ].includes(s)

  const handleStepChange = (newStep: ManualStepId) => {
    // Clear fromExtraction when navigating away
    navigate({ to: '/profile/edit', search: { step: newStep } })
  }

  // Handle ProfileCreationWizard completion - go to profile view
  const handleWizardComplete = () => {
    navigate({ to: '/profile' })
  }

  // Handle manual entry from wizard - switch to basic step
  const handleManualEntry = () => {
    navigate({ to: '/profile/edit', search: { step: 'basic' } })
  }

  // Handle enrichment from wizard - switch to enrichment step with context
  const handleEnrichFromWizard = (fromExtract: boolean) => {
    navigate({
      to: '/profile/edit',
      search: {
        step: 'enrichment',
        fromExtraction: fromExtract ? 'true' : undefined,
        chatFirst: !fromExtract ? 'true' : undefined,
      },
    })
  }

  // Determine page title/description based on step
  const getPageHeader = () => {
    if (step === 'input') {
      return {
        title: 'Create Your Profile',
        description: 'Choose how to get started with your AI Safety profile',
      }
    }
    if (step === 'enrichment') {
      return {
        title: 'Profile Enrichment',
        description: 'Have a conversation with our AI to enhance your profile',
      }
    }
    return {
      title: 'Edit Profile',
      description:
        'Complete your profile to unlock smart matching and connect with opportunities',
    }
  }

  const { title, description } = getPageHeader()

  // Render ProfileCreationWizard for input step
  if (step === 'input') {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        <ProfileCreationWizard
          onComplete={handleWizardComplete}
          onManualEntry={handleManualEntry}
          onEnrich={handleEnrichFromWizard}
        />
      </main>
    )
  }

  // Render ProfileWizard for manual steps
  if (isManualStep(step)) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        <ProfileWizard
          currentStep={step}
          onStepChange={handleStepChange}
          fromExtraction={fromExtraction === 'true'}
          chatFirst={chatFirst === 'true'}
        />
      </main>
    )
  }

  // Fallback - should not reach here
  return null
}
