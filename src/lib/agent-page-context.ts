export type PageContextType =
  | 'viewing_home'
  | 'editing_profile'
  | 'browsing_matches'
  | 'viewing_match'
  | 'browsing_opportunities'
  | 'viewing_opportunity'

export interface AgentPageContext {
  type: PageContextType
  entityId?: string
}

export function getAgentPageContext(pathname: string): AgentPageContext | undefined {
  if (pathname === '/' || pathname === '') return { type: 'viewing_home' }
  if (pathname === '/profile' || pathname === '/profile/')
    return { type: 'editing_profile' }
  if (pathname === '/matches' || pathname === '/matches/')
    return { type: 'browsing_matches' }
  if (pathname.startsWith('/matches/')) {
    return {
      type: 'viewing_match',
      entityId: pathname.split('/matches/')[1]?.replace(/\/$/, '') || undefined,
    }
  }
  if (pathname === '/opportunities' || pathname === '/opportunities/')
    return { type: 'browsing_opportunities' }
  if (pathname.startsWith('/opportunities/')) {
    return {
      type: 'viewing_opportunity',
      entityId:
        pathname.split('/opportunities/')[1]?.replace(/\/$/, '') || undefined,
    }
  }

  return undefined
}
