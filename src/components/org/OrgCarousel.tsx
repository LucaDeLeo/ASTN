import { OrgCard } from './OrgCard'
import type { OrgCardProps } from './OrgCard'
import type { ReactNode } from 'react'

interface OrgCarouselProps {
  orgs: Array<OrgCardProps['org']>
  emptyState?: ReactNode
}

export function OrgCarousel({ orgs, emptyState }: OrgCarouselProps) {
  if (orgs.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>
    }
    return null
  }

  return (
    <div className="relative">
      {/* Scrollable container with snap */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {orgs.map((org) => (
          <div key={org._id} className="snap-start shrink-0">
            <OrgCard org={org} variant="carousel" />
          </div>
        ))}
      </div>

      {/* Subtle scroll hint gradient on right edge */}
      <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
    </div>
  )
}
