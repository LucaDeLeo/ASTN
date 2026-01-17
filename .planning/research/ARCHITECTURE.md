# Architecture Research

**Domain:** Career Platform / Talent Matching System (AI Safety Focus)
**Researched:** 2026-01-17
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
|  +------------------+  +------------------+  +------------------+ |
|  |   Talent Portal  |  |   Org Dashboard  |  |   Admin Panel    | |
|  | (Profile, Match) |  | (Members, Stats) |  |  (Moderation)    | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
+-----------|--------------------|----------------------|-----------+
            |                    |                      |
            v                    v                      v
+------------------------------------------------------------------+
|                     CONVEX REAL-TIME LAYER                        |
|  +------------------+  +------------------+  +------------------+ |
|  |  Auth (Clerk)    |  | Profile Queries  |  | Match Queries    | |
|  |  + Convex Auth   |  | (Real-time sync) |  | (Live updates)   | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+  +------------------+ |
|  | Profile Mutations|  | Match Mutations  |  |  Org Mutations   | |
|  | (Transactional)  |  | (Transactional)  |  | (Transactional)  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
            |                    |                      |
+-----------v--------------------v----------------------v-----------+
|                       CONVEX ACTIONS                              |
|  +------------------+  +------------------+  +------------------+ |
|  | LLM Matching     |  | Profile Builder  |  | Job Aggregator   | |
|  | (Claude Sonnet)  |  | (Claude Haiku)   |  | (External APIs)  | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+  +------------------+ |
|  | Notification     |  |  Email Service   |  |  Scheduled Jobs  | |
|  | (Digests)        |  |  (Resend)        |  |  (Cron actions)  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
            |                    |                      |
+-----------v--------------------v----------------------v-----------+
|                    CONVEX DATA LAYER                              |
|  +------------------------------------------------------------+ |
|  |                    Convex Database                          | |
|  |  Documents: profiles, opportunities, organizations,         | |
|  |             matches, users, notifications                   | |
|  |  Real-time subscriptions, ACID transactions,               | |
|  |  Serializable isolation                                     | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Convex Implementation |
|-----------|----------------|------------------------|
| Profile Builder | Collect structured profile data via form + LLM conversation | Convex mutations + Claude Haiku 4.5 actions for structured extraction |
| Match Engine | Score profile-opportunity fit via programmatic context | Convex actions calling Claude Sonnet 4.5 with constructed context |
| LLM Gateway | Centralize all LLM calls, manage prompts | Convex actions wrapping Anthropic SDK |
| Job Aggregator | Sync opportunities from external sources | Convex scheduled actions (cron) fetching 80K Hours, aisafety.com |
| Notification Service | Send digests, alerts based on user preferences | Convex actions + Resend for email |
| Multi-tenant Layer | Org-scoped views of same data | Query-level filtering with organizationId + function-level auth checks |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, signup)
│   ├── (dashboard)/            # Authenticated routes
│   │   ├── profile/            # Profile creation/editing
│   │   ├── opportunities/      # Browse & match opportunities
│   │   └── org/                # Organization dashboard
│   └── layout.tsx
├── components/                 # React components
│   ├── profile/                # Profile-related components
│   ├── opportunities/          # Opportunity components
│   └── ui/                     # Generic UI (shadcn)
├── lib/                        # Client-side utilities
│   └── utils.ts                # Helper functions
└── types/                      # Shared TypeScript types

convex/                         # Convex backend (all server logic)
├── _generated/                 # Auto-generated types
├── schema.ts                   # Database schema definition
├── auth.ts                     # Auth configuration
├── profiles.ts                 # Profile queries & mutations
├── opportunities.ts            # Opportunity queries & mutations
├── organizations.ts            # Org queries & mutations
├── matching/                   # Matching logic
│   ├── engine.ts               # Core matching action
│   ├── context.ts              # Context construction for LLM
│   └── scoring.ts              # Score interpretation
├── llm/                        # LLM integration
│   ├── client.ts               # Anthropic client setup
│   ├── prompts.ts              # Prompt templates
│   └── extractors.ts           # Structured data extraction
├── aggregation/                # Job aggregation
│   ├── sources/                # Per-source adapters
│   │   ├── eightyK.ts          # 80,000 Hours adapter
│   │   └── aisafety.ts         # aisafety.com adapter
│   └── sync.ts                 # Sync orchestration action
├── notifications/              # Notification system
│   ├── digests.ts              # Digest generation
│   └── email.ts                # Email sending action
└── crons.ts                    # Scheduled job definitions
```

### Structure Rationale

- **app/**: Next.js App Router for file-based routing; minimal API routes since Convex handles backend
- **convex/**: All backend logic lives here; TypeScript functions that run server-side
- **convex/schema.ts**: Single source of truth for data model; generates types automatically
- **convex/matching/**: Core algorithm isolated; programmatic context construction pattern
- **convex/llm/**: Centralized LLM access via actions; prevents prompt sprawl
- **No separate API layer**: Convex functions are the API; real-time by default

## Architectural Patterns

### Pattern 1: Programmatic Context Construction for Matching

**What:** Build LLM context programmatically from structured data, let LLM score and explain matches
**When to use:** When you want full control over what context the LLM sees and transparent reasoning
**Trade-offs:** More explicit than embeddings; requires careful context design; easier to debug and iterate

**Approach:**
Instead of: embed profile -> embed opportunity -> vector similarity
Do: query relevant structured data -> construct LLM prompt with context -> LLM scores/explains match

**Example:**
```typescript
// convex/matching/context.ts
import { Doc } from "./_generated/dataModel";

export function constructMatchContext(
  profile: Doc<"profiles">,
  opportunity: Doc<"opportunities">
): string {
  return `
## Candidate Profile
- Current Role: ${profile.currentRole}
- Years of Experience: ${profile.yearsExperience}
- Technical Skills: ${profile.skills.join(", ")}
- AI Safety Interests: ${profile.aiSafetyInterests.join(", ")}
- Location Preference: ${profile.locationPreference}
- Career Goals: ${profile.careerGoals}
- Background Summary: ${profile.narrativeSummary}

## Opportunity
- Title: ${opportunity.title}
- Organization: ${opportunity.organization}
- Type: ${opportunity.type}
- Required Skills: ${opportunity.requiredSkills.join(", ")}
- Preferred Skills: ${opportunity.preferredSkills?.join(", ") || "None specified"}
- Experience Level: ${opportunity.experienceLevel}
- Location: ${opportunity.location}
- Description: ${opportunity.description}
- AI Safety Focus Area: ${opportunity.aiSafetyFocus}
  `.trim();
}

// convex/matching/engine.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

export const scoreMatch = action({
  args: { profileId: v.id("profiles"), opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const profile = await ctx.runQuery(internal.profiles.get, { id: args.profileId });
    const opportunity = await ctx.runQuery(internal.opportunities.get, { id: args.opportunityId });

    const context = constructMatchContext(profile, opportunity);

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `${MATCH_SCORING_PROMPT}\n\n${context}`
      }]
    });

    // Parse structured response
    const result = parseMatchResponse(response.content[0].text);

    // Store match result via mutation
    await ctx.runMutation(internal.matches.upsert, {
      profileId: args.profileId,
      opportunityId: args.opportunityId,
      score: result.score,
      explanation: result.explanation,
      strengthAreas: result.strengths,
      gapAreas: result.gaps,
      acceptanceProbability: result.acceptanceProbability
    });

    return result;
  }
});
```

### Pattern 2: LLM Structured Extraction via Tool Use

**What:** Use Claude tool use to extract structured data from conversation
**When to use:** Converting free-form LLM conversation into database-ready structured fields
**Trade-offs:** Reliable schema enforcement; requires well-designed prompts and tool definitions

**Example:**
```typescript
// convex/llm/extractors.ts
import Anthropic from "@anthropic-ai/sdk";

const profileExtractionTool = {
  name: "extract_profile",
  description: "Extract structured profile information from the conversation",
  input_schema: {
    type: "object" as const,
    properties: {
      current_role: { type: "string", description: "Current job title or role" },
      years_experience: { type: "number", description: "Years of relevant experience" },
      skills: {
        type: "array",
        items: { type: "string" },
        description: "Technical and professional skills"
      },
      ai_safety_interests: {
        type: "array",
        items: { type: "string" },
        description: "Specific AI safety areas of interest"
      },
      location_preference: {
        type: "string",
        enum: ["remote", "hybrid", "onsite"],
        description: "Work location preference"
      },
      career_goals: { type: "string", description: "Career aspirations and goals" }
    },
    required: ["current_role", "skills", "ai_safety_interests"]
  }
};

export async function extractProfileFromConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20250514",
    max_tokens: 1024,
    tools: [profileExtractionTool],
    tool_choice: { type: "tool", name: "extract_profile" },
    messages
  });

  const toolUse = response.content.find(block => block.type === "tool_use");
  if (toolUse && toolUse.type === "tool_use") {
    return toolUse.input as ExtractedProfile;
  }
  throw new Error("Failed to extract profile data");
}
```

### Pattern 3: Convex Query-Level Multi-Tenancy

**What:** Enforce organization data isolation at query/mutation level with auth checks
**When to use:** When orgs should only see their members' profiles and related data
**Trade-offs:** Explicit in code (easy to reason about); requires discipline to include in all functions

**Example:**
```typescript
// convex/profiles.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query with org scoping
export const listOrgProfiles = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Verify user has access to this org
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", identity.subject).eq("organizationId", args.organizationId)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this organization");

    // Return only profiles belonging to this org
    return await ctx.db
      .query("profiles")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  }
});

// Mutation with ownership check
export const updateProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    updates: v.object({
      currentRole: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      // ... other fields
    })
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.userId !== identity.subject) {
      throw new Error("Cannot update profile you don't own");
    }

    await ctx.db.patch(args.profileId, {
      ...args.updates,
      updatedAt: Date.now()
    });
  }
});
```

### Pattern 4: Hybrid Profile Data Model (Convex Documents)

**What:** Store both structured fields (queryable) and unstructured data (LLM context) in documents
**When to use:** When you need to filter/sort on some fields but preserve rich context for LLM
**Trade-offs:** Some data duplication; clear separation of concerns

**Example:**
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),  // From auth identity
    organizationId: v.optional(v.id("organizations")),

    // Structured fields (queryable, filterable)
    currentRole: v.string(),
    yearsExperience: v.number(),
    locationPreference: v.union(
      v.literal("remote"),
      v.literal("hybrid"),
      v.literal("onsite")
    ),
    skills: v.array(v.string()),
    aiSafetyInterests: v.array(v.string()),
    careerGoals: v.string(),

    // Unstructured context (for LLM matching)
    conversationHistory: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number()
    })),
    narrativeSummary: v.string(),  // LLM-generated summary of profile

    // Metadata
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_skills", ["skills"]),

  opportunities: defineTable({
    title: v.string(),
    organization: v.string(),
    type: v.union(
      v.literal("full-time"),
      v.literal("part-time"),
      v.literal("contract"),
      v.literal("internship"),
      v.literal("fellowship"),
      v.literal("grant")
    ),
    description: v.string(),
    requiredSkills: v.array(v.string()),
    preferredSkills: v.optional(v.array(v.string())),
    experienceLevel: v.string(),
    location: v.string(),
    aiSafetyFocus: v.string(),
    sourceUrl: v.string(),
    sourceId: v.string(),  // Dedupe key
    status: v.union(v.literal("active"), v.literal("closed"), v.literal("expired")),

    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"])
    .index("by_organization", ["organization"]),

  matches: defineTable({
    profileId: v.id("profiles"),
    opportunityId: v.id("opportunities"),
    score: v.number(),  // 0-100
    explanation: v.string(),
    strengthAreas: v.array(v.string()),
    gapAreas: v.array(v.string()),
    acceptanceProbability: v.number(),  // 0-1

    // User feedback
    userFeedback: v.optional(v.union(
      v.literal("interested"),
      v.literal("not_interested"),
      v.literal("applied")
    )),

    computedAt: v.number(),
    version: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_profile_score", ["profileId", "score"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),

    createdAt: v.number()
  })
    .index("by_slug", ["slug"]),

  memberships: defineTable({
    userId: v.string(),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("member")),

    createdAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"])
    .index("by_user_org", ["userId", "organizationId"])
});
```

## Data Flow

### Profile Creation Flow

```
[User starts profile]
       |
       v
[Form collects structured data]
       |
       v
[Convex mutation saves initial profile]
       |
       v (real-time sync to client)
[LLM conversation for enrichment] (Convex action + Claude Haiku 4.5)
       |
       v (Tool Use extraction)
[Extract additional structured fields]
       |
       v
[Convex mutation updates profile with enriched data]
       |
       v
[Generate narrative summary] (Haiku 4.5)
       |
       v
[Trigger initial match computation] (async action)
```

### Matching Flow (Programmatic Context)

```
[User requests matches / New opportunity triggers recompute]
       |
       v
[Query profile data from Convex]
       |
       v
[Query active opportunities from Convex]
       |
       v (for each opportunity)
[Construct match context programmatically]
  - Profile: role, skills, interests, goals, narrative
  - Opportunity: requirements, description, focus area
       |
       v
[Call Claude Sonnet 4.5 with context + scoring prompt]
       |
       v
[Parse structured response: score, explanation, strengths, gaps]
       |
       v
[Convex mutation stores match results]
       |
       v (real-time sync)
[Client receives updated matches automatically]
```

### Opportunity Aggregation Flow

```
[Convex cron triggers daily/hourly]
       |
       v
[Convex action: Fetch from 80K Hours] <--> [Convex action: Fetch from aisafety.com]
       |                                          |
       v                                          v
[Parse & normalize]                       [Parse & normalize]
       |                                          |
       +------------------+-------------------+
                          |
                          v
[Deduplicate via sourceId index]
       |
       v
[Convex mutation: Upsert opportunities]
       |
       v (real-time sync to subscribed clients)
[Queue match recomputation for affected profiles] (internal action)
```

### Key Data Flows

1. **Profile -> Match Context:** Profile data (structured + narrative) formatted into prompt context for LLM scoring
2. **Opportunity -> Match Context:** Job descriptions formatted with requirements for LLM evaluation
3. **Match Computation:** Profile context + Opportunity context -> Claude Sonnet 4.5 -> score + explanation
4. **Real-time Updates:** All Convex queries auto-subscribe; matches update in UI instantly when computed
5. **Notification Trigger:** High-score new matches -> queue notification action -> batch into digest or send immediately

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 profiles | Default Convex fine. Compute matches on-demand. Real-time works great. |
| 500-5K profiles | Pre-compute matches via scheduled actions. Cache top matches in dedicated table. |
| 5K-50K profiles | Batch match computation. Prioritize active users. Consider match staleness vs freshness tradeoffs. |
| 50K+ profiles | Tiered matching (quick filter -> detailed match). Geographic/interest-based sharding of computation. |

### Scaling Priorities

1. **First bottleneck:** LLM API calls for match scoring/explanations. Mitigation: Cache match results, batch computation in off-peak, use Haiku for pre-filtering before Sonnet for detailed scoring.
2. **Second bottleneck:** Match recomputation volume when new opportunities arrive. Mitigation: Incremental matching (only recompute for profiles with relevant skills/interests).
3. **Third bottleneck:** Real-time subscription fan-out at scale. Mitigation: Convex handles this well; consider pagination for large result sets.

## Anti-Patterns

### Anti-Pattern 1: Storing Only Structured Profile Data

**What people do:** Extract structured fields from LLM conversation, discard conversation history
**Why it's wrong:** Loses context needed for accurate LLM matching and explanations later
**Do this instead:** Store both structured fields (for queries/filtering) and raw conversation/narrative (for LLM context)

### Anti-Pattern 2: Generating Minimal Context for LLM Matching

**What people do:** Send only `{skills: [...], role: "..."}` to LLM for matching
**Why it's wrong:** Loses semantic richness; "wants to work on AI alignment at technical orgs" becomes just keywords
**Do this instead:** Construct rich context including narrative, goals, interests, and full opportunity description

### Anti-Pattern 3: Real-Time Match Computation for Every Request

**What people do:** Compute LLM match scoring on every /matches page load
**Why it's wrong:** Expensive (LLM calls), slow (user waits), wasteful (matches don't change that often)
**Do this instead:** Pre-compute matches in background actions, serve from matches table, recompute on profile/opportunity changes

### Anti-Pattern 4: Tenant Filtering Only at Query Level Without Auth

**What people do:** Filter by organizationId but don't verify user membership
**Why it's wrong:** Any user could pass any organizationId if they guess/enumerate IDs
**Do this instead:** Always verify auth identity + membership before returning org-scoped data

### Anti-Pattern 5: Scraping Without Fallback Strategy

**What people do:** Rely solely on web scraping for opportunity aggregation
**Why it's wrong:** Sites change structure; IP blocks; legal risk; unreliable data
**Do this instead:** Prefer APIs where available; build resilient scrapers with error handling; manual import as fallback

### Anti-Pattern 6: Synchronous LLM Calls in Mutations

**What people do:** Call Claude directly inside Convex mutations
**Why it's wrong:** Mutations must be deterministic in Convex; LLM calls are non-deterministic side effects
**Do this instead:** Use Convex actions for LLM calls, then call mutations to store results

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Anthropic (Claude Sonnet/Haiku 4.5) | Convex actions via SDK | Sonnet for detailed matching, Haiku for extraction/conversation |
| 80,000 Hours Job Board | Convex action with scraper | No known public API; build resilient scraper with rate limiting |
| aisafety.com | Convex action with scraper | No known public API; coordinate with maintainers if possible |
| Email (Resend) | Convex action | For digests, alerts, notifications |
| Auth (Clerk + Convex Auth) | Convex auth integration | Handle user sessions, org membership |

### Internal Boundaries (Convex)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Queries <-> Mutations | Direct in-process | Same Convex deployment; real-time sync automatic |
| Mutations <-> Actions | `ctx.runMutation` from actions | Actions call mutations to persist side-effect results |
| Actions <-> External | HTTP/SDK calls | LLM APIs, scrapers, email services |
| Scheduled Jobs <-> Actions | Cron definitions in crons.ts | Background work runs as actions |

## Build Order Implications

Based on component dependencies, recommended implementation order:

### Phase 1: Foundation (Must build first)
1. **Convex schema** - Core tables (users, profiles, opportunities, organizations)
2. **Auth integration** - Clerk + Convex auth, user sessions
3. **Basic profile CRUD** - Form-based profile creation (no LLM yet)

### Phase 2: Core Matching (Depends on Phase 1)
4. **Opportunity model + manual import** - Get some opportunities in the system
5. **Context construction** - Build the profile+opportunity context formatter
6. **Basic matching action** - Claude Sonnet 4.5 scoring with constructed context

### Phase 3: LLM Enhancement (Depends on Phase 2)
7. **LLM conversation for profile** - Enrich profiles via Haiku conversation
8. **Match explanations** - Detailed reasoning from Sonnet
9. **Acceptance probability** - LLM-estimated fit scores

### Phase 4: Multi-Tenant + Aggregation (Can parallel with Phase 3)
10. **Org membership model** - memberships table, auth checks
11. **Org dashboard** - View members, stats with proper scoping
12. **Job aggregation** - Scheduled actions syncing from 80K Hours, aisafety.com

### Phase 5: Engagement (Depends on Phase 3+4)
13. **Notification system** - Digests, alerts via Resend
14. **Match caching** - Pre-compute and store in matches table
15. **Analytics** - Usage tracking, match quality metrics

## Sources

### Convex Architecture
- [How Convex Works](https://stack.convex.dev/how-convex-works)
- [Convex Overview](https://docs.convex.dev/understanding/)
- [Components for Backend](https://stack.convex.dev/backend-components)
- [Horizontally Scaling Functions](https://stack.convex.dev/horizontally-scaling-functions)
- [Convex Functions Documentation](https://docs.convex.dev/functions)

### Matching & Recommendation Patterns
- [Algorithms and Architecture for Job Recommendations (O'Reilly/Indeed)](https://www.oreilly.com/content/algorithms-and-architecture-for-job-recommendations/)
- [System Design for Recommendations and Search (Eugene Yan)](https://eugeneyan.com/writing/system-design-for-discovery/)

### LLM Integration
- [AI Hiring with LLMs: Multi-Agent Framework (arXiv)](https://arxiv.org/html/2504.02870v1)
- [How to Use LLMs in Recruitment (HeroHunt)](https://www.herohunt.ai/blog/how-to-use-llms-in-recruitment)

### Notification Systems
- [Design a Notification System (Medium)](https://medium.com/@bangermadhur/design-a-notification-system-a-complete-system-design-guide-3b20d49298de)

### Job Board Aggregation
- [Job Board Scraping Guide 2025 (Job Boardly)](https://www.jobboardly.com/blog/job-board-scraping-complete-guide-2025)
- [80,000 Hours Job Board](https://jobs.80000hours.org/)
- [AISafety.com Jobs](https://www.aisafety.com/jobs)

---
*Architecture research for: AI Safety Talent Network (ASTN)*
*Researched: 2026-01-17*
*Updated: 2026-01-17 - Convex backend, programmatic matching (no vector search), Claude Sonnet/Haiku 4.5*
