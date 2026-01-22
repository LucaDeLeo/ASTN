# AI Safety Talent Network (ASTN)

## What This Is

A career command center for AI safety talent. Individuals maintain living profiles and get matched to opportunities with acceptance probability estimates and personalized "what to do next" recommendations. Local orgs get a self-maintaining CRM as a byproduct. The core insight: people keep profiles updated when they get real value back, not because you ask them to.

## Core Value

Individuals get enough value from smart matching + recommendations that they keep profiles fresh — this is the flywheel that makes everything else work.

## Current Milestone: v2.0 Mobile + Tauri

**Goal:** Transform ASTN into a mobile-first experience with native iOS and Android apps via Tauri, fixing all responsive layout issues and adding app-like navigation.

**Target features:**
- Comprehensive responsive fixes across entire app
- Bottom tab bar navigation (Home, Opportunities, Matches, Events, Profile)
- Native-ish feel with smooth mobile interactions
- Tauri wrapper for iOS and Android
- Ship to app stores (TestFlight, Play Store beta)

## Current State

**Shipped:** v1.3 Visual Overhaul (2026-01-20)

v1.3 transformed ASTN from generic shadcn/ui to a warm, memorable visual identity. Features include design token system (Lora + Plus Jakarta Sans fonts, OKLCH coral palette), motion system (AnimatedCard stagger, Card hover lift, Button squish, View Transitions), intentional coral-based dark mode, and accessibility polish (focus states, empty states).

**Tech stack:** Convex + TanStack Start + React 19 + shadcn/ui + Claude Sonnet 4.5/Haiku 4.5 + Tauri (v2.0)

**Codebase:** ~114,000 lines TypeScript, ~500 files

## Requirements

### Validated

- ✓ Rich profile creation via form + LLM conversation — v1.0
- ✓ Smart opportunity matching with explanations ("here's why this fits you") — v1.0
- ✓ LLM-estimated acceptance probability for each match — v1.0
- ✓ Personalized recommendations ("do these 3 things to improve your fit") — v1.0
- ✓ Org dashboard for BAISH to view their members (basic CRM) — v1.0
- ✓ Automated opportunity aggregation from 80k job board and aisafety.com — v1.0
- ✓ Email digests for matches — v1.0
- ✓ PDF/document upload for profile creation (CV, LinkedIn export) — v1.1
- ✓ Text paste for profile creation (any format) — v1.1
- ✓ LLM extraction from uploaded content → auto-fill form fields — v1.1
- ✓ Context-aware enrichment chat (knows what's populated, only asks about gaps) — v1.1
- ✓ Org discovery with geography-based suggestions and invite links — v1.2
- ✓ Lu.ma event integration with automatic sync and dashboard display — v1.2
- ✓ Configurable event notifications with batching and org muting — v1.2
- ✓ Post-event attendance tracking with one-tap confirmation and feedback — v1.2
- ✓ LLM engagement scoring with explanations and admin override — v1.2
- ✓ Full CRM dashboard with member profiles, history, and CSV export — v1.2
- ✓ Custom program tracking with enrollment and attendance — v1.2
- ✓ Design token system (Lora + Plus Jakarta Sans fonts, OKLCH coral palette, fluid typography) — v1.3
- ✓ Font preloading infrastructure (no FOIT/FOUT) — v1.3
- ✓ Warm visual treatment (GradientBg, coral shadows, atmospheric depth) — v1.3
- ✓ Motion system (AnimatedCard stagger, Card hover, Button squish, View Transitions) — v1.3
- ✓ Intentional coral-based dark mode with SSR detection (no flash) — v1.3
- ✓ Accessibility polish (focus states, Empty component variants) — v1.3

### Active

- [ ] Responsive layout fixes across all member-facing pages
- [ ] Bottom tab bar navigation for mobile (Home, Opportunities, Matches, Events, Profile)
- [ ] Mobile-optimized touch interactions and gestures
- [ ] Tauri project setup for iOS and Android
- [ ] Native mobile app builds (TestFlight, Play Store beta)
- [ ] Basic responsive admin pages (usable, not polished)

### Out of Scope

- Application tracker — v2, after proving the hook works
- Rejection analysis — v2, requires application history
- Pre-fill applications — v2, retention feature not acquisition
- Collaborator matching — v2+, complex feature
- Reading/course tracking system — v2+, simple recs first
- "Insist" escalation (multi-channel nudges) — v2+
- Cross-org discovery — v2+
- Sophisticated career pathing with milestones — v2+

## Context

**Current state:** v1.3 shipped 2026-01-20. Warm visual identity with design tokens, motion system, and dark mode. Mobile experience is currently broken with layout bugs across the app.

**Known issues:**
- `@ts-nocheck` in batchActions.ts (Convex action type inference workaround)
- OAuth flows require real browser testing
- Aggregation requires 80K/Airtable API keys configured
- Lu.ma API key required for event sync (per-org Lu.ma Plus subscription)
- linkedEventIds auto-attendance not yet implemented (tracked as future work)
- Settings/attendance/org admin pages still use cold backgrounds (v1.3 coverage gap)
- 35+ headings use font-bold instead of font-display (v1.3 coverage gap)
- Mobile layout bugs and responsive issues across entire app (v2.0 focus)

**v2.0 context:**
- BAISH workshop onboarding may happen on phones — mobile must work
- Tauri 2.0 supports iOS and Android via native webview wrappers
- Goal is app store presence (TestFlight for iOS, Play Store beta for Android)
- Responsive web comes first, Tauri wraps the working web app
- Desktop Tauri skipped — focus is mobile only

**Launch plan:** Workshop-based onboarding where members create profiles (via upload, paste, or AI chat) and get immediate matches during the session.

**Three-sided network:**
1. Individuals — get matching + recommendations, keep profiles updated
2. Local orgs — get CRM that maintains itself (members update their own profiles)
3. Opportunity posters — get better candidates without changing workflow (v2, passive benefit from aggregation for now)

## Constraints

- **Pilot scope**: BAISH first, 50-100 profiles before expanding
- **Opportunity data**: Dependent on 80k and aisafety.com aggregation working
- **LLM-based**: Acceptance probability and recommendations are LLM-estimated, not historical data (yet)
- **Tech stack**: Convex for backend, TanStack Start for frontend
- **No vector search**: Programmatic context construction for LLM calls instead of embeddings
- **Models**: Claude Sonnet 4.5 (quality/reasoning tasks) + Haiku 4.5 (bulk/fast operations)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1 focused on matching + recommendations, not application tracking | Need to prove the hook before building retention features | ✓ Good — shipped core value prop |
| LLM-estimated acceptance probability from day one | Differentiator, can refine with real data over time | ✓ Good — prominent in UI with experimental label |
| Org CRM in v1 | BAISH needs visibility into their members for pilot to work | ✓ Good — full dashboard with stats and export |
| Automated opportunity aggregation | Manual curation doesn't scale; 80k/aisafety.com teams likely cooperative | ✓ Good — adapters working, needs API keys |
| Convex over Supabase | Real-time sync, simpler developer experience, no separate vector DB needed | ✓ Good — real-time updates smooth |
| Programmatic context over vectors | More control over what context the LLM sees, avoids embedding quality issues | ✓ Good — matching prompts well-structured |
| Claude Sonnet 4.5 + Haiku 4.5 | Latest models, Sonnet for quality reasoning, Haiku for speed/cost | ✓ Good — Haiku fast for enrichment, quality TBD |
| Tier labels (great/good/exploring) not percentages | More encouraging, less anxiety-inducing for job seekers | ✓ Good — aligns with encouraging tone |
| Cold start prevention (opportunities first) | Ensure users see matches immediately on signup | ✓ Good — no empty state for new users |
| Claude Haiku 4.5 for extraction | Fast, cheap (~$0.001/resume), vision capability for PDFs | ✓ Good — ~5-10 second extraction |
| Extract-then-discard for privacy | No document retention after extraction | ✓ Good — privacy-preserving |
| Explicit user review required | All extracted data must be reviewed before saving | ✓ Good — user maintains control |
| 4-way entry point wizard | Upload, paste, manual, chat-first options | ✓ Good — covers all user preferences |
| Default acceptance in review UI | Users reject unwanted fields rather than accepting each | ✓ Good — reduced friction |
| Fuzzy skill matching (0.7 threshold) | Suggest ASTN skills from resume content | ✓ Good — helpful suggestions |
| Location discovery opt-in | Privacy-first approach to geography features | ✓ Good — users control visibility |
| Lu.ma integration over native events | Leverage existing event platform, avoid re-inventing | ✓ Good — faster delivery, familiar UX |
| Weekly digest as default notification | Prevent notification fatigue from day one | ✓ Good — users can opt into more |
| Post-event prompt within 2-4 hours | Balance response rate vs memory accuracy | ✓ Good — research-backed timing |
| Claude Haiku for engagement scoring | Cost-effective for batch daily classification | ✓ Good — ~$0.001 per member |
| Engagement levels not percentages | Avoid false precision, reduce member anxiety | ✓ Good — admin-only, actionable labels |
| Server-side pagination for CRM | Prevent performance explosion at scale | ✓ Good — handles 100+ members |
| OKLCH color space for tokens | Perceptually uniform, consistent chroma across hues | ✓ Good — coral-500 and teal-500 equally vibrant |
| Lora for headings, Plus Jakarta Sans for body | Split personality creates elegance + readability | ✓ Good — warm and approachable |
| Spring easing with 1.56 overshoot | Organic motion without being distracting | ✓ Good — subtle bounce feels alive |
| Stagger cap at 9 items (450ms) | Prevent excessive wait times on large lists | ✓ Good — max delay feels responsive |
| Dark mode primary stays coral | Maintain brand identity across themes | ✓ Good — warm charcoal background |
| Cookie-based SSR theme detection | Eliminate dark mode flash on page load | ✓ Good — no FOIT equivalent for themes |
| View Transitions API for navigation | Native browser animation, works without JS | ✓ Good — 250ms crossfade |

---
*Last updated: 2026-01-20 after v2.0 milestone start*
