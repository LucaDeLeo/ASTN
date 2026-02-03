---
phase: 03-profiles
plan: 01
subsystem: database, ui
tags: [convex, react, tanstack-router, profile, wizard, auto-save]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: User authentication flow (login/logout/session)
provides:
  - Profile data model with education, work history, career goals
  - Multi-step wizard with URL-synced navigation
  - Auto-save on blur with debounced mutations
  - Profile completeness tracking with section status
  - Stub components for Skills, Enrichment, Privacy steps
affects: [03-02-skills, 03-03-enrichment, 03-04-privacy, matching]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Multi-step wizard with TanStack Router search params
    - Auto-save hook with debounced Convex mutations
    - Dynamic array entry forms (education, work history)
    - Completeness checklist component

key-files:
  created:
    - convex/profiles.ts
    - src/components/profile/wizard/ProfileWizard.tsx
    - src/components/profile/wizard/WizardProgress.tsx
    - src/components/profile/wizard/hooks/useAutoSave.ts
    - src/components/profile/wizard/steps/BasicInfoStep.tsx
    - src/components/profile/wizard/steps/EducationStep.tsx
    - src/components/profile/wizard/steps/WorkHistoryStep.tsx
    - src/components/profile/wizard/steps/GoalsStep.tsx
    - src/components/profile/wizard/steps/SkillsStep.tsx
    - src/components/profile/wizard/steps/EnrichmentStep.tsx
    - src/components/profile/wizard/steps/PrivacyStep.tsx
    - src/routes/profile/edit.tsx
    - src/routes/profile/index.tsx
  modified:
    - convex/schema.ts
    - src/components/layout/auth-header.tsx

key-decisions:
  - 'Auto-save debounce of 500ms for text fields, immediate save for arrays'
  - '7 wizard steps: basic, education, work, goals, skills, enrichment, privacy'
  - 'Section completeness rules: basicInfo requires name AND location'
  - 'Pre-defined AI safety interest areas for goals selection'
  - 'Unlock threshold of 4 completed sections for smart matching'

patterns-established:
  - 'useAutoSave hook: debounced save on blur, immediate save for arrays'
  - 'WizardProgress sidebar: completeness checklist with clickable navigation'
  - 'Dynamic array forms: add/remove entries with immediate persistence'

# Metrics
duration: 8min
completed: 2026-01-18
---

# Phase 3 Plan 1: Profile Data Model and Wizard Summary

**Convex profile schema with 4 new tables (profiles, enrichmentMessages, enrichmentExtractions, skillsTaxonomy) and multi-step wizard at /profile/edit with auto-save on blur**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-18T01:09:19Z
- **Completed:** 2026-01-18T01:17:45Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Profile schema deployed with profiles, enrichmentMessages, enrichmentExtractions, skillsTaxonomy tables
- 7-step wizard with URL-synced navigation via TanStack Router search params
- Auto-save on blur for all form fields with 500ms debounce
- Profile view page at /profile showing all saved data
- Completeness tracking with unlock messaging (4 sections = smart matching)

## Task Commits

Each task was committed atomically:

1. **Task 1: Profile schema and CRUD mutations** - `6d47437` (feat)
2. **Task 2: Profile wizard with basic form steps** - `5a0d60e` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added profiles, enrichmentMessages, enrichmentExtractions, skillsTaxonomy tables
- `convex/profiles.ts` - Profile CRUD mutations and completeness queries
- `src/components/profile/wizard/ProfileWizard.tsx` - Main wizard container with step rendering
- `src/components/profile/wizard/WizardProgress.tsx` - Sidebar with completeness checklist
- `src/components/profile/wizard/hooks/useAutoSave.ts` - Debounced auto-save hook
- `src/components/profile/wizard/steps/BasicInfoStep.tsx` - Name, pronouns, location, headline
- `src/components/profile/wizard/steps/EducationStep.tsx` - Dynamic education entry list
- `src/components/profile/wizard/steps/WorkHistoryStep.tsx` - Dynamic work history entry list
- `src/components/profile/wizard/steps/GoalsStep.tsx` - Career goals, AI safety interests, seeking
- `src/components/profile/wizard/steps/SkillsStep.tsx` - Stub component (Plan 02)
- `src/components/profile/wizard/steps/EnrichmentStep.tsx` - Stub component (Plan 03)
- `src/components/profile/wizard/steps/PrivacyStep.tsx` - Stub component (Plan 04)
- `src/routes/profile/edit.tsx` - Wizard entry point with URL step validation
- `src/routes/profile/index.tsx` - Read-only profile view
- `src/components/layout/auth-header.tsx` - Updated dropdown links to /profile

## Decisions Made

- Auto-save debounce set to 500ms for text fields, with immediate save for array changes (education/work entries)
- Pre-defined list of 14 AI safety interest areas for the goals step selection
- Smart matching unlock threshold set at 4 completed sections
- Used month input type for work history dates for better UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript error with useRef requiring explicit undefined initial value - fixed by adding explicit type annotation
- vite.config.ts has pre-existing TypeScript error unrelated to this plan (react property type mismatch)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Profile data model ready for Skills taxonomy integration (Plan 02)
- enrichmentMessages table ready for LLM conversation storage (Plan 03)
- privacySettings schema ready for Privacy controls (Plan 04)
- All stub components in place ready to be implemented

---

_Phase: 03-profiles_
_Completed: 2026-01-18_
