import { z } from 'zod'

export const matchItemSchema = z.object({
  opportunityId: z.string(),
  tier: z.enum(['great', 'good', 'exploring']),
  score: z.coerce.number().min(0).max(100),
  strengths: z.array(z.string()),
  gap: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  interviewChance: z.string(),
  ranking: z.string(),
  confidence: z.string(),
  recommendations: z
    .array(
      z.object({
        type: z.enum(['specific', 'skill', 'experience']),
        action: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      }),
    )
    .optional()
    .default([]),
})

export const matchResultSchema = z.object({
  matches: z.array(matchItemSchema),
  growthAreas: z
    .array(
      z.object({
        theme: z.string(),
        items: z.array(z.string()),
      }),
    )
    .optional(),
})

export type MatchingResultValidated = z.infer<typeof matchResultSchema>
