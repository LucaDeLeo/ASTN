import { z } from 'zod'

export const engagementResultSchema = z
  .object({
    level: z.enum(['highly_engaged', 'moderate', 'at_risk', 'new', 'inactive']),
    adminExplanation: z.string(),
    userExplanation: z.string(),
  })
  .passthrough()

export type EngagementResultValidated = z.infer<typeof engagementResultSchema>
