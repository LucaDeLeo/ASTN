import { v } from 'convex/values'
import { internalMutation, mutation } from '../_generated/server'
import { internal } from '../_generated/api'
import { requireAuth } from '../lib/auth'

/**
 * Public mutation: authenticate, guard against duplicate extraction, claim the
 * document, and schedule the internal extraction action.
 *
 * Returns true if extraction was scheduled, false if skipped.
 */
export const requestExtraction = mutation({
  args: { documentId: v.id('uploadedDocuments') },
  returns: v.boolean(),
  handler: async (ctx, { documentId }) => {
    const userId = await requireAuth(ctx)

    const doc = await ctx.db.get('uploadedDocuments', documentId)
    if (!doc) throw new Error('Document not found')
    if (doc.userId !== userId) throw new Error('Not authorized')

    // Skip if already extracting or already extracted
    if (doc.status === 'extracting' || doc.status === 'extracted') return false

    const extractionStartedAt = Date.now()

    // Atomically claim: set status + timestamp in one mutation
    await ctx.db.patch('uploadedDocuments', documentId, {
      status: 'extracting',
      extractionStartedAt,
      errorMessage: undefined,
    })

    // Schedule the internal action (runs immediately, but client isn't blocked)
    await ctx.scheduler.runAfter(0, internal.extraction.pdf.extractFromPdf, {
      documentId,
      extractionStartedAt,
    })

    return true
  },
})

// Atomically claim a document for extraction (compare-and-swap).
// Returns true if claimed, false if already being extracted.
// Kept for backward compat — no longer called from the action.
export const claimForExtraction = internalMutation({
  args: { documentId: v.id('uploadedDocuments') },
  returns: v.boolean(),
  handler: async (ctx, { documentId }) => {
    const doc = await ctx.db.get('uploadedDocuments', documentId)
    if (!doc) return false
    if (doc.status === 'extracting' || doc.status === 'extracted') return false
    await ctx.db.patch('uploadedDocuments', documentId, {
      status: 'extracting',
    })
    return true
  },
})

// Update document status (used during extraction flow).
// Skips the write if extractionStartedAt doesn't match (stale handler).
export const updateDocumentStatus = internalMutation({
  args: {
    documentId: v.id('uploadedDocuments'),
    status: v.union(
      v.literal('pending_extraction'),
      v.literal('extracting'),
      v.literal('extracted'),
      v.literal('failed'),
    ),
    errorMessage: v.optional(v.string()),
    extractionStartedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { documentId, status, errorMessage, extractionStartedAt },
  ) => {
    const doc = await ctx.db.get('uploadedDocuments', documentId)
    if (!doc) return null

    // CAS guard: if a timestamp was provided, verify it matches the current doc
    if (
      extractionStartedAt !== undefined &&
      doc.extractionStartedAt !== extractionStartedAt
    ) {
      // Stale handler — a newer extraction attempt owns this document
      return null
    }

    await ctx.db.patch('uploadedDocuments', documentId, {
      status,
      ...(errorMessage !== undefined && { errorMessage }),
    })
    return null
  },
})

// Save extraction results to document.
// Skips the write if extractionStartedAt doesn't match (stale handler).
export const saveExtractionResult = internalMutation({
  args: {
    documentId: v.id('uploadedDocuments'),
    extractedData: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      location: v.optional(v.string()),
      education: v.optional(
        v.array(
          v.object({
            institution: v.string(),
            degree: v.optional(v.string()),
            field: v.optional(v.string()),
            startYear: v.optional(v.number()),
            endYear: v.optional(v.number()),
            current: v.optional(v.boolean()),
          }),
        ),
      ),
      workHistory: v.optional(
        v.array(
          v.object({
            organization: v.string(),
            title: v.string(),
            startDate: v.optional(v.string()),
            endDate: v.optional(v.string()),
            current: v.optional(v.boolean()),
            description: v.optional(v.string()),
          }),
        ),
      ),
      skills: v.optional(v.array(v.string())),
      rawSkills: v.optional(v.array(v.string())),
    }),
    extractionStartedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, { documentId, extractedData, extractionStartedAt }) => {
    const doc = await ctx.db.get('uploadedDocuments', documentId)
    if (!doc) return null

    // CAS guard: if a timestamp was provided, verify it matches the current doc
    if (
      extractionStartedAt !== undefined &&
      doc.extractionStartedAt !== extractionStartedAt
    ) {
      // Stale handler — a newer extraction attempt owns this document
      return null
    }

    await ctx.db.patch('uploadedDocuments', documentId, {
      extractedData,
      status: 'extracted' as const,
    })
    return null
  },
})
