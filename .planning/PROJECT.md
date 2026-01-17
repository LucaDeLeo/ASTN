# AI Safety Talent Network (ASTN)

## What This Is

A career command center for AI safety talent. Individuals maintain living profiles and get matched to opportunities with acceptance probability estimates and personalized "what to do next" recommendations. Local orgs get a self-maintaining CRM as a byproduct. The core insight: people keep profiles updated when they get real value back, not because you ask them to.

## Core Value

Individuals get enough value from smart matching + recommendations that they keep profiles fresh — this is the flywheel that makes everything else work.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Rich profile creation via form + LLM conversation (background, AI safety engagement, goals, constraints)
- [ ] Smart opportunity matching with explanations ("here's why this fits you")
- [ ] LLM-estimated acceptance probability for each match
- [ ] Personalized recommendations ("do these 3 things to improve your fit")
- [ ] Org dashboard for BAISH to view their members (basic CRM)
- [ ] Automated opportunity aggregation from 80k job board and aisafety.com
- [ ] Email digests for matches

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

**Launch plan:** Pilot with BAISH (Buenos Aires AI Safety Hub), targeting 50-100 initial profiles. Workshop-based onboarding where members create profiles and get immediate matches during the session.

**Opportunity supply:** Automated aggregation from 80k job board and aisafety.com. Teams there are expected to be cooperative — will coordinate with them for data access.

**Building approach:** Building in public, starting lean to prove the core bet works.

**Three-sided network:**
1. Individuals — get matching + recommendations, keep profiles updated
2. Local orgs — get CRM that maintains itself (members update their own profiles)
3. Opportunity posters — get better candidates without changing workflow (v2, passive benefit from aggregation for now)

## Constraints

- **Pilot scope**: BAISH first, 50-100 profiles before expanding
- **Opportunity data**: Dependent on 80k and aisafety.com aggregation working
- **LLM-based**: Acceptance probability and recommendations are LLM-estimated, not historical data (yet)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1 focused on matching + recommendations, not application tracking | Need to prove the hook before building retention features | — Pending |
| LLM-estimated acceptance probability from day one | Differentiator, can refine with real data over time | — Pending |
| Org CRM in v1 | BAISH needs visibility into their members for pilot to work | — Pending |
| Automated opportunity aggregation | Manual curation doesn't scale; 80k/aisafety.com teams likely cooperative | — Pending |

---
*Last updated: 2026-01-17 after initialization*
