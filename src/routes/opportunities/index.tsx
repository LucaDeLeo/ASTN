import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { usePaginatedQuery, useQuery } from 'convex/react'
import { useCallback } from 'react'
import { api } from '../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { useIsMobile } from '~/hooks/use-media-query'
import { PullToRefresh } from '~/components/ui/pull-to-refresh'
import { OpportunityFilters } from '~/components/opportunities/opportunity-filters'
import { OpportunityList } from '~/components/opportunities/opportunity-list'

// Define search params schema for this route
type OpportunitySearchParams = {
  role?: string
  location?: string
  q?: string
}

// Larger limit for list mode to reduce need for pagination
// This enables simpler data flow and better view transitions
const LIST_LIMIT = 50
const SEARCH_PAGE_SIZE = 20

// Helper to derive filter params consistently between loader and component
function getFilterParams(search: OpportunitySearchParams) {
  return {
    roleType: search.role && search.role !== 'all' ? search.role : undefined,
    isRemote:
      search.location === 'remote'
        ? true
        : search.location === 'onsite'
          ? false
          : undefined,
  }
}

export const Route = createFileRoute('/opportunities/')({
  validateSearch: (
    search: Record<string, unknown>,
  ): OpportunitySearchParams => {
    return {
      role: search.role as string | undefined,
      location: search.location as string | undefined,
      q: search.q as string | undefined,
    }
  },
  loader: async ({ context, location }) => {
    const search = location.search as OpportunitySearchParams
    const params = getFilterParams(search)

    // Preload opportunities for view transitions
    // Only preload list query (not search) - search has different behavior
    if (!search.q) {
      await context.queryClient.ensureQueryData(
        convexQuery(api.opportunities.list, {
          ...params,
          limit: LIST_LIMIT,
        }),
      )
    }
  },
  component: OpportunitiesPage,
})

function OpportunitiesPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { q: searchTerm } = search
  const isMobile = useIsMobile()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const user = profile ? { name: profile.name || 'User' } : null

  // Derive filter params consistently (same logic as loader)
  const params = getFilterParams(search)

  // Check if any filters are active (for empty state context)
  const hasFilters = !!(searchTerm || search.role || search.location)

  // Clear all filters and navigate to base route
  const handleClearFilters = useCallback(() => {
    navigate({ to: '/opportunities', search: {} })
  }, [navigate])

  // For list mode: use preloaded data (enables view transitions)
  // This is synchronously available from the loader
  const { data: opportunities } = useSuspenseQuery(
    convexQuery(api.opportunities.list, {
      ...params,
      limit: LIST_LIMIT,
    }),
  )

  // Search mode uses separate paginated query (no view transitions expected during search)
  const searchPagination = usePaginatedQuery(
    api.opportunities.searchPaginated,
    searchTerm
      ? {
          searchTerm,
          roleType: params.roleType,
          isRemote: params.isRemote,
        }
      : 'skip',
    { initialNumItems: SEARCH_PAGE_SIZE },
  )

  // Simple logic: search term present = use search, otherwise use preloaded list
  const isSearchMode = !!searchTerm
  const results = isSearchMode ? searchPagination.results : opportunities
  const status = isSearchMode ? searchPagination.status : 'Exhausted'
  const loadMore = isSearchMode ? searchPagination.loadMore : () => {}

  const isLoading =
    isSearchMode && searchPagination.status === 'LoadingFirstPage'

  // Pull-to-refresh handler - Convex is real-time, so data is already fresh
  // This provides visual feedback acknowledging the gesture
  const handlePullRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  const pageContent = (
    <>
      <OpportunityFilters />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Opportunities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {results.length}{' '}
            {results.length !== 1 ? 'opportunities' : 'opportunity'}
            {isSearchMode && status !== 'Exhausted' && ' (more available)'}
          </p>
        </div>
        <PullToRefresh onRefresh={handlePullRefresh} className="min-h-[200px]">
          <OpportunityList
            opportunities={results}
            isLoading={isLoading}
            status={status}
            onLoadMore={() => loadMore(SEARCH_PAGE_SIZE)}
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        </PullToRefresh>
      </main>
    </>
  )

  if (isMobile) {
    return (
      <MobileShell user={user}>
        <GradientBg variant="subtle">{pageContent}</GradientBg>
      </MobileShell>
    )
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      {pageContent}
    </GradientBg>
  )
}
