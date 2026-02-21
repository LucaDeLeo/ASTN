import { z } from 'zod'

export const enrichmentItemSchema = z.object({
  opportunityId: z.string(),
  location: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
  roleType: z
    .enum([
      'research',
      'engineering',
      'operations',
      'policy',
      'training',
      'other',
    ])
    .optional(),
  isRemote: z.boolean().optional(),
})

export const enrichmentResultSchema = z.object({
  enrichments: z.array(enrichmentItemSchema),
})

export type EnrichmentResult = z.infer<typeof enrichmentResultSchema>
export type EnrichmentItem = z.infer<typeof enrichmentItemSchema>
