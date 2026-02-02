"use node";

import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireAuth } from "../lib/auth";

// Tool definition for profile extraction
const profileExtractionTool: Anthropic.Tool = {
  name: "extract_profile_info",
  description: "Extract structured profile information from the conversation",
  input_schema: {
    type: "object" as const,
    properties: {
      skills_mentioned: {
        type: "array",
        items: { type: "string" },
        description: "Technical and professional skills mentioned by the user",
      },
      career_interests: {
        type: "array",
        items: { type: "string" },
        description: "AI safety areas and topics the user is interested in",
      },
      career_goals: {
        type: "string",
        description: "Summary of the user's career aspirations and goals",
      },
      background_summary: {
        type: "string",
        description: "Brief summary of professional and educational background",
      },
      seeking: {
        type: "string",
        description:
          "What the user is looking for (roles, opportunities, mentorship, etc.)",
      },
    },
    required: ["skills_mentioned", "career_interests"],
  },
};

// Extraction result type
export interface ExtractionResult {
  skills_mentioned: Array<string>;
  career_interests: Array<string>;
  career_goals?: string;
  background_summary?: string;
  seeking?: string;
}

// Extract structured data from conversation
export const extractFromConversation = action({
  args: {
    profileId: v.id("profiles"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, { profileId, messages }): Promise<ExtractionResult> => {
    // Auth + ownership check
    const userId = await requireAuth(ctx);
    const profile = await ctx.runQuery(
      internal.enrichment.queries.getProfileInternal,
      { profileId }
    );
    if (!profile || profile.userId !== userId) {
      throw new Error("Not authorized");
    }

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [profileExtractionTool],
      tool_choice: { type: "tool", name: "extract_profile_info" },
      system: `You are extracting structured profile information from a career coaching conversation about AI safety careers.
Extract all relevant details that were discussed. Be thorough but accurate - only include information that was actually mentioned.
For skills, include both technical skills (programming languages, ML frameworks) and domain skills (research areas, methodologies).
For career interests, focus on specific AI safety topics and research areas mentioned.`,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Find the tool use block
    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (toolUse) {
      return toolUse.input as ExtractionResult;
    }

    throw new Error("Failed to extract profile data - no tool use in response");
  },
});
