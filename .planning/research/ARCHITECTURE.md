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
+-----------v--------------------v----------------------v-----------+
|                          API LAYER                                |
|  +------------------+  +------------------+  +------------------+ |
|  |  Auth Service    |  |  Profile API     |  |  Matching API    | |
|  | (Clerk/Supabase) |  | (CRUD, Version)  |  | (Score, Explain) | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+  +------------------+ |
|  |  LLM Gateway     |  |  Notification    |  |  Aggregation     | |
|  | (Conversation)   |  |  (Digest, Alert) |  |  (Jobs Sync)     | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
            |                    |                      |
+-----------v--------------------v----------------------v-----------+
|                      PROCESSING LAYER                             |
|  +------------------+  +------------------+  +------------------+ |
|  | Profile Builder  |  | Match Engine     |  | Job Aggregator   | |
|  | (Form + LLM)     |  | (Retrieval+Rank) |  | (Scrape + API)   | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+  +------------------+ |
|  |  Embedding Gen   |  |  LLM Reasoning   |  |  Batch Jobs      | |
|  | (Profile Vectors)|  | (Explanations)   |  | (Daily Sync)     | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
            |                    |                      |
+-----------v--------------------v----------------------v-----------+
|                        DATA LAYER                                 |
|  +--------------------+  +-------------------+  +---------------+ |
|  |    PostgreSQL      |  |  Vector Store     |  |     Queue     | |
|  | (Profiles, Jobs,   |  | (Embeddings for   |  | (Background   | |
|  |  Orgs, Matches)    |  |  Semantic Search) |  |  Jobs)        | |
|  +--------------------+  +-------------------+  +---------------+ |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Profile Builder | Collect structured profile data via form + LLM conversation | Next.js forms + OpenAI Function Calling for structured extraction |
| Match Engine | Score profile-opportunity fit, rank results | Two-stage: vector retrieval (pgvector) + LLM re-ranking |
| LLM Gateway | Centralize all LLM calls, manage prompts, rate limits | Vercel AI SDK or custom service wrapping OpenAI/Anthropic |
| Job Aggregator | Sync opportunities from external sources | Background jobs (cron/queue) fetching 80K Hours, aisafety.com |
| Notification Service | Send digests, alerts based on user preferences | Email (Resend), in-app (polling or WebSockets) |
| Multi-tenant Layer | Org-scoped views of same data | PostgreSQL Row-Level Security with organization_id |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, signup)
│   ├── (dashboard)/            # Authenticated routes
│   │   ├── profile/            # Profile creation/editing
│   │   ├── opportunities/      # Browse & match opportunities
│   │   └── org/                # Organization dashboard
│   ├── api/                    # API routes
│   │   ├── profile/            # Profile CRUD
│   │   ├── match/              # Matching endpoints
│   │   ├── llm/                # LLM conversation endpoints
│   │   └── webhooks/           # External webhooks
│   └── layout.tsx
├── lib/                        # Shared utilities
│   ├── db/                     # Database client, queries
│   │   ├── schema.ts           # Drizzle/Prisma schema
│   │   └── queries/            # Type-safe query functions
│   ├── llm/                    # LLM integration
│   │   ├── client.ts           # OpenAI/Anthropic client
│   │   ├── prompts/            # Prompt templates
│   │   └── extractors.ts       # Structured data extraction
│   ├── matching/               # Match scoring logic
│   │   ├── retrieval.ts        # Vector similarity search
│   │   ├── ranking.ts          # LLM-based re-ranking
│   │   └── explanation.ts      # Match explanation generation
│   └── aggregation/            # Job aggregation
│       ├── sources/            # Per-source adapters
│       └── sync.ts             # Sync orchestration
├── components/                 # React components
│   ├── profile/                # Profile-related components
│   ├── opportunities/          # Opportunity components
│   └── ui/                     # Generic UI (shadcn)
├── types/                      # TypeScript types
└── jobs/                       # Background jobs
    ├── aggregate-jobs.ts       # Fetch external opportunities
    ├── generate-matches.ts     # Compute match scores
    └── send-digests.ts         # Notification digests
```

### Structure Rationale

- **app/**: Next.js App Router for file-based routing with (groups) for layout organization
- **lib/**: Business logic separated from UI; enables testing and reuse
- **lib/db/**: Colocate schema and queries; use Drizzle for type-safe SQL
- **lib/llm/**: Centralized LLM access prevents prompt sprawl
- **lib/matching/**: Core algorithm isolated from API layer
- **jobs/**: Background work separate from request-response cycle

## Architectural Patterns

### Pattern 1: Two-Stage Matching (Retrieval + Ranking)

**What:** Split matching into fast retrieval (thousands to hundreds) then precise ranking (hundreds to tens)
**When to use:** When you have more than ~1000 opportunities and need both speed and quality
**Trade-offs:** More complex than single-pass, but scales better and allows LLM reasoning on manageable set

**Example:**
```typescript
// Stage 1: Vector Retrieval (fast, approximate)
async function retrieveCandidates(profileEmbedding: number[], limit: number = 100) {
  return db.execute(sql`
    SELECT id, title, organization,
           1 - (embedding <=> ${profileEmbedding}::vector) as similarity
    FROM opportunities
    WHERE status = 'active'
    ORDER BY embedding <=> ${profileEmbedding}::vector
    LIMIT ${limit}
  `);
}

// Stage 2: LLM Ranking (precise, with explanations)
async function rankWithExplanations(profile: Profile, candidates: Opportunity[]) {
  const results = await Promise.all(
    candidates.map(async (opp) => {
      const { score, explanation, acceptanceProbability } = await llm.evaluate({
        profile,
        opportunity: opp,
        prompt: MATCH_EVALUATION_PROMPT
      });
      return { ...opp, score, explanation, acceptanceProbability };
    })
  );
  return results.sort((a, b) => b.score - a.score);
}
```

### Pattern 2: LLM Structured Extraction via Function Calling

**What:** Use OpenAI/Anthropic function calling to extract structured data from conversation
**When to use:** Converting free-form LLM conversation into database-ready structured fields
**Trade-offs:** Reliable schema enforcement; requires well-designed prompts and schemas

**Example:**
```typescript
// Define extraction schema
const profileExtractionSchema = {
  name: "extract_profile",
  parameters: {
    type: "object",
    properties: {
      current_role: { type: "string" },
      years_experience: { type: "number" },
      skills: { type: "array", items: { type: "string" } },
      interests: { type: "array", items: { type: "string" } },
      location_preference: { type: "string", enum: ["remote", "hybrid", "onsite"] },
      career_goals: { type: "string" }
    },
    required: ["current_role", "skills", "interests"]
  }
};

// Use in conversation
async function extractProfileFromConversation(messages: Message[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    functions: [profileExtractionSchema],
    function_call: { name: "extract_profile" }
  });

  return JSON.parse(response.choices[0].message.function_call.arguments);
}
```

### Pattern 3: Multi-Tenant Row-Level Security

**What:** Enforce organization data isolation at database level using PostgreSQL RLS
**When to use:** When orgs should only see their members' profiles and related data
**Trade-offs:** Security at DB layer (fail-safe); slight query overhead; requires session context

**Example:**
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for org admins to see their org's profiles
CREATE POLICY org_profiles_policy ON profiles
FOR ALL
USING (
  organization_id = current_setting('app.current_org_id')::uuid
  OR public_profile = true
);

-- In application code, set context per request
-- BEGIN;
-- SET LOCAL app.current_org_id = 'org-uuid-here';
-- SELECT * FROM profiles; -- Only sees org profiles
-- COMMIT;
```

### Pattern 4: Hybrid Profile Data Model

**What:** Store both structured fields (queryable) and unstructured data (LLM context)
**When to use:** When you need to filter/sort on some fields but preserve rich context for LLM
**Trade-offs:** Some data duplication; clear separation of concerns

**Example:**
```typescript
// Database schema
const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // Structured fields (queryable, filterable)
  currentRole: text('current_role'),
  yearsExperience: integer('years_experience'),
  locationPreference: text('location_preference'),
  skills: jsonb('skills').$type<string[]>(),

  // Unstructured context (for LLM)
  conversationHistory: jsonb('conversation_history').$type<Message[]>(),
  rawNarrative: text('raw_narrative'), // Free-form self-description

  // Embeddings (for semantic search)
  embedding: vector('embedding', { dimensions: 1536 }),

  // Versioning
  version: integer('version').default(1),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

## Data Flow

### Profile Creation Flow

```
[User starts profile]
       ↓
[Form collects structured data]
       ↓
[LLM conversation for enrichment]
       ↓ (Function Calling)
[Extract structured fields]
       ↓
[Generate embedding from combined data]
       ↓
[Store: structured fields + conversation + embedding]
       ↓
[Trigger initial match computation]
```

### Matching Flow

```
[User requests matches]
       ↓
[Load profile embedding]
       ↓
[Stage 1: Vector similarity search] → [~100 candidates]
       ↓
[Stage 2: LLM evaluation with context] → [~20 ranked results]
       ↓
[Generate explanations + acceptance probability]
       ↓
[Return ranked opportunities with reasoning]
```

### Opportunity Aggregation Flow

```
[Cron job triggers daily/hourly]
       ↓
[Fetch from 80K Hours] ←→ [Fetch from aisafety.com]
       ↓                          ↓
[Parse & normalize]         [Parse & normalize]
       ↓                          ↓
[Deduplicate across sources]
       ↓
[Generate embeddings for new opportunities]
       ↓
[Upsert to database]
       ↓
[Trigger re-matching for affected profiles] (async)
```

### Key Data Flows

1. **Profile → Embedding:** Profile data (structured + narrative) embedded via text-embedding model for semantic search
2. **Opportunity → Embedding:** Job descriptions embedded for profile matching
3. **Match Computation:** Profile embedding × Opportunity embeddings → similarity scores → LLM re-ranking
4. **Notification Trigger:** New high-score matches → queue notification → batch into digest or send immediately

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 profiles | Monolith fine. Compute matches on-demand. Single Postgres instance. |
| 500-5K profiles | Pre-compute embeddings. Cache top matches. Consider read replica. |
| 5K-50K profiles | Background match computation. Queue-based processing. Vector DB consideration. |
| 50K+ profiles | Dedicated vector store (Pinecone/Qdrant). Geographic sharding. CDN for static. |

### Scaling Priorities

1. **First bottleneck:** LLM API calls for match explanations. Mitigation: Cache explanations, batch similar requests, use cheaper models for initial filtering.
2. **Second bottleneck:** Vector similarity search at scale. Mitigation: Move to dedicated vector DB (pgvector sufficient to ~100K vectors, then consider Pinecone/Qdrant).
3. **Third bottleneck:** Opportunity aggregation latency. Mitigation: Incremental syncs, webhook integration if available.

## Anti-Patterns

### Anti-Pattern 1: Storing Only Structured Profile Data

**What people do:** Extract structured fields from LLM conversation, discard conversation history
**Why it's wrong:** Loses context needed for accurate LLM matching and explanations later
**Do this instead:** Store both structured fields (for queries) and raw conversation/narrative (for LLM context)

### Anti-Pattern 2: Generating Embeddings from Structured Fields Only

**What people do:** Generate embeddings from `skills.join(', ') + role + location`
**Why it's wrong:** Loses semantic richness; "wants to work on AI alignment at technical orgs" becomes just "AI, alignment, technical"
**Do this instead:** Generate embeddings from combined narrative: structured fields + conversation summary + self-description

### Anti-Pattern 3: Real-Time Match Computation for Every Request

**What people do:** Compute vector similarity + LLM ranking on every /matches request
**Why it's wrong:** Expensive (LLM calls), slow (user waits), wasteful (matches don't change that often)
**Do this instead:** Pre-compute matches in background, serve from cache, recompute on profile/opportunity changes

### Anti-Pattern 4: Tenant Filtering in Application Code Only

**What people do:** Add `WHERE organization_id = ?` to every query manually
**Why it's wrong:** One missed filter leaks cross-org data; security depends on developer diligence
**Do this instead:** Use PostgreSQL Row-Level Security; filter enforced at DB level regardless of query

### Anti-Pattern 5: Scraping Without Fallback Strategy

**What people do:** Rely solely on web scraping for opportunity aggregation
**Why it's wrong:** Sites change structure; IP blocks; legal risk; unreliable data
**Do this instead:** Prefer APIs where available; build resilient scrapers with error handling; manual import as fallback

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI/Anthropic | REST API via SDK | Use for structured extraction, match explanations, conversation |
| 80,000 Hours Job Board | Scrape or check for API | No known public API; build resilient scraper with rate limiting |
| aisafety.com | Scrape or check for API | No known public API; coordinate with maintainers if possible |
| Email (Resend/SendGrid) | REST API | For digests, alerts, notifications |
| Auth (Clerk/Supabase Auth) | SDK integration | Handle user sessions, org membership |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Profile API ↔ Match Engine | Direct function calls | Same process; profile changes trigger match recompute |
| Match Engine ↔ LLM Gateway | Async with queue | Rate limit protection; retry logic |
| API Layer ↔ Background Jobs | Queue (BullMQ, Inngest) | Decouple request/response from heavy computation |
| Org Dashboard ↔ Profile Data | Via RLS-protected queries | Org sees only their members |

## Build Order Implications

Based on component dependencies, recommended implementation order:

### Phase 1: Foundation (Must build first)
1. **Database schema** - Core tables (users, profiles, opportunities, organizations)
2. **Auth integration** - User accounts, org membership
3. **Basic profile CRUD** - Form-based profile creation (no LLM yet)

### Phase 2: Core Matching (Depends on Phase 1)
4. **Opportunity model + manual import** - Get some opportunities in the system
5. **Embedding generation** - Profile and opportunity embeddings
6. **Basic matching** - Vector similarity search (no LLM ranking yet)

### Phase 3: LLM Enhancement (Depends on Phase 2)
7. **LLM conversation for profile** - Enrich profiles via conversation
8. **LLM match explanations** - Add reasoning to matches
9. **Acceptance probability** - LLM-estimated fit scores

### Phase 4: Multi-Tenant + Aggregation (Can parallel with Phase 3)
10. **Row-Level Security** - Org-scoped data views
11. **Org dashboard** - View members, stats
12. **Job aggregation** - Automated sync from 80K Hours, aisafety.com

### Phase 5: Engagement (Depends on Phase 3+4)
13. **Notification system** - Digests, alerts
14. **Match caching** - Pre-compute and cache
15. **Analytics** - Usage tracking, match quality metrics

## Sources

### Architecture & Matching Patterns
- [Algorithms and Architecture for Job Recommendations (O'Reilly/Indeed)](https://www.oreilly.com/content/algorithms-and-architecture-for-job-recommendations/)
- [System Design for Recommendations and Search (Eugene Yan)](https://eugeneyan.com/writing/system-design-for-discovery/)
- [Talent.com NLP Job Recommender (AWS Blog)](https://aws.amazon.com/blogs/machine-learning/from-text-to-dream-job-building-an-nlp-based-job-recommender-at-talent-com-with-amazon-sagemaker/)

### Multi-Tenant Architecture
- [Row Level Security for Tenants in Postgres (Crunchy Data)](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres)
- [Shipping Multi-Tenant SaaS Using Postgres RLS (Nile)](https://www.thenile.dev/blog/multi-tenant-rls)
- [Multi-Tenant SaaS Patterns (Microsoft Azure)](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns)

### LLM Integration
- [AI Hiring with LLMs: Multi-Agent Framework (arXiv)](https://arxiv.org/html/2504.02870v1)
- [How to Use LLMs in Recruitment (HeroHunt)](https://www.herohunt.ai/blog/how-to-use-llms-in-recruitment)
- [Building an LLM System for Mapping Org Data (AlixPartners)](https://www.alixpartners.com/insights/102ltvp/platforms-tech-brief-building-an-llm-system-for-mapping-org-data-at-scale/)

### Vector Search & Embeddings
- [Vector Database Tutorial (Mantra Ideas)](https://mantraideas.com/build-semantic-search-engine-vector-database/)
- [Best Vector Databases 2025 (Firecrawl)](https://www.firecrawl.dev/blog/best-vector-databases-2025)
- [Recommendation System Matching Algorithms (Alibaba Cloud)](https://www.alibabacloud.com/blog/recommendation-system-matching-algorithms-and-architecture_596645)

### Notification Systems
- [Design a Notification System (Medium)](https://medium.com/@bangermadhur/design-a-notification-system-a-complete-system-design-guide-3b20d49298de)
- [Best Notification Infrastructure 2025 (Courier)](https://www.courier.com/blog/best-notification-infrastructure-software-2025)

### Job Board Aggregation
- [Job Board Scraping Guide 2025 (Job Boardly)](https://www.jobboardly.com/blog/job-board-scraping-complete-guide-2025)
- [80,000 Hours Job Board](https://jobs.80000hours.org/)
- [AISafety.com Jobs](https://www.aisafety.com/jobs)

---
*Architecture research for: AI Safety Talent Network (ASTN)*
*Researched: 2026-01-17*
