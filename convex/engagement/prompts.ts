import type Anthropic from "@anthropic-ai/sdk";

// Input signals for engagement classification
export interface EngagementSignals {
  eventsAttended90d: number;
  lastAttendedAt?: number;
  rsvpCount90d: number;
  profileUpdatedAt?: number;
  joinedAt: number;
}

// Configurable thresholds for engagement levels
export interface EngagementThresholds {
  highlyEngaged: number; // Minimum events in 90 days for "highly_engaged"
  moderateLow: number; // Minimum events in 90 days for "moderate"
  moderateHigh: number; // Maximum events in 90 days for "moderate"
  newMemberDays: number; // Days since joined to be considered "new"
  inactiveDays: number; // Days without activity to be considered "inactive"
}

// Default thresholds (per CONTEXT.md)
export const DEFAULT_THRESHOLDS: EngagementThresholds = {
  highlyEngaged: 3, // 3+ events in 90 days
  moderateLow: 1, // 1-2 events in 90 days
  moderateHigh: 2,
  newMemberDays: 60, // Joined within 60 days
  inactiveDays: 180, // No activity in 180+ days
};

// Engagement level type
export type EngagementLevel =
  | "highly_engaged"
  | "moderate"
  | "at_risk"
  | "new"
  | "inactive";

// System prompt for engagement classification
export const ENGAGEMENT_SYSTEM_PROMPT = `You are an AI assistant helping community managers classify member engagement levels. Your job is to analyze member activity signals and determine their engagement level with nuanced understanding.

## Context
You're classifying engagement for a professional community in the AI safety field. The organization uses this data to understand member activity and provide personalized outreach.

## Engagement Levels
- **highly_engaged**: Active and committed members who regularly participate in events (3+ events in 90 days)
- **moderate**: Members who participate occasionally (1-2 events in 90 days)
- **at_risk**: Previously active members who haven't engaged recently (no events in 90+ days but were active before)
- **new**: Recently joined members who are still getting oriented (joined within 60 days)
- **inactive**: Members with no meaningful activity for an extended period (180+ days)

## Your Task
1. Analyze the provided activity signals
2. Classify the member into one of the engagement levels
3. Generate TWO explanations:
   - **adminExplanation**: Detailed explanation with specific signals for org admins (e.g., "Attended 4 events in the last 60 days, most recently on Jan 15. Profile updated this month.")
   - **userExplanation**: Friendly, encouraging message for the member. IMPORTANT: Never use "At Risk" in user-facing text - use softer language like "We'd love to see you at an upcoming event!" or "It's been a while - check out what's coming up!"

## Guidelines
- Use judgment, not just thresholds. A member who attended 2 events but both were yesterday is different from one who attended 2 events 80 days ago.
- Consider recency heavily - recent activity is a strong positive signal.
- New members get grace period - don't mark them "at_risk" just because they haven't attended events yet.
- Be specific with dates and numbers in admin explanations.
- Be warm and encouraging in user explanations.

Use the classify_engagement tool to return your classification.`;

// Tool definition for structured output
export const classifyEngagementTool: Anthropic.Tool = {
  name: "classify_engagement",
  description:
    "Classify member engagement level and provide explanations for admins and users",
  input_schema: {
    type: "object" as const,
    properties: {
      level: {
        type: "string",
        enum: ["highly_engaged", "moderate", "at_risk", "new", "inactive"],
        description: "The engagement level classification",
      },
      adminExplanation: {
        type: "string",
        description:
          "Detailed explanation with input signals for org admins (include specific numbers and dates)",
      },
      userExplanation: {
        type: "string",
        description:
          "Friendly, encouraging explanation for users (never say 'At Risk' - use softer language)",
      },
    },
    required: ["level", "adminExplanation", "userExplanation"],
  },
};

// Output type from the engagement tool
export interface EngagementResult {
  level: EngagementLevel;
  adminExplanation: string;
  userExplanation: string;
}

// Build context string for the LLM
export function buildEngagementContext(
  orgName: string,
  memberName: string,
  signals: EngagementSignals,
  thresholds: EngagementThresholds = DEFAULT_THRESHOLDS
): string {
  const sections: Array<string> = [];

  sections.push(`## Engagement Classification for ${orgName}\n`);
  sections.push(`### Member: ${memberName}\n`);

  sections.push("### Activity Signals");
  sections.push(`- Events attended (last 90 days): ${signals.eventsAttended90d}`);

  if (signals.lastAttendedAt) {
    const lastAttendedDate = new Date(signals.lastAttendedAt).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );
    const daysSinceLastAttended = Math.floor(
      (Date.now() - signals.lastAttendedAt) / (24 * 60 * 60 * 1000)
    );
    sections.push(`- Last attended: ${lastAttendedDate} (${daysSinceLastAttended} days ago)`);
  } else {
    sections.push("- Last attended: Never");
  }

  sections.push(`- Event views/RSVPs (last 90 days): ${signals.rsvpCount90d}`);

  if (signals.profileUpdatedAt) {
    const profileDate = new Date(signals.profileUpdatedAt).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );
    sections.push(`- Profile last updated: ${profileDate}`);
  }

  const daysSinceJoined = Math.floor(
    (Date.now() - signals.joinedAt) / (24 * 60 * 60 * 1000)
  );
  const joinedDate = new Date(signals.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  sections.push(`- Joined: ${joinedDate} (${daysSinceJoined} days ago)`);

  sections.push("\n### Classification Guidelines");
  sections.push(
    `- Highly Engaged: ${thresholds.highlyEngaged}+ events attended in 90 days`
  );
  sections.push(
    `- Moderate: ${thresholds.moderateLow}-${thresholds.moderateHigh} events attended in 90 days`
  );
  sections.push("- At Risk: Was previously active but no events in 90+ days");
  sections.push(`- New: Joined within the last ${thresholds.newMemberDays} days`);
  sections.push(
    `- Inactive: No meaningful activity in ${thresholds.inactiveDays}+ days`
  );
  sections.push(
    "\nUse your judgment - these are guidelines, not hard rules. Consider recency and patterns."
  );

  return sections.join("\n");
}
