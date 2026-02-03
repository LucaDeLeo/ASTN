# Phase 4: Matching - Research

**Researched:** 2026-01-18
**Domain:** Smart matching between profiles and opportunities with LLM-generated explanations and recommendations
**Confidence:** HIGH

## Summary

Phase 4 implements smart matching between user profiles and opportunities using programmatic context construction (not vector search) with Claude LLM calls. The matching system will score opportunities against profiles, generate tier-based match explanations, estimate acceptance probabilities, and provide personalized recommendations.

Key findings:

1. **Profile and opportunity schemas are well-structured** - Rich data available for matching including skills, career goals, AI safety interests, education, work history, location preferences
2. **Established LLM patterns from Phase 3** - The enrichment conversation (conversation.ts, extraction.ts) provides a clear template for Node.js actions with Claude API calls, internal queries/mutations, and forced tool_choice for structured output
3. **Programmatic context construction is the approach** - Per PROJECT.md, no vector search - instead construct LLM prompts with profile + opportunity data directly
4. **Batch processing available but not needed initially** - Anthropic Batch API exists for async bulk processing, but for pilot scale (50-100 profiles, ~50-100 active opportunities) synchronous calls with caching are sufficient
5. **Tier-based matching confirmed** - Per 04-CONTEXT.md: "Great match" / "Good match" / "Worth exploring" tiers, not percentages

**Primary recommendation:** Build matching as a Convex Node.js action that programmatically constructs context from profile + opportunities, uses Claude with forced tool_choice to return structured match scores/explanations, and stores results for reactive display.

## Existing Code Analysis

### Profile Schema (from schema.ts)

Available fields for matching:

| Field                                      | Type                                                                     | Matching Relevance                           |
| ------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------- |
| `name`, `pronouns`, `location`, `headline` | string                                                                   | Location matching, personalization           |
| `education`                                | array of {institution, degree, field, startYear, endYear, current}       | Credential matching                          |
| `workHistory`                              | array of {organization, title, startDate, endDate, current, description} | Experience matching                          |
| `skills`                                   | string[] (from taxonomy)                                                 | Core skill matching                          |
| `careerGoals`                              | string                                                                   | Goal alignment                               |
| `aiSafetyInterests`                        | string[]                                                                 | Interest area matching                       |
| `seeking`                                  | string                                                                   | Role type preferences                        |
| `enrichmentSummary`                        | string                                                                   | Rich narrative context from LLM conversation |
| `hasEnrichmentConversation`                | boolean                                                                  | Profile depth indicator                      |
| `completedSections`                        | string[]                                                                 | Profile completeness                         |
| `privacySettings`                          | object                                                                   | Filter out hidden orgs                       |

**Key insight:** `enrichmentSummary` provides LLM-generated narrative that adds depth beyond structured fields. The combination of structured data (skills, education) + narrative (enrichmentSummary, careerGoals) gives rich context for matching.

### Opportunity Schema (from schema.ts)

Available fields for matching:

| Field                  | Type                                                                | Matching Relevance                   |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| `title`                | string                                                              | Role type inference                  |
| `organization`         | string                                                              | Org matching, privacy filtering      |
| `location`, `isRemote` | string, boolean                                                     | Location preference matching         |
| `roleType`             | string ("research", "engineering", "operations", "policy", "other") | Core role matching                   |
| `experienceLevel`      | string ("entry", "mid", "senior", "lead")                           | Experience matching                  |
| `description`          | string                                                              | Full job context                     |
| `requirements`         | string[]                                                            | Skills/qualification matching        |
| `salaryRange`          | string                                                              | Preference matching (if profile has) |
| `deadline`             | number                                                              | Urgency/relevance                    |
| `status`               | "active"/"archived"                                                 | Filter                               |

### LLM Patterns (from enrichment/)

**conversation.ts pattern:**

```typescript
"use node";  // Required for Anthropic SDK

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import Anthropic from "@anthropic-ai/sdk";

export const sendMessage = action({
  args: { profileId: v.id("profiles"), message: v.string() },
  handler: async (ctx, { profileId, message }) => {
    // 1. Fetch data via internal queries
    const messages = await ctx.runQuery(internal.enrichment.queries.getMessages, { profileId });
    const profile = await ctx.runQuery(internal.enrichment.queries.getProfileInternal, { profileId });

    // 2. Build context string programmatically
    const contextParts: string[] = [];
    if (profile?.name) contextParts.push(`Name: ${profile.name}`);
    // ... more fields

    // 3. Save state via internal mutations
    await ctx.runMutation(internal.enrichment.queries.saveMessage, { ... });

    // 4. Call Claude
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",  // Haiku for fast operations
      max_tokens: 500,
      system: SYSTEM_PROMPT.replace("{profileContext}", profileContext),
      messages: claudeMessages,
    });

    // 5. Process response and save
    // ...
  }
});
```

**extraction.ts pattern (forced tool_choice):**

```typescript
const profileExtractionTool: Anthropic.Tool = {
  name: 'extract_profile_info',
  description: 'Extract structured profile information from the conversation',
  input_schema: {
    type: 'object' as const,
    properties: {
      /* structured output schema */
    },
    required: ['skills_mentioned', 'career_interests'],
  },
}

const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  tools: [profileExtractionTool],
  tool_choice: { type: 'tool', name: 'extract_profile_info' }, // FORCED
  system: '...',
  messages: messages,
})

const toolUse = response.content.find((block) => block.type === 'tool_use')
if (toolUse && toolUse.type === 'tool_use') {
  return toolUse.input as ExtractionResult
}
```

**queries.ts pattern (internal queries/mutations):**

```typescript
import { internalMutation, internalQuery, query } from '../_generated/server'

export const getMessages = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

export const saveMessage = internalMutation({
  args: { profileId, role, content },
  handler: async (ctx, args) => {
    await ctx.db.insert('enrichmentMessages', {
      ...args,
      createdAt: Date.now(),
    })
  },
})
```

## Technical Approach

### Context Construction Strategy

The programmatic context construction should balance:

1. **Richness** - Enough context for accurate matching
2. **Token efficiency** - Keep within context limits, minimize cost
3. **Structure** - Clear sections for profile and opportunity data

**Profile context template:**

```
## Candidate Profile

### Background
Name: {name}
Location: {location}
Headline: {headline}

### Education
{education formatted as list}

### Work Experience
{workHistory formatted with titles, orgs, durations}

### Skills
{skills as comma-separated list}

### AI Safety Interests
{aiSafetyInterests as comma-separated list}

### Career Goals
{careerGoals}

### What They're Seeking
{seeking}

### Additional Context (from conversation)
{enrichmentSummary}
```

**Opportunity context template:**

```
## Opportunity

Title: {title}
Organization: {organization}
Location: {location} {isRemote ? "(Remote available)" : ""}
Role Type: {roleType}
Experience Level: {experienceLevel}

### Description
{description}

### Requirements
{requirements as bulleted list}

### Deadline
{deadline formatted or "Rolling"}
```

### Scoring Strategy

**Option A: Single call per opportunity** (simpler, more expensive)

- One LLM call per profile-opportunity pair
- Best for detailed explanations
- Use for top matches after pre-filtering

**Option B: Batch scoring call** (recommended)

- Single LLM call scores multiple opportunities for one profile
- Return array of {opportunityId, tier, score, explanation}
- More token-efficient
- Use Claude Sonnet for quality reasoning

**Recommended approach:**

1. Pre-filter opportunities (skip privacy-hidden orgs, expired deadlines)
2. Batch score 10-20 opportunities at a time with Claude Sonnet
3. Request structured output via forced tool_choice
4. Store match results in new `matches` table
5. Re-compute periodically or on profile/opportunity changes

### Model Selection

Per PROJECT.md and prior decisions:

- **Claude Sonnet 4.5** for matching quality/reasoning (match scoring, explanations, probability)
- **Claude Haiku 4.5** for bulk/fast operations (recommendations if separated)

Given the requirements for nuanced matching with explanations, **use Sonnet for all matching operations**. The pilot scale (50-100 profiles) doesn't require Haiku-level cost optimization.

### Match Result Schema

New table needed:

```typescript
matches: defineTable({
  profileId: v.id('profiles'),
  opportunityId: v.id('opportunities'),

  // Scoring
  tier: v.union(v.literal('great'), v.literal('good'), v.literal('exploring')),
  score: v.number(), // 0-100 internal score for sorting

  // Explanations (MATCH-02)
  explanation: v.object({
    strengths: v.array(v.string()), // Why this fits
    gap: v.optional(v.string()), // One actionable gap
  }),

  // Probability (MATCH-03)
  probability: v.object({
    interviewChance: v.string(), // "Strong", "Good", "Moderate"
    ranking: v.string(), // "Top 10%", "Top 20%", "Top 30%"
    confidence: v.string(), // "HIGH", "MEDIUM", "LOW"
  }),

  // Recommendations (MATCH-04)
  recommendations: v.array(
    v.object({
      type: v.string(), // "skill", "experience", "specific"
      action: v.string(), // The recommendation text
      priority: v.string(), // "high", "medium", "low"
    }),
  ),

  // Metadata
  isNew: v.boolean(), // For "new high-fit" prioritization
  computedAt: v.number(),
  modelVersion: v.string(), // Track which model generated
})
  .index('by_profile', ['profileId'])
  .index('by_profile_tier', ['profileId', 'tier'])
  .index('by_opportunity', ['opportunityId'])
```

### Matching Tool Schema

Forced tool_choice for structured output:

```typescript
const matchOpportunitiesTool: Anthropic.Tool = {
  name: 'score_opportunities',
  description:
    'Score and explain how well opportunities match a candidate profile',
  input_schema: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            opportunityId: { type: 'string' },
            tier: {
              type: 'string',
              enum: ['great', 'good', 'exploring', 'not_recommended'],
              description: 'Match quality tier',
            },
            score: {
              type: 'number',
              description: 'Numeric score 0-100 for sorting within tier',
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: '2-4 bullet points on why this fits',
            },
            gap: {
              type: 'string',
              description:
                'One actionable thing that would strengthen application',
            },
            interviewChance: {
              type: 'string',
              enum: ['Strong chance', 'Good chance', 'Moderate chance'],
              description: 'Likelihood of reaching interview stage',
            },
            ranking: {
              type: 'string',
              description:
                "Estimated percentile among applicants, e.g. 'Top 20%'",
            },
            recommendation: {
              type: 'object',
              properties: {
                specific: {
                  type: 'string',
                  description: 'One specific action for this role',
                },
                general: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '1-2 general growth areas',
                },
              },
            },
          },
          required: [
            'opportunityId',
            'tier',
            'score',
            'strengths',
            'interviewChance',
            'ranking',
          ],
        },
      },
      growthAreas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: "Category like 'Skills to build'",
            },
            items: { type: 'array', items: { type: 'string' } },
          },
        },
        description: 'Aggregated growth recommendations across all matches',
      },
    },
    required: ['matches', 'growthAreas'],
  },
}
```

## Key Decisions Needed

The planner will need to decide:

1. **When to compute matches**
   - On profile update? On new opportunity? Scheduled cron?
   - Recommendation: On-demand with caching, refresh on profile change

2. **Batch size for LLM calls**
   - How many opportunities per call?
   - Recommendation: 10-15 opportunities per batch to stay within token limits

3. **Match staleness policy**
   - How long are cached matches valid?
   - Recommendation: 24 hours, or immediate refresh on profile update

4. **UI route structure**
   - `/matches` as dedicated page? Integrated into opportunities?
   - Recommendation: Dedicated `/matches` page with tier sections

5. **Recommendations aggregation**
   - Same page as matches? Separate "Growth areas" section?
   - Per 04-CONTEXT.md: Both on match detail AND aggregated dashboard section

6. **Probability opt-out**
   - Per 04-CONTEXT.md: Claude's discretion on whether to implement
   - Recommendation: Defer to v2, keep simple for pilot

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── matching/
│   ├── compute.ts        # Node.js action - main matching logic
│   ├── queries.ts        # Internal queries for profile/opportunity data
│   ├── mutations.ts      # Store/update match results
│   └── prompts.ts        # System prompts and tool definitions
├── matches.ts            # Public queries for UI

src/
├── routes/
│   └── matches/
│       ├── index.tsx     # Main matches page with tier sections
│       └── $id.tsx       # Match detail with full explanation
├── components/
│   └── matches/
│       ├── MatchCard.tsx           # Card with tier badge, explanation preview
│       ├── MatchDetail.tsx         # Full explanation + recommendations
│       ├── MatchTierSection.tsx    # Section grouping by tier
│       ├── GrowthAreas.tsx         # Aggregated recommendations
│       └── ProbabilityBadge.tsx    # Interview chance + ranking display
```

### Pattern: Programmatic Batch Matching

```typescript
// convex/matching/compute.ts
'use node'

import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import Anthropic from '@anthropic-ai/sdk'
import {
  matchOpportunitiesTool,
  buildProfileContext,
  buildOpportunitiesContext,
} from './prompts'

export const computeMatchesForProfile = action({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    // 1. Get profile with all fields
    const profile = await ctx.runQuery(
      internal.matching.queries.getFullProfile,
      { profileId },
    )
    if (!profile) throw new Error('Profile not found')

    // 2. Get candidate opportunities (excluding hidden orgs, expired)
    const opportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs: profile.privacySettings?.hiddenFromOrgs || [] },
    )

    // 3. Build context
    const profileContext = buildProfileContext(profile)
    const opportunitiesContext = buildOpportunitiesContext(opportunities)

    // 4. Call Claude with forced tool_choice
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20241022', // Sonnet for quality
      max_tokens: 4096,
      tools: [matchOpportunitiesTool],
      tool_choice: { type: 'tool', name: 'score_opportunities' },
      system: MATCHING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${profileContext}\n\n---\n\n${opportunitiesContext}\n\nScore all opportunities for this candidate.`,
        },
      ],
    })

    // 5. Extract and save results
    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('No tool use in response')
    }

    const results = toolUse.input as MatchingResult

    // 6. Store matches
    await ctx.runMutation(internal.matching.mutations.saveMatches, {
      profileId,
      matches: results.matches,
      growthAreas: results.growthAreas,
    })

    return { matchCount: results.matches.length }
  },
})
```

## Don't Hand-Roll

| Problem                    | Don't Build                 | Use Instead                    | Why                                            |
| -------------------------- | --------------------------- | ------------------------------ | ---------------------------------------------- |
| Structured LLM output      | Regex parsing               | Forced tool_choice             | Guaranteed structure, existing pattern         |
| Profile context formatting | Ad-hoc string concatenation | Template function              | Consistency, maintainability                   |
| Match caching              | Custom TTL logic            | Convex timestamps + query      | DB handles staleness                           |
| Tier thresholds            | Hard-coded numbers          | LLM-determined tiers           | More nuanced, adaptive                         |
| Probability calibration    | Statistical models          | LLM estimation with disclaimer | Matches project approach, labeled experimental |

## Common Pitfalls

### Pitfall 1: Token Limits with Large Opportunity Batches

**What goes wrong:** Batch too many opportunities, context truncated or errors
**Why it happens:** Opportunity descriptions can be long
**How to avoid:** Limit to 10-15 opportunities per batch, summarize descriptions
**Warning signs:** Incomplete match arrays, API errors

### Pitfall 2: Stale Matches After Profile Update

**What goes wrong:** User updates profile but sees old matches
**Why it happens:** No invalidation on profile change
**How to avoid:** Clear/recompute matches on profile update mutation
**Warning signs:** Users complaining matches don't reflect changes

### Pitfall 3: Privacy Leakage Through Matches

**What goes wrong:** Matches shown for orgs user hid from
**Why it happens:** Privacy filter not applied before matching
**How to avoid:** Filter `hiddenFromOrgs` in opportunity query before LLM call
**Warning signs:** Users seeing matches for hidden organizations

### Pitfall 4: Inconsistent Explanation Tone

**What goes wrong:** Some explanations formal, others casual
**Why it happens:** No tone guidance in system prompt
**How to avoid:** Explicit tone instructions per 04-CONTEXT.md: "Encouraging tone"
**Warning signs:** User feedback about inconsistent voice

### Pitfall 5: Recommendations Too Generic

**What goes wrong:** Recommendations like "improve skills" not actionable
**Why it happens:** No specificity guidance in prompt
**How to avoid:** Require at least one specific action per 04-CONTEXT.md
**Warning signs:** Low engagement with recommendations

## Risks & Mitigations

| Risk                             | Likelihood | Impact | Mitigation                                               |
| -------------------------------- | ---------- | ------ | -------------------------------------------------------- |
| LLM rate limiting                | Medium     | High   | Implement retry with backoff, queue matching jobs        |
| Inconsistent scoring             | Low        | Medium | Use explicit tier definitions in prompt, validate output |
| High API costs                   | Low        | Medium | Pilot scale is small; batch efficiently; cache results   |
| Slow matching (user waits)       | Medium     | Medium | Background computation, show cached results immediately  |
| Probability estimates misleading | Medium     | Low    | Clear "experimental" labeling per requirements           |

## Open Questions

1. **Trigger for recomputation**
   - What we know: Need to refresh on profile/opportunity changes
   - What's unclear: Cron schedule? Event-driven? User-triggered?
   - Recommendation: Event-driven (on profile save) + daily cron for new opportunities

2. **New opportunities notification**
   - What we know: MATCH-01 says "receives" matches - implies proactive
   - What's unclear: Real-time? Batch? Email only (Phase 5)?
   - Recommendation: Compute on login/page load; email in Phase 5

3. **Match explanation length**
   - What we know: 04-CONTEXT.md says 2-5 bullets, Claude's discretion
   - What's unclear: How to enforce in structured output
   - Recommendation: Set min/max in tool schema, trust model

## Sources

### Primary (HIGH confidence)

- `/Users/luca/dev/ASTN/convex/schema.ts` - Profile and opportunity schemas
- `/Users/luca/dev/ASTN/convex/enrichment/conversation.ts` - LLM action pattern
- `/Users/luca/dev/ASTN/convex/enrichment/extraction.ts` - Forced tool_choice pattern
- `/Users/luca/dev/ASTN/.planning/phases/04-matching/04-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)

- `/Users/luca/dev/ASTN/.planning/PROJECT.md` - Tech stack, no vector search decision
- Anthropic tool use documentation - Forced tool_choice for structured output
- Exa web search - Batch processing patterns

### Tertiary (LOW confidence)

- Web search for LLM matching patterns - General approaches

## Metadata

**Confidence breakdown:**

- Existing code patterns: HIGH - Directly analyzed codebase
- Context construction: HIGH - Follows established enrichment pattern
- Scoring approach: HIGH - Forced tool_choice proven in extraction.ts
- UI/UX decisions: HIGH - Documented in 04-CONTEXT.md
- Timing/triggers: MEDIUM - Needs planner decision

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain, established patterns)
