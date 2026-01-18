import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * Generate a one-time upload URL for file uploads.
 * The URL expires in 1 hour.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save uploaded document metadata after file is uploaded to storage.
 * Creates a record with "pending_extraction" status for Phase 8 processing.
 */
export const saveDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const documentId = await ctx.db.insert("uploadedDocuments", {
      userId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      status: "pending_extraction",
      uploadedAt: Date.now(),
    });

    return documentId;
  },
});
