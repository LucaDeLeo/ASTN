export type OpportunitySearchParams = {
  type?: string
  role?: string
  location?: string
  q?: string
}

export const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Events & Training' },
] as const

export const JOB_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'research', label: 'Research' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'policy', label: 'Policy' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
] as const

export const EVENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'conference', label: 'Conference' },
  { value: 'course', label: 'Course' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'talk', label: 'Talk' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'other', label: 'Other' },
] as const

export const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'onsite', label: 'On-site Only' },
] as const

export function readOpportunitySearchParams(
  url: URL,
): OpportunitySearchParams {
  const get = (key: keyof OpportunitySearchParams) =>
    url.searchParams.get(key) ?? undefined

  return {
    type: get('type'),
    role: get('role'),
    location: get('location'),
    q: get('q'),
  }
}

export function getCategoryOptions(type?: string) {
  if (type === 'event') return EVENT_CATEGORIES
  return JOB_CATEGORIES
}

export function getFilterParams(search: OpportunitySearchParams) {
  const opportunityType: 'job' | 'event' | undefined =
    search.type === 'job' || search.type === 'event' ? search.type : undefined

  const isEventCategory = search.type === 'event'

  return {
    opportunityType,
    roleType:
      search.role && search.role !== 'all' && !isEventCategory
        ? search.role
        : undefined,
    eventType:
      search.role && search.role !== 'all' && isEventCategory
        ? search.role
        : undefined,
    isRemote:
      search.location === 'remote'
        ? true
        : search.location === 'onsite'
          ? false
          : undefined,
  }
}
