import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Helper: Require org admin
async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">
): Promise<Doc<"orgMemberships">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .first();

  if (!membership) throw new Error("Not a member of this organization");
  if (membership.role !== "admin") throw new Error("Admin access required");

  return membership;
}

// Helper: Generate URL-safe slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Get all programs for an org
export const getOrgPrograms = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, { orgId, status }) => {
    await requireOrgAdmin(ctx, orgId);

    let programs;
    if (status) {
      programs = await ctx.db
        .query("programs")
        .withIndex("by_org_status", (q) =>
          q.eq("orgId", orgId).eq("status", status)
        )
        .collect();
    } else {
      programs = await ctx.db
        .query("programs")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }

    // Add participant counts
    const programsWithCounts = await Promise.all(
      programs.map(async (program) => {
        const participants = await ctx.db
          .query("programParticipation")
          .withIndex("by_program_status", (q) =>
            q.eq("programId", program._id).eq("status", "enrolled")
          )
          .collect();

        return {
          ...program,
          participantCount: participants.length,
        };
      })
    );

    return programsWithCounts;
  },
});

// Create a new program
export const createProgram = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("reading_group"),
      v.literal("fellowship"),
      v.literal("mentorship"),
      v.literal("cohort"),
      v.literal("workshop_series"),
      v.literal("custom")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    enrollmentMethod: v.union(
      v.literal("admin_only"),
      v.literal("self_enroll"),
      v.literal("approval_required")
    ),
    maxParticipants: v.optional(v.number()),
    completionCriteria: v.optional(
      v.object({
        type: v.union(
          v.literal("attendance_count"),
          v.literal("attendance_percentage"),
          v.literal("manual")
        ),
        requiredCount: v.optional(v.number()),
        requiredPercentage: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const adminMembership = await requireOrgAdmin(ctx, args.orgId);

    // Generate unique slug
    let slug = generateSlug(args.name);
    const existingSlug = await ctx.db
      .query("programs")
      .withIndex("by_org_slug", (q) =>
        q.eq("orgId", args.orgId).eq("slug", slug)
      )
      .first();

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const now = Date.now();
    const programId = await ctx.db.insert("programs", {
      orgId: args.orgId,
      name: args.name,
      slug,
      description: args.description,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "planning",
      enrollmentMethod: args.enrollmentMethod,
      maxParticipants: args.maxParticipants,
      completionCriteria: args.completionCriteria,
      linkedEventIds: [],
      createdBy: adminMembership._id,
      createdAt: now,
      updatedAt: now,
    });

    return { programId, slug };
  },
});

// Update a program
export const updateProgram = mutation({
  args: {
    programId: v.id("programs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    enrollmentMethod: v.optional(
      v.union(
        v.literal("admin_only"),
        v.literal("self_enroll"),
        v.literal("approval_required")
      )
    ),
    maxParticipants: v.optional(v.number()),
    completionCriteria: v.optional(
      v.object({
        type: v.union(
          v.literal("attendance_count"),
          v.literal("attendance_percentage"),
          v.literal("manual")
        ),
        requiredCount: v.optional(v.number()),
        requiredPercentage: v.optional(v.number()),
      })
    ),
    linkedEventIds: v.optional(v.array(v.id("events"))),
  },
  handler: async (ctx, { programId, ...updates }) => {
    const program = await ctx.db.get("programs", programId);
    if (!program) throw new Error("Program not found");

    await requireOrgAdmin(ctx, program.orgId);

    const patchData: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.description !== undefined)
      patchData.description = updates.description;
    if (updates.status !== undefined) patchData.status = updates.status;
    if (updates.startDate !== undefined)
      patchData.startDate = updates.startDate;
    if (updates.endDate !== undefined) patchData.endDate = updates.endDate;
    if (updates.enrollmentMethod !== undefined)
      patchData.enrollmentMethod = updates.enrollmentMethod;
    if (updates.maxParticipants !== undefined)
      patchData.maxParticipants = updates.maxParticipants;
    if (updates.completionCriteria !== undefined)
      patchData.completionCriteria = updates.completionCriteria;
    if (updates.linkedEventIds !== undefined)
      patchData.linkedEventIds = updates.linkedEventIds;

    await ctx.db.patch("programs", programId, patchData);

    return { success: true };
  },
});

// Delete a program (soft delete by archiving)
export const deleteProgram = mutation({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get("programs", programId);
    if (!program) throw new Error("Program not found");

    await requireOrgAdmin(ctx, program.orgId);

    // Archive instead of hard delete
    await ctx.db.patch("programs", programId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
