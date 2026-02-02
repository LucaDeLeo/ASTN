import { z } from "zod";

export const extractionResultSchema = z
  .object({
    skills_mentioned: z.array(z.string()).optional().default([]),
    career_interests: z.array(z.string()).optional().default([]),
    career_goals: z.string().optional(),
    background_summary: z.string().optional(),
    seeking: z.string().optional(),
  })
  .passthrough();

export type ExtractionResultValidated = z.infer<
  typeof extractionResultSchema
>;
