# Project Research Summary

**Project:** AI Safety Talent Network (ASTN)
**Domain:** Career platform / Talent matching system for AI safety field
**Researched:** 2026-01-17
**Confidence:** MEDIUM-HIGH

## Executive Summary

ASTN is a two-sided talent marketplace targeting the AI safety niche. This is a well-understood domain architecturally (career platforms, recommendation systems, multi-tenant dashboards), but with novel LLM-powered features that push beyond typical implementations. The recommended approach is a Next.js 16 + Supabase + Vercel stack with Clerk auth, using a two-stage matching architecture (vector retrieval + LLM ranking). The LLM layer should use Claude 3.5 Sonnet for high-quality reasoning (profile conversations, match explanations) and GPT-4o-mini for bulk operations (embeddings, initial filtering).

The core value proposition is "conversational profile creation that generates actionable career recommendations." This differentiates from 80,000 Hours (passive job board) and LinkedIn (generic matching). The key technical innovations are: LLM-powered profile enrichment, match explanations that show reasoning, and acceptance probability estimates. However, the acceptance probability feature carries the highest risk of hallucination and should be labeled experimental or deferred.

The critical risks are: (1) **Cold start** - launching without sufficient opportunities will kill the platform immediately; aggregate jobs BEFORE building user features; (2) **Profile decay** - users won't update unless they get value, so the recommendation engine must deliver from day one; (3) **LLM hallucination** - one confidently wrong recommendation destroys trust; ground all LLM output in verified data. The niche market size (~50-200 active AI safety opportunities worldwide) is a reality to manage through expectation-setting, not a problem to solve.

## Key Findings

### Recommended Stack

The stack prioritizes developer velocity and serverless deployment while avoiding infrastructure overhead. All services have generous free tiers sufficient for the 50-100 user pilot.

**Core technologies:**
- **Next.js 16.x**: Full-stack React framework with App Router, Turbopack (now stable), and React Server Components. Industry standard for 2025.
- **Supabase (PostgreSQL 16+)**: Managed database with built-in pgvector for embeddings, Row-Level Security for multi-tenant org dashboards.
- **Prisma 6.x**: Type-safe ORM with declarative schema. v6 removed Rust engine for faster serverless cold starts.
- **Vercel AI SDK 6.x**: Unified API for OpenAI/Anthropic. Enables streaming, function calling, and structured outputs.
- **Clerk 6.x**: Authentication with org management built-in. 5-minute setup, 10K MAU free.
- **Inngest**: Background jobs for scraping, matching, and email digests. Purpose-built for serverless.
- **Resend + React Email**: Transactional email with React component templates.

**What NOT to use:** LangChain (over-abstraction), MongoDB/Firebase (relational data needs joins), Puppeteer (Playwright has better anti-detection), separate vector DB at MVP scale (pgvector sufficient for <1M vectors).

**Estimated pilot cost:** ~$11/month (primarily LLM API costs).

### Expected Features

**Must have (table stakes):**
- User profiles with skills/experience (AI safety-specific taxonomy)
- Opportunity listings (aggregated from 80K Hours + manual)
- Search and filtering by role type, location, experience
- Email digest notifications (weekly personalized summaries)
- Privacy controls (hide from specific orgs, e.g., current employer)
- OAuth authentication (Google/GitHub)
- Mobile-responsive design

**Should have (differentiators):**
- LLM conversational profile creation (core innovation)
- Smart matching with explanations ("why this fits you")
- Personalized "what to do next" recommendations
- Acceptance probability estimation (labeled experimental)
- Basic org dashboard (CRM view for pilot local groups)
- Automated opportunity aggregation

**Defer (v2+):**
- Full application tracker (users have existing systems)
- Real-time messaging between users (scope creep, moderation burden)
- Social feed / content posting (EA Forum already serves this)
- Gamification (inappropriate for mission-driven context)
- Video interviews/assessments (high friction)

### Architecture Approach

The architecture follows a standard three-tier pattern (client, API, data) with a processing layer for LLM operations and background jobs. The key architectural decision is **two-stage matching**: fast vector retrieval (pgvector) to get ~100 candidates, then LLM re-ranking with explanations for the top ~20. This balances speed, cost, and quality.

**Major components:**
1. **Profile Builder** - Form + LLM conversation, structured extraction via function calling
2. **Match Engine** - Two-stage retrieval + ranking, generates explanations
3. **LLM Gateway** - Centralized prompt management, rate limiting, cost tracking
4. **Job Aggregator** - Background scraping of 80K Hours, aisafety.com, org career pages
5. **Notification Service** - Weekly digests, match alerts via Resend
6. **Multi-tenant Layer** - PostgreSQL Row-Level Security for org-scoped data views

**Key patterns:**
- Hybrid data model: structured fields (queryable) + unstructured narrative (LLM context) + embeddings (semantic search)
- Background job processing for expensive operations (matching, embedding generation)
- Pre-compute matches, serve from cache, recompute on changes

### Critical Pitfalls

1. **Cold Start** - Must aggregate opportunities BEFORE launching user features. Users who see zero matches never return. Mitigation: Import from 80K Hours, aisafety.com, and org career pages before pilot. Target: 3+ opportunities per user segment.

2. **LLM Hallucination** - LLMs will confidently fabricate job requirements, org details, or acceptance probabilities. Mitigation: Ground ALL LLM output in verified database content. Show explanations as "Matched because [data]" not "You would be perfect because [generated]". Consider deferring acceptance probability to v2.

3. **Profile Decay** - Profiles become stale within months. Dead profiles make matching worse, which reduces value, which reduces updates. Mitigation: Build micro-update prompts, activity signals as implicit preferences, profile freshness indicators.

4. **Aggregation Fragility** - Scraped job sources WILL break. HTML structure changes, rate limits, IP blocks. Mitigation: Build monitoring, staleness detection, manual curation fallback. Show "Last verified: X" on all listings.

5. **Privacy Violations** - Career data is highly sensitive (current employer, salary expectations). Mitigation: Minimal data collection, user-controlled visibility, clear consent flows, no LLM training on user data, data retention policy from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation + Data Layer
**Rationale:** Cold start prevention requires opportunities before users. Auth and data model enable everything else.
**Delivers:** Database schema, auth system, opportunity data model, aggregation infrastructure, basic opportunity display
**Addresses:** Auth (table stakes), opportunity listings (table stakes), aggregation (enables matching)
**Avoids:** Cold start pitfall - ensures opportunities exist before user onboarding begins

### Phase 2: Profile + Matching Core
**Rationale:** Profiles depend on auth/data layer. Matching requires both profiles and opportunities. This is the core value proposition.
**Delivers:** Form-based profile creation, LLM profile enrichment, embedding generation, two-stage matching, match explanations
**Uses:** Supabase, Prisma, Vercel AI SDK (Claude + OpenAI embeddings), pgvector
**Implements:** Profile Builder, Match Engine, LLM Gateway
**Avoids:** LLM hallucination - implements grounded explanations

### Phase 3: Engagement + Org Features
**Rationale:** Email notifications require matching to work first. Org dashboard requires profiles and privacy controls.
**Delivers:** Weekly digest emails, notification preferences, org dashboard (CRM view), privacy controls
**Uses:** Resend, React Email, Inngest for scheduling, PostgreSQL RLS for multi-tenancy
**Implements:** Notification Service, Multi-tenant Layer
**Avoids:** Profile decay - builds engagement loops to drive updates

### Phase 4: Enhancement + Scale Prep
**Rationale:** Acceptance probability needs baseline matching working. Analytics need usage data. Scale prep before public launch.
**Delivers:** Acceptance probability (experimental), recommendation feedback loop, match caching, analytics dashboard, bias audits
**Addresses:** Differentiator features, performance optimization
**Avoids:** Filter bubble - implements diversity metrics before scaling

### Phase 5: Public Launch Readiness
**Rationale:** Security hardening, monitoring, and polish before opening beyond pilot.
**Delivers:** Security audit, rate limiting, abuse prevention, onboarding polish, documentation
**Addresses:** Production readiness

### Phase Ordering Rationale

- **Opportunities before profiles:** Two-sided marketplace research is unanimous - the supply side (opportunities) must exist before demand side (job seekers) arrives. One bad first experience = permanent abandonment.
- **Matching before notifications:** Email digests are only valuable if they contain good matches. Building notifications before matching works creates spam and unsubscribes.
- **Org dashboard after privacy:** Row-Level Security must be in place before any org-scoped data access. Privacy first, then sharing.
- **LLM features gradual rollout:** Start with simpler retrieval matching, add LLM explanations once grounded, defer acceptance probability until confident in calibration.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (LLM Profile Enrichment):** Function calling schemas for structured extraction need iteration. Prompt engineering for profile conversation is novel.
- **Phase 2 (Matching Algorithm):** Two-stage retrieval + ranking implementation has many tuning parameters. Need to research embedding strategies for profiles vs opportunities.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Next.js + Supabase + Clerk patterns. Prisma schema design is straightforward.
- **Phase 3 (Email/Notifications):** Resend + React Email has excellent documentation. Inngest cron patterns are standard.
- **Phase 5 (Launch Prep):** Standard security and monitoring practices.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified with official 2025/2026 docs. Version compatibility confirmed. |
| Features | MEDIUM-HIGH | Table stakes well-established from competitor analysis. LLM-powered differentiators are novel with limited precedent. |
| Architecture | MEDIUM-HIGH | Two-stage matching is industry standard (Indeed, LinkedIn). LLM integration patterns are emerging but documented. |
| Pitfalls | HIGH | Marketplace dynamics extensively documented. LLM risks well-understood. Privacy requirements clear. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Acceptance probability calibration:** No precedent for this feature. Consider labeling as "experimental" or "LLM-estimated" rather than authoritative. May need to defer or redesign based on early user feedback.
- **AI safety skills taxonomy:** Must be defined before meaningful matching. Research found no existing taxonomy. Need community input during Phase 1 or early Phase 2.
- **80K Hours API/partnership:** Research found no public API. Scraping is the current assumption but partnership would be more reliable. Worth exploring during Phase 1.
- **Embedding strategy:** Research confirms hybrid approach (structured + narrative) but optimal text composition for embeddings needs experimentation.
- **Profile update incentives:** "Update for better recommendations" is the theory but needs validation. If recommendations don't noticeably improve, need alternative engagement hooks.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - Version, features, Turbopack stability
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - v6 features, provider abstraction
- [Prisma Documentation](https://www.prisma.io/docs) - ORM capabilities, v6 engine changes
- [Supabase Documentation](https://supabase.com/docs) - pgvector, RLS, platform features
- [Clerk Documentation](https://clerk.com/docs) - Auth, org management, pricing
- [Inngest Documentation](https://www.inngest.com/docs) - Background job patterns

### Secondary (MEDIUM confidence)
- [NFX: 19 Marketplace Tactics](https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem) - Cold start strategies
- [Indeed: Algorithms and Architecture for Job Recommendations](https://www.oreilly.com/content/algorithms-and-architecture-for-job-recommendations/) - Two-stage matching pattern
- [Eugene Yan: System Design for Discovery](https://eugeneyan.com/writing/system-design-for-discovery/) - Recommendation architecture
- [80,000 Hours Job Board](https://jobs.80000hours.org/) - Competitor analysis, opportunity source
- [Wellfound](https://wellfound.com/) - Feature benchmarking

### Tertiary (LOW confidence)
- LLM-powered profile enrichment patterns - emerging space, limited production case studies
- Acceptance probability estimation - novel feature, no direct precedent found
- AI safety talent market size - estimates vary, need validation with pilot data

---
*Research completed: 2026-01-17*
*Ready for roadmap: yes*
