# Phase 1: Foundation + Opportunities - Research

**Researched:** 2026-01-17
**Domain:** TanStack Start + Convex setup, job board aggregation, opportunity browsing
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 establishes the technical foundation (TanStack Start + Convex) and builds the opportunity pipeline from two sources: 80,000 Hours job board and aisafety.com. Both sources lack public APIs, requiring different scraping approaches.

**80,000 Hours** uses Algolia search under the hood, making direct API queries feasible without rendering JavaScript. The Algolia configuration is exposed in the page source, allowing structured JSON data retrieval. This is the recommended approach over DOM scraping.

**aisafety.com** is built on Webflow with Finsweet CMS, requiring Playwright for JavaScript-rendered content since data loads dynamically via client-side scripts.

For duplicate detection, opportunities from both sources should be matched using normalized title + organization name. A simple Levenshtein-based fuzzy match (via string-similarity or fuse.js) handles minor variations.

**Primary recommendation:** Use Algolia API for 80K Hours (fast, reliable), Airtable API for aisafety.com (team has provided access), Quikturn for organization logos, and Convex scheduled actions for daily sync.

**Stack decisions (updated after red-teaming):**
- **Convex Auth** instead of Clerk (native, free, simpler)
- **Airtable API** instead of Playwright scraping (aisafety.com team provided access)
- **string-similarity-js** instead of string-similarity (deprecated package)
- **Quikturn** instead of Brandfetch (500K/mo free vs 250/mo)
- **bun** instead of pnpm (faster, simpler)

## Standard Stack

The established libraries/tools for this phase:

### Core (from project stack)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Start | 1.x RC | Full-stack React framework | File-based routing, full type inference, Vite-powered |
| TanStack Router | 1.x | Type-safe routing | End-to-end type safety for routes, params, search |
| TanStack Query | 5.x | Data fetching | Caching, background updates, works with Convex |
| Convex | Latest | Backend-as-a-Service | Real-time, TypeScript-first, serverless functions |
| @convex-dev/react-query | Latest | Convex + TanStack Query | Bridges Convex with TanStack Query patterns |
| Convex Auth | Latest | Authentication | Native to Convex, free, OAuth + password support |
| TypeScript | 5.5+ | Type safety | Required for Convex end-to-end types |
| Tailwind CSS | 4.x | Styling | Industry standard, works with shadcn/ui |
| shadcn/ui | Latest | Component library | Lyra style, accessible, customizable |

### Phase-Specific
| Library | Version | Purpose | Why Selected |
|---------|---------|---------|--------------|
| algoliasearch | 5.x | 80K Hours API queries | Direct Algolia API access for structured job data |
| string-similarity-js | Latest | Duplicate detection | Maintained fork of deprecated string-similarity |

### Supporting Services
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Quikturn | Organization logos | 500K requests/month |
| Airtable (aisafety.com) | Job data source | API access provided by team |
| Convex | Database + scheduled functions | Generous for pilot |
| Vercel | Hosting | Hobby tier sufficient |

### Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Algolia API (80K) | Playwright scraping | If Algolia API gets restricted; slower and heavier |
| Quikturn | Brandfetch | Brandfetch has lower free tier (250/mo) |
| Convex Auth | Clerk | If need advanced features (passkeys, 2FA, enterprise SSO) |
| Airtable API | Playwright scraping | Never - API access is more reliable |
| string-similarity-js | fuse.js | If need fuzzy search UI; string-similarity-js is simpler for backend dedup |
| Convex crons | Inngest | If need complex retry logic or step functions; Convex crons sufficient for daily sync |

**Installation:**
```bash
# Use official Convex TanStack Start template (includes Convex + TanStack Query preconfigured)
bunx create-convex@latest -t tanstack-start .

# Add Tailwind CSS
bun add @tailwindcss/vite tailwindcss

# Add Convex Auth and supporting dependencies
bun add @convex-dev/auth @auth/core
bun add class-variance-authority clsx tailwind-merge lucide-react

# Phase 1 specific
bun add algoliasearch string-similarity-js
```

**Vite config (vite.config.ts):**
```typescript
import { tanstackStart } from "@tanstack/start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackStart(), tailwindcss()],
});
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── routes/                     # TanStack Start file-based routing
│   ├── __root.tsx              # Root layout with providers
│   ├── index.tsx               # Landing page
│   ├── _public.tsx             # Pathless layout for public routes
│   ├── opportunities/
│   │   ├── index.tsx           # List view with filters
│   │   └── $id.tsx             # Detail view (dynamic route)
│   └── admin/
│       ├── route.tsx           # Admin layout with nav
│       ├── index.tsx           # Dashboard
│       └── opportunities/
│           ├── index.tsx       # List admin opportunities
│           ├── new.tsx         # Create opportunity
│           └── $id/
│               └── edit.tsx    # Edit opportunity
├── components/
│   ├── opportunities/          # Opportunity-specific components
│   │   ├── opportunity-card.tsx
│   │   ├── opportunity-detail.tsx
│   │   ├── opportunity-filters.tsx
│   │   └── opportunity-list.tsx
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── convex.ts               # Convex client + TanStack Query setup
│   └── utils.ts                # Helper functions (cn, etc.)
├── styles/
│   └── app.css                 # Global styles with Tailwind
├── router.tsx                  # Router configuration
├── client.tsx                  # Client entry point
└── ssr.tsx                     # SSR entry point

convex/
├── _generated/                 # Auto-generated types
├── schema.ts                   # Database schema
├── opportunities.ts            # Opportunity queries & mutations
├── aggregation/                # Job aggregation logic
│   ├── eightyK.ts              # 80K Hours Algolia adapter
│   ├── aisafety.ts             # aisafety.com Airtable adapter
│   ├── dedup.ts                # Duplicate detection logic
│   └── sync.ts                 # Sync orchestration action
├── admin.ts                    # Admin mutations
└── crons.ts                    # Scheduled job definitions
```

### Pattern 1: Algolia Direct API Query (80K Hours)

**What:** Query Algolia search API directly using exposed credentials instead of scraping rendered HTML
**When to use:** Websites using Algolia with public frontend credentials
**Trade-offs:** Fast, reliable, structured data; may break if credentials change

**Key Finding:** The 80K Hours job board exposes Algolia configuration in page source:
- API Base: `https://backend.eawork.org/api`
- Algolia Indices: `jobs_prod_super_ranked`, `jobs_prod_closing_date`, `jobs_prod`
- Credentials are public (designed for frontend use)

**Example:**
```typescript
// convex/aggregation/eightyK.ts
import { action } from "../_generated/server";
import algoliasearch from "algoliasearch";

// Credentials from 80K Hours page source (public frontend keys)
const ALGOLIA_APP_ID = "[extracted-from-page]";
const ALGOLIA_API_KEY = "[extracted-from-page]";
const ALGOLIA_INDEX = "jobs_prod_super_ranked";

export const fetchOpportunities = action({
  args: {},
  handler: async (ctx) => {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    const index = client.initIndex(ALGOLIA_INDEX);

    const results = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await index.search("", {
        page,
        hitsPerPage: 100,
      });

      results.push(...response.hits);
      hasMore = page < response.nbPages - 1;
      page++;

      // Rate limiting: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results.map(hit => normalizeEightyKJob(hit));
  }
});

function normalizeEightyKJob(hit: any) {
  return {
    sourceId: `80k-${hit.objectID}`,
    source: "80k_hours" as const,
    title: hit.title,
    organization: hit.company_name,
    location: hit.location || "Remote",
    roleType: mapRoleType(hit.job_type),
    description: hit.description_short || hit.description,
    requirements: hit.requirements || [],
    salaryRange: hit.salary_text,
    deadline: hit.closing_date ? new Date(hit.closing_date).getTime() : undefined,
    sourceUrl: hit.url,
    postedAt: hit.posted_date ? new Date(hit.posted_date).getTime() : Date.now(),
  };
}
```

### Pattern 2: Playwright Scraping (aisafety.com)

**What:** Use headless browser to render JavaScript-heavy pages and extract data
**When to use:** Webflow/CMS sites without API access
**Trade-offs:** Heavier, slower, may need maintenance if DOM changes

**Key Finding:** aisafety.com uses Webflow + Finsweet CMS. Content loads via JavaScript, requiring browser rendering.

**Example:**
```typescript
// convex/aggregation/aisafety.ts
"use node";
import { action } from "../_generated/server";
import { chromium } from "playwright";

export const fetchOpportunities = action({
  args: {},
  handler: async (ctx) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set realistic user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    await page.goto('https://www.aisafety.com/jobs', {
      waitUntil: 'networkidle',
    });

    // Wait for Finsweet CMS to load content
    await page.waitForSelector('.featured-card', { timeout: 10000 });

    const opportunities = await page.evaluate(() => {
      const cards = document.querySelectorAll('.featured-card');
      return Array.from(cards).map(card => {
        const titleEl = card.querySelector('h3, .job-title');
        const orgEl = card.querySelector('.organization, .company');
        const locationEl = card.querySelector('.location');
        const link = card.querySelector('a');

        return {
          title: titleEl?.textContent?.trim() || '',
          organization: orgEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || 'Remote',
          sourceUrl: link?.href || '',
        };
      });
    });

    await browser.close();

    return opportunities.map(opp => ({
      sourceId: `aisafety-${hashString(opp.title + opp.organization)}`,
      source: "aisafety_com" as const,
      ...opp,
    }));
  }
});
```

### Pattern 3: Convex Scheduled Actions (Daily Sync)

**What:** Use Convex cron jobs to run aggregation actions on a schedule
**When to use:** Any periodic background task
**Trade-offs:** Simple setup, limited to one concurrent execution per job

**Example:**
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 6 AM UTC
crons.daily(
  "sync-opportunities",
  { hourUTC: 6, minuteUTC: 0 },
  internal.aggregation.sync.runFullSync
);

export default crons;

// convex/aggregation/sync.ts
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const runFullSync = internalAction({
  args: {},
  handler: async (ctx) => {
    // Fetch from both sources
    const [eightyKJobs, aisafetyJobs] = await Promise.all([
      ctx.runAction(internal.aggregation.eightyK.fetchOpportunities, {}),
      ctx.runAction(internal.aggregation.aisafety.fetchOpportunities, {}),
    ]);

    // Deduplicate and upsert
    const allJobs = [...eightyKJobs, ...aisafetyJobs];
    await ctx.runMutation(internal.aggregation.sync.upsertOpportunities, {
      opportunities: allJobs,
    });

    // Archive opportunities that disappeared from sources
    await ctx.runMutation(internal.aggregation.sync.archiveMissing, {
      currentSourceIds: allJobs.map(j => j.sourceId),
    });
  }
});
```

### Pattern 4: Upsert with Deduplication

**What:** Query by unique index, then insert or update based on existence
**When to use:** Syncing external data that may already exist
**Trade-offs:** Safe from race conditions via Convex OCC

**Example:**
```typescript
// convex/aggregation/sync.ts
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import stringSimilarity from "string-similarity";

export const upsertOpportunities = internalMutation({
  args: {
    opportunities: v.array(v.object({
      sourceId: v.string(),
      source: v.union(v.literal("80k_hours"), v.literal("aisafety_com"), v.literal("manual")),
      title: v.string(),
      organization: v.string(),
      location: v.string(),
      roleType: v.optional(v.string()),
      description: v.optional(v.string()),
      requirements: v.optional(v.array(v.string())),
      salaryRange: v.optional(v.string()),
      deadline: v.optional(v.number()),
      sourceUrl: v.string(),
      postedAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    for (const opp of args.opportunities) {
      // Check for exact source match
      const existing = await ctx.db
        .query("opportunities")
        .withIndex("by_source_id", q => q.eq("sourceId", opp.sourceId))
        .unique();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          ...opp,
          lastVerified: Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        // Check for fuzzy duplicate from other source
        const possibleDupes = await ctx.db
          .query("opportunities")
          .withIndex("by_organization", q => q.eq("organization", opp.organization))
          .collect();

        const duplicate = possibleDupes.find(existing =>
          stringSimilarity.compareTwoStrings(
            normalizeTitle(existing.title),
            normalizeTitle(opp.title)
          ) > 0.85
        );

        if (duplicate) {
          // Add as alternate source to existing opportunity
          await ctx.db.patch(duplicate._id, {
            alternateSources: [
              ...(duplicate.alternateSources || []),
              { sourceId: opp.sourceId, source: opp.source, sourceUrl: opp.sourceUrl }
            ],
            lastVerified: Date.now(),
          });
        } else {
          // Insert new
          await ctx.db.insert("opportunities", {
            ...opp,
            status: "active",
            lastVerified: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
  }
});

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Pattern 5: Convex Full-Text Search for Opportunities

**What:** Use Convex search indexes for typeahead/keyword search
**When to use:** When users need to search opportunity text
**Trade-offs:** Limited to 1 search field per index, best for English/Latin text

**Example:**
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  opportunities: defineTable({
    sourceId: v.string(),
    source: v.union(v.literal("80k_hours"), v.literal("aisafety_com"), v.literal("manual")),
    title: v.string(),
    organization: v.string(),
    organizationLogoUrl: v.optional(v.string()),
    location: v.string(),
    isRemote: v.boolean(),
    roleType: v.string(),
    experienceLevel: v.optional(v.string()),
    description: v.string(),
    requirements: v.optional(v.array(v.string())),
    salaryRange: v.optional(v.string()),
    deadline: v.optional(v.number()),
    sourceUrl: v.string(),
    alternateSources: v.optional(v.array(v.object({
      sourceId: v.string(),
      source: v.string(),
      sourceUrl: v.string(),
    }))),
    status: v.union(v.literal("active"), v.literal("archived")),
    lastVerified: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source_id", ["sourceId"])
    .index("by_organization", ["organization"])
    .index("by_status", ["status"])
    .index("by_role_type", ["roleType", "status"])
    .index("by_location", ["isRemote", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "roleType", "isRemote"],
    }),
});

// convex/opportunities.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    if (args.searchTerm) {
      // Use search index for text queries
      let searchQuery = ctx.db
        .query("opportunities")
        .withSearchIndex("search_title", q => {
          let search = q.search("title", args.searchTerm!);
          search = search.eq("status", "active");
          if (args.roleType) search = search.eq("roleType", args.roleType);
          if (args.isRemote !== undefined) search = search.eq("isRemote", args.isRemote);
          return search;
        });

      return await searchQuery.take(limit);
    } else {
      // Use regular index for filter-only queries
      let query = ctx.db.query("opportunities");

      if (args.roleType) {
        query = query.withIndex("by_role_type", q =>
          q.eq("roleType", args.roleType!).eq("status", "active")
        );
      } else if (args.isRemote !== undefined) {
        query = query.withIndex("by_location", q =>
          q.eq("isRemote", args.isRemote!).eq("status", "active")
        );
      } else {
        query = query.withIndex("by_status", q => q.eq("status", "active"));
      }

      return await query.take(limit);
    }
  }
});
```

### Anti-Patterns to Avoid
- **Scraping 80K Hours with Playwright:** Unnecessary overhead when Algolia API is available; slower and more fragile
- **Storing logos in Convex file storage:** Use Brandfetch CDN URLs instead; hotlinking is required by their ToS anyway
- **Real-time scraping on user request:** Pre-fetch via cron; serve from database for instant response
- **Raw DOM selectors without fallbacks:** Webflow sites change; use resilient selectors with error handling
- **Synchronous scraping in mutations:** Use actions for external API calls; mutations must be deterministic

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Custom Levenshtein | `string-similarity` | Well-tested, handles edge cases, Dice coefficient good for names |
| Organization logos | Logo scraping/storage | Brandfetch API | 500K free requests/month, CDN delivery, up-to-date logos |
| Full-text search | Custom search logic | Convex search indexes | BM25 ranking, prefix matching, reactive updates built-in |
| Job scraping infrastructure | Custom browser management | Playwright directly or Browserless | Anti-detection, scaling, error handling already solved |
| Scheduled tasks | Custom cron system | Convex crons | Built-in, single-concurrency guarantee, dashboard visibility |

**Key insight:** For a pilot with 2 data sources and ~1000 opportunities, simple solutions win. Don't optimize for scale that doesn't exist yet.

## Common Pitfalls

### Pitfall 1: Algolia Credential Rotation
**What goes wrong:** 80K Hours rotates their Algolia API key, breaking the integration
**Why it happens:** Frontend credentials can change during site updates
**How to avoid:**
- Store credentials in environment variables, not code
- Build credential extraction fallback that parses page source
- Monitor sync failures with alerting
**Warning signs:** 403 errors from Algolia, empty results, sudden sync failures

### Pitfall 2: Webflow DOM Changes
**What goes wrong:** aisafety.com redesigns their job cards, breaking selectors
**Why it happens:** Webflow sites update frequently; CSS classes aren't stable
**How to avoid:**
- Use multiple fallback selectors
- Match on text content patterns, not just classes
- Log parsing failures with full HTML for debugging
**Warning signs:** Partial data extraction, null fields, zero opportunities from source

### Pitfall 3: Rate Limiting on Algolia
**What goes wrong:** Requests get blocked or throttled
**Why it happens:** Too many concurrent requests or no delays between pagination
**How to avoid:**
- Add 1-2 second delays between paginated requests
- Implement exponential backoff on errors
- Cache results aggressively (data changes daily, not hourly)
**Warning signs:** 429 responses, timeouts, inconsistent result counts

### Pitfall 4: Duplicate Opportunities Across Sources
**What goes wrong:** Same job appears twice from 80K Hours and aisafety.com
**Why it happens:** Title/org variations (e.g., "Anthropic" vs "Anthropic, PBC")
**How to avoid:**
- Normalize organization names before matching
- Use fuzzy matching threshold (0.85) not exact match
- Store alternate sources as references, not separate records
**Warning signs:** Identical jobs appearing in search results, user confusion

### Pitfall 5: Stale Opportunities Not Archived
**What goes wrong:** Closed jobs remain visible to users
**Why it happens:** Jobs removed from source but not marked archived
**How to avoid:**
- Track `lastVerified` timestamp on every sync
- Archive opportunities not seen in latest sync
- Display "Last verified" freshness indicator
**Warning signs:** Users clicking through to 404 pages, old deadlines visible

### Pitfall 6: Convex Provider Setup in TanStack Start
**What goes wrong:** Convex queries return undefined or fail silently
**Why it happens:** ConvexProvider must wrap QueryClientProvider, and both must be in root route
**How to avoid:** Set up providers in `__root.tsx` with correct nesting order
**Warning signs:** `useQuery` returns undefined, suspense boundaries don't trigger

## Code Examples

Verified patterns from official sources:

### TanStack Start + Convex Provider Setup
```typescript
// app/lib/convex.ts
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
export const convex = new ConvexReactClient(convexUrl);
export const convexQueryClient = new ConvexQueryClient(convex);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

// app/routes/__root.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import { convex, queryClient } from "../lib/convex";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <ConvexProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}

// convex/auth.ts
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [GitHub, Google, Password],
});
```
Source: [Convex Auth](https://labs.convex.dev/auth), [TanStack Start](https://tanstack.com/start)

### Convex Cron Job Definition
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 6 AM UTC
crons.daily(
  "sync-opportunities",
  { hourUTC: 6, minuteUTC: 0 },
  internal.aggregation.sync.runFullSync
);

export default crons;
```
Source: [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)

### Convex Search Index Query
```typescript
// convex/opportunities.ts
const results = await ctx.db
  .query("opportunities")
  .withSearchIndex("search_title", (q) =>
    q.search("title", searchTerm).eq("status", "active")
  )
  .take(20);
```
Source: [Convex Full-Text Search](https://docs.convex.dev/search/text-search)

### Quikturn Logo URL
```html
<!-- Simple logo embed -->
<img
  src="https://logo.quikturn.com/anthropic.com?size=200"
  alt="Anthropic logo"
/>
```
Source: [Quikturn Logo API](https://quikturn.com/) - 500K free requests/month

### Algolia Direct Query
```typescript
import algoliasearch from "algoliasearch";

const client = algoliasearch(APP_ID, API_KEY);
const index = client.initIndex("jobs_prod");

const { hits, nbPages } = await index.search("", {
  page: 0,
  hitsPerPage: 100,
});
```
Source: [Algolia JavaScript Client](https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/javascript/)

### Duplicate Detection with string-similarity-js
```typescript
import { stringSimilarity } from "string-similarity-js";

const similarity = stringSimilarity(
  "research engineer - ai safety",
  "ai safety research engineer"
);
// Returns ~0.85

const isDuplicate = similarity > 0.85;
```
Source: [string-similarity-js npm](https://www.npmjs.com/package/string-similarity-js) - maintained fork of deprecated string-similarity

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js | TanStack Start | 2025-2026 | Full type inference, Vite-powered, better DX for AI coding |
| Next.js routing | TanStack Router | 2025-2026 | End-to-end type safety for routes, params, search |
| shadcn init | shadcn create | Dec 2025 | Visual styles (Lyra, Nova, Maia, Lyra, Mira) |
| Clearbit Logo API | Quikturn, Brandfetch, or LogoKit | Dec 2025 | Clearbit deprecated; Quikturn has best free tier |
| Clerk for auth | Convex Auth | 2025 | Native to Convex, no per-user cost, simpler |
| Puppeteer for scraping | Playwright | 2023-2024 | Better anti-detection, cross-browser support |
| Custom cron infrastructure | Convex native crons | Convex 1.0 | No external scheduler needed |
| Vector search for job matching | Programmatic context + LLM | 2024-2025 | Better explainability, no embedding drift |
| string-similarity | string-similarity-js | 2024 | Original package deprecated |

**Deprecated/outdated:**
- **Clearbit Logo API**: Discontinued December 2025; use Quikturn instead
- **string-similarity**: Package deprecated; use string-similarity-js fork
- **Puppeteer**: Playwright has better anti-detection and is actively maintained
- **Manual job posting only**: All modern job platforms aggregate from multiple sources
- **shadcn init default style**: Use `npx shadcn create` with Lyra/Nova/Maia/Mira styles

## Open Questions

Things that couldn't be fully resolved:

1. **80K Hours Algolia credentials stability**
   - What we know: Credentials are exposed in page source, indices are named `jobs_prod_*`
   - What's unclear: How often credentials rotate; no public documentation
   - Recommendation: Build credential extraction as backup; monitor for changes

2. **aisafety.com exact DOM structure**
   - What we know: Uses Webflow + Finsweet CMS, `.featured-card` class visible
   - What's unclear: Exact selectors for all fields; may need runtime inspection
   - Recommendation: Test scraper against live site during implementation; build resilient selectors

3. **AI Safety organization logo coverage**
   - What we know: Brandfetch has major tech companies; unclear on niche orgs like MIRI, CAIS
   - What's unclear: Logo availability for smaller AI safety orgs
   - Recommendation: Fall back to initials/placeholder for missing logos; allow admin override

4. **Opportunity data completeness from sources**
   - What we know: Basic fields (title, org, location) available; detailed requirements vary
   - What's unclear: What fields are consistently available across both sources
   - Recommendation: Make most fields optional in schema; enrich with LLM in Phase 4 if needed

## Sources

### Primary (HIGH confidence)
- [TanStack Start](https://tanstack.com/start) - Full-stack React framework with type-safe routing
- [TanStack Router](https://tanstack.com/router) - Type-safe routing for React
- [Convex TanStack Start Quickstart](https://docs.convex.dev/quickstart/tanstack-start) - Official integration guide
- [Convex Auth](https://labs.convex.dev/auth) - Native authentication for Convex
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) - Scheduling patterns
- [Convex Full-Text Search](https://docs.convex.dev/search/text-search) - Search index implementation
- [Convex Writing Data](https://docs.convex.dev/database/writing-data) - Upsert patterns
- [Convex Actions](https://docs.convex.dev/functions/actions) - External API calls
- [Algolia JavaScript Client](https://www.algolia.com/developers/search-api-javascript) - API usage
- [Quikturn Logo API](https://quikturn.com/) - Logo service (500K free/month)
- [Airtable API](https://airtable.com/developers/web/api/introduction) - REST API for aisafety.com data

### Secondary (MEDIUM confidence)
- [How to Scrape Algolia Search](https://scrapfly.io/blog/posts/how-to-scrape-algolia-search) - Algolia scraping patterns
- [string-similarity-js](https://www.npmjs.com/package/string-similarity-js) - Maintained fuzzy matching fork

### Tertiary (LOW confidence, needs validation)
- 80K Hours page source inspection - Algolia credentials discovered via WebFetch
- aisafety.com page structure - Webflow/Finsweet identified via WebFetch

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with official Convex, Clerk, Algolia docs
- Architecture patterns: MEDIUM-HIGH - Convex patterns verified; scraping needs runtime validation
- Pitfalls: MEDIUM - Common issues from search; specific scraper edge cases unknown until implementation

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable technologies, but scraping targets may change)
