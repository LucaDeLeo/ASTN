import { useRouterState } from '@tanstack/react-router'

export type PageContext =
  | 'viewing_home'
  | 'editing_profile'
  | 'browsing_matches'
  | 'viewing_match'
  | 'browsing_opportunities'
  | 'viewing_opportunity'

export function useAgentPageContext(): PageContext | undefined {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (pathname === '/') return 'viewing_home'
  if (pathname === '/profile' || pathname === '/profile/')
    return 'editing_profile'
  if (pathname === '/matches' || pathname === '/matches/')
    return 'browsing_matches'
  if (pathname.startsWith('/matches/')) return 'viewing_match'
  if (pathname === '/opportunities' || pathname === '/opportunities/')
    return 'browsing_opportunities'
  if (pathname.startsWith('/opportunities/')) return 'viewing_opportunity'

  return undefined
}
