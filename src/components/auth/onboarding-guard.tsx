import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Spinner } from '~/components/ui/spinner'

/**
 * Guard that ensures a profile exists before rendering children.
 * Onboarding (profile building) now happens via the agent sidebar,
 * so this no longer redirects to the wizard or enrichment step.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const profile = useQuery(api.profiles.getOrCreateProfile)

  // Loading
  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  // Profile will be auto-created by getOrCreateProfile, but guard just in case
  if (profile === null) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
