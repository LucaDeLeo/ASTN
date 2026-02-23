import { useMutation } from 'convex/react'
import { Bookmark } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { MatchCard } from './MatchCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { CollapsibleSection } from '~/components/ui/collapsible-section'

interface SavedMatchesSectionProps {
  matches: Array<{
    _id: Id<'matches'>
    tier: 'great' | 'good' | 'exploring'
    score: number
    isNew: boolean
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

export function SavedMatchesSection({ matches }: SavedMatchesSectionProps) {
  return (
    <CollapsibleSection
      icon={Bookmark}
      iconClassName="fill-emerald-600"
      title="Saved"
      count={matches.length}
      subtitle="Opportunities you're interested in"
      variant="emerald"
      storageKey="saved-matches-expanded"
      itemCount={matches.length}
      className="mb-8"
    >
      <SavedMatchesGrid matches={matches} />
    </CollapsibleSection>
  )
}

/** Card grid without the CollapsibleSection wrapper. */
export function SavedMatchesGrid({ matches }: SavedMatchesSectionProps) {
  const toggleSaveMatch = useMutation(api.matches.saveMatch)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-1">
      {matches.map((match, index) => (
        <AnimatedCard key={match._id} index={index}>
          <MatchCard
            match={match}
            isSaved
            onUnsave={() => toggleSaveMatch({ matchId: match._id })}
            className="border-emerald-200"
          />
        </AnimatedCard>
      ))}
    </div>
  )
}
