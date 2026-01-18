import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

// Get document by ID (internal use for extraction)
export const getDocument = internalQuery({
  args: { documentId: v.id("uploadedDocuments") },
  handler: async (ctx, { documentId }) => {
    return await ctx.db.get("uploadedDocuments", documentId);
  },
});

// Get skills taxonomy for matching
export const getSkillsTaxonomy = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("skillsTaxonomy").collect();
  },
});

// Get document with extraction status (for frontend polling)
export const getDocumentStatus = internalQuery({
  args: { documentId: v.id("uploadedDocuments") },
  handler: async (ctx, { documentId }) => {
    const doc = await ctx.db.get("uploadedDocuments", documentId);
    if (!doc) return null;
    return {
      status: doc.status,
      extractedData: doc.extractedData,
      errorMessage: doc.errorMessage,
    };
  },
});
