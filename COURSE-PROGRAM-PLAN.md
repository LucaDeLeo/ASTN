# Course Program Platform — Comprehensive Design Document

> **Goal:** Build a course/program platform for ASTN that is meaningfully better than BlueDot Impact's platform. Initial pilot: BAISH's Technical AI Safety course (~10 participants, 6 weekly sessions in Spanish).

---

## Table of Contents

1. [Analysis: What BlueDot Does (and Where It Falls Short)](#1-analysis-what-bluedot-does)
2. [What We've Already Built](#2-what-weve-already-built)
3. [The Big Ideas](#3-the-big-ideas)
4. [Feature: Learning Flow (Participant Curriculum Experience)](#4-learning-flow)
5. [Feature: Exercises & Submissions](#5-exercises--submissions)
6. [Feature: AI-Powered Feedback & Summaries](#6-ai-powered-feedback--summaries)
7. [Feature: Live Session Mode (Replacing Google Docs)](#7-live-session-mode)
8. [Feature: "Low on Time" Adaptive Mode](#8-low-on-time-adaptive-mode)
9. [Feature: Facilitator Dashboard](#9-facilitator-dashboard)
10. [Feature: Social/Cohort Layer](#10-socialcohort-layer)
11. [Feature: Smart Notifications & Reminders](#11-smart-notifications--reminders)
12. [Feature: Mobile-Native Experience](#12-mobile-native-experience)
13. [Data Model Design](#13-data-model-design)
14. [Implementation Priority](#14-implementation-priority)

---

## 1. Analysis: What BlueDot Does

### BlueDot's Core UX

BlueDot's platform is a **content tracker with a checklist pattern**:

- **Left sidebar:** Numbered modules (1-6), expandable to show subsections. Each subsection shows estimated time and completion count (e.g., "4 of 6 completed").
- **Right content area:** Sequential list of reading materials (external links) and exercises.
- **Materials:** Each is an external link with metadata (author, year, estimated reading time). A "Complete" button marks it done.
- **Exercises:** Plain text box with a prompt. A "Complete" button submits. No feedback, no review, no visibility into others' work.
- **Navigation:** Breadcrumbs + Prev/Next buttons to move through subsections linearly.
- **Progress:** Global percentage at top ("8% completed").

### Where BlueDot Falls Short

| Area                    | Problem                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content experience**  | Just links to external sites. Participant context-switches to 5+ tabs. No summaries, no inline previews.                                                              |
| **Exercises**           | Plain text box → "Complete". No structured types, no feedback, no peer visibility, no facilitator review. Exercises go into a void.                                   |
| **Session support**     | Zero. BlueDot has no concept of live sessions, attendance, RSVPs, or session facilitation tooling. Sessions happen entirely outside the platform (Google Docs, Zoom). |
| **Facilitator tools**   | Almost nothing. No engagement dashboard, no exercise review queue, no attendance patterns, no communication tools.                                                    |
| **Social layer**        | Completely absent. You're alone clicking through materials. No sense of cohort, no peer interaction, no discussion.                                                   |
| **Mobile**              | Desktop-first layout. Terrible on mobile — sidebar + content doesn't work on small screens.                                                                           |
| **Pre-work connection** | No link between materials/exercises and sessions. No "you should finish this before Tuesday's session."                                                               |
| **Adaptivity**          | One-size-fits-all. No accommodation for participants with limited time.                                                                                               |

### What BlueDot Does Well

- Clean, simple curriculum navigation (sidebar + linear flow)
- Time estimates per material (helps planning)
- Clear completion tracking (X of Y per subsection)
- Low cognitive overhead — it's just a checklist, easy to understand

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
- Bulk enrollment from linked opportunities
- Module management with materials (links, PDFs, videos, readings) + time estimates
- Session scheduling with dual time slots
- RSVP system for slot preferences
- Batch attendance marking
- Material progress tracking per participant
- Admin and participant views

### What's Missing (the gap this document addresses)

- Exercises with submissions and feedback
- Live session facilitation (currently in Google Docs)
- AI-powered feedback and summaries
- Facilitator engagement dashboard
- Time-adaptive learning paths
- Social/discussion features
- Smart notifications

---

## 3. The Big Ideas

### Idea 1: Replace Google Docs with "Live Session Mode"

Currently, each session is run using a Google Doc that serves as facilitator script, collaborative worksheet, discussion prompts, pair coordination tool, and session record — all poorly. We build a dedicated real-time session interface where the facilitator controls the flow and participants interact through structured activities.

### Idea 2: Exercises That Create a Feedback Loop

BlueDot's exercises are write-and-forget. We build exercises with structured types, AI-powered instant feedback, peer review rounds, and facilitator review queues. Exercises become the core learning activity, not an afterthought.

### Idea 3: Adaptive "Low on Time" Mode

Not everyone has 3 hours for pre-work. We ask participants how much time they have and adapt: full readings for deep learners, curated essentials for focused learners, and AI-generated audio summaries (NotebookLM-style) for minimal prep. Audio summaries are gated — only available when you're genuinely short on time — to encourage deep reading by default.

### Idea 4: Pre-Work ↔ Session Connection

Exercise submissions and material completion feed directly into the live session. Facilitators see who did what before the session starts. Session activities can prepopulate from homework. Smart pairing uses pre-work choices to create complementary discussion pairs.

### Idea 5: Facilitator as First-Class User

BlueDot treats facilitators as invisible. We give them a dashboard with engagement heatmaps, exercise review queues, automated nudge tools, session prep summaries, and real-time visibility into participant progress.

---

## 4. Learning Flow

### Current State (BlueDot-like)

Flat checklist of materials per module. Click external link → read → come back → click Complete.

### Target Experience

#### 4a. Module Page — "Learning Path" View

Each module shows materials in a guided sequence, not just a list:

```
Module 2: Training Safer Models
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session 2 is in 2 days — 1h 45min of pre-work remaining

[Pre-Session Reading]
  ✅ Can we train AI to be safe? .................. 10 min
  ✅ Feeding AI 'good' data ...................... 15 min
  ⬜ Teaching AI right from wrong ................ 20 min  ← Continue here
  ⬜ More safety techniques ...................... 25 min

[Exercise — Due before Session 2]
  ⬜ Evaluate a safety technique ................. 60 min
     Pick ONE: Deliberative Alignment, Debate, or Weak-to-Strong

[Optional Deep Dives]
  ⬜ Empirical progress in Debate ................ 15 min
  ⬜ Debating with more persuasive LLMs .......... 20 min
  ...
```

Key differences from BlueDot:

- **Time remaining** shown prominently, tied to session date
- **"Continue here"** marker — always know where you left off
- **Exercise** integrated into the flow, not a separate section
- **Pre-session vs. optional** clearly separated
- Materials automatically prioritized based on session date proximity

#### 4b. Focus Mode

A dedicated reading/exercise view that flows through ALL materials in order:

- Full-width content area, no distractions
- Inline previews where possible (article excerpts, video embeds)
- Prev/Next navigation through the entire module
- Auto-advance to exercise after completing readings
- Progress bar at top

#### 4c. Smart Material Ordering

Materials linked as pre-work for an upcoming session are automatically:

- Surfaced at the top of the participant's dashboard
- Flagged with "Due before Session N" badges
- Included in reminder notifications

---

## 5. Exercises & Submissions

### Current State

Materials have a "Complete" button. No exercises, no submissions, no feedback.

### Target Experience

#### 5a. Exercise Types

Support multiple exercise formats within modules:

| Type                    | Description                           | Example from BAISH                                                                               |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Long-form essay**     | Open-ended text response              | "Evaluate a safety technique — explain step-by-step, evaluate robustness, describe failure mode" |
| **Structured response** | Multiple fields                       | "What did you learn? / Open questions" (the session reflection table)                            |
| **Multiple choice**     | Quick comprehension check             | "Which of these is NOT a scalable oversight technique?"                                          |
| **Selection + essay**   | Choose an option, then write about it | "Pick ONE technique (Debate/Deliberative Alignment/W2S) and do a deep dive"                      |
| **Peer teaching prep**  | Prepare to explain a topic            | "Prepare a 5-minute explanation of your chosen technique for a peer"                             |

#### 5b. Submission Flow

```
Participant submits exercise
        ↓
Instant AI feedback appears (optional, per-exercise config)
  "Your explanation of Debate is clear. Consider also addressing:
   how verification works when the judge can't check citations."
        ↓
Submission visible to facilitator in review queue
        ↓
Facilitator can: comment, highlight, request revision, approve
        ↓
After deadline: peer review round (optional)
  - See 2-3 anonymous peer submissions
  - Rate and comment on each
```

#### 5c. Exercise Configuration (Admin)

When creating an exercise, facilitator defines:

- **Type** (from above list)
- **Prompt** (markdown, can include sub-questions)
- **Linked module** (optional — which module's materials this relates to)
- **Due date** (optional, or "before session N")
- **AI feedback enabled** (yes/no + optional custom instructions for the AI)
- **Peer review enabled** (yes/no + how many peers to review)
- **Required for completion** (yes/no)
- **Estimated time** (shown to participants)

#### 5d. Exercise ↔ Session Connection

Exercises completed before a session feed into the live session:

- The facilitator sees all submissions before the session starts
- Session activities can reference/prepopulate from submissions (e.g., "your chosen technique" auto-fills from the selection exercise)
- Pair assignments can be based on exercise choices (pair people who chose different techniques)

---

## 6. AI-Powered Feedback & Summaries

### 6a. Instant Exercise Feedback

After submitting a written exercise, the participant receives AI feedback:

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Feedback on your submission                      │
│                                                     │
│ Your explanation of Debate as a safety technique    │
│ covers the core mechanism well — you correctly      │
│ identified that two models arguing opposing sides    │
│ can surface truth even when the judge is less        │
│ capable than the debaters.                          │
│                                                     │
│ Consider strengthening your analysis of failure     │
│ modes:                                              │
│ - You mention "the judge might be fooled" but don't │
│   address what happens when both debaters collude   │
│ - The verification problem you raise is real — how  │
│   does the judge check citations they can't verify? │
│                                                     │
│ Your robustness evaluation could address the        │
│ generalization question: does Debate work beyond     │
│ factual questions (e.g., in value-laden domains)?   │
└─────────────────────────────────────────────────────┘
```

This is NOT a grade. It's a conversation — pointing out what's strong, what's missing, and suggesting deeper questions. The AI has access to the module's reading materials as context.

**Configuration:** Facilitator can customize the AI feedback prompt per exercise:

- "Focus on whether they understood the core mechanism"
- "Check if they addressed all three sub-questions"
- "Be encouraging, this is a beginner audience"

### 6b. Audio Summaries (NotebookLM-Style)

For each module, we generate a ~15 minute conversational audio overview:

- Two AI voices discuss the key concepts from all readings
- Covers the essential ideas, debates, and open questions
- Generated once per module (not per-user)

**Access gating:**

- Participants who select "Low on Time" mode for a module: audio available immediately as their primary learning path
- Participants doing full readings: audio locked during pre-work period, unlocked after the session as review material
- This preserves the incentive to do deep reading while accommodating busy participants

**Generation pipeline:**

1. Feed all module materials (URLs, descriptions) to Claude
2. Generate a dialogue script covering key concepts
3. Convert to audio via TTS (ElevenLabs, OpenAI TTS, or similar)
4. Store as audio file linked to the module

### 6c. AI-Generated Pre-Session Briefing (for Facilitators)

Before each session, the facilitator gets an AI-generated summary:

- "8 of 10 participants submitted the exercise. Key themes in responses: [X, Y, Z]"
- "Common misconceptions: 3 participants confused RLHF reward model with the base model"
- "Discussion seeds: Mica raised an interesting question about debate verification that could drive good discussion"
- "Suggested focus areas based on where participants struggled"

---

## 7. Live Session Mode

### The Problem

Currently, sessions are run in a Google Doc that serves 5 purposes simultaneously, all poorly:

1. **Facilitator script** — timed agenda with private tips (⌛ markers, "Facilitator tip" boxes)
2. **Collaborative worksheet** — tables where everyone types answers simultaneously
3. **Discussion prompt display** — questions shown during activities
4. **Pair/group coordination** — manual pairing for breakouts
5. **Session record** — permanent artifact of what happened

Problems: facilitator notes visible to everyone, people overwrite each other's rows, no timer, no pre-work integration, terrible on mobile, no structure for different activity types.

### The Solution: Structured Live Session Interface

#### 7a. Session Plan Builder (Admin/Facilitator)

A facilitator creates a "Session Plan" as a sequence of **activity blocks**:

| Block Type             | What It Contains                         | Participant UI                                              |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| **Facilitator Note**   | Private markdown text, tips, reminders   | Not visible to participants                                 |
| **Timer/Break**        | Duration, label (e.g., "Coffee Break")   | Countdown timer visible to all                              |
| **Reflection Table**   | Column definitions + prompt              | Per-person input fields, see others' responses in real-time |
| **Exercise Table**     | Column definitions + prompt              | Per-person structured input, real-time visibility           |
| **Discussion Prompt**  | Questions (markdown) + facilitator guide | Questions displayed, shared note-taking space               |
| **Pair Activity**      | Pairing strategy + prompts + timer       | Partner assignment shown, shared scratchpad per pair, timer |
| **Group Discussion**   | Questions + shared notes area            | Discussion questions, ability to add notes, +1 points       |
| **Material Reference** | Links to readings/resources              | Inline material cards (for referencing during discussion)   |
| **Open Input**         | Free-form collaborative space            | Like a shared whiteboard/doc section                        |

Each block has:

- Estimated duration (shown to facilitator, drives timer)
- Optional facilitator-only notes/tips
- Phase label (e.g., "[0:05-0:20] Aprendizajes y preguntas")

#### 7b. Facilitator "Presenter Mode"

The facilitator sees a dashboard with:

```
┌─────────────────────────────────────────────────────────────┐
│ Session 2: Entrenando modelos de IA más seguros             │
│ 8/10 participants connected · Started 14 min ago            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CURRENT: Phase 1 — Aprendizajes y preguntas                │
│ ⏱️ 6:23 remaining (of 15:00)     [Extend +5] [Next Phase →]│
│                                                             │
│ ┌─ Facilitator Tip (only you see this) ─────────────────┐  │
│ │ Ask constrained questions: "How might X impact Y,      │  │
│ │ given Z?" instead of "Does anyone have thoughts?"      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Live Responses ──────────────────────────────────────┐  │
│ │ ✅ Facundo: "La importancia de las 4 stages..."       │  │
│ │ ✅ Lucas: "Las dificultades de cada técnica..."        │  │
│ │ ✅ Lauti: "Por que no enseñarle como ser malo..."      │  │
│ │ ✏️ María: (typing...)                                  │  │
│ │ ⬜ Guido: (not started)                               │  │
│ │ ⬜ Mica: (not started)                                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ [📌 Spotlight Response] [👥 Form Pairs] [📊 Show Results]  │
│                                                             │
│ ── Upcoming ──                                              │
│ Phase 2: RLHF y Constitutional AI (40 min)                  │
│ Phase 3: Coffee Break (15 min)                              │
│ Phase 4: Sharing is Caring (45 min)                         │
│ Phase 5: Reflección y Feedback (30 min)                     │
└─────────────────────────────────────────────────────────────┘
```

Key facilitator controls:

- **Advance phase** — all participants see the current activity update in real-time
- **Built-in timer** — visible countdown for the current phase, extendable
- **Live response feed** — see who has/hasn't responded, who's typing
- **Spotlight** — highlight a response to project/discuss with the group
- **Form pairs/groups** — trigger pairing (random, by pre-work choice, or manual)
- **Shared notes** — facilitator can add notes visible to everyone

#### 7c. Participant View

Participants see only the current activity, focused and clean:

**During a Reflection Table phase:**

```
┌─────────────────────────────────────────────────────────────┐
│ Aprendizajes y preguntas                         ⏱️ 6:23   │
│                                                             │
│ Reflect on the resources and exercises from this week.      │
│                                                             │
│ ┌─ Your response ──────────────────────────────────────┐   │
│ │ What did you learn?                                   │   │
│ │ [_______________________________________________]      │   │
│ │                                                       │   │
│ │ Open questions / doubts                               │   │
│ │ [_______________________________________________]      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ From your pre-work ─────────────────────────────────┐   │
│ │ You chose: Debate                                     │   │
│ │ Your exercise: "I explored how debate can surface     │   │
│ │ truth even when judges are less capable..."           │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Others' responses (live) ───────────────────────────┐   │
│ │ Facundo: "La importancia de las 4 stages para..."    │   │
│ │ Lucas: "Las dificultades de cada técnica de..."      │   │
│ │ Lauti: "Por que no enseñarle como ser malo..."       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Save & Continue]              │
└─────────────────────────────────────────────────────────────┘
```

**During a Pair Activity phase:**

```
┌─────────────────────────────────────────────────────────────┐
│ Sharing is Caring — Pair Discussion               ⏱️ 5:12  │
│                                                             │
│ You're paired with: Mica                                    │
│ 👤 You teach: Deliberative Alignment                        │
│ 👤 They teach: Debate                                       │
│                                                             │
│ First 7 min: You're the TEACHER                             │
│ - Explain your technique from memory (no notes!)            │
│ - Help Mica understand the concept deeply                   │
│                                                             │
│ Then 7 min: You're the LEARNER                              │
│ - Ask detailed questions                                    │
│ - Polite interruption is encouraged!                        │
│                                                             │
│ ┌─ Shared scratchpad ─────────────────────────────────┐    │
│ │ (both you and Mica can type here)                    │    │
│ │ [________________________________________________]   │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─ Your notes (private) ─────────────────────────────┐     │
│ │ [________________________________________________]  │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### 7d. Prepopulation from Pre-Work

Session activities can pull data from completed exercises:

| Session Element                         | Prepopulated From                              |
| --------------------------------------- | ---------------------------------------------- |
| "Técnica de Safety que elegiste" column | Selection exercise ("Pick ONE technique")      |
| "¿Qué aprendiste?" initial prompt       | Summary of their exercise submission           |
| Pair assignments                        | Exercise choices (pair different techniques)   |
| "Tu solución a un wiki-modelo"          | Could seed from related exercise if applicable |
| Facilitator's prep notes                | AI summary of all submissions                  |

#### 7e. Smart Pairing

When the facilitator triggers pair formation:

1. **By complementary pre-work** (default for teaching activities): Pair people who chose different techniques so they teach each other something new. Exactly what "Sharing is Caring" does manually.
2. **Random**: Simple random pairing, re-rolled each time.
3. **By slot** (morning/afternoon): For in-person sessions where groups are physically split.
4. **Manual**: Facilitator drags names to form pairs.

The system handles odd numbers (creates one trio) and absences (real-time adjustment based on who's actually connected).

#### 7f. Session Templates

The Google Doc structure is consistent across BAISH sessions. We can make it template-based:

A **Session Template** defines the sequence of activity blocks:

```
Template: "BAISH Weekly Discussion" (2h 30min)
├── Facilitator Welcome Note (private)
├── Reflection Table: "Aprendizajes y preguntas" (15 min)
│   └── Columns: Nombre, ¿Qué aprendiste?, Dudas abiertas
├── Discussion Prompt: Group discussion on reflections (15 min)
├── Exercise Table: [Custom per session] (40 min)
├── Break (15 min)
├── Pair Activity: "Sharing is Caring" (45 min)
│   └── Pairing strategy: By complementary pre-work choice
├── Group Discussion: Debrief (15 min)
└── Feedback Table: "Reflección y feedback" (15 min)
    └── Columns: Nombre, Aprendizajes, Feedback
```

Each session instantiates a template, with per-session customization (different exercise prompts, discussion questions, etc.).

#### 7g. Post-Session Artifact

After the session ends, all data is preserved as a structured record:

- All participant responses (organized by phase)
- Discussion notes
- Pair assignments and shared scratchpads
- Timer data (how long each phase actually took)
- Attendance (auto-marked based on participation)

This replaces the messy Google Doc as a permanent record, and it's searchable, exportable, and linkable.

---

## 8. "Low on Time" Adaptive Mode

### The Problem

Not everyone has 3 hours for pre-work. Currently, participants who can't finish everything come to sessions underprepared and feel lost or guilty.

### The Solution

#### 8a. Time Check Before Each Module

When a module unlocks (or when a participant opens it), ask:

```
┌─────────────────────────────────────────────────────────────┐
│ Session 2 is in 3 days                                      │
│ Full pre-work: ~2h 30min                                    │
│                                                             │
│ How much time do you have for prep this week?               │
│                                                             │
│ [🔬 Full Depth]  [⚡ Focused]  [⏰ Minimal]                │
│   2+ hours          ~1 hour       ~30 min                   │
└─────────────────────────────────────────────────────────────┘
```

#### 8b. Adaptive Content Paths

**Full Depth (2+ hours):**

- All materials shown, complete exercises, optional deep dives available
- Audio summary locked (available after session as review)

**Focused (~1 hour):**

- Materials tagged "essential" shown first, optional materials collapsed
- Exercise simplified (shorter prompt or just the core question)
- Key excerpts/highlights shown inline for longer readings
- Audio summary still locked

**Minimal (~30 min):**

- AI-generated audio summary unlocked as primary learning path (15 min listen)
- Only the single most essential reading shown
- Exercise reduced to the minimum viable response
- "Conversation starters" provided so they can still participate in session discussion

#### 8c. Audio Summary Details

Generated per module using this pipeline:

1. **Input:** All module materials (URLs, titles, descriptions, key concepts)
2. **Script generation:** Claude generates a conversational dialogue between two voices covering:
   - Core concepts from each reading
   - Key debates and open questions
   - Connection to previous modules
   - Preview of what the session will discuss
3. **Audio generation:** TTS converts script to audio (~15 min per module)
4. **Storage:** Audio file linked to module, served to participants

The audio feels like "two AI safety researchers having a casual conversation about this week's topics" — engaging, not lecture-y.

#### 8d. Facilitator Visibility

The facilitator sees each participant's chosen time mode:

```
Pre-work status for Session 2:
  Facundo: Full Depth — 5/6 materials, exercise done
  Lucas: Full Depth — 4/6 materials, exercise done
  María: Focused — 3/3 essential materials, exercise done
  Guido: Minimal — listened to audio summary, exercise pending
  Lauti: Not started
```

This lets the facilitator adjust session activities (e.g., pair a "Minimal" person with a "Full Depth" person for richer discussion).

---

## 9. Facilitator Dashboard

### The Problem

BlueDot gives facilitators virtually nothing. Our current admin view shows participant lists and attendance — that's it. Facilitators running sessions need much more.

### 9a. Engagement Heatmap

At a glance, see the entire cohort's engagement:

```
                Module 1   Module 2   Module 3   Module 4   Module 5
Facundo         ████████   ████████   ████░░░░
Lucas           ████████   ██████░░   ░░░░░░░░
Lauti           ████████   ████░░░░   ░░░░░░░░
María           ████████   ████████   ████████
Guido           ██████░░   ████░░░░   ░░░░░░░░
Tomás           ████████   ████████   ██░░░░░░
Mica            ████████   ████████   ████████
Tobias          ████████   ██████░░   ████░░░░

████ = materials completed    ░░░░ = remaining    (no bar) = future/locked
```

Color coding: Green (on track), Yellow (falling behind), Red (significantly behind), Gray (future).

### 9b. Exercise Review Queue

All pending exercise submissions in one feed:

```
Exercise Review Queue (12 pending)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Module 2 — "Evaluate a safety technique"

  Facundo · Submitted 2h ago · Chose: Deliberative Alignment
  "Las 4 etapas del entrenamiento son fundamentales para..."
  [Read Full] [Comment] [✓ Reviewed]

  Lucas · Submitted 5h ago · Chose: Debate
  "La técnica de debate permite que modelos menos capaces..."
  [Read Full] [Comment] [✓ Reviewed]

  ...
```

Facilitator can:

- Read full submissions inline
- Leave comments (visible to participant)
- Highlight exemplary responses (shown to cohort after deadline)
- Flag common misconceptions (seeds for session discussion)
- Bulk-mark as reviewed

### 9c. Pre-Session Prep View

Before each session, a focused prep screen:

```
Session 2 Prep — Tuesday 14:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attendance
  RSVPs: 7 morning, 2 afternoon, 1 either

Pre-work Completion
  Materials: 8/10 participants completed all essentials
  Exercise: 7/10 submitted (Guido, Lauti, María pending)

Time Modes
  Full Depth: 6 · Focused: 2 · Minimal: 1 · Not set: 1

AI-Generated Insights
  Key themes in exercise responses:
  - 4 participants focused on verification challenges
  - 3 highlighted the scalability advantage of AI feedback
  - Common confusion: difference between reward model and base model

  Suggested discussion seeds:
  - Mica's question about debate verification is excellent for group discussion
  - Several participants conflated RLHF and RLAIF — worth clarifying

Technique Choices (for pairing)
  Deliberative Alignment: Facundo, Lucas, Tomás
  Debate: Mica, Guido, María
  Weak-to-Strong: Lauti, Tobias

[📋 Generate Pairs] [📧 Send Reminder to Pending] [▶️ Start Session]
```

### 9d. Automated Nudges

One-click reminders that are contextual:

- **Pre-work reminder:** "3 participants haven't started Module 2 pre-work and the session is tomorrow" → [Send reminder email]
- **Exercise deadline:** "Exercise due in 24 hours. 4 participants haven't submitted." → [Send nudge]
- **Post-session follow-up:** "Session 2 complete. Send reflection prompt?" → [Send follow-up]

### 9e. Completion Predictions

Based on current engagement patterns:

```
Completion Risk Assessment
  🟢 On track (6): Facundo, Lucas, María, Tomás, Mica, Tobias
  🟡 At risk (2): Guido (missed 1 session, 60% materials), Lauti (declining engagement)
  🔴 Unlikely (0)

  Recommended action: Check in with Guido and Lauti
```

---

## 10. Social/Cohort Layer

### 10a. Discussion Threads Per Module

Lightweight comment thread under each module:

- Participants can post questions, share insights, respond to each other
- Facilitator can pin important posts or answer questions
- Threaded replies (not flat)
- Optional email notification for new posts

### 10b. Cohort Presence

Subtle indicators of who's active:

- Module page shows small avatars: "María and Tomás are also studying this module"
- Not intrusive — just creates a sense of shared learning

### 10c. Peer Connections

After pair activities or peer review:

- "You and Mica discussed Debate together — connect on the platform?"
- Build the network through learning interactions

### 10d. Highlighted Responses

After exercise deadlines, facilitator can "spotlight" great responses:

- Shown to the whole cohort (with author attribution)
- Creates positive incentive to write thoughtful responses
- Builds shared knowledge base

---

## 11. Smart Notifications & Reminders

### Push Notifications (Mobile via Capacitor)

- "Session 4 starts in 1 hour"
- "New pre-work available for Module 3"
- "Mica replied to your comment in Module 2 discussion"
- "Exercise due tomorrow — you haven't submitted yet"

### Email Notifications

- Weekly module unlock: "This week's materials for Session 3 are ready"
- Pre-session reminder (24h before): "Session 3 is tomorrow. You've completed 4/5 pre-work items."
- Post-session: "Session 3 recap is available. Don't forget to submit your reflection."

### Notification Preferences

- Participants choose: All / Essential only / None
- Essential = session reminders + exercise deadlines only

---

## 12. Mobile-Native Experience

Since we're already building with Capacitor:

- **Responsive session view** — works well on phone during in-person sessions
- **Push notifications** via native APIs
- **Offline material caching** — download readings for offline consumption
- **Quick RSVP** — respond to session invites from notification
- **Audio playback** — listen to module summaries during commute

---

## 13. Data Model Design

### New Tables Needed

```
programExercises
  programId, moduleId (optional), sessionId (optional)
  title, description (markdown)
  type: "long_form" | "structured" | "multiple_choice" | "selection_essay" | "peer_teaching"
  fields: array of { key, label, type, options?, required }
  dueDate (optional), dueBefore (sessionId, optional)
  estimatedMinutes
  config: {
    aiFeedbackEnabled: boolean
    aiFeedbackPrompt: string (optional, custom instructions)
    peerReviewEnabled: boolean
    peerReviewCount: number (how many peers to review)
    requiredForCompletion: boolean
  }
  orderIndex
  createdAt, updatedAt

exerciseSubmissions
  exerciseId, programId, userId
  responses: record<string, any> (keyed by field key)
  status: "draft" | "submitted" | "reviewed" | "revision_requested"
  submittedAt
  aiFeedback: string (generated feedback text)
  aiFeedbackGeneratedAt
  facilitatorFeedback: string (optional)
  facilitatorReviewedBy, facilitatorReviewedAt
  highlighted: boolean (facilitator spotlighted this)

peerReviews
  submissionId, reviewerId (userId), exerciseId, programId
  rating: number (1-5, optional)
  comment: string
  createdAt

sessionPlans
  sessionId, programId
  templateId (optional — reference to a reusable template)
  blocks: array of SessionBlock (see below)
  status: "draft" | "ready" | "live" | "completed"
  startedAt, completedAt

  SessionBlock = {
    id: string (uuid)
    type: "facilitator_note" | "timer" | "reflection_table" | "exercise_table"
          | "discussion_prompt" | "pair_activity" | "group_discussion"
          | "material_reference" | "open_input"
    title: string
    durationMinutes: number
    facilitatorNotes: string (markdown, private)
    config: varies by type (see below)
    orderIndex: number
  }

  ReflectionTableConfig = {
    prompt: string
    columns: array of { key, label }
    prepopulateFrom: exerciseId (optional)
  }

  PairActivityConfig = {
    prompt: string (markdown)
    pairingStrategy: "complementary_prework" | "random" | "by_slot" | "manual"
    pairingExerciseId: string (which exercise to use for complementary pairing)
    timerMinutes: number
    switchHalfway: boolean
    sharedScratchpad: boolean
  }

  DiscussionPromptConfig = {
    questions: array of string
    sharedNotes: boolean
  }

sessionLiveState
  sessionPlanId
  currentBlockIndex: number
  currentBlockStartedAt: number (timestamp)
  timerExtensions: number (seconds added)
  pairs: array of { participantA, participantB } (when pair activity is active)
  status: "not_started" | "in_progress" | "completed"

sessionResponses
  sessionPlanId, blockId, userId
  responses: record<string, any> (keyed by column/field key)
  updatedAt

sessionPairNotes
  sessionPlanId, blockId, pairId (derived from pair assignment)
  sharedNotes: string
  updatedAt

moduleDiscussions
  moduleId, programId, userId
  parentId (optional — for threaded replies)
  content: string (markdown)
  pinned: boolean
  createdAt, updatedAt

participantTimeMode
  programId, moduleId (or sessionId), userId
  mode: "full_depth" | "focused" | "minimal"
  createdAt

moduleAudioSummaries
  moduleId, programId
  audioFileId (convex file storage)
  scriptText: string (the generated dialogue)
  durationSeconds: number
  generatedAt
  status: "generating" | "ready" | "failed"
```

### Updated Existing Tables

```
programModules — add:
  essentialMaterialIndexes: array of number (which materials are "essential" for focused mode)
  audioSummaryId: Id<moduleAudioSummaries> (optional)

programSessions — add:
  sessionPlanId: Id<sessionPlans> (optional — links to live session plan)
  postSessionMaterials: array of { label, url, type } (recordings, notes added after)
```

---

## 14. Implementation Priority

Ordered by impact vs. effort, considering the current BAISH cohort (6 sessions):

### Phase A: Exercise System (High Impact, Medium Effort)

**Why first:** This is the single biggest gap. BlueDot's exercises are the weakest part, and this is where the most learning happens. Also a prerequisite for Live Session prepopulation.

- Exercise definitions on modules
- Participant submission flow
- Facilitator review queue
- AI feedback on submissions (we have Claude API already)

### Phase B: Live Session Mode (High Impact, High Effort)

**Why second:** This replaces the Google Doc chaos. The real-time piece is where Convex shines — live participant inputs updating in real-time is nearly free with our stack.

- Session plan builder with activity blocks
- Facilitator presenter mode (phase control, timer, live feed)
- Participant activity view (structured inputs, real-time sync)
- Prepopulation from exercises
- Smart pairing

### Phase C: Facilitator Dashboard (High Impact, Medium Effort)

**Why third:** Gives facilitators superpowers. Most of the data already exists — this is about surfacing it well.

- Engagement heatmap
- Pre-session prep view
- AI-generated session insights
- Automated nudge tools

### Phase D: "Low on Time" Mode (Medium Impact, Medium Effort)

**Why fourth:** Solves a real problem (busy participants) and introduces the audio summary feature.

- Time mode selection per module
- Adaptive content display (essential vs. optional)
- Audio summary generation pipeline
- Time mode visibility for facilitators

### Phase E: Social Layer (Medium Impact, Low-Medium Effort)

**Why fifth:** Adds the cohort feeling that BlueDot completely lacks.

- Discussion threads per module
- Highlighted responses
- Cohort presence indicators

### Phase F: Notifications & Mobile (Medium Impact, Medium Effort)

**Why later:** Important but not transformative. Capacitor infrastructure already exists.

- Push notifications for sessions, deadlines
- Email reminders
- Offline material caching
- Mobile-optimized session view

---

## Appendix: BAISH Session Structure (Reference)

Based on the actual Session 2 Google Doc, here's the recurring session pattern:

```
Duration: 2h 30min

[0:00-0:05]  Facilitator setup + arrivals
[0:05-0:20]  Reflection: "Aprendizajes y preguntas"
             - Individual reflection (writing)
             - Read others' reflections
             - Group discussion on key themes
[0:20-1:00]  Main Activity (varies by session)
             - Session 2: RLHF wiki-model exercise
             - Typically: individual work → pair discussion → group discussion
[1:00-1:15]  Coffee Break
[1:15-2:00]  Pair Teaching Activity: "Sharing is Caring"
             - Based on pre-work technique choice
             - 7 min teaching → 7 min learning → switch
             - Group debrief
[2:00-2:30]  Reflection & Feedback
             - Individual reflection (writing)
             - Round-table: "What action will you take?"
             - Preview of next session

Key elements that repeat:
- Facilitator-only tips and instructions (hidden from participants)
- Timed phases with ⌛ markers
- Collaborative tables (Name | Response columns)
- Pair activities with role-switching
- Group discussion facilitation prompts
- Post-session reflection and feedback collection
```

This pattern maps perfectly to our Session Plan template system.
