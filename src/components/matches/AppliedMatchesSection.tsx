import { Check } from 'lucide-react'
import { MatchCard } from './MatchCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { CollapsibleSection } from '~/components/ui/collapsible-section'

interface AppliedMatchesSectionProps {
  matches: Array<{
    _id: Id<'matches'>
    tier: 'great' | 'good' | 'exploring'
    score: number
    isNew: boolean
    appliedAt?: number
    status?: 'active' | 'dismissed' | 'saved'
    explanation: { strengths: Array<string> }
    opportunity: {
      _id: string
      title: string
      organization: string
      location: string
      isRemote: boolean
      roleType: string
      experienceLevel?: string
      salaryRange?: string
      deadline?: number
    }
  }>
}

export function AppliedMatchesSection({ matches }: AppliedMatchesSectionProps) {
  return (
    <CollapsibleSection
      icon={Check}
      title="Applied"
      count={matches.length}
      variant="violet"
      storageKey="applied-matches-expanded"
      itemCount={matches.length}
      className="mb-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-1">
        {matches.map((match, index) => (
          <AnimatedCard key={match._id} index={index}>
            <MatchCard match={match} />
          </AnimatedCard>
        ))}
      </div>
    </CollapsibleSection>
  )
}
