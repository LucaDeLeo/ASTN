# Course Program Platform — Design Document (v2)

> **Goal:** Build a course/program platform for ASTN that is meaningfully better than BlueDot Impact's platform. Initial pilot: BAISH's Technical AI Safety course (~10 participants, 6 weekly sessions in Spanish).
>
> **Core thesis:** The differentiator isn't any single feature — it's that everything lives in one system with AI woven into every layer. BlueDot stitches together Google Docs, Zoom, Slack, and their own content tracker. We build one unified platform where data flows everywhere, the facilitator has an AI copilot, and participants have an AI learning partner.

---

## Table of Contents

1. [Analysis: What BlueDot Does (and Where It Falls Short)](#1-analysis-what-bluedot-does)
2. [What We've Already Built](#2-what-weve-already-built)
3. [The Big Ideas (Revised)](#3-the-big-ideas)
4. [Design Principles](#4-design-principles)
5. [Feature: Unified Prompt System](#5-unified-prompt-system)
6. [Feature: AI Sidebar (Participant Learning Partner)](#6-ai-sidebar)
7. [Feature: Facilitator Agent](#7-facilitator-agent)
8. [Feature: Session Runner](#8-session-runner)
9. [Feature: Module Enhancements](#9-module-enhancements)
10. [Data Model Design](#10-data-model-design)
11. [Implementation Priority](#11-implementation-priority)
12. [Deferred to v2](#12-deferred-to-v2)

---

## 1. Analysis: What BlueDot Does

### BlueDot's Core UX

BlueDot's platform is a **content tracker with a checklist pattern**:

- **Left sidebar:** Numbered modules (1-6), expandable to show subsections. Each subsection shows estimated time and completion count (e.g., "4 of 6 completed").
- **Right content area:** Sequential list of reading materials (external links) and exercises.
- **Materials:** Each is an external link with metadata (author, year, estimated reading time). A "Complete" button marks it done. Like/Dislike feedback and "Was this resource useful?" freeform input per resource.
- **Exercises:** Multiple choice questions with selection UI, and freeform essay prompts with structured sub-questions (numbered requirements, word count guidance). A "Complete" button saves and marks done.
- **Navigation:** Breadcrumbs + Prev/Next buttons to move through subsections linearly.
- **Progress:** Global percentage at top ("8% completed").

### Where BlueDot Actually Falls Short

BlueDot's exercises and content tracker are more capable than they first appear — the real problems are structural:

| Area                       | Actual Problem                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Disconnected stacks**    | BlueDot platform + Google Docs + Zoom + Slack/WhatsApp are completely separate systems. No data flows between them. The facilitator can never see a unified picture.                                                              |
| **Facilitator blindness**  | Facilitators cannot see who did the readings, what participants wrote in exercises, or how engagement trends over time. Exercise submissions go into a void.                                                                      |
| **Session facilitation**   | Zero in-platform support. Sessions happen in Google Docs where: facilitator notes are visible to everyone, participants overwrite each other's table rows, there are no timers, no private-then-reveal flows, no pair management. |
| **No AI integration**      | No feedback on exercises, no learning assistance, no facilitator intelligence. In AI safety courses specifically, this is a missed opportunity — the platform should demonstrate AI capabilities as part of the learning.         |
| **Pre-work ↔ session gap** | No connection between what participants read/wrote before the session and what happens during the session. Facilitators manually prepare by reading Google Docs.                                                                  |
| **No adaptivity**          | No way for busy participants to get personalized prioritization of materials.                                                                                                                                                     |

### What BlueDot Does Well

- Clean, simple curriculum navigation (sidebar + linear flow)
- Time estimates per material (helps planning)
- Clear completion tracking (X of Y per subsection)
- Low cognitive overhead — it's just a checklist, easy to understand
- Reasonable exercise UI (MC + freeform with structured prompts)

---

## 2. What We've Already Built

### Data Model

- **`programs`** — name, type, status, dates, enrollment method, completion criteria, linked events/opportunity
- **`programParticipation`** — enrollment status, sessions attended, materials completed
- **`programModules`** — title, description, weekNumber, orderIndex, materials array, linked session, status
- **`programSessions`** — day number, title, date, morning/afternoon time slots
- **`sessionRsvps`** — per-session slot preferences (morning/afternoon/either)
- **`sessionAttendance`** — admin-marked attendance per session per slot
- **`materialProgress`** — per-material completion tracking

### Functionality

- Program CRUD with 6 types (reading group, fellowship, mentorship, cohort, workshop series, custom)
- 3 enrollment methods (admin only, self enroll, approval required)
- Completion criteria (attendance count, percentage, manual)
- Bulk enrollment from linked opportunities (ASTN pipeline integration — participants' profile data carries over)
- Module management with materials (links, PDFs, videos, readings) + time estimates
- Session scheduling with dual time slots
- RSVP system for slot preferences
- Batch attendance marking
- Material progress tracking per participant
- Admin and participant views with efficient batch operations

### What's Missing (the gap this document addresses)

- Prompts/exercises with responses and AI feedback
- In-session interaction (currently Google Docs)
- AI learning partner for participants
- AI copilot for facilitators
- Facilitator visibility into participant learning (not just completion checkboxes)

---

## 3. The Big Ideas (Revised)

### Idea 1: One Unified System

BlueDot's fundamental problem isn't any single missing feature — it's that everything is split across disconnected tools. We build one platform where: applicant data flows into enrollment, pre-work exercises feed into sessions, facilitator visibility spans everything, and AI has full context. The competitive advantage is integration, not features.

### Idea 2: AI as the Substrate

AI isn't a feature bolted onto the platform — it's woven into every layer:

- **Participants** get an AI learning partner that knows the curriculum, their progress, and their responses
- **Facilitators** get an AI copilot that can query all program data, propose actions, and surface insights
- **During sessions**, AI observes in real-time and assists the facilitator
- **The AI itself is pedagogical** — in AI safety courses, interacting with AI (seeing its strengths, catching its mistakes, experiencing its limitations) IS part of the learning

### Idea 3: Facilitator-First Design

The facilitator gets an AI agent with full system access — not a static dashboard. They can ask questions ("who hasn't done homework?"), get synthesis ("what are the common misconceptions?"), and take actions ("draft a reminder for Guido") through conversation. The visual UI shows the same data the agent can access — context parity between human and AI views.

### Idea 4: One Component, Everywhere

Pre-work exercises and in-session activities are the same thing: a prompt that participants respond to. Same component, same data model, same AI feedback. Whether you're answering a reflection question at home or during a live session, the UX is identical. This eliminates the exercise/session split that the previous design imposed.

---

## 4. Design Principles

### Context Parity

The facilitator's visual UI and the AI agent read the exact same data through the exact same queries. The facilitator should never see information the agent can't access, and vice versa. When the agent updates data, it shows up instantly in the UI (Convex reactive subscriptions make this free).

### Propose-and-Approve (Human-in-the-Loop)

The AI agent NEVER writes directly to participant-visible data. It proposes actions:

- Draft comments on exercise responses → facilitator edits/approves
- Suggested pair assignments → facilitator confirms
- Draft messages to participants → facilitator reviews and sends
- Session summary notes → facilitator edits before saving

Over time, certain low-risk actions (e.g., session notes) can be promoted to auto-approve.

### Minimal Configuration

Prompts don't need 15 configuration fields. A prompt has: text, fields, and whether AI feedback is on. Due dates are implicit from the linked session. All exercises get AI feedback by default. Facilitators create prompts in 30 seconds, not 5 minutes.

### Build for the Next Model

Design the AI integration so that every improvement in AI models automatically improves the platform. The facilitator agent gets smarter without code changes. The learning partner gives better feedback without reconfiguration. The session copilot surfaces better insights automatically.

---

## 5. Unified Prompt System

### The Core Primitive

A **prompt** is the single interactive component used everywhere — pre-work exercises, session reflections, live polls, feedback forms. One component, one data model.

```
Prompt = {
  text: string (markdown — the question/instruction)
  fields: [{
    label: string
    type: "text" | "choice" | "multiple_choice"
    options?: string[] (for choice/multiple_choice)
    placeholder?: string
  }]
  estimatedMinutes?: number
  aiFeedback: boolean (default true)
}
```

### How It Works

**Creating a prompt (facilitator):**
Add prompts to a module (for pre-work) or to a session phase (for in-session). The UI is a simple form: write the prompt text, add fields (text inputs or choices), set estimated time.

**Responding to a prompt (participant):**
The same component renders everywhere. Text fields for writing, radio buttons for choices. Submit button saves the response.

**AI feedback (automatic):**
When a participant submits a response to a prompt with `aiFeedback: true`, the AI sidebar proactively offers feedback. The AI has context: the module's materials, the prompt text, and the participant's response. Feedback is conversational ("Here's what I noticed about your response..."), not a graded rubric.

**Visibility modes:**
Each prompt can be configured with a reveal mode:

- **`immediate`** — responses visible to others as soon as submitted (default for pre-work)
- **`facilitator_only`** — only the facilitator (and agent) can see responses
- **`write_then_reveal`** — private until the facilitator triggers reveal (key for in-session use)

### Examples from BAISH

| Context            | Prompt                                                                                                     | Fields                    | Reveal Mode       |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------- |
| Pre-work exercise  | "Pick ONE technique and evaluate it: explain step-by-step, evaluate robustness, describe one failure mode" | choice (3 options) + text | immediate         |
| Session reflection | "¿Qué aprendiste esta semana? / Dudas abiertas"                                                            | text + text               | write_then_reveal |
| Live poll          | "¿Cuál técnica les parece más prometedora?"                                                                | choice (3 options)        | write_then_reveal |
| Session feedback   | "¿Qué fue lo más valioso? / ¿Cómo podemos mejorar?"                                                        | text + text               | facilitator_only  |
| Ad-hoc question    | (facilitator creates on the fly during session)                                                            | text                      | write_then_reveal |

### Spotlight Responses

The facilitator can mark any response as "highlighted." Highlighted responses become visible to the entire cohort — creating positive incentive for thoughtful writing and building shared knowledge.

---

## 6. AI Sidebar (Participant Learning Partner)

### What It Is

A persistent AI chat companion available to participants throughout their course experience. It knows: the curriculum materials, the participant's progress, their exercise responses, and the course context.

### When Participants Use It

**While reading materials:**

> "No entiendo la diferencia entre RLHF y RLAIF. ¿Me lo explicás simple?"

> "This paper mentions 'scalable oversight' — what does that mean in practice?"

**While working on exercises:**

> "¿Estoy en el camino correcto con mi análisis de Debate?"

> The AI gives Socratic pushback, not answers: "Your point about verification is good. But what happens when both debaters are trying to deceive the judge?"

**When short on time:**

> "Solo tengo 30 minutos esta semana. ¿Qué debería priorizar para la sesión del martes?"

> The AI knows which materials are essential, what the session will cover, and what the participant has already completed. It gives a personalized plan.

**During sessions:**

> Available for quick reference: "¿Cómo se llamaba el concepto que estábamos discutiendo sobre el reward model?"

### How It Works

The sidebar is a chat interface that sends messages to an AI (Claude) with a system prompt containing:

- The current module's materials and descriptions
- The participant's completion status and exercise responses
- The course structure and upcoming session info
- Instructions to be a Socratic learning partner, not a homework-doer

The conversation is stored per-participant per-module. Facilitators (and the facilitator agent) can see what questions participants are asking — this feeds into session prep insights.

### The Meta-Pedagogical Angle

These are AI safety courses. The AI sidebar is itself a teaching tool:

- Participants experience AI helpfulness firsthand
- They also experience AI limitations — hallucinations, confident-but-wrong answers, failure on nuanced questions
- Specific exercises could be designed around the AI: "Ask the sidebar to summarize this paper. Find what it got wrong."
- This makes the learning visceral, not theoretical

---

## 7. Facilitator Agent

### What It Is

An AI agent (Claude) with tool access to all program data. The facilitator interacts with it through a chat sidebar on the admin page. The agent can read everything the facilitator can see, and proposes actions that the facilitator approves.

### Agent Tools (Convex queries and mutations)

**Read tools (no approval needed — just returns data):**

- Query participant progress (materials completed, exercises submitted)
- Query exercise responses (full text, by participant or by exercise)
- Query attendance and RSVP data
- Query session data (phases, responses, pairs)
- Query participant profiles (from ASTN pipeline)
- Query sidebar conversations (what questions participants are asking)

**Write tools (all proposed, facilitator approves):**

- Draft comments on exercise responses
- Draft messages to participants
- Suggest pair assignments for sessions
- Draft session notes / summaries
- Flag misconceptions or patterns
- Create ad-hoc prompts (live polls, questions)

### Example Interactions

**Session prep (async, between sessions):**

> **Facilitator:** "¿Cómo viene el pre-work para la sesión 3?"
>
> **Agent:** "De 10 participantes: 8 completaron materiales esenciales, 6 enviaron el ejercicio. Guido no empezó nada — es la segunda semana que no hace pre-work. María completó materiales pero no hizo el ejercicio.
>
> Patrones en los ejercicios: 4 personas eligieron Debate, los otros se dividieron entre las otras opciones. Confusión recurrente: Facundo y Tomás siguen confundiendo reward model con base model.
>
> [DRAFT — reminder for Guido] [DRAFT — general reminder for María]"

**During a live session:**

> **Agent (proactive):** "6 de 8 respondieron la reflexión. Temas que se repiten: 3 mencionaron Constitutional AI como lo más interesante. Lucas escribió 'no entiendo cómo RLAIF es diferente de RLHF' — posible punto de discusión grupal."

> **Facilitator:** "Armá parejas complementarias para Sharing is Caring"
>
> **Agent:** "[DRAFT — pairs based on technique choices, adjusted for Guido's absence]"

**Post-session:**

> **Facilitator:** "Resumen de la sesión"
>
> **Agent:** "[DRAFT — structured summary: attendance, duration per phase, key topics discussed, persistent confusions, suggested follow-ups]"

### Proposals UI

Agent proposals appear as draft cards in the facilitator's interface — inline next to the relevant data. A proposed comment on Lauti's exercise appears right below Lauti's submission. A proposed session summary appears in the session view. Each card has: approve, edit + approve, or dismiss.

---

## 8. Session Runner

### What It Is

An extension of the existing program admin page — not a separate app. When a session is happening, the admin page gains a "Live Session" mode. Participants see their program page enter a "session active" state showing the current activity.

### Session Structure

A session is an ordered list of **phases**:

```
Phase = {
  title: string
  durationMinutes: number
  facilitatorNotes?: string (markdown, only visible to facilitator)
  promptId?: Id<prompts> (optional — phases can be discussion-only)
  pairConfig?: {
    strategy: "complementary" | "random" | "manual"
    sourcePromptId?: Id<prompts> (for complementary pairing based on choices)
  }
}
```

That's it. No typed "blocks" with different schemas. A phase is: title, duration, optional facilitator notes, optional prompt, optional pair config.

### Facilitator View (During Session)

The admin session page shows:

- **Current phase** with title, timer, and facilitator notes
- **Responses streaming in** (if the phase has a prompt) — who's submitted, who's typing, who hasn't started
- **Upcoming phases** with durations (shows if you're running behind)
- **Controls:** Advance phase, Reveal responses (for write-then-reveal), Extend timer
- **Agent sidebar** with real-time observations and proposals

### Participant View (During Session)

The participant's program page shows:

- **Current phase title** and timer
- **The prompt** (if the phase has one) with input fields
- **Others' responses** (after reveal, or immediately if configured that way)
- **Pair assignment** (if the phase has pair config) — who they're paired with, the activity description, optional shared scratchpad

### Session Templates

A session with its phases can be duplicated. "BAISH Weekly Discussion" is just a session you can copy → change dates → customize prompts per session. No separate template system needed.

### Post-Session

All data is preserved automatically:

- Participant responses per phase
- Pair assignments
- Timer data (actual duration per phase vs. planned)
- Agent-generated session summary (facilitator-approved)
- Attendance (auto-marked based on who submitted responses during the session)

### Ad-Hoc Prompts

During a live session, the facilitator can create a new prompt on the fly — "quick poll" or "nueva pregunta." This becomes a new phase that appears for all participants immediately. The agent can also propose ad-hoc prompts.

### Pairing

When a phase has `pairConfig`:

- **Complementary:** System reads choices from a specified exercise (e.g., "which technique did you pick?") and pairs people who chose differently
- **Random:** Random pairs
- **Manual:** Facilitator assigns

The system handles odd numbers (creates one trio) and absences (pairs from whoever's actually connected, not who RSVP'd).

---

## 9. Module Enhancements

Small additions to the existing module system:

### Essential vs. Optional Materials

Add `isEssential: boolean` to material items in the materials array. Essential materials appear first with a visual indicator. Optional materials are collapsed by default. This replaces the entire "Low on Time" adaptive mode — busy participants focus on essentials, and the AI sidebar can personalize further.

### Audio Materials

Add `"audio"` as a material type alongside link, pdf, video, reading. Facilitators upload an MP3 (e.g., a pre-recorded module overview or discussion) via Convex file storage. Participants see a play button inline with other materials. No generation pipeline — facilitators create the audio externally and upload it.

### Time-to-Session Indicator

On the participant's module view, show "Session N is in X days — Yh Zm of pre-work remaining" prominently. The existing `linkedSessionId` and material time estimates already support this.

### Continue-Here Marker

Highlight the first incomplete material/exercise in the module. Always clear where to pick up.

---

## 10. Data Model Design

### New Tables

```
prompts
  programId
  moduleId (optional — for pre-work prompts)
  sessionId (optional — for session prompts)
  phaseIndex (optional — for ordering within sessions)
  text: string (markdown)
  fields: array of { label, type, options?, placeholder? }
  estimatedMinutes?: number
  aiFeedback: boolean (default true)
  revealMode: "immediate" | "facilitator_only" | "write_then_reveal"
  orderIndex: number
  createdAt

promptResponses
  promptId, programId, userId
  responses: record<string, any> (keyed by field label/index)
  visibility: "private" | "revealed" (controlled by facilitator reveal action)
  highlighted: boolean (facilitator spotlight)
  submittedAt, updatedAt

agentProposals
  programId
  type: "comment" | "message" | "pairs" | "summary" | "flag" | "prompt"
  targetId?: string (e.g., promptResponseId for comments)
  content: string (the proposed text/action)
  status: "proposed" | "approved" | "edited" | "dismissed"
  approvedBy?: Id<users>
  approvedAt?: number
  createdAt

facilitatorComments
  promptResponseId, programId
  authorId: Id<users> (facilitator who wrote/approved it)
  content: string
  fromAgent: boolean (was this proposed by the agent?)
  createdAt

sessionLiveState
  sessionId, programId
  currentPhaseIndex: number
  phaseStartedAt: number
  timerExtensions: number (seconds added)
  activePairs?: array of { participantA: Id<users>, participantB: Id<users> }
  status: "not_started" | "live" | "completed"
  startedAt, completedAt

sidebarConversations
  programId, moduleId (optional), userId
  messages: array of { role: "user" | "assistant", content: string, timestamp: number }
  updatedAt
```

### Updates to Existing Tables

```
programModules — add:
  No schema changes needed. Materials array already supports different types.
  Just add "audio" as a valid material type in the materialValidator.
  Add isEssential boolean to material items in the materials array.

programSessions — add:
  phases: array of {
    title: string
    durationMinutes: number
    facilitatorNotes?: string
    promptId?: Id<prompts>
    pairConfig?: { strategy, sourcePromptId? }
  }
```

### Tables NOT Needed (cut from previous design)

- ~~`programExercises`~~ → replaced by `prompts` (unified)
- ~~`exerciseSubmissions`~~ → replaced by `promptResponses` (unified)
- ~~`peerReviews`~~ → cut from v1
- ~~`sessionPlans`~~ → phases live directly on `programSessions`
- ~~`sessionResponses`~~ → `promptResponses` handles session prompts too
- ~~`sessionPairNotes`~~ → simplified into `promptResponses` with pair context
- ~~`moduleDiscussions`~~ → cut from v1
- ~~`participantTimeMode`~~ → cut (AI sidebar handles adaptive recommendations)
- ~~`moduleAudioSummaries`~~ → audio is just a material type

**Previous design: 12 new tables. This design: 5 new tables + 1 table update.**

---

## 11. Implementation Priority

Ordered by what creates the most value, considering that each builds on the previous:

### Phase 1: Unified Prompt System (Foundation)

**Why first:** This is the single primitive that everything else depends on. Once you can create prompts and collect responses, you have exercises, session activities, polls, and feedback — all in one component.

Build:

- `prompts` and `promptResponses` tables + Convex functions
- Prompt creation UI on module admin (add prompts alongside materials)
- Participant response UI (renders on the module/program page)
- Write-then-reveal mechanism (visibility flag + facilitator reveal mutation)
- Spotlight/highlight responses

### Phase 2: AI Sidebar (Participant Learning Partner)

**Why second:** Transforms the platform from content tracker to learning environment. This is the single biggest experiential differentiator from BlueDot. Also provides AI feedback on exercise submissions automatically.

Build:

- Chat UI component (sidebar on participant program page)
- `sidebarConversations` table
- Claude integration with module materials as context
- Proactive feedback on prompt submissions
- Facilitator ability to view sidebar conversations (feeds into agent context later)

### Phase 3: Facilitator Agent

**Why third:** The facilitator gets an AI copilot with full system access. Now the data from Phases 1 and 2 becomes actionable — the agent can synthesize exercise responses, surface patterns, draft comments, and prepare for sessions.

Build:

- Agent chat UI (sidebar on admin program page)
- `agentProposals` and `facilitatorComments` tables
- Claude integration with tool access to all program queries
- Propose-and-approve UI (draft cards with approve/edit/dismiss)
- Agent tools: query progress, query responses, query sidebar convos, draft comments, draft messages, suggest pairs

### Phase 4: Session Runner

**Why fourth:** Now that prompts, AI sidebar, and the agent all exist, adding live session support is an incremental step — not a new system. Sessions use the same prompts, the same response UI, the same agent. The new pieces are: phase sequencing, the timer, pair assignments, and the real-time "who's connected" state.

Build:

- `sessionLiveState` table
- Phase editor on session admin (ordered list of phases with optional prompt links)
- Session mode on participant view (shows current phase + prompt)
- Facilitator session controls (advance phase, reveal, extend timer)
- Pairing system (complementary/random/manual + absence handling)
- Agent real-time session observations

### Module Enhancements (Can happen anytime)

These are small, independent additions:

- Essential/optional material flags (add `isEssential` to material items)
- Audio material type (add "audio" + upload to Convex file storage)
- Time-to-session indicator (computed from existing data)
- Continue-here marker (first incomplete item)

---

## 12. Deferred to v2

These features become valuable when scaling beyond small in-person cohorts:

### Discussion Threads

Module-level comment threads for async peer interaction. Valuable for remote cohorts or groups >20 where not everyone knows each other. Not needed for 10-person in-person BAISH groups who have WhatsApp.

### Push & Email Notifications

Session reminders, exercise deadlines, discussion replies. For the pilot, the facilitator (or agent) sends reminders via WhatsApp manually. Build notification infrastructure when managing multiple concurrent cohorts.

### Cross-Cohort Analytics

"Compare this cohort's understanding of RLHF to the last cohort." Requires multiple cohorts' data. Build when the platform is running 3+ programs.

### Session Template Library

Shareable templates across organizations. For now, duplicate sessions. Build a template system when 3+ orgs are using the platform.

### Advanced Pairing

History-aware pairing ("don't pair people who were paired last week"), skill-based pairing, facilitator drag-and-drop interface. For now, complementary + random is sufficient.

### Auto-Approve for Agent Actions

Certain agent actions (session notes, pattern flags) promoted to auto-execute without facilitator approval. Build trust in the agent first with propose-and-approve, then selectively remove the gate.

---

## Appendix: Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND                         │
│         (single source of truth for everything)          │
│                                                          │
│  programs, participants, modules, materials, prompts,    │
│  responses, sessions, attendance, proposals, comments,   │
│  sidebar conversations                                   │
├──────────────┬──────────────────┬────────────────────────┤
│              │                  │                        │
│  Facilitator │  Facilitator     │  Participant           │
│  Visual UI   │  AI Agent        │  UI + AI Sidebar       │
│              │                  │                        │
│  Admin page  │  Same queries    │  Program page with     │
│  with prog-  │  as UI tools.    │  modules, materials,   │
│  ress, resp- │  Proposes        │  prompts. AI sidebar   │
│  onses, ses- │  actions via     │  with full module      │
│  sion ctrl.  │  agentProposals. │  context.              │
│              │  Facilitator     │                        │
│  READS same  │  approves.       │  READS own data +      │
│  data as     │                  │  revealed responses.   │
│  agent.      │  READS same      │                        │
│              │  data as UI.     │  WRITES own responses  │
│  WRITES      │                  │  + sidebar messages.   │
│  directly.   │  PROPOSES only.  │                        │
└──────────────┴──────────────────┴────────────────────────┘
```

## Appendix: BAISH Session Structure (Reference)

Based on actual BAISH session Google Docs, here's the recurring pattern:

```
Duration: 2h 30min

[0:00-0:05]  Facilitator setup + arrivals
[0:05-0:20]  Reflection: "Aprendizajes y preguntas"
             - Individual reflection (writing) → reveal → group discussion
[0:20-1:00]  Main Activity (varies by session)
             - Typically: individual work → pair discussion → group discussion
[1:00-1:15]  Coffee Break
[1:15-2:00]  Pair Teaching Activity: "Sharing is Caring"
             - Based on pre-work technique choice
             - 7 min teaching → 7 min learning → switch
             - Group debrief
[2:00-2:30]  Reflection & Feedback
             - Individual reflection (writing) → round-table discussion
             - Preview of next session

Key elements that repeat:
- Facilitator-only notes (hidden from participants)
- Timed phases
- Per-person input fields (not shared tables)
- Write-then-reveal pattern
- Pair activities based on pre-work choices
- Group discussion facilitation prompts
```

This maps directly to the session runner: each segment is a phase, reflections and exercises are prompts with write-then-reveal, pair teaching uses complementary pairing from exercise choices.
