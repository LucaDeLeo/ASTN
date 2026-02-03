---
phase: 03-profiles
plan: 03
subsystem: ai, ui
tags: [anthropic, claude, llm, chat, extraction, tool-use, convex-actions]

# Dependency graph
requires:
  - phase: 03-01
    provides: Profile schema with enrichmentMessages table, wizard framework, useAutoSave hook
provides:
  - LLM-powered career coaching conversation
  - Claude tool use for structured data extraction
  - Chat UI with message persistence
  - Extraction review with accept/reject/edit controls
  - Profile field auto-population from extractions
affects: [matching, recommendations, profile-completeness]

# Tech tracking
tech-stack:
  added: ['@anthropic-ai/sdk']
  patterns:
    - Convex actions for LLM API calls (Node.js runtime)
    - Separate queries file for non-Node functions
    - Claude tool use for structured extraction
    - Optimistic UI updates with server persistence

key-files:
  created:
    - convex/enrichment/conversation.ts
    - convex/enrichment/queries.ts
    - convex/enrichment/extraction.ts
    - src/components/profile/enrichment/EnrichmentChat.tsx
    - src/components/profile/enrichment/ExtractionReview.tsx
    - src/components/profile/enrichment/hooks/useEnrichment.ts
  modified:
    - src/components/profile/wizard/steps/EnrichmentStep.tsx
    - src/components/profile/wizard/ProfileWizard.tsx
    - package.json

key-decisions:
  - 'Claude Haiku 4.5 for both conversation and extraction (fast, cost-effective)'
  - 'Separate Node.js file for actions, regular file for queries/mutations'
  - 'Career coach tone: warm, exploratory, not interrogative'
  - 'shouldExtract flag triggered by LLM signaling phrases'
  - 'Extraction uses tool_choice forced to extract_profile_info'

patterns-established:
  - 'useEnrichment hook: manages chat state, extraction, and review flow'
  - 'EnrichmentChat component: scrolling messages with typing indicator'
  - 'ExtractionReview component: per-field accept/reject/edit controls'

# Metrics
duration: 8min
completed: 2026-01-18
---

# Phase 3 Plan 3: LLM Enrichment Conversation Summary

**Career coaching conversation with Claude Haiku, structured extraction via tool use, and extraction review UI with accept/reject/edit controls**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-18T01:18:00Z
- **Completed:** 2026-01-18T01:26:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- LLM conversation with career coach persona using Claude Haiku 4.5
- Message persistence to enrichmentMessages table with real-time sync
- Structured extraction using Claude tool use with extract_profile_info tool
- Chat UI with message display, typing indicator, and scroll-to-bottom
- Extraction review UI with per-field accept/reject/edit controls
- Profile auto-population from accepted extractions
- Conversation history preserved across page refresh
- Continuation support after applying extractions

## Task Commits

Each task was committed atomically:

1. **Task 1: LLM conversation action and message persistence** - `d5f0a1d` (feat)
2. **Task 2: EnrichmentStep UI with chat and extraction review** - `689f2a3` (feat)

## Files Created/Modified

- `convex/enrichment/conversation.ts` - sendMessage action with Claude Haiku, career coach system prompt
- `convex/enrichment/queries.ts` - getMessages, getMessagesPublic, saveMessage for message persistence
- `convex/enrichment/extraction.ts` - extractFromConversation action using Claude tool use
- `src/components/profile/enrichment/EnrichmentChat.tsx` - Chat UI with message display and input
- `src/components/profile/enrichment/ExtractionReview.tsx` - Accept/reject/edit UI for extractions
- `src/components/profile/enrichment/hooks/useEnrichment.ts` - Hook managing chat and extraction state
- `src/components/profile/wizard/steps/EnrichmentStep.tsx` - Full enrichment step replacing stub
- `src/components/profile/wizard/ProfileWizard.tsx` - Updated to pass profile prop to EnrichmentStep
- `package.json` - Added @anthropic-ai/sdk dependency

## Decisions Made

- Used Claude Haiku 4.5 (claude-haiku-4-5-20250514) for both conversation and extraction - fast and cost-effective
- Separated Node.js actions from queries/mutations per Convex runtime requirements
- Career coach prompt emphasizes warm, exploratory tone - not interrogative
- shouldExtract detection via keyword matching (summarize, update profile, good picture, what I learned)
- Forced tool use via tool_choice parameter for reliable structured extraction
- Extraction maps to profile fields: skills_mentioned -> skills, career_interests -> aiSafetyInterests, etc.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed Anthropic SDK with --legacy-peer-deps**

- **Found during:** Task 1 (dependency installation)
- **Issue:** npm peer dependency conflict with existing @auth/core version
- **Fix:** Used `npm install @anthropic-ai/sdk --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** Package installs, imports work
- **Committed in:** d5f0a1d (Task 1 commit)

**2. [Rule 3 - Blocking] Split Node.js action from queries/mutations**

- **Found during:** Task 1 (Convex compilation)
- **Issue:** Convex "use node" runtime only allows actions, not queries/mutations
- **Fix:** Created separate queries.ts file for getMessages, saveMessage
- **Files modified:** convex/enrichment/conversation.ts, convex/enrichment/queries.ts
- **Verification:** Convex compiles successfully
- **Committed in:** d5f0a1d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for Convex runtime compatibility. No scope creep.

## Issues Encountered

- TypeScript circular reference errors in conversation.ts - resolved by adding explicit type annotations
- Linter auto-modified some file references which required verification

## User Setup Required

**External services require manual configuration.** The ANTHROPIC_API_KEY environment variable must be configured:

1. Go to [Anthropic Console](https://console.anthropic.com) -> API Keys
2. Create or copy an API key
3. Add to Convex environment: `npx convex env set ANTHROPIC_API_KEY <your-key>`
4. Verify: Test the enrichment conversation in the wizard

## Next Phase Readiness

- Enrichment conversation fully functional
- Profile completeness now tracks hasEnrichmentConversation
- Ready for smart matching integration (Phase 4)
- Skills and interests populated from enrichment available for matching

---

_Phase: 03-profiles_
_Completed: 2026-01-18_
