# Project Milestones: AI Safety Talent Network (ASTN)

## v1.6 Career Actions (Shipped: 2026-02-11)

**Delivered:** LLM-generated personalized career actions with a full lifecycle (save, dismiss, in-progress, done) and a completion-to-enrichment loop that feeds accomplished actions back into profiles for better matching.

**Phases completed:** 35-36 (5 plans, 14 tasks)

**Key accomplishments:**

- Personalized career action generation via Claude Haiku 4.5 producing 3-5 targeted actions per person across 8 types, referencing specific profile elements
- Violet-accented action card UI with type badges, personalized rationale, and status-dependent interaction buttons
- Full action lifecycle: save, dismiss, in-progress, done states with regeneration preservation of user-modified actions
- Fire-and-forget generation pipeline alongside matching via scheduler trigger, with growth area context from match recommendations
- Completion-to-enrichment loop: done actions feed into enrichment chat (pre-seeded with action context), extraction review, profile update, and match refresh
- Zero component duplication: completion flow reuses existing EnrichmentChat and ExtractionReview directly

**Stats:**

- 31 files changed
- +2,097 / -49 lines TypeScript (source)
- 2 phases, 5 plans, 14 tasks
- 1 day execution (2026-02-11)
- 23 commits

**Git range:** `2ebee02` → `0667247`

**Tech debt noted:** None accumulated.

**What's next:** v1.7+ for action-to-match bridging, opportunities page actions, intelligent resurfacing

---

## v1.5 Org Onboarding & Co-working (Shipped: 2026-02-03)

**Delivered:** Org self-onboarding with application flow and admin approval, co-working space management with capacity tracking, member direct booking, lightweight guest access, and admin dashboard with bookings calendar and utilization stats.

**Phases completed:** 30-34 (17 plans)

**Key accomplishments:**

- Org application flow with ASTN admin approval and org self-configuration
- Co-working space definition with capacity, operating hours, and custom visit forms
- Member direct booking with flexible hours and soft capacity warnings
- Lightweight guest access with quick account creation and org approval
- Guest visit info pre-fills ASTN profile on later signup
- Admin dashboard with bookings calendar, attendance history, and utilization stats

**Stats:**

- 5 phases, 17 plans
- Shipped 2026-02-03

---

## v1.4 Hardening (Shipped: 2026-02-02)

**Delivered:** Security hardening, bug fixes, performance optimization, accessibility, and code quality improvements closing all issues from the comprehensive codebase review before the BAISH pilot.

**Phases completed:** 27-29 (9 plans total)

**Key accomplishments:**

- Authentication hardening with shared requireAuth/requireAnyOrgAdmin helpers gating 9 previously-unprotected endpoints
- OAuth PKCE S256 with Tauri Store persistence, redirectUri allowlist, and state validation for mobile auth flow
- LLM prompt injection defense via XML delimiters on all 6 call points, shadow-mode Zod validation on all 5 tool_use responses
- CI pipeline (GitHub Actions) and pre-commit hooks (husky + lint-staged), .env.example, dual lockfile cleanup
- Bug fixes: growth area aggregation, Date.UTC conversion, useEffect navigation, engagement override expiration, structured JSON logging
- N+1 query elimination, rate-limited matching via chained scheduled actions, WCAG 2.1 aria-describedby across 14 forms, GradientBg + font-display completion

**Stats:**

- 125 files changed
- ~17,000 lines added/modified
- 3 phases, 9 plans
- 1 day execution (2026-02-02)

**Git range:** `7769e7f` → `2dce89c`

**Tech debt noted:** OAUTH-03 deferred to post-pilot, Zod validation in shadow mode, 3 matching concurrency edge cases tracked for v1.5.

**What's next:** BAISH pilot launch, or v1.5 for matching robustness and extended hardening

---

## v1.3 Visual Overhaul (Shipped: 2026-01-20)

**Delivered:** Transform ASTN from generic shadcn/ui to a warm, memorable visual identity that says "AI safety is about people."

**Phases completed:** 17-20 (13 plans total)

**Key accomplishments:**

- Design token system with Lora + Plus Jakarta Sans variable fonts, warm cream/coral OKLCH palette, fluid typography scale
- Font preloading infrastructure eliminating FOIT/FOUT with woff2 preloads
- Warm visual treatment with GradientBg, coral-tinted shadows, and atmospheric depth across all main pages
- Motion system with AnimatedCard stagger, Card hover lift, Button press squish, and View Transitions for page navigation
- Intentional coral-based dark mode with warm undertones and cookie-based SSR detection (no theme flash)
- Accessibility polish with coral focus rings and Enhanced Empty component with warm SVG illustrations

**Stats:**

- 84 files created/modified
- ~4,000 lines added/modified
- 4 phases, 13 plans
- 1 day execution (2026-01-19 → 2026-01-20)

**Git range:** `e024186` → `77f502d`

**Tech debt noted:** Some secondary pages (settings, attendance, org admin) still use cold backgrounds — tracked for future polish.

**What's next:** BAISH pilot expansion, or v1.4 for additional polish based on user feedback

---

## v1.2 Org CRM & Events (Shipped: 2026-01-19)

**Delivered:** Transform ASTN into a self-maintaining CRM where orgs track members, events, and engagement automatically.

**Phases completed:** 11-16 (20 plans total)

**Key accomplishments:**

- Org discovery with geography-based suggestions, searchable directory with interactive Leaflet map, and invite links
- Lu.ma event integration with automatic sync, org event pages, and dashboard event grouping
- Configurable event notifications with in-app notification center, scheduler-based reminders, and digest emails with org muting
- Post-event attendance tracking with one-tap confirmation, star ratings + feedback, and attendance history on profile
- LLM engagement scoring via Claude Haiku with natural language explanations and admin override with audit trail
- Full CRM dashboard with time-range stats, filterable member directory, privacy-controlled profiles, CSV export, and custom program tracking

**Stats:**

- 147 files created/modified
- ~25,000 lines of TypeScript added
- 6 phases, 20 plans
- Same day execution (~7 hours from first to last commit)

**Git range:** `feat(11-01)` → `fix: restructure member route`

**What's next:** v1.3 or v2.0 based on BAISH pilot feedback — potential features include mobile responsiveness, advanced event check-in, or application tracking

---

## v1.1 Profile Input Speedup (Shipped: 2026-01-19)

**Delivered:** Faster profile creation via PDF/text upload with LLM extraction, review UI, and 4-way entry point wizard.

**Phases completed:** 7-10 (13 plans total)

**Key accomplishments:**

- PDF upload infrastructure with drag-drop, file picker, progress indicators, and 10MB limit
- Text paste fallback with collapsible input and soft character limit warning
- Claude Haiku 4.5 Vision extraction pipeline for structured data (name, location, education, work history)
- Smart skill matching with 0.7 fuzzy threshold suggesting ASTN skills from resume content
- Review & edit UI with field cards (accept/reject/edit) and expandable entries for multi-item sections
- Profile wizard with 4 entry points: upload PDF, paste text, manual entry, chat-first AI guidance

**Stats:**

- 74 files created/modified
- ~10,600 lines of TypeScript added
- 4 phases, 13 plans
- 2 days from v1.0 to v1.1 (2026-01-17 → 2026-01-19)

**Git range:** `feat(07-01)` → `docs(10-03)`

**What's next:** v1.2 or v2.0 based on BAISH pilot feedback — potential features include mobile responsiveness, advanced extraction (DOCX, publications), or application tracking

---

## v1.0 MVP (Shipped: 2026-01-18)

**Delivered:** Career command center for AI safety talent with smart matching, LLM-powered profiles, and org dashboard for BAISH pilot (50-100 profiles).

**Phases completed:** 1-6 (21 plans total)

**Key accomplishments:**

- Opportunity aggregation pipeline from 80K Hours and aisafety.com with daily sync
- Full authentication system (Google, GitHub OAuth + email/password)
- Rich profile wizard with AI safety skills taxonomy (39 skills) and LLM career coaching
- Smart matching engine with tier-based grouping (Great/Good/Exploring), explanations, and recommendations
- Email engagement with high-fit alerts and weekly personalized digests
- Org CRM with member directory, admin dashboard with stats, and CSV/JSON export

**Stats:**

- 289 files created/modified
- ~73,000 lines of TypeScript
- 6 phases, 21 plans
- 2 days from start to ship (2026-01-17 → 2026-01-18)

**Git range:** Initial commit → `f67e25b`

**What's next:** v1.1 — Mobile responsiveness, production hardening, or feature expansion based on pilot feedback

---

_Milestones file created: 2026-01-18_
_Updated: 2026-01-20 - Added v1.3 Visual Overhaul_
