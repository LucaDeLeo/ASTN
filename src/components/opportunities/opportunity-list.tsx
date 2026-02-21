import { OpportunityCard } from './opportunity-card'
import type { Id } from '../../../convex/_generated/dataModel'
import { Empty } from '~/components/ui/empty'
import { Spinner } from '~/components/ui/spinner'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

type Opportunity = {
  _id: Id<'opportunities'>
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  salaryRange?: string
  deadline?: number
}

type PaginationStatus =
  | 'LoadingFirstPage'
  | 'CanLoadMore'
  | 'LoadingMore'
  | 'Exhausted'

function OpportunityCardSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-border rounded-none sm:rounded-sm">
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-sm" />
            <Skeleton className="h-5 w-14 rounded-sm" />
          </div>

          {/* Title + org */}
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Salary + deadline */}
          <div className="flex gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OpportunityList({
  opportunities,
  isLoading,
  status,
  onLoadMore,
  hasFilters = false,
  onClearFilters,
}: {
  opportunities?: Array<Opportunity>
  isLoading: boolean
  status?: PaginationStatus
  onLoadMore?: () => void
  hasFilters?: boolean
  onClearFilters?: () => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <OpportunityCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!opportunities || opportunities.length === 0) {
    if (hasFilters) {
      return (
        <Empty
          variant="no-results"
          className="py-16"
          action={
            onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )
          }
        />
      )
    }
    return <Empty variant="no-opportunities" className="py-16" />
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity, index) => (
        <div
          key={opportunity._id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{
            animationDelay: `${Math.min(index, 19) * 50}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <OpportunityCard opportunity={opportunity} index={index} />
        </div>
      ))}

      {status === 'CanLoadMore' && onLoadMore && (
        <div className="pt-4">
          <Button onClick={onLoadMore} variant="outline" className="w-full">
            Load More
          </Button>
        </div>
      )}

      {status === 'LoadingMore' && (
        <div className="flex justify-center py-4">
          <Spinner className="w-6 h-6" />
        </div>
      )}
    </div>
  )
}
