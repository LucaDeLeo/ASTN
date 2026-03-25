import type { Id } from '$convex/_generated/dataModel'

export interface OrgDirectoryOrg {
  _id: Id<'organizations'>
  name: string
  slug?: string
  logoUrl?: string
  description?: string
  city?: string
  country?: string
  memberCount?: number
  upcomingEventCount?: number
  isJoined?: boolean
  coordinates?: {
    lat: number
    lng: number
  }
}

export function getOrgLocation(org: Pick<OrgDirectoryOrg, 'city' | 'country'>) {
  return [org.city, org.country].filter(Boolean).join(', ')
}

export function getOrgHref(org: Pick<OrgDirectoryOrg, '_id' | 'slug'>) {
  return `/org/${org.slug ?? org._id}`
}

