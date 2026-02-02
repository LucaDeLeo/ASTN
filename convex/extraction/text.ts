"use node";

import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { FIELD_LIMITS } from "../lib/limits";
import { matchSkillsToTaxonomy } from "./skills";
import { EXTRACTION_SYSTEM_PROMPT, extractProfileTool } from "./prompts";
import { documentExtractionResultSchema } from "./validation";
import type { ExtractionResult } from "./prompts";

const MODEL_VERSION = "claude-haiku-4-5-20251001";
const MAX_RETRIES = 3;

export const extractFromText = action({
  args: {
    text: v.string(),
    profileId: v.optional(v.id("profiles")), // Optional: link to profile for context
  },
  handler: async (ctx, { text }) => {
    // Input length limit
    if (text.length > FIELD_LIMITS.documentText) {
      throw new Error("Content too long to process");
    }

    // 1. Extract with retry
    const extractedData = await extractWithRetry(text);

    // 2. Match skills to taxonomy
    const taxonomy = await ctx.runQuery(
      internal.extraction.queries.getSkillsTaxonomy
    );
    const matchedSkills = matchSkillsToTaxonomy(
      extractedData.rawSkills || [],
      taxonomy
    );

    // 3. Return results (no document to update for text extraction)
    return {
      success: true,
      extractedData: { ...extractedData, skills: matchedSkills },
    };
  },
});

async function extractWithRetry(text: string): Promise<ExtractionResult> {
  const anthropic = new Anthropic();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL_VERSION,
        max_tokens: 4096,
        tools: [extractProfileTool],
        tool_choice: { type: "tool", name: "extract_profile_info" },
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Extract the profile information from this resume/CV:\n\n<document_content>\n${text}\n</document_content>`,
          },
        ],
      });

      const toolUse = response.content.find((block) => block.type === "tool_use");
      if (!toolUse) {
        throw new Error("No tool use in Claude response");
      }

      const rawInput = (toolUse as { type: "tool_use"; input: unknown }).input;
      const parseResult = documentExtractionResultSchema.safeParse(rawInput);
      if (!parseResult.success) {
        console.error(
          "[LLM_VALIDATION_FAIL] text extraction",
          JSON.stringify(parseResult.error.issues)
        );
      }
      return (parseResult.success ? parseResult.data : rawInput) as ExtractionResult;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("Extraction failed after retries");
}
