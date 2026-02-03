import { z } from 'zod'

export const documentExtractionResultSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional(),
    location: z.string().optional(),
    education: z
      .array(
        z
          .object({
            institution: z.string(),
            degree: z.string().optional(),
            field: z.string().optional(),
            startYear: z.coerce.number().optional(),
            endYear: z.coerce.number().optional(),
            current: z.boolean().optional(),
          })
          .passthrough(),
      )
      .optional(),
    workHistory: z
      .array(
        z
          .object({
            organization: z.string(),
            title: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            current: z.boolean().optional(),
            description: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    rawSkills: z.array(z.string()).optional(),
  })
  .passthrough()

export type DocumentExtractionResultValidated = z.infer<
  typeof documentExtractionResultSchema
>
