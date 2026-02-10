import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Spinner } from '~/components/ui/spinner'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const navigate = useNavigate()

  useEffect(() => {
    if (profile === null) {
      navigate({ to: '/profile/edit' })
    } else if (profile && profile.hasEnrichmentConversation !== true) {
      navigate({ to: '/profile/edit', search: { step: 'enrichment' } })
    }
  }, [profile, navigate])

  // Loading
  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  // Redirecting
  if (profile === null || profile.hasEnrichmentConversation !== true) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
