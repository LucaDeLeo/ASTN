# Stack Research

**Domain:** Career platform / talent network with LLM-powered features
**Researched:** 2025-01-17
**Confidence:** HIGH (verified with official docs and current sources)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.1.x | Full-stack React framework | Industry standard for React apps in 2025. App Router with React Server Components, built-in API routes, Turbopack (now stable) for 5-10x faster builds. Cache Components are opt-in, better DX than v15. |
| **TypeScript** | 5.5+ | Type safety | Required for Prisma, Vercel AI SDK, and modern tooling. Enables end-to-end type safety from DB to UI. |
| **PostgreSQL** | 16+ | Primary database | Battle-tested relational database. Supports pgvector for embeddings, Row Level Security for multi-tenant CRM view. Supabase provides managed hosting. |
| **Supabase** | Latest | Backend-as-a-Service | Managed PostgreSQL with built-in auth, real-time subscriptions, and pgvector support. Free tier generous for pilot (50-100 profiles). Removes need for separate auth and DB infrastructure. |
| **Prisma** | 6.19.x | ORM | Best-in-class TypeScript ORM with declarative schema, type-safe queries, and migrations. v6 removed Rust engine = faster cold starts on serverless. |
| **Vercel AI SDK** | 6.x | LLM integration | Unified API across OpenAI/Anthropic/Gemini. Streaming, tool calling, structured outputs. DevTools for debugging. Provider-agnostic = easy to switch models. |

### LLM Layer

| Component | Technology | Purpose | Notes |
|-----------|------------|---------|-------|
| Primary LLM | Claude 3.5 Sonnet via Anthropic | Profile conversations, opportunity explanations | Best reasoning for nuanced career advice. $3/M input, $15/M output. |
| Fast LLM | GPT-4o-mini or Claude 3.5 Haiku | Matching, recommendations, bulk processing | Cost-effective for high-volume. <$1/M tokens. |
| Embeddings | OpenAI text-embedding-3-small | Profile + opportunity vectors | 1536 dimensions, $0.02/M tokens. Industry standard. |
| Vector Store | pgvector (via Supabase) | Semantic search | Integrated with PostgreSQL. No separate vector DB for <1M vectors. |

### Background Jobs & Scheduling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Inngest** | Latest | Background jobs, cron | Purpose-built for serverless. Runs on Vercel without extra infrastructure. Step functions for reliability. Free tier = 25K runs/month. |
| **Vercel Cron** | Built-in | Simple scheduled tasks | For lightweight triggers (email digest schedule). Inngest for complex workflows. |

### Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Resend** | Latest | Transactional email | Modern API, React Email integration. Free tier = 3K emails/month (sufficient for pilot). 100/day limit on free tier. |
| **React Email** | 5.x | Email templates | Build emails with React components. Tailwind 4 support. Dark mode. Spam score checking. |

### Scraping / Aggregation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Playwright** | 1.57.x | Job board scraping | Cross-browser, handles JS-heavy sites (80K, aisafety.com). Better anti-detection than Puppeteer. Scales in Inngest background jobs. |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Clerk** | 6.x | User auth + management | 5-minute setup, pre-built components, 10K MAU free. Perfect for MVP. Org management built-in for BAISH dashboard. |

### UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Tailwind CSS** | 4.x | Styling | Industry standard. Pairs with shadcn/ui. |
| **shadcn/ui** | Latest | Component library | Copy-paste components, full control. Built on Radix. Not a dependency = no version lock-in. |
| **Radix UI** | Latest | Accessible primitives | Headless, accessible. Foundation for shadcn/ui. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Turbopack** | Dev server, builds | Now stable in Next.js 16. 5-10x faster than webpack. |
| **pnpm** | Package manager | Faster, stricter than npm. Better monorepo support if needed later. |
| **Biome** | Linting + formatting | Faster than ESLint + Prettier. Single tool. |
| **Vercel** | Hosting | First-class Next.js support. Free tier sufficient for pilot. |

## Installation

```bash
# Create Next.js 16 app
npx create-next-app@latest astn --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core dependencies
pnpm add @supabase/supabase-js prisma @prisma/client
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai
pnpm add @clerk/nextjs
pnpm add inngest
pnpm add resend @react-email/components
pnpm add playwright

# UI
pnpm add tailwindcss@next
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react

# Dev dependencies
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D prisma
pnpm add -D @biomejs/biome
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Next.js** | Remix | If you need smaller JS bundles or Cloudflare Workers deployment. Remix has better nested routing for complex dashboards. Next.js wins on ecosystem maturity and hiring. |
| **Prisma** | Drizzle ORM | If cold start performance is critical or you prefer SQL-like syntax. Drizzle is ~7kb vs Prisma's larger footprint. Prisma wins on DX, documentation, and tooling (Studio). |
| **Clerk** | Auth.js (NextAuth v5) | If you need full data ownership or have >10K MAU. Auth.js is free and open source but v5 still in beta. Clerk wins for speed-to-market. |
| **Supabase** | Neon + separate auth | If you need just PostgreSQL without BaaS features. Neon has better serverless scaling. Supabase wins on all-in-one simplicity. |
| **Resend** | SendGrid | If you need proven enterprise deliverability or marketing email. SendGrid has faster domain approval. Resend wins on DX and React Email integration. |
| **Inngest** | Trigger.dev | If you need self-hosting or tighter Vercel control. Both are good. Inngest has better Vercel integration and documentation. |
| **pgvector** | Pinecone | If you exceed 1M vectors or need hybrid search with metadata filtering. Pinecone wins at scale but adds latency + cost. pgvector wins on simplicity for MVP. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **NextAuth.js v4** | Legacy, v5 (Auth.js) is the path forward but still beta | Clerk for managed auth, or Auth.js v5 if you accept beta risk |
| **Puppeteer** | Worse anti-detection, Chrome-only, larger footprint | Playwright |
| **Firebase** | NoSQL doesn't fit relational career data well, vendor lock-in | Supabase (open source, Postgres) |
| **MongoDB** | Relational data (profiles, orgs, opportunities) needs joins | PostgreSQL |
| **Langchain** | Over-abstraction for simple LLM calls, debugging nightmare | Vercel AI SDK for direct, typed LLM calls |
| **Custom auth** | Time sink, security risks for no benefit at MVP stage | Clerk |
| **Mailchimp/Marketing tools** | Overkill for transactional digests, wrong API model | Resend |
| **Separate vector DB** | Unnecessary complexity for <1M vectors | pgvector integrated in Supabase |
| **BullMQ/Redis queues** | Requires separate Redis infrastructure | Inngest (serverless-native) |

## Stack Patterns by Variant

**If pilot grows beyond 10K users:**
- Migrate from Clerk to Auth.js for cost savings
- Consider Prisma Accelerate for connection pooling
- Evaluate dedicated Pinecone if vector queries slow down

**If you need real-time collaboration:**
- Supabase Realtime is already available
- Add Liveblocks or PartyKit for richer presence

**If you deploy outside Vercel:**
- Inngest works anywhere (Netlify, Railway, self-hosted)
- Consider Trigger.dev for more deployment flexibility

**If scraping gets blocked:**
- Add Browserbase or ScrapingBee for managed browser infrastructure
- Implement residential proxy rotation

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.x | React 19.x, Node 20.9+ | Requires Node 20+, drops Node 18 support soon |
| Prisma 6.x | TypeScript 5.1+, Node 18.18+ | Rust-free engine in v6.16+ |
| Vercel AI SDK 6.x | Next.js 14+, React 18+ | Works with App Router and Pages Router |
| Clerk 6.x | Next.js 14+, React 18+ | Full App Router support |
| React Email 5.x | React 19.x, Tailwind 4.x | Must update @react-email/components alongside |
| Playwright 1.57.x | Node 18+, drops Node 16/17 | Now uses Chrome for Testing instead of Chromium |

## Cost Projections (Pilot: 50-100 users)

| Service | Free Tier | Pilot Needs | Monthly Cost |
|---------|-----------|-------------|--------------|
| Vercel | Hobby (100GB bandwidth) | Sufficient | $0 |
| Supabase | 500MB DB, 1GB storage | Sufficient | $0 |
| Clerk | 10K MAU | 100 users | $0 |
| Resend | 3K emails/month | ~500 digests | $0 |
| Inngest | 25K runs/month | ~2K runs | $0 |
| Anthropic | Pay-per-use | ~$5-20/month | ~$10 |
| OpenAI embeddings | Pay-per-use | ~$1/month | ~$1 |
| **Total** | | | **~$11/month** |

## Architecture Decision Records

### ADR-001: Supabase over separate services
**Context:** Need PostgreSQL, auth, and vector storage.
**Decision:** Use Supabase as unified platform.
**Rationale:** Single dashboard, integrated pgvector, built-in auth backup (even if using Clerk), real-time for future features. Trade-off: slight vendor coupling.

### ADR-002: Clerk over Supabase Auth
**Context:** Need auth with org management for BAISH dashboard.
**Decision:** Use Clerk for primary auth, Supabase for database only.
**Rationale:** Clerk's org management, pre-built components, and 5-minute setup beats Supabase Auth's flexibility. Can sync to Supabase via webhooks. Trade-off: two auth systems to understand.

### ADR-003: pgvector over Pinecone
**Context:** Need vector search for profile/opportunity matching.
**Decision:** Use pgvector in Supabase.
**Rationale:** <1M vectors expected for years. Same database = simpler queries, no network latency. Trade-off: less sophisticated filtering than Pinecone.

### ADR-004: Prisma over Drizzle
**Context:** Need TypeScript ORM for PostgreSQL.
**Decision:** Use Prisma 6.x.
**Rationale:** Better DX, Prisma Studio for debugging, larger ecosystem. v6 removed Rust engine = comparable cold starts. Trade-off: slightly larger bundle.

### ADR-005: Inngest over Vercel Cron alone
**Context:** Need job scraping, email digests, matching runs.
**Decision:** Use Inngest for all background work.
**Rationale:** Step functions for reliability, retries, observability. Vercel Cron for triggers only. Trade-off: additional service to learn.

## Sources

### Official Documentation (HIGH confidence)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - Version and features verified
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction) - v6 features and providers
- [Prisma Documentation](https://www.prisma.io/docs) - ORM capabilities and v6 features
- [Supabase Documentation](https://supabase.com/docs) - Platform features
- [Inngest Documentation](https://www.inngest.com/docs) - Background job patterns
- [Resend Documentation](https://resend.com/docs) - Email API features
- [React Email 5.0 Release](https://resend.com/blog/react-email-5) - v5 features including Tailwind 4
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) - v1.57 features
- [Clerk Pricing](https://clerk.com/pricing) - Free tier limits

### Comparison Articles (MEDIUM confidence)
- [Drizzle vs Prisma (Bytebase)](https://www.bytebase.com/blog/drizzle-vs-prisma/) - ORM comparison
- [Clerk Authentication Guide](https://clerk.com/articles/user-authentication-for-nextjs-top-tools-and-recommendations-for-2025) - Auth comparison
- [pgvector vs Pinecone (Confident AI)](https://www.confident-ai.com/blog/why-we-replaced-pinecone-with-pgvector) - Vector DB comparison
- [Playwright vs Puppeteer (PromptCloud)](https://www.promptcloud.com/blog/playwright-vs-puppeteer-for-web-scraping/) - Scraping comparison
- [Email APIs 2025 (Medium)](https://medium.com/@nermeennasim/email-apis-in-2025-sendgrid-vs-resend-vs-aws-ses-a-developers-journey-8db7b5545233) - Email service comparison

### Web Search (verified with official sources)
- Next.js vs Remix comparison - verified with official docs
- Inngest vs Vercel Cron - verified with official docs
- Auth.js v5 status - verified via GitHub releases

---
*Stack research for: AI Safety Talent Network (ASTN)*
*Researched: 2025-01-17*
