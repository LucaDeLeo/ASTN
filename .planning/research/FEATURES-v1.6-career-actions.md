# Feature Landscape: v1.6 Career Actions

**Domain:** LLM-generated personalized career coaching actions for AI safety talent
**Researched:** 2026-02-10
**Overall confidence:** HIGH (well-understood domain, clear existing patterns in ASTN codebase, strong source material)

## Context

This feature is inspired by the EA Forum post ["Stop Applying And Get To Work"](https://forum.effectivealtruism.org/posts/NfDbPsFmaXqajQP4J/stop-applying-and-get-to-work), which argues that in a field with short timelines and increasing competition for formal positions, proactive self-directed career moves produce more impact than endless applications. The core thesis: "I'd much rather take someone onto a project who has spent a few months trying to build useful things than spending cycles on applications."

The existing ASTN match system already generates per-match recommendations and growth areas. Career actions extend this into a standalone, profile-driven system of things to DO beyond applying to posted positions.

**Key distinction from existing features:** Matches say "apply to this job." Career actions say "do this thing to build your career, regardless of any specific job posting."

---

## Table Stakes

Features users expect once career actions exist. Missing = feature feels incomplete or broken.

| Feature                                 | Why Expected                                                                                                                                                                          | Complexity | Dependencies                                                                                       | Notes                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Profile-driven action generation**    | Actions must feel personal, not generic. "Replicate a mech interp paper" should reference the user's ML skills + interpretability interest.                                           | Med        | `profiles` table (skills, aiSafetyInterests, enrichmentSummary, careerGoals, seeking, workHistory) | Reuse `buildProfileContext()` from `convex/matching/prompts.ts`. Haiku 4.5 is appropriate (speed + cost for 3-5 actions). |
| **3-5 personalized actions per person** | Core value proposition. More than 5 overwhelms. Fewer than 3 feels thin.                                                                                                              | Low        | Action generation prompt                                                                           | Enforce in tool schema `minItems: 3, maxItems: 5`. Single Haiku call with forced `tool_choice`.                           |
| **Actions generated with matching**     | Users already trigger matching; actions should piggyback on the same flow.                                                                                                            | Low        | `convex/matching/compute.ts` scheduler                                                             | Chain after last match batch completes. Also support on-demand refresh.                                                   |
| **Action-specific reasoning**           | "Why is this relevant TO ME?" not generic advice. Each action needs a rationale tied to profile signals.                                                                              | Med        | LLM prompt design                                                                                  | Profile context + match growth areas fed to prompt. LLM generates per-action rationale.                                   |
| **Save/bookmark an action**             | Parallel to save match -- users want to curate interesting actions for later.                                                                                                         | Low        | Status toggle mutation                                                                             | Mirror existing `saveMatch` pattern.                                                                                      |
| **Dismiss an action**                   | Parallel to dismiss match -- users want to filter noise.                                                                                                                              | Low        | Status mutation                                                                                    | Mirror existing `dismissMatch` pattern with undo toast.                                                                   |
| **Mark as in-progress**                 | Users need to indicate they have started working on something. Meaningful state between "I see this" and "I finished this."                                                           | Low        | Status mutation with `startedAt`                                                                   | Simple status toggle.                                                                                                     |
| **Mark as done**                        | Users need to signal completion. This is the entry point to the completion flow.                                                                                                      | Low        | Status mutation with `completedAt`                                                                 | Two paths: "Tell us about it" (enrichment chat) or "Just mark done" (skip chat).                                          |
| **Violet visual distinction**           | Per project spec, actions use violet to distinguish from emerald/blue/amber (match tiers). Must not look like opportunity matches.                                                    | Low        | Tailwind v4 `violet-*` utilities                                                                   | Use OKLCH violet tokens consistent with existing design system.                                                           |
| **Directed but general framing**        | Actions must be specific enough to feel personalized but general enough not to prescribe exact resources. "Find a mech interp paper to replicate" not "Replicate Elhage et al. 2022." | Low        | Prompt engineering                                                                                 | Constrain in system prompt. No specific paper/course/tool names in generated actions.                                     |
| **Actions on matches page**             | Where users already go for career guidance. Natural home for "what to do beyond applying."                                                                                            | Low        | `src/routes/matches/index.tsx`                                                                     | New section component below match tiers, above growth areas.                                                              |
| **On-demand refresh**                   | Users expect to regenerate when profile changes.                                                                                                                                      | Low        | Reuse "Refresh Matches" trigger                                                                    | Same trigger regenerates both matches and actions.                                                                        |

---

## Action Type Taxonomy

Based on research into AI safety career pathways ([80,000 Hours career review](https://80000hours.org/career-reviews/ai-safety-researcher/), [80K upskilling resources](https://80000hours.org/2025/06/technical-ai-safety-upskilling-resources/), [AI Safety Camp](https://www.aisafety.camp/), [SPAR](https://sparai.org/), and the ["Stop Applying" post](https://forum.effectivealtruism.org/posts/NfDbPsFmaXqajQP4J/stop-applying-and-get-to-work)):

| Action Type             | Slug             | Description                                                                                                                                                                             | Example Action                                                                                                                                  | Best For Profile                            | Source                               |
| ----------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------ |
| **Replicate Research**  | `replicate`      | Reproduce a paper's results to build research skills and demonstrate capability. DeepMind: "if you can reproduce a typical ML paper in a few hundred hours, we're probably interested." | "Find a mechanistic interpretability paper to replicate -- your ML engineering skills + interpretability interest make this high-value"         | ML skills + research interest               | 80K Hours, DeepMind hiring guidance  |
| **Find Collaborators**  | `collaborate`    | Connect with researchers or practitioners for joint work. SPAR model: pairing aspiring researchers with mentors for 3-month projects.                                                   | "Reach out to researchers working on scalable oversight -- your policy background could complement their technical work"                        | Domain knowledge + networking goals         | SPAR, Alignment Forum                |
| **Start an Initiative** | `start_org`      | Found a project, reading group, org, or program. "Stop Applying" thesis: "consider starting your own project" when no one is addressing a need.                                         | "Consider starting an AI safety reading group at your university -- your governance knowledge and communication skills are a strong foundation" | Leadership skills + local community         | "Stop Applying" post                 |
| **Identify Gaps**       | `identify_gaps`  | Research under-served areas and contribute analysis. "Address problems you've noticed that should be addressed."                                                                        | "Map the landscape of deceptive alignment detection tooling -- your security background gives you unique perspective"                           | Research + analytical skills                | "Stop Applying" post, 80K Hours      |
| **Volunteer**           | `volunteer`      | Contribute time to existing AI safety organizations. Direct outreach with tangible proposals rather than generic inquiries.                                                             | "Volunteer with an AI safety org on their evaluation pipeline -- your Python + testing skills are directly applicable"                          | Technical skills + specific domain interest | "Stop Applying" post, AISafety.com   |
| **Build Tools**         | `build_tools`    | Create software, datasets, or infrastructure for AI safety. Anthropic: "write a complex new feature or fix a serious bug in a major ML library, and we'd want to interview you."        | "Build a visualization tool for attention patterns -- your frontend + ML combo is rare and valuable"                                            | Engineering skills + research awareness     | 80K Hours, Anthropic hiring guidance |
| **Teach or Write**      | `teach_write`    | Produce educational content, blog posts, tutorials, or give talks. Research involves creating knowledge AND sharing it effectively.                                                     | "Write a blog post explaining RLHF tradeoffs for a policy audience -- your dual background in policy and technical AI is perfect for this"      | Communication skills + domain expertise     | 80K Hours, LessWrong norms           |
| **Develop Skills**      | `develop_skills` | Targeted upskilling through courses, projects, or practice. Not generic "learn Python" but specific to identified gaps.                                                                 | "Work through the ARENA curriculum on transformer circuits -- this fills your main gap for interpretability roles"                              | Clear skill gaps identified from matching   | 80K Hours upskilling resources       |

**Implementation note:** Store as a string union in the schema. The LLM generates the type tag; the frontend maps it to an icon and label. Do NOT make this an open-ended string -- constrain to the taxonomy so the UI can render appropriate icons, colors, and categories.

**Taxonomy completeness:** These 8 types cover the full range of self-directed career moves discussed across all AI safety career resources surveyed. The categories are mutually exclusive and collectively exhaustive for the target domain. If a new type emerges, adding a literal to the union is a schema migration but a minor one.

---

## Differentiators

Features that set career actions apart from generic career advice or todo lists. Not expected, but valued.

| Feature                                                  | Value Proposition                                                                                                                                                                                            | Complexity | Dependencies                                                                                                              | Notes                                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Completion -> enrichment chat -> profile update loop** | Actions actually improve your profile, which improves future matching, which generates new actions. This virtuous cycle is what makes ASTN career actions qualitatively different from a static advice list. | High       | Enrichment chat (`convex/enrichment/conversation.ts`), extraction (`convex/enrichment/extraction.ts`), matching recompute | The killer differentiator. Done -> chat ("tell me what you did") -> extract skills/experience -> update profile -> recompute matches + regenerate actions. |
| **Actions informed by match gaps**                       | "Your matches repeatedly show ML engineering as a gap" -> "Build an ML project." Actions address the patterns across all your matches, not just one.                                                         | Med        | Match `growthAreas` aggregation, action generation prompt                                                                 | Feed aggregated growth areas from matching into the action generation prompt as context. Makes actions feel like they close the loop on match feedback.    |
| **Cross-pollination with growth areas**                  | Existing `GrowthAreas` component on matches page shows "Skills to build" / "Experience to gain." Actions are the HOW for those growth themes.                                                                | Med        | `aggregateGrowthAreas()` in matches page                                                                                  | Growth areas become the "why," actions become the "what." Visual linkage on the page.                                                                      |
| **Dismissed action resurfacing**                         | Dismissed actions can come back with different framing if profile evolves. Not identical text, but same type/direction with updated rationale.                                                               | Low        | Dismissal tracking + regeneration logic                                                                                   | Store dismissed action `type` + `generatedAt`. On regeneration, LLM sees dismissed types but can regenerate them if profile has changed.                   |
| **Action type variety enforcement**                      | LLM prompted to diversify across types. 5 actions should not all be "develop skills."                                                                                                                        | Med        | Prompt engineering                                                                                                        | Include instruction: "Distribute across at least 3 different action types. Prioritize types most relevant to the user's current career stage."             |
| **Progress indicator**                                   | "2 of 5 actions completed" -- simple motivational signal without gamification.                                                                                                                               | Low        | Query count by status                                                                                                     | Simple count. No streaks, no points, no badges.                                                                                                            |
| **Dashboard integration**                                | Show 1-2 top career actions on the main dashboard alongside top matches. "Your matches" + "Your next moves" side by side.                                                                                    | Low        | Dashboard route (`src/routes/index.tsx`)                                                                                  | Add section with violet accent below/alongside "Your Top Matches." Uses same `AnimatedCard` wrapper.                                                       |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature                                     | Why Avoid                                                                                                                                                                            | What to Do Instead                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Specific resource links in actions**           | Actions should NOT link to specific papers, courses, or tools. These go stale, create LLM hallucination risk, and constrain the user.                                                | Keep actions directed but general. "Find a mech interp paper" not "Replicate Elhage et al. 2022." The user finds the specific resource. |
| **Detailed step-by-step plans**                  | Breaking actions into sub-tasks makes this a project management tool. ASTN is not Asana. Scope explosion per action.                                                                 | One action = one direction with rationale. The enrichment chat on completion is where users discuss what they did.                      |
| **Gamification (points, streaks, badges, XP)**   | This is a career tool for adults working on existential risk. Gamification trivializes the work and creates perverse incentives (checking boxes vs. doing meaningful work).          | Simple completion status. The reward is profile improvement and better matches, not points.                                             |
| **Action deadlines or time estimates**           | Creates false pressure. Self-directed actions don't have deadlines. "You haven't done X in 2 weeks" notifications feel paternalistic.                                                | No timeline fields. "Do when ready" philosophy. Let users manage their own pace.                                                        |
| **Social/public action sharing**                 | "Share your career actions with your network" creates performance pressure and dilutes the personal nature of the feature. Small pilot (50-100 users) makes social proof misleading. | Keep actions private to the user. Profile updates resulting from completion are what become visible (if user chooses).                  |
| **AI-generated resource recommendations**        | "Here are 5 papers you could replicate" alongside the action. LLM hallucination risk is too high for specific citations.                                                             | Keep it directional. If the user wants specific recommendations, they can ask in the enrichment chat during completion flow.            |
| **Action editing by user**                       | Letting users edit LLM-generated text creates ownership confusion and makes regeneration harder.                                                                                     | User controls: save, dismiss, done. If an action doesn't fit, dismiss it. If the whole set doesn't fit, regenerate.                     |
| **Continuous progress bar**                      | Actions are discrete items (done/not done), not continuous progress. A bar implies gradual completion of each action.                                                                | Discrete count: "2 of 5 completed" if showing progress at all.                                                                          |
| **Notification for stale in-progress actions**   | Nagging users about incomplete self-directed work is counterproductive and breaks trust.                                                                                             | No push notifications for actions. Pull-based: user sees status when they visit the page.                                               |
| **Action-to-resource linking / curated content** | Curating resources (papers, courses, repos) per action is a content curation problem that scales poorly and goes stale.                                                              | Actions are directional. The AI safety ecosystem (80K Hours, AISafety.com, ARENA, etc.) already curates resources well.                 |
| **Historical action archive**                    | Building a full history of all past actions adds storage complexity for minimal value.                                                                                               | Keep current + completed actions visible. Dismissed actions disappear. Completed persist in a "completed" section.                      |

---

## Feature Dependencies

```
Profile data (skills, interests, goals, enrichment, work history)
    -> Action generation (single Haiku call, forced tool_choice)
        -> Action display (violet-accent cards on matches page + dashboard)
            -> Status tracking (save/dismiss/in-progress/done)
                -> Completion flow (done -> enrichment chat)
                    -> Extraction review (profile field updates)
                        -> Profile update (accepted extractions applied)
                            -> Match recomputation (existing trigger)
                            -> Action regeneration (new trigger, cycle restarts)

Existing match growth areas (aggregated from all matches)
    -> Action generation (as additional context input)

Profile update (any source: manual edit, extraction, enrichment)
    -> Action staleness check (compare profile.updatedAt to actions.generatedAt)
        -> Regeneration trigger (either automatic or prompt user)

Match save/dismiss UI pattern (MatchCard.tsx, MatchTierSection.tsx, UndoToast.tsx)
    -> Action card interaction pattern (reuse dismiss animation, undo toast, save toggle)
```

**Critical path:** Schema -> Generation -> Display -> Status -> Completion flow

**Existing infrastructure reuse:**
| Component | Reuse | Adaptation Needed |
|-----------|-------|-------------------|
| `convex/matching/prompts.ts` `buildProfileContext()` | Direct reuse | None |
| `convex/matching/compute.ts` pattern | Pattern reuse | New action-specific LLM call, different tool schema |
| `convex/enrichment/conversation.ts` | Significant reuse | New system prompt for completion debrief (shorter, focused on "what did you do?") |
| `convex/enrichment/extraction.ts` | Direct reuse | Same extraction flow, same review UI |
| `MatchCard.tsx` interaction pattern | Pattern reuse | New `ActionCard` component with violet accent, different card layout |
| `MatchTierSection.tsx` grouping | Pattern reuse | New `CareerActionsSection` with status grouping instead of tier grouping |
| `UndoToast.tsx` | Direct reuse | Same dismiss undo pattern |
| `GrowthAreas.tsx` | Conceptual link | Growth areas provide the "why," actions provide the "what." May adjust copy. |

---

## Completion Flow Detail

The completion flow is the most novel and highest-value aspect of this feature. It creates a virtuous cycle unique to ASTN.

### Step 1: User marks action "Done"

- UI shows confirmation with two paths:
  - **"Tell us about it"** -> enters completion enrichment chat (encouraged)
  - **"Just mark done"** -> skips chat, marks complete (always available)
- "Tell us about it" is the primary CTA (larger, violet). "Just mark done" is secondary (text link).
- Rationale: Some users will want to share what they learned. Others just want to check it off. Both are valid.

### Step 2: Completion Enrichment Chat (optional but encouraged)

- **Different system prompt** from profile enrichment chat. This is a completion debrief, not initial profile building.
- System prompt: "The user completed [action type]: [action title]. Ask them what they did, what they learned, and how their thinking has changed. Extract career-relevant information: new skills gained, experiences, refined interests, updated goals."
- Short conversation: 2-4 exchanges, not the full enrichment flow (3-8 exchanges).
- Conversation stored in `enrichmentMessages` table with a reference from the action's `completionConversationId`.

### Step 3: Extraction Review

- Reuse existing `enrichmentExtractions` table and review UI.
- Extracted fields: skills (new ones learned), enrichmentSummary updates, careerGoals refinements, aiSafetyInterests additions.
- User reviews and accepts/rejects/edits each extraction -- same pattern as current enrichment.
- Key UX: Show the action title as context during review ("Based on your work replicating a mech interp paper...").

### Step 4: Profile Update

- Apply accepted extractions to profile fields.
- Update `completedSections` if applicable.
- Set profile `updatedAt` to trigger downstream cascades.

### Step 5: Cascade

- Profile update triggers match recomputation (existing pattern via profile `updatedAt`).
- Profile update triggers action regeneration (new trigger).
- New actions reflect updated profile: if user completed "Replicate Research," new actions may shift toward "Find Collaborators" or "Teach or Write" about their replication work.
- This creates the virtuous cycle: action -> profile growth -> better matches -> new actions.

---

## Schema Recommendation

```typescript
// New table in convex/schema.ts
careerActions: defineTable({
  profileId: v.id('profiles'),

  // Action content (LLM-generated)
  type: v.union(
    v.literal('replicate'),
    v.literal('collaborate'),
    v.literal('start_org'),
    v.literal('identify_gaps'),
    v.literal('volunteer'),
    v.literal('build_tools'),
    v.literal('teach_write'),
    v.literal('develop_skills'),
  ),
  title: v.string(),        // Short directive, e.g., "Find a mech interp paper to replicate"
  description: v.string(),  // 2-3 sentences on why this fits the user's profile
  rationale: v.string(),    // Which profile signals drove this recommendation

  // Status tracking
  status: v.union(
    v.literal('active'),
    v.literal('saved'),
    v.literal('dismissed'),
    v.literal('in_progress'),
    v.literal('done'),
  ),

  // Timestamps
  startedAt: v.optional(v.number()),    // When user moved to in_progress
  completedAt: v.optional(v.number()),  // When user marked done

  // Completion tracking (links to enrichment chat if user chose "tell us about it")
  completionConversationStarted: v.optional(v.boolean()),

  // Generation metadata
  generatedAt: v.number(),
  modelVersion: v.string(),
})
  .index('by_profile', ['profileId'])
  .index('by_profile_status', ['profileId', 'status']),
```

**Schema decisions:**

- `in_progress` is included because it is a meaningful state between "I see this" and "I finished this." Users may want to indicate active work.
- `completionConversationStarted` is a boolean rather than an ID because the enrichment messages are already indexed by `profileId` and can be queried by `createdAt` relative to `completedAt`.
- No `priority` field -- ordering within the 3-5 actions is implicit (first generated = highest priority). LLM generates them in priority order.
- No `relatedMatchIds` field in v1 -- action-to-match bridging is deferred.
- No `urgency` or `deadline` fields -- per anti-features, actions are self-paced.

---

## UI/UX Patterns

### Distinguishing Actions from Matches

| Dimension               | Matches                                              | Career Actions                                                   |
| ----------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **Color**               | Emerald (great), Blue (good), Amber (exploring)      | Violet accent for all                                            |
| **Card structure**      | Title + org + location + strength + probability      | Title + type badge + description + rationale                     |
| **Primary CTA**         | "Apply" (external link to job posting)               | "Start Working" / "Mark Done" / "Save"                           |
| **Source**              | External opportunities from 80K Hours / aisafety.com | LLM-generated from profile analysis                              |
| **Ephemeral?**          | Yes (opportunities expire, matches recompute)        | Semi-persistent (regenerate on profile change)                   |
| **Navigation**          | `/matches` with tier sections                        | Section within `/matches` page (below tiers, above growth areas) |
| **Dashboard label**     | "Your Top Matches"                                   | "Your Next Moves"                                                |
| **Information density** | High (tier, probability, deadline, org, location)    | Lower (type, title, description)                                 |

### Action Card Layout

```
+------------------------------------------------------+
| [Violet badge: "Replicate Research"]  [Save] [Dismiss]|
|                                                        |
| Find a mech interp paper to replicate                  |
|                                                        |
| Your ML engineering skills combined with your           |
| interpretability interest make paper replication        |
| a high-value way to build research credibility.        |
|                                                        |
| Based on: ML Engineering, Interpretability, PyTorch    |
|                                                        |
| [Start Working]                                        |
+------------------------------------------------------+
```

When in-progress:

```
+------------------------------------------------------+
| [Violet badge: "Replicate Research"]  [In Progress]    |
|                                                        |
| Find a mech interp paper to replicate                  |
|                                                        |
| [Mark Done]                                            |
+------------------------------------------------------+
```

### Status Transitions

```
active -> saved         (user saves for later)
active -> dismissed     (user dismisses, undo available via toast)
active -> in_progress   (user starts working)
active -> done          (user completes directly)
saved -> in_progress    (user starts from saved)
saved -> dismissed      (user dismisses from saved)
saved -> done           (user completes from saved)
in_progress -> done     (user completes, primary flow)
in_progress -> active   (user un-starts, rare edge case)
dismissed -> (removed)  (dismissed actions removed from view; type may resurface on regeneration)
done -> (permanent)     (done is terminal; shows in "completed" section)
```

### Page Layout (Matches Page)

```
/matches page:
  [Saved Matches]           (existing, collapsible)
  [Great Matches]           (existing)
  [Good Matches]            (existing)
  [Exploring Matches]       (existing)
  --- NEW ---
  [Your Next Moves]         (career actions section, violet accent)
    [Active actions]
    [In-progress actions]
  [Completed Actions]       (collapsible, like saved matches)
  --- END NEW ---
  [Your Growth Areas]       (existing, may get copy update to link to actions)
```

### Dashboard Preview

```
/ dashboard:
  [Your Top Matches]        (existing, emerald/blue)
  [Your Next Moves]         (NEW, violet, 1-2 actions)
  [Suggested Organizations] (existing)
  [Upcoming Events]         (existing)
```

---

## MVP Recommendation

### Phase 1: Generation + Display + Status (ship first)

Prioritize in order:

1. **Schema** -- `careerActions` table with indexes
2. **Action generation pipeline** -- Haiku call with profile context + growth areas, forced tool_choice, taxonomy-constrained output
3. **Pipeline integration** -- Chain after last match batch in `processMatchBatch` when `isLastBatch`
4. **Queries + mutations** -- `getMyActions`, `saveAction`, `dismissAction`, `startAction`, `completeAction`
5. **ActionCard component** -- Violet accent, type badge, description, rationale, status-dependent CTAs
6. **CareerActionsSection** -- Composition component for matches page
7. **Matches page integration** -- New section between match tiers and growth areas
8. **Dashboard preview** -- 1-2 actions in dashboard "Your Next Moves" section

**Why this order:** Schema must exist before generation. Generation must exist before display. Display must exist before interactions make sense. Dashboard preview creates discovery surface.

### Phase 2: Completion Flow (ship second)

Prioritize in order:

1. **"Mark Done" with two paths** -- "Tell us about it" vs "Just mark done" UI
2. **Completion enrichment chat** -- New system prompt, short conversation (2-4 exchanges), stored in `enrichmentMessages`
3. **Extraction from completion chat** -- Reuse `extractFromConversation` with completion-specific prompt
4. **Extraction review UI** -- Reuse existing extraction review pattern
5. **Profile update on acceptance** -- Apply extractions, update `updatedAt`
6. **Regeneration trigger** -- After profile update, regenerate actions (and matches recompute via existing trigger)

**Why second:** The completion flow is the highest-complexity piece and touches enrichment, extraction, and matching systems. Ship generation + display + status first to validate action quality with real users before investing in the full loop.

### Defer to Later

| Feature                                       | Reason to Defer                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Action-to-match bridging**                  | Adds prompt complexity for marginal UX value. Can retrofit later.                                  |
| **Opportunities page integration**            | Matches page covers the primary use case. Secondary surface.                                       |
| **Match detail relevance filtering**          | Showing related actions on individual match detail requires relevance scoring.                     |
| **Dismissed action resurfacing intelligence** | Simple regeneration handles this naturally. Explicit resurfacing logic is over-engineering for v1. |

---

## Sources

### Primary (HIGH confidence)

- [Stop Applying And Get To Work -- EA Forum](https://forum.effectivealtruism.org/posts/NfDbPsFmaXqajQP4J/stop-applying-and-get-to-work) -- Feature inspiration, action philosophy
- [AI Safety Technical Research Career Review -- 80,000 Hours](https://80000hours.org/career-reviews/ai-safety-researcher/) -- Action type taxonomy, hiring signals
- [Technical AI Safety Upskilling Resources -- 80,000 Hours](https://80000hours.org/2025/06/technical-ai-safety-upskilling-resources/) -- Self-directed project types, program references
- Existing ASTN codebase: `convex/matching/`, `convex/enrichment/`, `src/components/matches/` -- Implementation patterns, schema patterns, UI patterns

### Secondary (MEDIUM confidence)

- [An Outsider's Roadmap into AI Safety Research 2025 -- LessWrong](https://www.lesswrong.com/posts/bcuzjKmNZHWDuEwBz/an-outsider-s-roadmap-into-ai-safety-research-2025) -- Career pathway patterns
- [SPAR -- Research Program for AI Risks](https://sparai.org/) -- Collaboration model, mentorship patterns
- [AI Safety Camp](https://www.aisafety.camp/) -- Project-based entry patterns
- [AI Safety and Governance Career Paths -- Probably Good](https://probablygood.org/career-profiles/ai-safety-governance/) -- Governance action types
- [AI Safety Foundations](https://www.aisafetyedu.org/learn/opportunities) -- Opportunity landscape

### Background (LOW confidence, informational only)

- [Dynamic Career Path Recommendation System (Jiang, 2025)](https://journals.sagepub.com/doi/abs/10.1177/14727978241313261) -- Academic reference for career recommendation systems
- [Personalized Career Pathway: Hybrid ML Approach](https://www.researchgate.net/publication/388618425_PERSONALIZED_CAREER_PATHWAY_A_HYBRID_MACHINE_LEARNING_APPROACH_FOR_DYNAMIC_RECOMMENDATIONS) -- Recommendation system patterns
- [How Agents Plan Tasks with To-Do Lists](https://towardsdatascience.com/how-agents-plan-tasks-with-to-do-lists/) -- LLM task management patterns
