import type { Id } from '$convex/_generated/dataModel'

export type MatchTier = 'great' | 'good' | 'exploring'

export type MatchOpportunitySummary = {
  _id: Id<'opportunities'>
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  salaryRange?: string
  deadline?: number
  postedAt?: number
  opportunityType?: string
}

export type MatchSummary = {
  _id: Id<'matches'>
  tier: MatchTier
  score: number
  isNew: boolean
  status?: 'active' | 'dismissed' | 'saved'
  appliedAt?: number
  explanation: {
    strengths: string[]
    gap?: string
  }
  recommendations: Array<{
    type: string
    action: string
    priority?: 'high' | 'medium' | 'low'
  }>
  opportunity: MatchOpportunitySummary
}

export type MatchDetail = MatchSummary & {
  opportunity: MatchOpportunitySummary & {
    description: string
    requirements?: string[]
    sourceUrl: string
  }
}

export type GrowthArea = {
  theme: string
  items: string[]
}
