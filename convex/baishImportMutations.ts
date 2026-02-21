import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

/**
 * Delete all existing BAISH imports for idempotent re-import.
 */
export const clearBaishImports = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const all = await ctx.db.query('baishImports').collect()
    for (const record of all) {
      await ctx.db.delete('baishImports', record._id)
    }
    return null
  },
})

/**
 * Insert a single BAISH import record.
 */
export const insertBaishImport = internalMutation({
  args: {
    email: v.string(),
    otherEmails: v.optional(v.array(v.string())),
    nombre: v.optional(v.string()),
    vinculo: v.optional(v.string()),
    rol: v.optional(v.string()),
    etapaProfesional: v.optional(v.string()),
    experienciaAiSafety: v.optional(v.string()),
    intereses: v.optional(v.array(v.string())),
    participoEn: v.optional(v.array(v.string())),
    disponibilidad: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    formResponses: v.optional(
      v.array(
        v.object({
          formName: v.optional(v.string()),
          submittedAt: v.optional(v.string()),
          careerGoals: v.optional(v.string()),
          whatLearned: v.optional(v.string()),
          nextSteps: v.optional(v.string()),
          feedback: v.optional(v.string()),
          otherResponses: v.optional(v.string()),
        }),
      ),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('baishImports', {
      ...args,
      importedAt: Date.now(),
    })
    return null
  },
})
