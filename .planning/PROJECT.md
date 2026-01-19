# AI Safety Talent Network (ASTN)

## What This Is

A career command center for AI safety talent. Individuals maintain living profiles and get matched to opportunities with acceptance probability estimates and personalized "what to do next" recommendations. Local orgs get a self-maintaining CRM as a byproduct. The core insight: people keep profiles updated when they get real value back, not because you ask them to.

## Core Value

Individuals get enough value from smart matching + recommendations that they keep profiles fresh — this is the flywheel that makes everything else work.

## Current Milestone: v1.2 Org CRM & Events

**Goal:** Transform ASTN into a self-maintaining CRM for field-building orgs — members discover local hubs, attend events, and orgs get a live view of their community without chasing people to update spreadsheets.

**Target features:**
- Org discovery (geography-based suggestions, searchable list, invite links)
- Local events (orgs create events, members get configurable notifications)
- Post-event attendance flow ("Did you attend?" → feedback form)
- Attendance tracked on member profiles
- Org dashboard as full CRM (member list, profiles, engagement history)
- LLM-computed engagement levels with admin override

**Stretch:**
- Custom program tracking per org (reading groups, fellowships, etc.)
- Granular attendance by program
- Travel reminders when near a hub

## Current State

**Shipped:** v1.1 Profile Input Speedup (2026-01-19)

v1.1 added faster profile creation via PDF/text upload with LLM extraction, a review UI for extracted data, and a 4-way entry point wizard (upload, paste, manual, chat-first).

**Tech stack:** Convex + TanStack Start + React 19 + shadcn/ui + Claude Sonnet 4.5/Haiku 4.5

**Codebase:** ~84,000 lines TypeScript, ~360 files

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

### Active

- [ ] Org discovery — geography-based suggestions for nearby hubs
- [ ] Org discovery — searchable list with online communities
- [ ] Org discovery — invite links for direct org joining
- [ ] Local events — orgs can create events with details
- [ ] Local events — configurable notifications (frequency, channel, disable)
- [ ] Event attendance — post-event "Did you attend?" notification
- [ ] Event attendance — feedback form (immediate, dismiss, remind later)
- [ ] Event attendance — tracked on member profiles
- [ ] Org CRM — full member directory with profiles
- [ ] Org CRM — engagement history per member
- [ ] Engagement scoring — LLM-computed from activity
- [ ] Engagement scoring — admin override capability

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

**Current state:** v1.1 shipped 2026-01-19. Ready for BAISH pilot (50-100 profiles) with faster profile creation.

**Known issues:**
- `@ts-nocheck` in batchActions.ts (Convex action type inference workaround)
- OAuth flows require real browser testing
- Aggregation requires 80K/Airtable API keys configured
- test-upload.tsx route should be removed after development verification

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

---
*Last updated: 2026-01-19 after v1.2 milestone defined*
