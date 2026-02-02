import { z } from "zod";

export const matchItemSchema = z
  .object({
    opportunityId: z.string(),
    tier: z.enum(["great", "good", "exploring"]),
    score: z.coerce.number().min(0).max(100),
    strengths: z.array(z.string()),
    gap: z.string().optional(),
    interviewChance: z.string(),
    ranking: z.string(),
    confidence: z.string(),
    recommendations: z
      .array(
        z
          .object({
            type: z.string(),
            action: z.string(),
            priority: z.string(),
          })
          .passthrough()
      )
      .optional()
      .default([]),
  })
  .passthrough();

export const matchResultSchema = z
  .object({
    matches: z.array(matchItemSchema),
    growthAreas: z
      .array(
        z
          .object({
            theme: z.string(),
            items: z.array(z.string()),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export type MatchingResultValidated = z.infer<typeof matchResultSchema>;
