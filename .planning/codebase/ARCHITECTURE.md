# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Full-stack serverless with real-time sync

**Key Characteristics:**

- Convex backend provides database, real-time subscriptions, scheduled jobs, and HTTP endpoints in one platform — no separate API layer
- Frontend queries Convex directly via generated typed client (`convex/_generated/api`); there is no REST/GraphQL intermediary
- LLM pipelines run as chained Convex Actions (`"use node"` files) that schedule themselves in batches, enabling long-running work within serverless constraints
- Multi-target deployment: web (Vercel/Nitro) and native iOS/Android (Tauri). Platform detection at runtime via `src/lib/platform.ts`

## Layers

**Frontend Routes:**

- Purpose: Page-level UI composition and data fetching
- Location: `src/routes/`
- Contains: TanStack Router `Route` exports, page components, authenticated/unauthenticated branching
- Depends on: Convex queries/mutations via `convex/react`, feature components from `src/components/`
- Used by: Users via browser or Tauri native shell

**Frontend Components:**

- Purpose: Reusable UI organized by feature domain
- Location: `src/components/`
- Contains: Feature components (profile, matching, orgs, events, agent), layout primitives, shadcn/ui wrappers under `src/components/ui/`
- Depends on: Convex client hooks, `src/lib/`, `src/hooks/`
- Used by: Route files

**Frontend Lib + Hooks:**

- Purpose: Shared utilities and React hooks
- Location: `src/lib/`, `src/hooks/`
- Contains: `cn()` utility (`src/lib/utils.ts`), platform detection (`src/lib/platform.ts`), match scoring logic (`src/lib/matchScoring.ts`), localStorage helpers (`src/lib/pendingInvite.ts`, `src/lib/pendingGuestApplication.ts`)
- Depends on: Nothing (pure functions)
- Used by: Components and routes

**Convex Public API (queries/mutations):**

- Purpose: Client-callable data access and write operations
- Location: `convex/*.ts`, `convex/*/queries.ts`, `convex/*/mutations.ts`
- Contains: `query`, `mutation` exports consumed by the frontend. Auth checked via `convex/lib/auth.ts` helpers at handler entry
- Depends on: `convex/_generated/`, `convex/lib/`
- Used by: Frontend via `convex/react` hooks

**Convex Internal Actions (LLM pipelines):**

- Purpose: Node.js-based serverless functions that call external AI APIs
- Location: `convex/matching/compute.ts`, `convex/careerActions/compute.ts`, `convex/engagement/compute.ts`, `convex/extraction/text.ts`, `convex/enrichment/`
- Contains: `internalAction` exports marked `"use node"`. Each action fetches data via `ctx.runQuery`, runs LLM calls, then writes results via `ctx.runMutation`. Chains further actions via `ctx.scheduler.runAfter`
- Depends on: Anthropic SDK, Google GenAI SDK, `@ai-sdk/anthropic`
- Used by: Cron jobs (`convex/crons.ts`), triggered mutations, and the profile matching flow

**Convex HTTP Routes:**

- Purpose: Public HTTP endpoints (streaming chat, email unsubscribe)
- Location: `convex/http.ts`
- Contains: `httpRouter` with `/enrichment-stream` (POST/OPTIONS) and `/unsubscribe` (GET/POST)
- Used by: Frontend streaming client, email unsubscribe links

**Convex Lib:**

- Purpose: Shared backend helpers
- Location: `convex/lib/`
- Contains: `auth.ts` (getUserId, requireAuth, requirePlatformAdmin), `models.ts` (LLM model constants), `logging.ts`, `limits.ts`, `debouncer.ts`, `llmUsage.ts`
- Used by: All Convex functions

## Data Flow

**Profile Matching Pipeline:**

1. User edits profile fields that affect matching (skills, education, work history, career goals)
2. `convex/profiles.ts::updateField` mutation detects match-affecting fields and calls `debouncedSchedule` for `setMatchesStale`
3. Debounced mutation sets `matchesStaleAt` on profile
4. Frontend or cron triggers `internal.matching.compute.computeMatchesForProfile` action
5. Action runs Tier 1 (programmatic hard filters), schedules Tier 2 (coarse LLM scoring via Gemini in batches of 50), which chains into Tier 3 (detailed LLM scoring via Gemini in batches of 15 for top 25)
6. Each batch calls `internal.matching.mutations.saveBatchResults` which upserts match documents and updates progress
7. Frontend queries `api.matches.getMyMatches` which subscribes in real-time; match cards update as batches complete

**Profile Enrichment (Chat):**

1. User types message in enrichment chat
2. Frontend calls `api.enrichment.streaming.startChat` mutation, receives a `streamId`
3. Frontend POSTs to `/enrichment-stream` HTTP endpoint passing `streamId`
4. HTTP action reads profile, streams Kimi K2.5 (or Claude Sonnet) response via `@convex-dev/persistent-text-streaming`
5. Frontend subscribes to stream via `useQuery(api.enrichment.streaming.getStream)` and renders tokens in real-time

**AI Agent (Profile Builder):**

1. User opens AgentSidebar in any route
2. Frontend renders `AgentChat` component that calls `convex/agent/actions.ts` to stream agent turns
3. `profileAgent` (defined in `convex/agent/index.ts`) uses `@convex-dev/agent` with Claude Sonnet 4.6 and 18 tool functions
4. Agent tools call internal mutations to write profile fields directly to the DB
5. Profile changes trigger match staleness via the standard profile update path

**Opportunity Sync (Cron):**

1. Daily cron (`sync-opportunities`) triggers `internal.aggregation.sync.runFullSync` at 6 AM UTC
2. Action fetches from 80,000 Hours, aisafety.com, and aisafety.com events in parallel
3. Validated opportunities upserted into `opportunities` table
4. Daily cron (`sync-luma-events`) at 7 AM UTC syncs Luma events for orgs with API keys

**Email Notifications (Cron):**

1. Hourly cron processes match alert batches; weekly cron processes digests
2. Batch actions query eligible users, build emails via React Email templates in `convex/emails/templates.tsx`, send via Resend

**State Management:**

- No client-side global state store (no Redux/Zustand). All server state flows through Convex `useQuery` subscriptions which auto-update via WebSocket
- UI-only local state uses React `useState`/`useRef`
- AgentSidebar open/close state managed via React Context (`AgentSidebarProvider`)
- Platform (web vs Tauri) detected once at module load via `src/lib/platform.ts`

## Key Abstractions

**Convex Function Types:**

- `query` / `mutation`: Public API callable from frontend
- `internalQuery` / `internalMutation` / `internalAction`: Backend-only, not exposed to client
- Purpose: Security boundary — internal functions can only be invoked from other Convex functions
- Examples: `convex/profiles.ts` (public), `convex/matching/compute.ts::computeMatchesForProfile` (internal)

**Auth Helpers (`convex/lib/auth.ts`):**

- `getUserId(ctx)`: Returns Clerk subject or null (no throw)
- `requireAuth(ctx)`: Throws if unauthenticated
- `requirePlatformAdmin(ctx)`: Throws if not in `platformAdmins` table
- `requireAnyOrgAdmin(ctx)`: Throws if user has no org admin membership

**Three-Tier Matching:**

- Tier 1: Programmatic hard filters (remote preference, role type, salary) — synchronous, instant
- Tier 2: Coarse Gemini scoring in batches of 50 — selects top 25 candidates
- Tier 3: Detailed Gemini scoring in batches of 15 — produces final tier (great/good/exploring) + strengths/gaps/recommendations
- Location: `convex/matching/compute.ts`, `convex/matching/coarse.ts`

**LLM Model Selection (`convex/lib/models.ts`):**

- `MODEL_FAST = 'claude-haiku-4-5'`: structured extraction, classification
- `MODEL_QUALITY = 'claude-sonnet-4-6'`: user-facing conversation, career actions
- `MODEL_GEMINI_FAST = 'gemini-3-flash-preview'`: matching (JSON output, cost-optimized)
- `MODEL_CONVERSATION`: currently `KIMI_K2_5` (swappable via single line)

**Convex Components (`convex/convex.config.ts`):**

- `@convex-dev/resend`: Email sending
- `@convex-dev/persistent-text-streaming`: Streaming chat responses
- `@convex-dev/agent`: Agent conversation management
- `@convex-dev/rate-limiter`: Public endpoint rate limiting
- `@ikhrustalev/convex-debouncer`: Server-side debounce for expensive operations

## Entry Points

**Web App Root:**

- Location: `src/routes/__root.tsx`
- Triggers: Browser load, Tauri WebView boot
- Responsibilities: Provides PostHog analytics wrapper, ThemeProvider, AgentSidebarProvider, Toaster, Sentry instrumentation. Branches rendering for Tauri (wraps in `MobileShell`) vs web

**Home Route / Landing:**

- Location: `src/routes/index.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Renders landing page for unauthenticated users or Dashboard for authenticated users. Handles post-auth side effects (claiming guest applications, joining orgs via pending invite)

**Convex HTTP Router:**

- Location: `convex/http.ts`
- Triggers: HTTP requests to Convex deployment URL
- Responsibilities: Routes `/enrichment-stream` to streaming chat handler, `/unsubscribe` to email unsubscribe handler

**Convex Crons:**

- Location: `convex/crons.ts`
- Triggers: Convex scheduler (time-based)
- Responsibilities: Opportunity sync (daily), Luma event sync (daily), match alerts (hourly), deadline reminders (hourly), weekly digest (Sunday), event digests (hourly/weekly), attendance check (every 10 min), engagement score compute (daily)

**CLI Agent:**

- Location: `agent/cli.ts`, `agent/server.ts`
- Triggers: `bun run agent` command
- Responsibilities: Local admin agent accessible via CLI, separate from the in-app agent sidebar

## Error Handling

**Strategy:** Throw on auth failure; return null for missing optional data; retry with exponential backoff in LLM pipelines

**Patterns:**

- Auth: `requireAuth` throws `'Not authenticated'`; `requirePlatformAdmin` throws `'Platform admin access required'`
- LLM Actions: catch rate limit errors (HTTP 429), retry with exponential backoff up to `MAX_RETRIES = 10` with max delay 60s (`convex/matching/compute.ts`)
- Batch failures: failed batches are skipped but still call `saveBatchResults` with empty matches so progress updates correctly and old data is preserved
- Frontend: Convex React hooks expose `undefined` (loading) vs `null` (not found/unauthenticated); routes handle both states
- Root error boundary: `src/routes/__root.tsx` errorComponent renders `ErrorDisplay` component

## Cross-Cutting Concerns

**Logging:** `convex/lib/logging.ts` provides a `log(level, message, data)` helper used in all backend actions. Logs are visible in Convex dashboard.

**Validation:** All Convex function args and return values use `v.*` validators from `convex/values`. Complex domain objects validated with Zod schemas in `*/validation.ts` files after LLM output parsing.

**Authentication:** Clerk handles identity (GitHub, Google, email+password). Convex verifies JWTs via `convex/auth.config.ts`. Every public Convex function begins by calling `getUserId(ctx)` or `requireAuth(ctx)`.

**Rate Limiting:** `@convex-dev/rate-limiter` applied to public endpoints in `convex/lib/rateLimiter.ts`; used in enrichment chat (`convex/enrichment/streaming.ts`).

**Debouncing:** `@ikhrustalev/convex-debouncer` used in `convex/profiles.ts` to debounce `setMatchesStale` triggers — prevents match pipeline from firing on every keystroke.

---

_Architecture analysis: 2026-03-10_
