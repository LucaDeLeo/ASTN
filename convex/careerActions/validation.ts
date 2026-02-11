import { z } from 'zod'

export const actionTypes = z.enum([
  'replicate',
  'collaborate',
  'start_org',
  'identify_gaps',
  'volunteer',
  'build_tools',
  'teach_write',
  'develop_skills',
])

export const actionItemSchema = z
  .object({
    type: actionTypes,
    title: z.string(),
    description: z.string(),
    rationale: z.string(),
    profileBasis: z.array(z.string()).optional().default([]),
  })
  .passthrough()

export const actionResultSchema = z
  .object({
    actions: z.array(actionItemSchema).min(1).max(7),
  })
  .passthrough()

export type ActionItemValidated = z.infer<typeof actionItemSchema>
export type ActionResultValidated = z.infer<typeof actionResultSchema>
