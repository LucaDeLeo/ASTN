# Stack Research

**Domain:** Career platform / talent network with LLM-powered features
**Researched:** 2025-01-17
**Confidence:** HIGH (verified with official docs and current sources)

## Recommended Stack

### Core Technologies

| Technology        | Version | Purpose                    | Why Recommended                                                                                                                                                                                                          |
| ----------------- | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js**       | 16.1.x  | Full-stack React framework | Industry standard for React apps in 2025. App Router with React Server Components, built-in API routes, Turbopack (now stable) for 5-10x faster builds. Cache Components are opt-in, better DX than v15.                 |
| **TypeScript**    | 5.5+    | Type safety                | Required for Convex, Vercel AI SDK, and modern tooling. Enables end-to-end type safety from DB to UI.                                                                                                                    |
| **Convex**        | Latest  | Backend-as-a-Service       | Real-time reactive database with serverless functions. TypeScript-first with end-to-end type safety. Automatic caching and real-time sync. No separate ORM needed - queries are functions. Free tier generous for pilot. |
| **Vercel AI SDK** | 6.x     | LLM integration            | Unified API across OpenAI/Anthropic/Gemini. Streaming, tool calling, structured outputs. DevTools for debugging. Provider-agnostic = easy to switch models.                                                              |

### LLM Layer

| Component   | Technology                      | Purpose                                                    | Notes                                                                                         |
| ----------- | ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Primary LLM | Claude Sonnet 4.5 via Anthropic | Profile conversations, match explanations, recommendations | Best reasoning for nuanced career advice. Quality-focused tasks requiring deep understanding. |
| Fast LLM    | Claude Haiku 4.5 via Anthropic  | Bulk processing, fast operations                           | Cost-effective for high-volume tasks. Sub-second latency for quick operations.                |

**Matching Approach:** Programmatic context construction, not vector search. LLM matching works by constructing structured context from database queries (skills, interests, org focus areas, role requirements) and passing to LLM for reasoning. This provides explainable matches and avoids embedding drift issues.

### Background Jobs & Scheduling

| Technology      | Version  | Purpose                | Why Recommended                                                                                                                        |
| --------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Inngest**     | Latest   | Background jobs, cron  | Purpose-built for serverless. Runs on Vercel without extra infrastructure. Step functions for reliability. Free tier = 25K runs/month. |
| **Vercel Cron** | Built-in | Simple scheduled tasks | For lightweight triggers (email digest schedule). Inngest for complex workflows.                                                       |

### Email

| Technology      | Version | Purpose             | Why Recommended                                                                                                      |
| --------------- | ------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Resend**      | Latest  | Transactional email | Modern API, React Email integration. Free tier = 3K emails/month (sufficient for pilot). 100/day limit on free tier. |
| **React Email** | 5.x     | Email templates     | Build emails with React components. Tailwind 4 support. Dark mode. Spam score checking.                              |

### Scraping / Aggregation

| Technology     | Version | Purpose            | Why Recommended                                                                                                                     |
| -------------- | ------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Playwright** | 1.57.x  | Job board scraping | Cross-browser, handles JS-heavy sites (80K, aisafety.com). Better anti-detection than Puppeteer. Scales in Inngest background jobs. |

### Authentication

| Technology | Version | Purpose                | Why Recommended                                                                                                   |
| ---------- | ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Clerk**  | 6.x     | User auth + management | 5-minute setup, pre-built components, 10K MAU free. Perfect for MVP. Org management built-in for BAISH dashboard. |

### UI Components

| Technology       | Version | Purpose               | Why Recommended                                                                             |
| ---------------- | ------- | --------------------- | ------------------------------------------------------------------------------------------- |
| **Tailwind CSS** | 4.x     | Styling               | Industry standard. Pairs with shadcn/ui.                                                    |
| **shadcn/ui**    | Latest  | Component library     | Copy-paste components, full control. Built on Radix. Not a dependency = no version lock-in. |
| **Radix UI**     | Latest  | Accessible primitives | Headless, accessible. Foundation for shadcn/ui.                                             |

### Development Tools

| Tool          | Purpose              | Notes                                                               |
| ------------- | -------------------- | ------------------------------------------------------------------- |
| **Turbopack** | Dev server, builds   | Now stable in Next.js 16. 5-10x faster than webpack.                |
| **pnpm**      | Package manager      | Faster, stricter than npm. Better monorepo support if needed later. |
| **Biome**     | Linting + formatting | Faster than ESLint + Prettier. Single tool.                         |
| **Vercel**    | Hosting              | First-class Next.js support. Free tier sufficient for pilot.        |

## Installation

```bash
# Create Next.js 16 app
npx create-next-app@latest astn --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core dependencies
pnpm add convex
pnpm add ai @ai-sdk/anthropic
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
pnpm add -D @biomejs/biome
```

## Alternatives Considered

| Recommended           | Alternative           | When to Use Alternative                                                                                                                                                                                         |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**           | Remix                 | If you need smaller JS bundles or Cloudflare Workers deployment. Remix has better nested routing for complex dashboards. Next.js wins on ecosystem maturity and hiring.                                         |
| **Convex**            | Supabase              | If you need raw SQL access or prefer PostgreSQL ecosystem. Supabase offers more database flexibility. Convex wins on real-time DX, TypeScript integration, and serverless functions without separate API layer. |
| **Convex**            | Firebase              | If you're deep in Google Cloud ecosystem. Convex wins on TypeScript-first design and better query model.                                                                                                        |
| **Clerk**             | Auth.js (NextAuth v5) | If you need full data ownership or have >10K MAU. Auth.js is free and open source but v5 still in beta. Clerk wins for speed-to-market.                                                                         |
| **Resend**            | SendGrid              | If you need proven enterprise deliverability or marketing email. SendGrid has faster domain approval. Resend wins on DX and React Email integration.                                                            |
| **Inngest**           | Trigger.dev           | If you need self-hosting or tighter Vercel control. Both are good. Inngest has better Vercel integration and documentation.                                                                                     |
| **Claude Sonnet 4.5** | GPT-4o                | If you need vision capabilities or faster response times for some tasks. Claude wins on reasoning quality and instruction following for complex tasks.                                                          |

## What NOT to Use

| Avoid                                 | Why                                                                 | Use Instead                                                   |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **NextAuth.js v4**                    | Legacy, v5 (Auth.js) is the path forward but still beta             | Clerk for managed auth, or Auth.js v5 if you accept beta risk |
| **Puppeteer**                         | Worse anti-detection, Chrome-only, larger footprint                 | Playwright                                                    |
| **Firebase**                          | NoSQL doesn't fit relational career data well, vendor lock-in       | Convex (better TypeScript, relational-like queries)           |
| **MongoDB**                           | Relational data (profiles, orgs, opportunities) needs joins         | Convex (supports relational patterns with references)         |
| **Langchain**                         | Over-abstraction for simple LLM calls, debugging nightmare          | Vercel AI SDK for direct, typed LLM calls                     |
| **Custom auth**                       | Time sink, security risks for no benefit at MVP stage               | Clerk                                                         |
| **Mailchimp/Marketing tools**         | Overkill for transactional digests, wrong API model                 | Resend                                                        |
| **Separate vector DB**                | Unnecessary complexity when using programmatic context construction | Structured data + LLM reasoning                               |
| **BullMQ/Redis queues**               | Requires separate Redis infrastructure                              | Inngest (serverless-native)                                   |
| **Traditional ORMs (Prisma/Drizzle)** | Not needed with Convex - it has its own query layer                 | Convex functions                                              |

## Stack Patterns by Variant

**If pilot grows beyond 10K users:**

- Migrate from Clerk to Auth.js for cost savings
- Consider Convex Pro tier for higher limits
- Evaluate caching strategies for LLM responses

**If you need real-time collaboration:**

- Convex has real-time built-in by default
- Add Liveblocks or PartyKit for richer presence features

**If you deploy outside Vercel:**

- Inngest works anywhere (Netlify, Railway, self-hosted)
- Consider Trigger.dev for more deployment flexibility
- Convex works with any hosting provider

**If scraping gets blocked:**

- Add Browserbase or ScrapingBee for managed browser infrastructure
- Implement residential proxy rotation

## Version Compatibility

| Package           | Compatible With            | Notes                                           |
| ----------------- | -------------------------- | ----------------------------------------------- |
| Next.js 16.x      | React 19.x, Node 20.9+     | Requires Node 20+, drops Node 18 support soon   |
| Convex            | TypeScript 5.0+, React 18+ | Works with Next.js App Router                   |
| Vercel AI SDK 6.x | Next.js 14+, React 18+     | Works with App Router and Pages Router          |
| Clerk 6.x         | Next.js 14+, React 18+     | Full App Router support                         |
| React Email 5.x   | React 19.x, Tailwind 4.x   | Must update @react-email/components alongside   |
| Playwright 1.57.x | Node 18+, drops Node 16/17 | Now uses Chrome for Testing instead of Chromium |

## Cost Projections (Pilot: 50-100 users)

| Service                | Free Tier                   | Pilot Needs              | Monthly Cost   |
| ---------------------- | --------------------------- | ------------------------ | -------------- |
| Vercel                 | Hobby (100GB bandwidth)     | Sufficient               | $0             |
| Convex                 | Free tier (generous limits) | Sufficient               | $0             |
| Clerk                  | 10K MAU                     | 100 users                | $0             |
| Resend                 | 3K emails/month             | ~500 digests             | $0             |
| Inngest                | 25K runs/month              | ~2K runs                 | $0             |
| Anthropic (Sonnet 4.5) | Pay-per-use                 | Profile convos, matching | ~$15           |
| Anthropic (Haiku 4.5)  | Pay-per-use                 | Bulk operations          | ~$5            |
| **Total**              |                             |                          | **~$20/month** |

## Architecture Decision Records

### ADR-001: Convex over Supabase/PostgreSQL

**Context:** Need backend with real-time capabilities, serverless functions, and TypeScript integration.
**Decision:** Use Convex as unified backend platform.
**Rationale:** TypeScript-first design with end-to-end type safety. Real-time sync is built-in, not bolted on. Serverless functions eliminate need for separate API layer. Simpler mental model than PostgreSQL + ORM + API routes. Trade-off: less SQL flexibility, newer platform.

### ADR-002: Clerk for Authentication

**Context:** Need auth with org management for BAISH dashboard.
**Decision:** Use Clerk for primary auth.
**Rationale:** Clerk's org management, pre-built components, and 5-minute setup. Can sync to Convex via webhooks for user data. Trade-off: dependency on external auth service.

### ADR-003: Programmatic Context over Vector Search

**Context:** Need to match profiles with opportunities.
**Decision:** Use structured data queries + LLM reasoning instead of embeddings/vector search.
**Rationale:** Explainable matches (LLM can articulate why), no embedding drift, simpler infrastructure, works well for <10K profiles. Trade-off: higher LLM token usage per match, but more accurate and debuggable.

### ADR-004: Claude Sonnet 4.5 + Haiku 4.5 for LLM

**Context:** Need high-quality reasoning for career advice and matching.
**Decision:** Sonnet 4.5 for quality tasks, Haiku 4.5 for bulk/fast operations.
**Rationale:** Single provider (Anthropic) simplifies billing and integration. Sonnet 4.5 has best reasoning for nuanced career conversations. Haiku 4.5 is cost-effective for high-volume. Trade-off: slightly higher cost than GPT-4o-mini for fast operations.

### ADR-005: Inngest over Vercel Cron alone

**Context:** Need job scraping, email digests, matching runs.
**Decision:** Use Inngest for all background work.
**Rationale:** Step functions for reliability, retries, observability. Vercel Cron for triggers only. Trade-off: additional service to learn.

## Sources

### Official Documentation (HIGH confidence)

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - Version and features verified
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction) - v6 features and providers
- [Convex Documentation](https://docs.convex.dev/) - Backend platform features
- [Inngest Documentation](https://www.inngest.com/docs) - Background job patterns
- [Resend Documentation](https://resend.com/docs) - Email API features
- [React Email 5.0 Release](https://resend.com/blog/react-email-5) - v5 features including Tailwind 4
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) - v1.57 features
- [Clerk Pricing](https://clerk.com/pricing) - Free tier limits
- [Anthropic Claude Models](https://docs.anthropic.com/en/docs/about-claude/models) - Model capabilities

### Comparison Articles (MEDIUM confidence)

- [Clerk Authentication Guide](https://clerk.com/articles/user-authentication-for-nextjs-top-tools-and-recommendations-for-2025) - Auth comparison
- [Playwright vs Puppeteer (PromptCloud)](https://www.promptcloud.com/blog/playwright-vs-puppeteer-for-web-scraping/) - Scraping comparison
- [Email APIs 2025 (Medium)](https://medium.com/@nermeennasim/email-apis-in-2025-sendgrid-vs-resend-vs-aws-ses-a-developers-journey-8db7b5545233) - Email service comparison

### Web Search (verified with official sources)

- Next.js vs Remix comparison - verified with official docs
- Inngest vs Vercel Cron - verified with official docs
- Auth.js v5 status - verified via GitHub releases

---

_Stack research for: AI Safety Talent Network (ASTN)_
_Researched: 2025-01-17_
