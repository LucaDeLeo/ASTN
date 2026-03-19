import { usePostHog } from '@posthog/react'
import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Spinner } from '~/components/ui/spinner'

/**
 * Guard that ensures a profile exists before rendering children.
 * Onboarding (profile building) now happens via the agent sidebar,
 * so this no longer redirects to the wizard or enrichment step.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const createProfile = useMutation(api.profiles.create)
  const creating = useRef(false)

  // Auto-create profile for authenticated users who don't have one yet
  useEffect(() => {
    if (profile === null && !creating.current) {
      creating.current = true
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      void createProfile({ timezone })
        .then(() => {
          posthog.capture('profile_created', { timezone })
        })
        .finally(() => {
          creating.current = false
        })
    }
  }, [profile, createProfile, posthog])

  // Loading or creating
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
