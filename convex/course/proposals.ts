import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireAuth } from "../lib/auth";
import { requireOrgAdmin } from "./_helpers";
import type { Id } from "../_generated/dataModel";

const proposalTypes = [
  v.literal("comment"),
  v.literal("message"),
  v.literal("pairs"),
  v.literal("summary"),
  v.literal("flag"),
  v.literal("prompt"),
] as const;

/**
 * Create a proposal (internal — called by agent tools, not frontend).
 */
export const createProposal = internalMutation({
  args: {
    programId: v.id("programs"),
    type: v.union(...proposalTypes),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    content: v.string(),
  },
  returns: v.id("agentProposals"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentProposals", {
      ...args,
      status: "proposed",
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a proposal (public — called by agent via ConvexClient, requires org admin).
 */
export const createProposalFromAgent = mutation({
  args: {
    programId: v.id("programs"),
    type: v.union(...proposalTypes),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    content: v.string(),
  },
  returns: v.id("agentProposals"),
  handler: async (ctx, args) => {
    const program = await ctx.db.get("programs", args.programId);
    if (!program) throw new ConvexError("Program not found");
    await requireOrgAdmin(ctx, program.orgId);

    return await ctx.db.insert("agentProposals", {
      ...args,
      status: "proposed",
      createdAt: Date.now(),
    });
  },
});

/**
 * Approve a proposal. If type is 'comment', creates a facilitatorComments record.
 */
export const approveProposal = mutation({
  args: { proposalId: v.id("agentProposals") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get("agentProposals", proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");
    if (proposal.status !== "proposed") throw new ConvexError("Proposal is not in proposed status");

    const program = await ctx.db.get("programs", proposal.programId);
    if (!program) throw new ConvexError("Program not found");
    await requireOrgAdmin(ctx, program.orgId);

    const userId = await requireAuth(ctx);

    await ctx.db.patch("agentProposals", proposalId, {
      status: "approved",
      approvedBy: userId,
      approvedAt: Date.now(),
    });

    // Create facilitator comment if this is a comment proposal
    if (proposal.type === "comment" && proposal.targetId) {
      await ctx.db.insert("facilitatorComments", {
        promptResponseId: proposal.targetId as Id<"promptResponses">,
        programId: proposal.programId,
        authorId: userId,
        content: proposal.content,
        fromAgent: true,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Edit and approve a proposal. Creates facilitatorComments with edited content.
 */
export const editAndApproveProposal = mutation({
  args: {
    proposalId: v.id("agentProposals"),
    editedContent: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { proposalId, editedContent }) => {
    const proposal = await ctx.db.get("agentProposals", proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");
    if (proposal.status !== "proposed") throw new ConvexError("Proposal is not in proposed status");

    const program = await ctx.db.get("programs", proposal.programId);
    if (!program) throw new ConvexError("Program not found");
    await requireOrgAdmin(ctx, program.orgId);

    const userId = await requireAuth(ctx);

    await ctx.db.patch("agentProposals", proposalId, {
      status: "edited",
      editedContent,
      approvedBy: userId,
      approvedAt: Date.now(),
    });

    // Create facilitator comment with edited content if comment proposal
    if (proposal.type === "comment" && proposal.targetId) {
      await ctx.db.insert("facilitatorComments", {
        promptResponseId: proposal.targetId as Id<"promptResponses">,
        programId: proposal.programId,
        authorId: userId,
        content: editedContent,
        fromAgent: true,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Dismiss a proposal.
 */
export const dismissProposal = mutation({
  args: { proposalId: v.id("agentProposals") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get("agentProposals", proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");
    if (proposal.status !== "proposed") throw new ConvexError("Proposal is not in proposed status");

    const program = await ctx.db.get("programs", proposal.programId);
    if (!program) throw new ConvexError("Program not found");
    await requireOrgAdmin(ctx, program.orgId);

    await ctx.db.patch("agentProposals", proposalId, { status: "dismissed" });

    return { success: true };
  },
});

/**
 * Get proposals for a program, optionally filtered by status.
 */
export const getProposalsByProgram = query({
  args: {
    programId: v.id("programs"),
    status: v.optional(
      v.union(
        v.literal("proposed"),
        v.literal("approved"),
        v.literal("edited"),
        v.literal("dismissed"),
      ),
    ),
  },
  returns: v.any(),
  handler: async (ctx, { programId, status }) => {
    const program = await ctx.db.get("programs", programId);
    if (!program) return [];
    await requireOrgAdmin(ctx, program.orgId);

    let proposals;
    if (status) {
      proposals = await ctx.db
        .query("agentProposals")
        .withIndex("by_programId_and_status", (q) =>
          q.eq("programId", programId).eq("status", status),
        )
        .collect();
    } else {
      proposals = await ctx.db
        .query("agentProposals")
        .withIndex("by_programId", (q) => q.eq("programId", programId))
        .collect();
    }

    // Sort by createdAt descending
    return proposals.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get pending proposals for a specific target (e.g., a prompt response).
 */
export const getProposalsByTarget = query({
  args: { targetId: v.string() },
  returns: v.any(),
  handler: async (ctx, { targetId }) => {
    await requireAuth(ctx);

    const proposals = await ctx.db
      .query("agentProposals")
      .withIndex("by_targetId", (q) => q.eq("targetId", targetId))
      .collect();

    // Return only proposed (pending) proposals
    return proposals.filter((p) => p.status === "proposed");
  },
});
