# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**AI / LLM:**

- Anthropic Claude API - Opportunity enrichment (skill extraction, metadata inference) and career coaching chat
  - SDK: `@anthropic-ai/sdk` (direct) + `@ai-sdk/anthropic` (Vercel AI SDK)
  - Auth: `ANTHROPIC_API_KEY` (Convex dashboard env var)
  - Models used: `claude-haiku-4-5` (fast/cheap tasks), `claude-sonnet-4-6` (quality tasks)
  - Files: `convex/aggregation/enrichment.ts`, `convex/lib/models.ts`

- Google Gemini API - Profile-to-opportunity matching (structured JSON scoring, 3-tier pipeline)
  - SDK: `@google/genai`
  - Auth: `GEMINI_API_KEY` (Convex dashboard env var)
  - Model used: `gemini-3-flash-preview`
  - Files: `convex/matching/compute.ts`, `convex/matching/coarse.ts`

- Kimi (Moonshot AI) K2.5 - Conversation model for enrichment chat (currently active, replaces Sonnet)
  - Protocol: OpenAI-compatible REST API at `https://api.moonshot.cn/v1/chat/completions`
  - Auth: `KIMI_API_KEY` (Convex dashboard env var)
  - Files: `convex/lib/models.ts` (`MODEL_CONVERSATION` set to `KIMI_K2_5`)

**Job Board Data Sources:**

- 80,000 Hours Job Board - Daily sync of AI safety job listings via Algolia search index
  - SDK: `algoliasearch`
  - Auth: `EIGHTY_K_ALGOLIA_APP_ID`, `EIGHTY_K_ALGOLIA_API_KEY` (Convex dashboard)
  - Index: `jobs_prod_super_ranked`
  - Files: `convex/aggregation/eightyK.ts`
  - Cron: daily at 06:00 UTC via `convex/crons.ts`

- aisafety.com Jobs - Daily sync of AI safety jobs via Airtable REST API
  - Auth: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` (Convex dashboard)
  - Files: `convex/aggregation/aisafety.ts`
  - Cron: daily at 06:00 UTC (same cron as 80K)

- aisafety.com Events - Events/courses/fellowships via separate Airtable base
  - Auth: `AIRTABLE_TOKEN`, `AIRTABLE_EVENTS_BASE_ID`, `AIRTABLE_EVENTS_TABLE_ID` (Convex dashboard)
  - Files: `convex/aggregation/aisafetyEvents.ts`

- Lu.ma - Event sync for orgs with configured calendar IDs (public API, no key required)
  - Files: `convex/events/lumaClient.ts`, `convex/events/sync.ts`
  - Cron: daily at 07:00 UTC

- Exa - Web search (imported via `exa-js`; exact usage scope not audited in this pass)
  - SDK: `exa-js`

## Data Storage

**Databases:**

- Convex (primary database + real-time sync)
  - Connection: `VITE_CONVEX_URL` (client) + Convex dashboard deployment config
  - Client: Convex React client (`convex/react`) with `@convex-dev/react-query` integration
  - Schema: `convex/schema.ts` (profiles, opportunities, matches, organizations, events, etc.)
  - Real-time subscriptions via `useQuery` throughout frontend

**File Storage:**

- Convex file storage - Used for profile uploads via `convex/upload.ts`; accessed via `_storage` system table

**Caching:**

- No external cache layer; Convex handles real-time reactive queries

## Authentication & Identity

**Auth Provider:**

- Clerk - Primary auth provider (GitHub OAuth, Google OAuth, Email+Password)
  - SDK: `@clerk/clerk-react` (frontend), `tauri-plugin-clerk` (native)
  - Client key: `VITE_CLERK_PUBLISHABLE_KEY`
  - JWT verification: `CLERK_JWT_ISSUER_DOMAIN` set in Convex dashboard (`convex/auth.config.ts`)
  - Custom domain: `clerk.safetytalent.org` (visible in CSP and `vercel.json`)
  - Legacy: `@convex-dev/auth` tables (`authSessions`, `authAccounts`, etc.) kept in schema during migration; see comment in `convex/schema.ts`

## Monitoring & Observability

**Error Tracking:**

- Sentry - Full-stack error monitoring
  - SDK: `@sentry/tanstackstart-react`
  - DSN: configured in `instrument.server.mjs` (server) and vite plugin (client)
  - Org: `baish`, project: `javascript-tanstackstart-react`
  - Tunneled via `/tunnel` proxy route (both `vite.config.ts` dev proxy and `vercel.json` rewrite)
  - Sentry init file: `instrument.server.mjs`

**Analytics:**

- PostHog - Product analytics and session recording
  - SDK: `@posthog/react` (frontend), `posthog-node` (server)
  - Client key: `VITE_PUBLIC_POSTHOG_KEY`
  - API proxied through `/ingest` (both `vite.config.ts` dev proxy and `vercel.json` rewrite)
  - User identification tied to Clerk user ID in `src/routes/__root.tsx` (`PostHogUserIdentifier`)

**LLM Usage Tracking:**

- Internal - All LLM API calls log token usage to `llmUsage` table
  - File: `convex/lib/llmUsage.ts`
  - Tracks: operation type, model, input/output tokens, userId, profileId, duration

## Email

**Transactional Email:**

- Resend - All outbound email via `@convex-dev/resend` component
  - Auth: `RESEND_API_KEY` (Convex dashboard)
  - From address: `ASTN <notifications@safetytalent.org>`
  - Files: `convex/emails/send.ts`
  - Email types: match alerts, weekly digest, deadline reminders, event digests, feedback notifications
  - Templates: React Email components in `convex/emails/templates.tsx`
  - RFC 8058 one-click unsubscribe via `convex/emails/unsubscribe.ts` HTTP action

**Email Scheduling (Crons):**

- Match alerts: hourly at :00 (timezone-aware, targets 8 AM local)
- Deadline reminders: hourly at :15 (timezone-aware, targets 8 AM local)
- Weekly opportunity digest: Sundays 22:00 UTC
- Daily event digest: hourly at :30 (timezone-aware, targets 9 AM local)
- Weekly event digest: Sundays 22:30 UTC

## Push Notifications

**Firebase Cloud Messaging (FCM):**

- Used for iOS/Android push notifications via Tauri native app
  - Auth: `FIREBASE_SERVER_KEY` (Convex dashboard)
  - Legacy API endpoint: `https://fcm.googleapis.com/fcm/send`
  - Tokens stored in `pushTokens` table; file `convex/pushTokens.ts`
  - Sender: `convex/push.ts`

## CI/CD & Deployment

**Hosting:**

- Vercel - Frontend + SSR (Nitro `vercel` preset)
- Convex Cloud - Backend (serverless functions, database, cron jobs)

**CI Pipeline:**

- None detected (no `.github/workflows/` or similar)

## Webhooks & Callbacks

**Incoming (Convex HTTP routes in `convex/http.ts`):**

- `POST /enrichment-stream` - LLM streaming endpoint for career coach chat (authenticated via Clerk JWT)
- `OPTIONS /enrichment-stream` - CORS preflight for above
- `POST /unsubscribe` - RFC 8058 one-click email unsubscribe
- `GET /unsubscribe` - Manual email unsubscribe link handler

**Outgoing:**

- No outgoing webhooks detected; all external calls are pull-based (cron syncs) or request-response (LLM APIs, email)

## Environment Configuration

**Required client vars (`.env.local`):**

- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `VITE_PUBLIC_POSTHOG_KEY` - PostHog client key

**Required server vars (Convex dashboard):**

- `ANTHROPIC_API_KEY` - Anthropic Claude
- `GEMINI_API_KEY` - Google Gemini
- `KIMI_API_KEY` - Kimi/Moonshot AI
- `RESEND_API_KEY` - Transactional email
- `EIGHTY_K_ALGOLIA_APP_ID` + `EIGHTY_K_ALGOLIA_API_KEY` - 80K Hours data
- `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID` + `AIRTABLE_TABLE_NAME` - aisafety.com jobs
- `AIRTABLE_EVENTS_BASE_ID` + `AIRTABLE_EVENTS_TABLE_ID` - aisafety.com events
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT verification
- `FIREBASE_SERVER_KEY` - FCM push notifications
- `FEEDBACK_NOTIFICATION_EMAIL` - Destination for feedback form emails
- `SENTRY_AUTH_TOKEN` - Sentry source map uploads (build-time)

**Secrets location:**

- Client vars: `.env.local` (gitignored)
- Server vars: Convex dashboard environment variables panel
- Template: `.env.example` documents all required variables

---

_Integration audit: 2026-03-10_
