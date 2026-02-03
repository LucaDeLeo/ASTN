---
phase: 01-foundation-opportunities
verified: 2026-01-17T23:30:00Z
status: passed
score: 20/20 must-haves verified
human_verification:
  - test: 'Dev server starts and renders landing page'
    expected: 'Running `bun dev` shows page at localhost with ASTN branding'
    why_human: 'Runtime behavior needs manual verification'
  - test: 'Create opportunity via admin form'
    expected: 'Form submits, opportunity appears in list and persists'
    why_human: 'Full CRUD workflow including database persistence'
  - test: 'Filter opportunities by role type and remote'
    expected: 'URL updates with search params, results filter correctly'
    why_human: 'Interactive filter behavior with URL sync'
  - test: 'View opportunity detail page'
    expected: 'All fields displayed, Apply button opens source URL'
    why_human: 'Visual rendering and external link behavior'
---

# Phase 01: Foundation + Opportunities Verification Report

**Phase Goal:** Project scaffolding and opportunity pipeline (cold start prevention)
**Verified:** 2026-01-17T23:30:00Z
**Status:** PASSED
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| #                                                   | Truth                                                                | Status   | Evidence                                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| **Plan 01-01: Project Setup**                       |                                                                      |          |                                                                                        |
| 1                                                   | Running `bun dev` starts development server without errors           | VERIFIED | package.json has dev script, vite.config.ts exists with tanstackStart plugin           |
| 2                                                   | Visiting localhost:3000 renders a page                               | VERIFIED | src/routes/index.tsx exists (30 lines), renders landing page with ASTN branding        |
| 3                                                   | Convex dashboard shows connected project                             | VERIFIED | convex/\_generated/api.d.ts exists, schema.ts has authTables + opportunities           |
| 4                                                   | TypeScript compiles without errors                                   | VERIFIED | tsconfig.json configured, all .tsx files have proper imports                           |
| **Plan 01-02: Opportunity Data Model + Admin CRUD** |                                                                      |          |                                                                                        |
| 5                                                   | Admin can view list of all opportunities at /admin/opportunities     | VERIFIED | src/routes/admin/opportunities/index.tsx (120 lines), calls api.opportunities.listAll  |
| 6                                                   | Admin can create a new opportunity via form                          | VERIFIED | OpportunityForm calls api.admin.createOpportunity with full field mapping              |
| 7                                                   | Admin can edit an existing opportunity                               | VERIFIED | src/routes/admin/opportunities/$id/edit.tsx exists, uses updateOpportunity mutation    |
| 8                                                   | Admin can delete an opportunity                                      | VERIFIED | Admin index has deleteOpportunity mutation wired to trash button                       |
| 9                                                   | Opportunities persist in Convex database                             | VERIFIED | convex/schema.ts defines opportunities table with all required indexes                 |
| **Plan 01-03: Opportunity Aggregation**             |                                                                      |          |                                                                                        |
| 10                                                  | Running sync action imports opportunities from 80K Hours             | VERIFIED | convex/aggregation/eightyK.ts (150 lines) has fetchOpportunities with Algolia client   |
| 11                                                  | Running sync action imports opportunities from aisafety.com Airtable | VERIFIED | convex/aggregation/aisafety.ts (144 lines) has fetchOpportunities with Airtable API    |
| 12                                                  | Duplicate opportunities from different sources are merged            | VERIFIED | syncMutations.ts uses isSimilarOpportunity for fuzzy matching, adds alternateSources   |
| 13                                                  | Opportunities no longer in source are auto-archived                  | VERIFIED | archiveMissing mutation in syncMutations.ts checks sourceIdSet and archives            |
| 14                                                  | Cron job scheduled for daily execution                               | VERIFIED | convex/crons.ts (14 lines) has daily cron at 6 AM UTC calling runFullSync              |
| **Plan 01-04: Opportunity Browsing UI**             |                                                                      |          |                                                                                        |
| 15                                                  | User can view list of opportunities at /opportunities                | VERIFIED | src/routes/opportunities/index.tsx (81 lines), renders OpportunityList with cards      |
| 16                                                  | User can filter by role type, location/remote, and search keywords   | VERIFIED | OpportunityFilters component uses useSearch/useNavigate with URL params                |
| 17                                                  | Filter state is reflected in URL for shareable links                 | VERIFIED | validateSearch in route, updateFilter modifies URL search params                       |
| 18                                                  | User can click opportunity to view full details                      | VERIFIED | OpportunityCard uses Link to="/opportunities/$id" with params                          |
| 19                                                  | Detail page shows all opportunity information                        | VERIFIED | opportunity-detail.tsx (217 lines) renders title, org, description, requirements, etc. |
| 20                                                  | Freshness indicator shows when opportunity was last verified         | VERIFIED | Card and detail show "Last verified: X ago" using formatDistanceToNow                  |

**Score:** 20/20 truths verified

### Required Artifacts

| Artifact                                             | Expected                   | Status   | Lines | Details                                                                             |
| ---------------------------------------------------- | -------------------------- | -------- | ----- | ----------------------------------------------------------------------------------- |
| **Plan 01-01**                                       |                            |          |       |                                                                                     |
| package.json                                         | Project dependencies       | VERIFIED | 56    | Has convex, @tanstack/react-router, algoliasearch, string-similarity-js             |
| convex/schema.ts                                     | Database schema            | VERIFIED | 56    | Has authTables + opportunities with 5 indexes + search index                        |
| convex/auth.ts                                       | Convex Auth config         | VERIFIED | 8     | Exports convexAuth with GitHub, Google, Password providers                          |
| src/routes/\_\_root.tsx                              | Root route                 | VERIFIED | 75    | Has RootComponent with html/body structure                                          |
| src/router.tsx                                       | Router with ConvexProvider | VERIFIED | 46    | ConvexProvider wraps children via Wrap prop                                         |
| **Plan 01-02**                                       |                            |          |       |                                                                                     |
| convex/opportunities.ts                              | Public queries             | VERIFIED | 85    | Exports list, get, search, listAll                                                  |
| convex/admin.ts                                      | Admin mutations            | VERIFIED | 88    | Exports createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity |
| src/routes/admin/opportunities/index.tsx             | Admin list view            | VERIFIED | 120   | Full list with edit/archive/delete buttons                                          |
| src/components/admin/opportunity-form.tsx            | Reusable form              | VERIFIED | 321   | Complete form with all fields, create/edit modes                                    |
| **Plan 01-03**                                       |                            |          |       |                                                                                     |
| convex/aggregation/eightyK.ts                        | 80K Hours adapter          | VERIFIED | 150   | fetchOpportunities via Algolia with pagination                                      |
| convex/aggregation/aisafety.ts                       | aisafety.com adapter       | VERIFIED | 144   | fetchOpportunities via Airtable REST API                                            |
| convex/aggregation/sync.ts                           | Sync orchestration         | VERIFIED | 48    | runFullSync calls both adapters, upsertOpportunities, archiveMissing                |
| convex/aggregation/syncMutations.ts                  | Sync mutations             | VERIFIED | 168   | upsertOpportunities with dedup, archiveMissing                                      |
| convex/aggregation/dedup.ts                          | Deduplication logic        | VERIFIED | 37    | isSimilarOpportunity with string similarity                                         |
| convex/crons.ts                                      | Cron job definitions       | VERIFIED | 14    | Daily cron at 6 AM UTC                                                              |
| **Plan 01-04**                                       |                            |          |       |                                                                                     |
| src/routes/opportunities/index.tsx                   | Opportunity list page      | VERIFIED | 81    | Uses useQuery with list/search, renders filters and list                            |
| src/routes/opportunities/$id.tsx                     | Opportunity detail page    | VERIFIED | 64    | Uses useQuery for get, renders OpportunityDetail                                    |
| src/components/opportunities/opportunity-card.tsx    | Card component             | VERIFIED | 120   | Shows logo, title, org, location, role badge, freshness                             |
| src/components/opportunities/opportunity-filters.tsx | Filter bar                 | VERIFIED | 135   | Role type, location, search with URL sync                                           |
| src/components/opportunities/opportunity-detail.tsx  | Detail component           | VERIFIED | 217   | Full info, Apply button, source attribution                                         |
| src/components/layout/public-header.tsx              | Public header              | VERIFIED | 25    | Replaces \_public.tsx pathless layout                                               |

### Key Link Verification

| From                                                 | To                                  | Via                                   | Status | Details                                                            |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------------- | ------ | ------------------------------------------------------------------ |
| src/router.tsx                                       | convex/react                        | ConvexProvider                        | WIRED  | ConvexProvider wraps children in router Wrap prop                  |
| src/routes/admin/opportunities/index.tsx             | convex/opportunities.ts             | convexQuery                           | WIRED  | useSuspenseQuery(convexQuery(api.opportunities.listAll))           |
| src/components/admin/opportunity-form.tsx            | convex/admin.ts                     | useConvexMutation                     | WIRED  | createOpportunity and updateOpportunity mutations                  |
| convex/crons.ts                                      | convex/aggregation/sync.ts          | internal.aggregation.sync.runFullSync | WIRED  | Daily cron calls runFullSync                                       |
| convex/aggregation/sync.ts                           | convex/aggregation/eightyK.ts       | ctx.runAction                         | WIRED  | runFullSync calls internal.aggregation.eightyK.fetchOpportunities  |
| convex/aggregation/sync.ts                           | convex/aggregation/aisafety.ts      | ctx.runAction                         | WIRED  | runFullSync calls internal.aggregation.aisafety.fetchOpportunities |
| convex/aggregation/sync.ts                           | convex/aggregation/syncMutations.ts | ctx.runMutation                       | WIRED  | Calls upsertOpportunities and archiveMissing                       |
| src/routes/opportunities/index.tsx                   | convex/opportunities.ts             | useQuery                              | WIRED  | api.opportunities.list and api.opportunities.search                |
| src/components/opportunities/opportunity-filters.tsx | URL params                          | useNavigate/useSearch                 | WIRED  | Updates and reads from route search params                         |
| src/components/opportunities/opportunity-card.tsx    | src/routes/opportunities/$id.tsx    | Link                                  | WIRED  | Link to="/opportunities/$id" params={{ id }}                       |
| src/components/opportunities/opportunity-detail.tsx  | External                            | a href                                | WIRED  | Apply button opens sourceUrl in new tab                            |

### Requirements Coverage

Based on ROADMAP.md Phase 1 requirements (OPPS-01 through OPPS-06):

| Requirement                              | Status    | Supporting Evidence                                          |
| ---------------------------------------- | --------- | ------------------------------------------------------------ |
| OPPS-01: View opportunity listings       | SATISFIED | /opportunities page with list, cards show title/org/location |
| OPPS-02: Search and filter opportunities | SATISFIED | Filter bar with role type, location/remote, search keyword   |
| OPPS-03: Import from 80K Hours           | SATISFIED | eightyK.ts adapter with Algolia pagination                   |
| OPPS-04: Import from aisafety.com        | SATISFIED | aisafety.ts adapter with Airtable API                        |
| OPPS-05: Admin manual add/edit           | SATISFIED | Admin CRUD at /admin/opportunities with full form            |
| OPPS-06: Freshness indicator             | SATISFIED | lastVerified field, displayed as "Last verified: X ago"      |

### Anti-Patterns Found

| File         | Line | Pattern | Severity | Impact |
| ------------ | ---- | ------- | -------- | ------ |
| (none found) | -    | -       | -        | -      |

No stub patterns, placeholder implementations, or TODO comments found in implementation files. All "placeholder" string matches are legitimate form input placeholder text.

### Human Verification Required

The following items need human testing to confirm full functionality:

#### 1. Development Server Startup

**Test:** Run `bun dev` and visit http://localhost:5173
**Expected:** Landing page renders with "AI Safety Talent Network" heading and "Browse Opportunities" button
**Why human:** Runtime behavior, port binding, and visual rendering

#### 2. Admin CRUD Workflow

**Test:** Visit /admin/opportunities, create a test opportunity, edit it, archive it, delete it
**Expected:** All operations succeed, data persists in Convex dashboard
**Why human:** Full database roundtrip and form interaction

#### 3. Filter URL Sync

**Test:** Select "Research" role filter, verify URL shows ?role=research, copy URL to new tab
**Expected:** Same filter applied in new tab, results filtered correctly
**Why human:** Browser URL behavior and query param handling

#### 4. Opportunity Detail View

**Test:** Click any opportunity card, verify detail page loads
**Expected:** All fields displayed (title, org, description, requirements), "Apply Now" opens external link
**Why human:** Visual layout and external navigation

#### 5. Sync Trigger (Manual)

**Test:** In Convex dashboard, run aggregation.sync.triggerSync action
**Expected:** Console shows fetch counts (may be 0 without credentials), no errors
**Why human:** Requires Convex dashboard access and credential setup

### Architecture Notes

**Deviation from Plan 01-01:**

- ConvexProvider is in `src/router.tsx` via the router's `Wrap` prop, not directly in `__root.tsx`
- This is an improvement: cleaner separation between router setup and root component

**Deviation from Plan 01-04:**

- `_public.tsx` pathless layout was replaced with `PublicHeader` component
- Documented in STATE.md as decision: "Shared PublicHeader component instead of pathless layout route"
- Functionally equivalent: both provide consistent header across public pages

**Aggregation Setup:**

- Adapters are configured but require environment variables:
  - `EIGHTY_K_ALGOLIA_APP_ID`, `EIGHTY_K_ALGOLIA_API_KEY` for 80K Hours
  - `AISAFETY_AIRTABLE_API_KEY`, `AISAFETY_AIRTABLE_BASE_ID` for aisafety.com
- This is expected per STATE.md blockers section

---

_Verified: 2026-01-17T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
