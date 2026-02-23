import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { MatchCard } from './MatchCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { cn } from '~/lib/utils'

const APPLIED_SECTION_EXPANDED_KEY = 'applied-matches-expanded'

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
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(APPLIED_SECTION_EXPANDED_KEY) === 'true'
  })
  const [isVisible, setIsVisible] = useState(matches.length > 0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    sessionStorage.setItem(APPLIED_SECTION_EXPANDED_KEY, String(isExpanded))
  }, [isExpanded])

  useEffect(() => {
    if (matches.length > 0 && !isVisible) {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else if (matches.length === 0 && isVisible) {
      setIsVisible(false)
    }
  }, [matches.length, isVisible])

  if (matches.length === 0 && !isVisible) return null

  return (
    <section
      ref={sectionRef}
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        isVisible && matches.length > 0 ? 'opacity-100 mb-8' : 'opacity-0 mb-0',
      )}
      style={{
        maxHeight: isVisible && matches.length > 0 ? '1000px' : '0px',
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-2 p-3 rounded-lg',
          'bg-violet-50 border border-violet-200',
          'hover:bg-violet-100 transition-colors',
          'text-left',
        )}
      >
        <div className="flex items-center gap-2">
          <Check className="size-5 text-violet-600" />
          <span className="font-medium text-violet-800">
            {matches.length} Applied
          </span>
        </div>
        <ChevronDown
          suppressHydrationWarning
          className={cn(
            'size-5 text-violet-600 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      <div
        suppressHydrationWarning
        className={cn(
          'grid mt-4 will-change-[grid-template-rows]',
          'transition-[grid-template-rows] duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-1">
            {matches.map((match, index) => (
              <AnimatedCard key={match._id} index={index}>
                <MatchCard match={match} />
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
