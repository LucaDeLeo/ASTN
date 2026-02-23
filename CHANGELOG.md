# Changelog

All notable changes to the AI Safety Talent Network (ASTN) project.

## [Unreleased] - 2026-02-11 to 2026-02-23

Post-milestone feature work, production hardening, and UX improvements after the initial BAISH pilot launch.

### Added

- GDPR compliance: privacy policy, terms of use, consent gate with full-profile consent
- Default notification preferences on signup and first-match email notification
- Application tracking for matches (save, apply, dismiss)
- Match sorting by weighted fit + urgency score with fit % and deadline display
- Collapsible career actions, growth areas, and insights sections on matches page
- Paginated match grid with sort dropdown and compact toolbar chips
- Org avatars in top navigation bar
- BAISH CRM import from Airtable with auto-greet for new profiles
- LinkedIn profile import with confirmation step before import
- Agent sidebar transformed from profile builder to career advisor with rich context
- Match preferences with incremental matching and hard constraint pre-filtering
- Expandable career action cards in 3-column grid
- LLM enrichment for opportunity metadata
- Kimi K2.5 as swappable conversation model for enrichment chat
- Multilingual sidebar agent support
- Profile completeness awareness and navigation links in chatbot
- In-app opportunity applications with guest (unauthenticated) support
- Generic org application system with dynamic forms
- Public coworking space landing page with admin customization
- Platform admin user data review interface with Matches tab
- Clerk API migration to backfill profile emails with auto-backfill on login
- Org members automatically grant profile viewing privileges to their org
- LLM usage tracking across all API call sites
- Rate limiting to all public endpoints via @convex-dev/rate-limiter
- Server-side debouncing for expensive operations
- Geocoding for organization map markers
- Auto-join org on signup via invite link
- Delete all account data button in settings
- Settings link in profile dropdown and hamburger menu
- Full-page opportunity form builder
- Embedded Clerk sign-in/sign-up on landing page
- Redesigned landing page with feature showcase
- Custom Convex-backed feedback dialog (replacing Formbricks)
- Security hardening: CSP enforcement, bundled Leaflet, static file headers
- Sticky top nav bar with backdrop blur
- Animated section expand/collapse with compact layout
- Org logos as circular map markers
- Attendee name clickable in booking list
- Orgs nav link and hamburger feedback dialog

### Changed

- Matching engine switched to Gemini Flash with admin recompute capability
- Restructured matches page: promoted grid view, added sort dropdown, compact toolbar chips
- Unified collapsible sections with shared CollapsibleSection component
- Revamped match detail page information architecture
- Restructured chat agent system prompt for clarity and reliability
- Enrichment chat improvements: reduced sycophancy, broadened non-technical support
- Old enrichment wizard step removed; agent sidebar is now sole enrichment path
- Removed Tauri mobile app scaffolding
- Removed interview probability estimation feature
- Optimized database bandwidth (~410 MB/month savings)

### Fixed

- Rate limit countdown instead of generic error on matches page
- Calendar date pickers unified with shared styles and correct nav positioning
- Org admins see full member profiles (joining means consent)
- Email unsubscribe links, conciser match explanations, location formatting
- Country-specific LinkedIn URL subdomains in smart input detection
- AuthHeader responsive on mobile
- Duplicate extractions and race conditions prevented
- React #185 on CV upload and 10000% progress bug
- Convex storage domain added to CSP img-src for org logos
- Auto-create profile for new users to prevent infinite load
- CRM-to-profile data gaps for LinkedIn, location, and match prefs
- Smooth auth panel transitions, no layout shift on page load
- Fit score hidden on card hover to avoid overlap with action buttons

---

## [1.6.0] - 2026-02-10 to 2026-02-11 — Career Actions

LLM-generated personalized career action plans based on match analysis.

### Added

- Career actions data layer: `careerActions` table with schema and Zod validation
- Career action queries and status transition mutations
- LLM generation pipeline with system prompt and tool definitions
- Compute action wired into match computation trigger
- ActionCard component with type badges and status buttons
- Career actions section integrated into matches page and dashboard
- Completion enrichment flow: choice dialog, enrichment dialog, and completion coach prompt
- "Enriched" indicator on completed actions with completion conversations

---

## [1.5.0] - 2026-02-03 to 2026-02-11 — Org Onboarding & Co-working

Self-service organization onboarding, coworking space management, member bookings, and guest access.

### Added

- Platform admin role with `platformAdmins` table and auth helpers
- Org applications system: schema, CRUD operations, notification types
- Application form, status page, and admin review queue with rejection dialogs
- Org self-configuration: setup wizard, onboarding checklist, space config
- Org configuration and coworking space schema and backend
- Member booking system: `spaceBookings` table, mutations, queries, calendar UI
- Space booking page with calendar, time picker, and attendee list
- "My Bookings" page with cancel and edit functionality
- Guest access: `guestProfiles` table, visit applications, approval workflow
- Guest signup form with tabbed login/signup and public space query
- Admin guest management and visit request review
- Admin booking dashboard: calendar, booking list, today's bookings
- Add Booking dialog, space utilization and guest conversion cards
- Booking pagination for booking list and history
- Space stats and Bookings quick action on admin dashboard

---

## [1.4.0] - 2026-01-31 to 2026-02-02 — Hardening

Security, quality gates, and performance/accessibility improvements.

### Added

- Auth hardening: admin auth on opportunity CRUD, gated listAll, deprecated getCompleteness
- OAuth hardening: redirect URI allowlist and PKCE support
- XML prompt injection defense, Zod shadow validation, and input limits
- Zod validation schemas and field limits module
- CI workflow with husky pre-commit hook and lint-staged config
- Structured logging utility across all Convex files
- Rate-limited matching with chained scheduled actions
- Aria-describedby across all data-entry form components
- Password inline validation, keyboard-accessible OrgCard, drag state indicators
- GradientBg applied to remaining user-facing pages
- Display font (font-display) applied across all page headings

### Fixed

- Dead code removed and alert() replaced with toast notifications
- Navigate() wrapped in useEffect for all redirect components
- Backend bugs in growth areas, dates, engagement, timezone

---

## [2.0.0] - 2026-01-20 to 2026-01-31 — Mobile & Responsive

Responsive foundation, mobile navigation, touch interactions, and UX polish. Tauri mobile was explored then removed from scope.

### Added

- Responsive utilities: useMediaQuery hook, ResponsiveSheet, Skeleton component
- Mobile-responsive OpportunityFilters, ProfileWizard, MemberFilters
- MobileFilters bottom sheet component
- MemberCardMobile for responsive member list switching
- Skeleton loading for OpportunityList
- Touch target utilities and layout transitions
- PWA manifest, viewport-fit=cover, safe area CSS utilities
- BottomTabBar, MobileHeader, MobileShell layout components
- HamburgerMenu with Sheet component (side positioning)
- Touch interaction foundation: useHaptic hook, global touch CSS optimizations
- SwipeableCard with gesture handling for match cards
- Pull-to-refresh in matches and opportunities
- Match status tracking: dismiss/save mutations
- UX polish: contextual empty state variants, navigation active indicators
- Clickable MatchCard linking to detail page
- Display font switched to Space Grotesk with preloading
- Location formatting utility
- Color palette evolution to navy/slate with semantic tokens
- Dark mode support with cookie-based SSR theme detection
- ThemeProvider and ThemeToggle components
- Focus states and enhanced Empty component with warm styling

### Fixed

- Horizontal overflow in MatchCard on mobile
- Stable bottom tab bar height preventing layout shifts
- Dark mode flash on page load with theme script ordering
- Scrollbar layout shift with scrollbar-gutter
- Card reappear flash on dismiss with smooth swipe animations
- All 110 ESLint errors and warnings resolved

### Removed

- Tauri mobile app scaffolding (Phase 24/25 removed from scope)

---

## [1.3.0] - 2026-01-19 to 2026-01-20 — Visual Overhaul

Complete design system with tokens, typography, animations, and dark mode.

### Added

- Color and typography token system with CSS custom properties
- Variable font packages (Lora, Space Grotesk) with FOIT/FOUT prevention
- Animation tokens and keyframes
- Warm visual polish applied across all pages
- AnimatedCard component with hover lift and shadow transitions
- Press squish feedback on Button component
- Staggered animations for Dashboard event cards and MatchTierSection
- View transitions for page navigation
- Core visual polish: gradient backgrounds, consistent spacing

### Fixed

- Scrollbar layout shift prevented with scrollbar-gutter

---

## [1.2.0] - 2026-01-19 — Org CRM & Events

Organization discovery, event management via lu.ma, notifications, attendance tracking, engagement scoring, and CRM dashboard.

### Added

- Org discovery: suggested orgs on dashboard, browse page with map (Leaflet)
- OrgCard, OrgCarousel, and OrgFilters components
- Location privacy toggle in settings
- Organization location fields and discovery queries
- Lu.ma event integration: API client, sync actions, daily cron job
- Events table and lu.ma config on organizations schema
- Org event pages with LumaEmbed, admin settings with lu.ma configuration
- EventCard component and dashboard events section
- Event notifications: schema, preferences UI, digest email templates
- Notification bell component with dropdown and real-time notifications
- Event digest batch processing and cron jobs
- Attendance tracking: schema, mutations, queries, scheduler
- AttendancePrompt, FeedbackForm, and StarRating components
- Attendance history page and profile summary
- Attendance privacy settings
- Engagement scoring: schema, LLM compute action, cron job
- Engagement badge, override dialog, and history components
- CRM dashboard: enhanced org stats with time range selector
- Member filtering, pagination, and profile queries
- Member engagement and career visualizations
- Programs system: schema, CRUD, enrollment, completion logic
- Program admin UI: list page, detail page, ProgramCard, CreateProgramDialog
- CSV export with engagement data
- Org bootstrap mutations

---

## [1.1.0] - 2026-01-18 to 2026-01-19 — Profile Input Speedup

Document upload infrastructure, LLM-powered CV/resume extraction, and profile creation wizard.

### Added

- File upload backend: `uploadedDocuments` table, upload mutations
- Upload utilities: useFileUpload hook with state machine, uploadWithProgress
- Upload UI: DocumentUpload (drag-drop), FilePreview, UploadProgress, TextPasteZone
- LLM extraction core: PDF and text extraction actions, extraction prompts
- Skill matching utility for extracted data
- Extraction UI: status tracking, useExtraction hook, progress components
- Review & Apply UI: field card, expandable entry, review container with skills
- applyExtractedProfile mutation for applying extractions to profile
- Profile creation wizard: EntryPointSelector, WizardStepIndicator
- ProfileCreationWizard orchestrator with flow orchestration
- PostApplySummary component
- Chat-first CV prompt integrated into EnrichmentStep

---

## [1.0.0] - 2026-01-17 to 2026-01-18 — Foundation

Initial platform with opportunity aggregation, authentication, profiles, AI matching, organizations, and email notifications.

### Added

- Project bootstrap: TanStack Start + Convex + shadcn/ui with coral accent
- Convex Auth configuration for TanStack Start
- Landing page
- Opportunity data model with schema and indexes
- Admin layout with opportunity CRUD (list, create, edit pages)
- Opportunity aggregation: 80K Hours (Algolia) and aisafety.com (Airtable) adapters
- Daily sync cron job with deduplication
- Public opportunity browsing: list page with filters, detail page
- Authentication: login page with OAuth and email/password
- Auth-aware header with avatar dropdown
- Profile system: schema, CRUD mutations, multi-step wizard
- Skills taxonomy with seed data and tag input UI
- LLM enrichment conversation with message persistence
- Privacy controls: section visibility and org hiding
- AI matching engine: prompts, tool definitions, batch LLM matching
- Matches data layer with internal queries and mutations
- Matches list page with tier sections and detail page with full explanation
- Growth areas section on matches page
- Email infrastructure: React Email templates and send functions
- Notification preferences (schema, queries, UI)
- Batch email processing with cron jobs
- Org membership system: schema, CRUD, invites, directory, join flow
- Org admin dashboard with stats and export
- Admin auth wrapper and navigation links
