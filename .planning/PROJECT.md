# AI Safety Talent Network (ASTN)

## What This Is

A career command center for AI safety talent. Individuals maintain living profiles and get matched to opportunities with acceptance probability estimates and personalized "what to do next" recommendations. Local orgs get a self-maintaining CRM as a byproduct. The core insight: people keep profiles updated when they get real value back, not because you ask them to.

## Core Value

Individuals get enough value from smart matching + recommendations that they keep profiles fresh — this is the flywheel that makes everything else work.

## Current Milestone: v1.1 Profile Input Speedup

**Goal:** Reduce friction in profile creation by letting users upload existing documents instead of filling forms from scratch.

**Target features:**
- Upload PDF (CV or LinkedIn "Save as PDF" export)
- Paste text block with career info
- LLM extracts structured data and auto-fills profile form
- User reviews/edits, then enrichment chat fills remaining gaps

## Requirements

### Validated

- ✓ Rich profile creation via form + LLM conversation — v1.0
- ✓ Smart opportunity matching with explanations ("here's why this fits you") — v1.0
- ✓ LLM-estimated acceptance probability for each match — v1.0
- ✓ Personalized recommendations ("do these 3 things to improve your fit") — v1.0
- ✓ Org dashboard for BAISH to view their members (basic CRM) — v1.0
- ✓ Automated opportunity aggregation from 80k job board and aisafety.com — v1.0
- ✓ Email digests for matches — v1.0

### Active

- [ ] PDF/document upload for profile creation (CV, LinkedIn export)
- [ ] Text paste for profile creation (any format)
- [ ] LLM extraction from uploaded content → auto-fill form fields
- [ ] Context-aware enrichment chat (knows what's populated, only asks about gaps)

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

**Current state:** v1.0 MVP shipped 2026-01-18. Ready for BAISH pilot (50-100 profiles).

**Tech stack:** Convex + TanStack Start + React 19 + shadcn/ui + Claude Sonnet 4.5/Haiku 4.5

**Codebase:** ~73,000 lines TypeScript, 289 files

**Known issues:**
- `@ts-nocheck` in batchActions.ts (Convex action type inference workaround)
- OAuth flows require real browser testing
- Aggregation requires 80K/Airtable API keys configured

**Launch plan:** Workshop-based onboarding where members create profiles and get immediate matches during the session.

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

---
*Last updated: 2026-01-18 after v1.1 milestone started*
