import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// Update document status (used during extraction flow)
export const updateDocumentStatus = internalMutation({
  args: {
    documentId: v.id("uploadedDocuments"),
    status: v.union(
      v.literal("pending_extraction"),
      v.literal("extracting"),
      v.literal("extracted"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { documentId, status, errorMessage }) => {
    await ctx.db.patch("uploadedDocuments", documentId, {
      status,
      ...(errorMessage && { errorMessage }),
    });
  },
});

// Save extraction results to document
export const saveExtractionResult = internalMutation({
  args: {
    documentId: v.id("uploadedDocuments"),
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
          })
        )
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
          })
        )
      ),
      skills: v.optional(v.array(v.string())),
      rawSkills: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { documentId, extractedData }) => {
    await ctx.db.patch("uploadedDocuments", documentId, {
      extractedData,
      status: "extracted" as const,
    });
  },
});
