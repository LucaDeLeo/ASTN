# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**Legacy auth tables still in schema:**

- Issue: Six legacy `@convex-dev/auth` tables (`users`, `authSessions`, `authAccounts`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits`) remain in `convex/schema.ts` even though Clerk is now the auth provider. The comment explicitly says "Remove after all users have migrated to Clerk IDs."
- Files: `convex/schema.ts` (lines 4–56), `convex/userMigration.ts`, `convex/lib/auth.ts` (`getLegacyUserEmail`), `convex/emails/send.ts` (multiple "Pass 2: Batch fetch user emails from legacy auth table" blocks)
- Impact: These dead tables consume storage; `getLegacyUserEmail` silently falls back to the old table for migrated users and will simply return `null`, causing email notifications to silently skip those users until the lookup chain resolves from `profile.email`.
- Fix approach: Verify all profiles have `email` populated (backfill migration `convex/migrations/backfillProfileEmails.ts` exists), then drop `getLegacyUserEmail` calls, strip `legacyAuthTables` from schema, and delete `convex/userMigration.ts`.

**Widespread `.filter()` on indexed tables (violates project rules):**

- Issue: `convex/CLAUDE.md` explicitly states "Never use `.filter()` — define an index in `schema.ts` and use `.withIndex()` instead." However `.filter()` is used extensively across the codebase in production query paths.
- Files: `convex/orgOpportunities.ts` (lines 45, 101, 148, 219, 272), `convex/opportunityApplications.ts` (lines 121, 279, 392, 434, 460, 487, 529, 582), `convex/autoEmailConfig.ts` (lines 42, 89, 156), `convex/orgs/members.ts` (lines 18, 51, 112, 123, 173), `convex/orgs/membership.ts` (lines 18, 110, 226, 316, 365), `convex/spaceBookings.ts` (lines 22, 98, 119, 247, 268, 296, 379), `convex/lib/auth.ts` (lines 66, 145), `convex/spaceBookings/admin.ts` (multiple lines)
- Impact: Convex `.filter()` performs a full index scan and filters client-side. For `orgMemberships` (queried by `by_user` + `.filter(orgId)`) this is a per-user table scan growing with membership count. The most critical offender is the admin authorization pattern duplicated 12+ times: `query('orgMemberships').withIndex('by_user').filter(orgId)`.
- Fix approach: `orgMemberships` already has a `by_user_and_org` compound index (confirmed in schema). Replace the `by_user` + `.filter(orgId)` pattern throughout with `.withIndex('by_user_and_org', q => q.eq('userId', userId).eq('orgId', orgId))`. Other tables need new compound indexes added to schema.

**Duplicated admin auth check (no shared helper):**

- Issue: The pattern "get userId → get opportunity → check orgMembership for that orgId" is duplicated in 12+ functions. The TODO.md explicitly calls this out: "Add `requireOrgAdminForOpportunity()` helper to `convex/lib/auth.ts`."
- Files: `convex/autoEmailConfig.ts`, `convex/opportunityApplications.ts`, `convex/orgOpportunities.ts`, `convex/emails/adminBroadcast.ts`, `convex/orgs/members.ts` (has its own local `requireOrgAdmin` helper that is not shared)
- Impact: Logic drift risk — changing admin check semantics requires updating 12+ places.
- Fix approach: Extract `requireOrgAdminForOpportunity(ctx, opportunityId)` into `convex/lib/auth.ts` and replace all call sites.

**`v.any()` used widely on public API boundaries:**

- Issue: `v.any()` bypasses Convex's runtime validation. Used on return validators for entire query modules and on args like `responses` (application form data).
- Files: `convex/agent/queries.ts` (13 functions return `v.any()`), `convex/orgs/directory.ts` (3 functions), `convex/orgs/discovery.ts` (3 functions), `convex/opportunityApplications.ts` (`responses: v.any()` on 6 mutations), `convex/platformAdmin/users.ts` (6 functions return `v.any()`)
- Impact: No type safety guarantee; malformed data can reach the database undetected. Particularly risky for `responses: v.any()` in `opportunityApplications.submit` — arbitrary data can be stored against any application.
- Fix approach: Define typed validators for `FormResponse` (see `convex/lib/formFields.ts`), replace `v.any()` with proper validators. Start with `opportunityApplications.ts` which is user-facing.

**`@ts-nocheck` in production email batch file:**

- Issue: `convex/emails/batchActions.ts` (line 2) has `// @ts-nocheck - Type inference issues with Convex internalAction handlers`. This disables TypeScript across the entire 653-line file that handles match alerts, weekly digests, deadline reminders, and event digests.
- Files: `convex/emails/batchActions.ts`
- Impact: Silent type errors in the core email notification pipeline go undetected. Any refactoring to Convex action types won't be caught.
- Fix approach: Resolve the type inference issues (likely requires explicit return type annotations on `internalAction` handlers), then remove `@ts-nocheck`.

**Full table scans in hourly cron jobs:**

- Issue: Every hourly cron call for match alerts and event digests begins by fetching ALL profiles via `ctx.db.query('profiles').collect()` and filtering in memory.
- Files: `convex/emails/send.ts` (`getUsersForMatchAlertBatch`, `getUsersForWeeklyDigestBatch`, and 2 more similar functions at lines 84–199, 700, 759)
- Impact: Currently fine at 40–100 users, but will degrade at scale. Each hourly invocation reads every profile document.
- Fix approach: Add indexes on `notificationPreferences.matchAlerts.enabled` and `notificationPreferences.timezone` fields, or migrate to a dedicated `notificationSubscribers` table queried by preference flag.

**Organizations listed with full table scan + in-memory sort:**

- Issue: `convex/organizations.ts:listOrganizations` does `ctx.db.query('organizations').collect()` then `.sort()` in memory.
- Files: `convex/organizations.ts` (line 8)
- Impact: Fine now (handful of orgs), but will degrade if org count grows significantly.
- Fix approach: Use the existing `by_name` index with `.order('asc')` to get alphabetical results from the DB.

**`crons.ts` uses deprecated `crons.daily`, `crons.hourly`, `crons.weekly`:**

- Issue: `convex/CLAUDE.md` states "Only use `crons.interval` or `crons.cron`" but `crons.ts` uses `crons.daily`, `crons.hourly`, and `crons.weekly` for all 7 cron jobs.
- Files: `convex/crons.ts` (lines 8, 16, 24, 42, 51, 60, 77)
- Impact: Using deprecated API. May break on future Convex SDK updates.
- Fix approach: Migrate each cron to `crons.cron('name', '0 6 * * *', ...)` syntax.

## Known Bugs

**Mobile bottom nav visible on desktop (hydration/resize race):**

- Symptoms: `BottomTabBar` renders on desktop-width viewports when navigating or resizing.
- Files: `src/components/layout/bottom-tab-bar.tsx`, `src/components/layout/mobile-shell.tsx`
- Trigger: `MobileShell` is gated by `useIsMobile()` hook (768px breakpoint), but `BottomTabBar` inside `mobile-shell.tsx` has no CSS `md:hidden` class — it relies entirely on the hook gate. Any hydration or resize-event race can expose the nav.
- Workaround: None. One-line fix: add `className="md:hidden"` to the `<nav>` element in `src/components/layout/bottom-tab-bar.tsx` (line 41).

**Location string formatting inconsistent:**

- Symptoms: Locations display as "San Francisco Bay Area.USA" (period instead of comma).
- Files: `src/utils/formatLocation.ts`, aggregation sources in `convex/aggregation/`
- Trigger: Source data from external aggregators (80K Hours, aisafety.com) uses inconsistent separators. `formatLocation()` handles the period→comma case but edge cases remain with other separators and orderings.
- Workaround: Partially mitigated by `formatLocation.ts`.

**Match skew too senior/technical for non-technical profiles:**

- Symptoms: Governance/policy candidates are matched to AI Engineer / Research Manager roles.
- Files: `convex/matching/prompts.ts`, `convex/matching/coarse.ts`, `convex/matching/compute.ts`
- Trigger: Matching prompt and coarse-scoring system treats technical role keywords as higher signals. Known quality regression documented in TODO.md.
- Workaround: None.

**Silent failure in `maybeAddPollRespondent` / `maybeScheduleAutoEmail`:**

- Symptoms: Poll respondents or auto-emails can fail to be created/scheduled with no user-visible error.
- Files: `convex/opportunityApplications.ts` (lines 14–88)
- Trigger: Both helper functions catch all errors and `console.error` silently. Any exception during poll insertion or email scheduling is swallowed.
- Workaround: None. These are intentional "fail silently" patterns but there is no retry or alerting mechanism.

## Security Considerations

**`GEMINI_API_KEY` accessed with non-null assertion (`!`):**

- Risk: If `GEMINI_API_KEY` is not set, `process.env.GEMINI_API_KEY!` resolves to `undefined` and the Gemini client throws an unguarded runtime error during match computation — potentially leaving `matchProgress` stuck on profiles.
- Files: `convex/matching/coarse.ts` (line 129), `convex/matching/compute.ts` (line 493)
- Current mitigation: None — the `!` assertion removes the undefined check.
- Recommendations: Guard with `if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')` at the top of each action.

**FCM push using deprecated legacy API endpoint:**

- Risk: `convex/push.ts` uses `https://fcm.googleapis.com/fcm/send` (FCM Legacy HTTP API) which was deprecated and shut down by Google in 2024. The `FIREBASE_SERVER_KEY` credential type was part of the legacy API.
- Files: `convex/push.ts` (line 40)
- Current mitigation: Push notifications silently skip when `FIREBASE_SERVER_KEY` is not set — effectively the feature is disabled.
- Recommendations: Migrate to FCM HTTP v1 API using a service account OAuth2 token, or remove push notification code if the feature is unused.

**`responses: v.any()` on application submissions accepts arbitrary data:**

- Risk: Unauthenticated (guest) and authenticated application submissions store unvalidated `responses: v.any()` in the database. A malicious actor can submit arbitrarily large or structured payloads.
- Files: `convex/opportunityApplications.ts` (lines 96, 181, 318, 371, 617)
- Current mitigation: Rate limiter (`opportunityApplication: 30/hour`, `guestApplication: 5/hour`) limits abuse volume but not payload content.
- Recommendations: Define a typed `FormResponse` validator and enforce max field lengths server-side.

**Unsubscribe HMAC secret falls back to skipping unsubscribe links:**

- Risk: If `UNSUBSCRIBE_SECRET` is not set on a deployment, `getUnsubscribeUrl()` returns `undefined` and emails are sent without `List-Unsubscribe` headers. The TODO.md confirms this needs manual Gmail verification.
- Files: `convex/emails/batchActions.ts` (lines 56–61), `convex/emails/unsubscribeVerify.ts`
- Current mitigation: Graceful degradation (emails send without unsubscribe header).
- Recommendations: Log a warning when `UNSUBSCRIBE_SECRET` is missing; add unsubscribe footer link as a text fallback.

**`lumaApiKey` stored in plain text in org document:**

- Risk: The `lumaApiKey` field in `organizations` schema (marked "Deprecated") is stored in plain text as a Convex document field. Any admin query returning the full org document exposes this key.
- Files: `convex/schema.ts` (line 391)
- Current mitigation: Marked deprecated; presumably not used.
- Recommendations: Delete the field from schema as part of schema cleanup.

## Performance Bottlenecks

**N+1 reads in match email processing:**

- Problem: `processMatchAlertBatch` in `convex/emails/batchActions.ts` calls `getOpportunity` as a separate `ctx.runQuery` per match per user (lines 105–113). For 10 users each with 5 matches, that is 50 sequential Convex round-trips inside an action.
- Files: `convex/emails/batchActions.ts` (lines 94–123)
- Cause: Each `ctx.runQuery` is a separate transaction; no batch-read utility for opportunities.
- Improvement path: Batch-fetch all unique opportunityIds in a single query before the user loop, or use denormalized opportunity snapshots already available on match documents.

**Match computation stores progress on the profile document:**

- Problem: During match computation, `matchProgress` is patched onto the `profiles` document on every batch completion. This means the high-read `profiles` query is invalidated every ~15 batches, triggering UI re-renders for the user.
- Files: `convex/matching/mutations.ts`, `convex/matching/compute.ts`, `convex/profiles.ts`
- Cause: Progress tracking embedded in the profile document rather than a separate lightweight document.
- Improvement path: Move `matchProgress` to a separate `matchComputationProgress` table queried only by the progress indicator component.

**`notifications/realtime.ts` N+1 profile reads per org notification:**

- Problem: When scheduling org-wide event notifications, `convex/notifications/realtime.ts` fetches all `orgMemberships` for an org then reads each member's `profile` document one by one in a loop.
- Files: `convex/notifications/realtime.ts` (lines 19–46)
- Cause: No batch read; sequential per-member profile lookup.
- Improvement path: `Promise.all` the profile reads, or query profiles directly with a `by_user` index batch.

## Fragile Areas

**Match computation chained scheduler architecture:**

- Files: `convex/matching/coarse.ts`, `convex/matching/compute.ts`, `convex/matching/mutations.ts`
- Why fragile: Match computation is split across Tier 2 (coarse scoring in batches of 50) and Tier 3 (detailed scoring in batches of 15), chained via `ctx.scheduler.runAfter(0, ...)` calls. If any batch action fails or times out after writing partial state, `matchProgress` on the profile gets stuck. There is no cleanup/timeout mechanism — a stuck `matchProgress` object means the user sees a permanent loading state.
- Safe modification: Always test the full match pipeline end-to-end after changes to batch sizes (`BATCH_SIZE`, `TOP_N`, `COARSE_THRESHOLD`). Verify `matchProgress` is cleared on both success and failure paths.
- Test coverage: No automated tests for the batch chaining logic.

**`AgentChat.tsx` is a 1,172-line mega-component:**

- Files: `src/components/profile/agent/AgentChat.tsx`
- Why fragile: Contains message rendering, file upload, streaming, error boundary, auto-scroll, LinkedIn import flow, tool-call approval UI, and smart input logic all in one file. The `MessageErrorBoundary` class component is a sign of defensive programming against render crashes.
- Safe modification: Make isolated changes; extract one concern at a time. Avoid modifying multiple message rendering paths simultaneously.
- Test coverage: No unit tests.

**`programs/$programId.tsx` is a 1,282-line route component:**

- Files: `src/routes/org/$slug/admin/programs/$programId.tsx`
- Why fragile: All error handling is bare `console.error(error)` with no user feedback (lines 467, 488, 597). Multiple independent mutation-triggering flows share complex local state.
- Safe modification: Add user-visible error toasts before extending this component. Extract sub-sections into child components.
- Test coverage: No tests.

**`availabilityPolls.ts` is 888 lines with no index guidance:**

- Files: `convex/availabilityPolls.ts`
- Why fragile: Multiple `.filter()` calls on `pollRespondents` and related tables. 888 lines with mixed query/mutation/action concerns.
- Safe modification: Read the entire file before making changes — many functions are co-dependent.
- Test coverage: No automated tests.

**LinkedIn URL frontend validation is weaker than backend:**

- Files: `src/components/profile/upload/LinkedInImport.tsx` (line 12: `const LINKEDIN_URL_PATTERN = /linkedin\.com\/in\//i`), `convex/extraction/linkedin.ts` (`validateLinkedInUrl`)
- Why fragile: The frontend pattern only checks for `linkedin.com/in/` and does not handle `/pub/` legacy URLs, protocol normalization, subdomains, or query params. The backend `validateLinkedInUrl` handles all of these. A URL that passes the frontend check may still fail the backend extraction.
- Safe modification: Replace the frontend regex with a call to the same normalization logic used in `convex/extraction/linkedin.ts`.

## Scaling Limits

**Full profile table scans (email batching):**

- Current capacity: Works fine at 40–100 profiles.
- Limit: Will cause noticeable slowdowns above ~5,000 profiles; Convex action timeouts become a risk above ~50,000 profiles.
- Scaling path: Index notification preferences or maintain a separate subscriber list.

**Match computation memory (all opportunities in profile context):**

- Current capacity: Coarse batch of 50 opportunities per Gemini call; fine at current opportunity count (~hundreds).
- Limit: At thousands of opportunities, Gemini context window and Convex action memory become constraints.
- Scaling path: Pre-filter opportunities by role type / experience level before LLM scoring (hard filters already exist in `applyHardFilters`; ensure they are applied aggressively).

## Dependencies at Risk

**`@convex-dev/persistent-text-streaming` (enrichment chat streaming):**

- Risk: Third-party Convex component with limited adoption. API surface is small but tightly coupled to the HTTP streaming endpoint in `convex/enrichment/streaming.ts`.
- Impact: Breaking change in the component would disable all chat streaming.
- Migration plan: The streaming could be reimplemented directly using Convex HTTP actions + SSE if needed.

**FCM Legacy HTTP API (push notifications):**

- Risk: `https://fcm.googleapis.com/fcm/send` is a deprecated endpoint.
- Impact: Push notification delivery will silently fail once the endpoint is fully shut down. Code currently falls back to "no push" if key is missing.
- Migration plan: Migrate to FCM HTTP v1 or drop the feature.

## Missing Critical Features

**Org admin email notifications:**

- Problem: No email system exists for org admins. When a user applies, updates their profile, or is accepted/rejected, org admins only receive in-app notifications via `createNotification()`.
- Blocks: Org admins must actively check the dashboard to see new applicants.

**Auto-email trigger validation:**

- Problem: `saveConfig` in `convex/autoEmailConfig.ts` accepts `triggers: v.array(v.string())` with no validation of trigger values against the allowed set.
- Blocks: A typo in a trigger name causes emails to never fire, with no error.

**No referral/source URL tracking:**

- Problem: No `?ref=` or `?source=` URL parameters exist. BAISH CRM links users to the platform but there is no mechanism to detect this and prompt targeted onboarding (e.g., CV upload prompt for BAISH referrals).
- Blocks: Custom onboarding flows for partner orgs.

## Test Coverage Gaps

**Convex backend functions (all):**

- What's not tested: All query, mutation, and action handlers in `convex/` have no automated tests.
- Files: Entire `convex/` directory
- Risk: Schema changes, auth logic changes, or matching algorithm updates can silently break without detection.
- Priority: High — especially for `convex/matching/`, `convex/emails/`, `convex/lib/auth.ts`

**Match pipeline batch chaining:**

- What's not tested: The Tier 2 → Tier 3 handoff logic in `convex/matching/coarse.ts` and `convex/matching/compute.ts`, including retry logic, rate limit backoff, and stuck-progress scenarios.
- Files: `convex/matching/coarse.ts`, `convex/matching/compute.ts`
- Risk: Stuck match computation leaves users with permanent loading state.
- Priority: High

**AgentChat component:**

- What's not tested: Message rendering, tool-call approval flow, file upload handling, LinkedIn import confirmation.
- Files: `src/components/profile/agent/AgentChat.tsx`
- Risk: Regression in any message rendering path (the `MessageErrorBoundary` suggests this has occurred before).
- Priority: Medium

**Frontend form validation:**

- What's not tested: `LinkedInImport.tsx` URL validation, application form submission logic, profile field validation.
- Files: `src/components/profile/upload/LinkedInImport.tsx`, `src/routes/org/$slug/apply/$opportunityId.tsx`
- Risk: Weak frontend validation allows invalid data to reach the backend.
- Priority: Medium

---

_Concerns audit: 2026-03-10_
