---
stepsCompleted: [1, 2, 3]
inputDocuments: [COURSE-PROGRAM-PLAN.md]
session_topic: 'Iterate on Course Program Plan - feature list, design, and UX'
session_goals: 'Start from current core UX, identify real problems, iterate on features and how-it-works design'
selected_approach: 'ai-recommended'
techniques_used: ['Assumption Reversal', 'Role Playing', 'SCAMPER']
ideas_generated: [32]
context_file: 'COURSE-PROGRAM-PLAN.md'
---

# Brainstorming Session Results

**Facilitator:** Luca
**Date:** 2026-03-10

## Session Overview

**Topic:** Iterate on the Course Program Plan — feature list, design, and "how it works"
**Goals:** Ground the design in the real current UX (BlueDot + Google Docs), identify actual problems, and iterate on features from there

## Technique Execution Results

### Phase 1: Assumption Reversal

**Assumptions challenged:**

1. **"BlueDot has no exercises"** — WRONG. BlueDot has MC questions, freeform essays with structured sub-questions. The real gap is: submissions go into a void (no AI feedback, no facilitator visibility, no session connection).

2. **"Exercise system is the single biggest gap"** — REFRAMED. The biggest gap is the integration layer — nothing talks to anything else. BlueDot + Google Docs + Zoom + WhatsApp are disconnected silos. The facilitator is blind.

3. **"Live Session Mode needs complex block types"** — OVERBUILT. Google Doc pain is simpler than assumed: shared tables where people overwrite each other, no private-then-reveal, no timers, facilitator notes visible to all. Solution is simpler: ordered phases with optional prompts.

4. **"Implementation should be Exercises → Sessions → Dashboard → Adaptive → Social → Notifications"** — WRONG ORDER. Should be: unified prompt system → AI sidebar → facilitator agent → session runner. The AI and integration are the foundation, not features added later.

**Key ideas from Phase 1:**

- **Idea #1: Facilitator visibility as core architecture** — build dashboard-first, not feature-first
- **Idea #2: AI Learning Partner sidebar** — persistent chat that knows the curriculum
- **Idea #3: Shared AI chat** — module-level shared conversations
- **Idea #4: Single backend as differentiator** — ASTN pipeline data carries over
- **Idea #5: AI as connective tissue** — shared cognitive layer across entire experience
- **Idea #6: AI IS the curriculum** — meta-pedagogical in AI safety courses
- **Idea #7: Unified input component** — same UX for exercises and session activities
- **Idea #8: Write-then-reveal pattern** — private first, facilitator triggers reveal
- **Idea #9: Session timeline with adaptive pacing** — timer bar, not presenter mode

### Phase 2: Role Playing

Played three full scenarios end-to-end:

1. **Lauti preparing for Session 2** — revealed the AI sidebar as the transformative element in the learning experience
2. **Luca (facilitator) preparing for and running Session 2** — revealed the facilitator agent as the key tool, propose-and-approve pattern, real-time session observations
3. **Setting up a new cohort** — revealed that session duplication is sufficient, no template system needed

**Key ideas from Phase 2:**

- **Idea #10: Live polling / ad-hoc prompts** — facilitator creates questions on the fly
- **Idea #11: AI session scribe** — automatic note-taking during sessions
- **Idea #12: Facilitator toolkit that grows with AI** — extensible, not fixed features
- **Idea #13: Session runner as admin page extension** — not a separate app
- **Idea #14: Activities as generic "prompt" primitive** — one table, one component
- **Idea #15: Facilitator agent with full system access** — conversational interface to all data
- **Idea #16: Agent as live copilot during sessions** — real-time observations
- **Idea #17: Agent for async facilitator assistance** — between-session prep
- **Idea #18: Context parity principle** — agent sees what facilitator sees
- **Idea #19: Propose-and-approve pattern** — human-in-the-loop for all agent writes
- **Idea #20: Agent actions reflect instantly in UI** — Convex reactive subscriptions

### Phase 3: SCAMPER

Systematic iteration on each section of the original plan:

- **Section 4 (Learning Flow):** ELIMINATE Focus Mode, COMBINE smart ordering with existing module view, ADD AI sidebar
- **Section 5 (Exercises):** SUBSTITUTE 5 types with one generic prompt, ELIMINATE peer review and config complexity
- **Section 6 (AI Feedback):** SUBSTITUTE with AI sidebar (conversational, not static), ELIMINATE audio generation pipeline (facilitator uploads MP3), MODIFY pre-session briefing to agent capability
- **Section 7 (Live Sessions):** MODIFY to simple phases + prompts + timer, ELIMINATE complex block types and session plan builder, REVERSE from facilitator-controlled to agent-assisted
- **Section 8 (Adaptive Mode):** ELIMINATE entirely — the sidebar handles it conversationally
- **Section 9 (Dashboard):** SUBSTITUTE with facilitator agent, KEEP visual data display
- **Section 10 (Social):** ELIMINATE for v1 except spotlight responses
- **Section 11-12 (Notifications, Mobile):** ELIMINATE for v1

**Key ideas from Phase 3:**

- **Idea #26: Minimal learning flow + AI sidebar** — sidebar IS the upgrade
- **Idea #27: One prompt primitive, zero configuration** — ~4 fields, not 15+
- **Idea #28: Kill audio summaries pipeline** — sidebar can summarize on demand; facilitators upload MP3 as audio material type
- **Idea #29: Sessions are just ordered prompts + timer + agent** — one array of phase objects
- **Idea #30: Adaptive mode is just asking the sidebar** — removes entire feature section
- **Idea #31: Dashboard = visual data + agent intelligence** — not 5 specialized views
- **Idea #32: No social layer for v1** — WhatsApp exists

## Creative Journey Summary

The session fundamentally reframed the plan from "build features A-F" to "build a facilitation operating system with AI as the substrate." The original plan had 12 new database tables, 6 implementation phases, and dozens of features. The revised plan has 5 new tables, 4 implementation phases, and a much clearer architecture.

**Biggest breakthroughs:**

1. Recognizing that BlueDot's real problem is disconnected stacks, not missing features
2. The AI sidebar replaces 3 separate features (feedback, audio summaries, adaptive mode)
3. The facilitator agent replaces the entire dashboard section
4. Exercises and session activities are the same component
5. The meta-pedagogical angle — AI in AI safety courses is itself the curriculum
