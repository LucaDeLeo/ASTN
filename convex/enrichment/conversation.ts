"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// Career coach system prompt
const CAREER_COACH_PROMPT = `You are a friendly career coach helping someone build their AI safety career profile.

Your tone is:
- Warm and encouraging, like a supportive mentor
- Curious and exploratory ("Tell me more about...")
- Not interrogative or clinical

Your goal is to understand:
1. Their background and how they got interested in AI safety
2. Specific skills and experiences relevant to the field
3. What types of roles or opportunities they're seeking
4. What motivates them about AI safety work

Ask open-ended questions. After 3-8 exchanges, when you feel you have enough context,
say something like "I think I have a good picture of your background now! Let me
summarize what I've learned and we can update your profile."

Current profile context:
{profileContext}`;

// Message type from enrichmentMessages table
interface EnrichmentMessage {
  _id: string;
  _creationTime: number;
  profileId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

// Send message action - calls Claude and persists messages
export const sendMessage = action({
  args: {
    profileId: v.id("profiles"),
    message: v.string(),
  },
  handler: async (
    ctx,
    { profileId, message }
  ): Promise<{ message: string; shouldExtract: boolean }> => {
    // Get existing conversation (from queries.ts)
    const messages: EnrichmentMessage[] = await ctx.runQuery(
      internal.enrichment.queries.getMessages,
      { profileId }
    );

    // Get profile for context (from queries.ts)
    const profile = await ctx.runQuery(
      internal.enrichment.queries.getProfileInternal,
      { profileId }
    );

    // Build context string from profile
    const contextParts: string[] = [];
    if (profile?.name) contextParts.push(`Name: ${profile.name}`);
    if (profile?.location) contextParts.push(`Location: ${profile.location}`);
    if (profile?.headline) contextParts.push(`Headline: ${profile.headline}`);
    if (profile?.skills && profile.skills.length > 0) {
      contextParts.push(`Skills: ${profile.skills.join(", ")}`);
    }
    if (profile?.careerGoals) {
      contextParts.push(`Career Goals: ${profile.careerGoals}`);
    }
    if (profile?.aiSafetyInterests && profile.aiSafetyInterests.length > 0) {
      contextParts.push(
        `AI Safety Interests: ${profile.aiSafetyInterests.join(", ")}`
      );
    }

    const profileContext =
      contextParts.length > 0 ? contextParts.join("\n") : "New profile";

    // Save user message first
    await ctx.runMutation(internal.enrichment.queries.saveMessage, {
      profileId,
      role: "user",
      content: message,
    });

    // Build messages array for Claude API
    const claudeMessages = [
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call Claude Haiku
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20250514",
      max_tokens: 500,
      system: CAREER_COACH_PROMPT.replace("{profileContext}", profileContext),
      messages: claudeMessages,
    });

    // Extract text response
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save assistant message
    await ctx.runMutation(internal.enrichment.queries.saveMessage, {
      profileId,
      role: "assistant",
      content: assistantMessage,
    });

    // Check if assistant is ready to extract (signaling summarization)
    const lowerMessage = assistantMessage.toLowerCase();
    const shouldExtract =
      lowerMessage.includes("summarize") ||
      lowerMessage.includes("update your profile") ||
      lowerMessage.includes("good picture") ||
      lowerMessage.includes("what i've learned") ||
      lowerMessage.includes("what i learned");

    return {
      message: assistantMessage,
      shouldExtract,
    };
  },
});
