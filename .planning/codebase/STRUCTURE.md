# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
ASTN/
├── src/                          # Frontend application (TanStack Start / React)
│   ├── routes/                   # File-based routing (TanStack Router)
│   ├── components/               # React components organized by domain
│   │   ├── ui/                   # shadcn/ui primitive components
│   │   ├── layout/               # App shell, headers, mobile shell
│   │   ├── agent-sidebar/        # AI agent chat sidebar
│   │   ├── profile/              # Profile editing, extraction, wizard
│   │   ├── matches/              # Match cards, saved/applied sections
│   │   ├── actions/              # Career action cards and dialogs
│   │   ├── org/                  # Organization components
│   │   ├── opportunities/        # Opportunity listing and forms
│   │   ├── events/               # Event cards
│   │   ├── attendance/           # Attendance prompts and ratings
│   │   ├── engagement/           # Engagement badge and history
│   │   ├── notifications/        # Notification bell and list
│   │   ├── settings/             # Settings form components
│   │   ├── guest/                # Guest signup form
│   │   ├── admin/                # Platform admin components
│   │   ├── space/                # Co-working space components
│   │   ├── programs/             # Program cards
│   │   ├── animation/            # Animated card wrappers
│   │   ├── gestures/             # Swipeable card (touch gestures)
│   │   └── theme/                # Theme provider and toggle
│   ├── hooks/                    # Shared React hooks
│   ├── lib/                      # Pure utilities and constants
│   └── styles/                   # Global CSS (app.css)
├── convex/                       # Convex backend (DB + serverless functions)
│   ├── _generated/               # Auto-generated types and API (do not edit)
│   ├── lib/                      # Shared backend helpers
│   ├── matching/                 # 3-tier LLM matching pipeline
│   ├── extraction/               # Resume/LinkedIn extraction
│   ├── enrichment/               # Profile enrichment chat + streaming
│   ├── careerActions/            # Career action generation
│   ├── engagement/               # Engagement score computation
│   ├── aggregation/              # External opportunity sync (80K Hours, aisafety.com)
│   ├── notifications/            # Real-time + scheduled notifications
│   ├── emails/                   # Email templates and batch sending
│   ├── attendance/               # Event attendance tracking
│   ├── agent/                    # Convex-dev/agent profile builder
│   ├── orgs/                     # Organization queries, members, stats
│   ├── spaceBookings/            # Co-working space booking admin
│   ├── migrations/               # One-time data migration scripts
│   ├── platformAdmin/            # Platform admin user management
│   ├── profiles.ts               # Core profile CRUD and completeness logic
│   ├── opportunities.ts          # Opportunity CRUD
│   ├── schema.ts                 # Convex database schema (all tables)
│   ├── http.ts                   # HTTP endpoint router
│   ├── crons.ts                  # Cron job definitions
│   ├── convex.config.ts          # Convex component registrations
│   └── auth.config.ts            # Clerk JWT issuer config
├── shared/                       # Code shared between frontend and agent
│   └── admin-agent/              # Admin agent types and constants
├── agent/                        # CLI admin agent (separate from in-app agent)
│   ├── agent.ts                  # Agent definition
│   ├── cli.ts                    # CLI entry point
│   ├── server.ts                 # Agent server
│   └── tools/                   # Admin agent tools
├── public/                       # Static assets (favicon, OG image, manifests)
├── docs/                         # Developer documentation
├── _bmad/                        # BMAD AI framework files
├── _bmad-output/                 # BMAD brainstorming outputs
├── .planning/                    # GSD planning artifacts
├── dist/                         # Production build output (gitignored)
├── vite.config.ts                # Vite + TanStack Start + Nitro config
├── tsconfig.json                 # TypeScript config (strict mode, `~/` alias)
├── package.json                  # Dependencies and scripts
├── components.json               # shadcn/ui configuration (new-york style)
└── instrument.server.mjs         # Sentry instrumentation for SSR
```

## Directory Purposes

**`src/routes/`:**

- Purpose: All application pages, implemented as file-based routes using TanStack Router
- Contains: `Route` exports created with `createFileRoute()` or `createRootRouteWithContext()`
- Key files:
  - `src/routes/__root.tsx`: Root layout with providers (PostHog, Theme, AgentSidebar)
  - `src/routes/index.tsx`: Home/dashboard/landing page
  - `src/routes/profile/index.tsx`: User profile view and editor
  - `src/routes/matches/index.tsx`: Match list and career actions
  - `src/routes/org/$slug/admin/`: Per-org admin pages (members, guests, bookings, programs, opportunities, setup)
  - `src/routes/admin/`: Platform-level admin (opportunities, applications, users)

**`src/components/ui/`:**

- Purpose: Low-level UI primitives from shadcn/ui (new-york variant)
- Contains: `button.tsx`, `card.tsx`, `dialog.tsx`, `sheet.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `skeleton.tsx`, `spinner.tsx`, `tooltip.tsx`, `responsive-sheet.tsx`, and others
- Naming: PascalCase files matching component name

**`src/components/profile/`:**

- Purpose: All profile-related UI
- Contains:
  - `extraction/`: Resume field review cards and hooks
  - `upload/`: Document upload, LinkedIn import, text paste zone
  - `wizard/`: Profile completeness wizard progress and auto-save
  - `agent/`: AI agent chat interface (`AgentChat.tsx`, `AgentProfileBuilder.tsx`, `LiveProfileView.tsx`)
  - `enrichment/`: Enrichment conversation review
  - `privacy/`: Section visibility controls
  - `skills/`: Skill chip and skills input
  - `ProfileSectionCard.tsx`: Shared section wrapper

**`src/components/agent-sidebar/`:**

- Purpose: Global AI agent sidebar accessible from any page
- Key files:
  - `AgentSidebarProvider.tsx`: Context + state management
  - `AgentSidebar.tsx`: Sidebar shell (desktop side panel or mobile bottom sheet)
  - `AgentFAB.tsx`: Floating action button to open sidebar
  - `SidebarAwareWrapper.tsx`: Shifts main content when sidebar opens

**`src/lib/`:**

- Purpose: Pure helper functions with no React dependencies
- Key files:
  - `utils.ts`: `cn()` class merge utility
  - `platform.ts`: `isTauri()` and `getPlatform()` detection
  - `matchScoring.ts`: Client-side match sort/score utilities
  - `pendingInvite.ts`: localStorage helpers for invite tokens persisted through OAuth redirect
  - `pendingGuestApplication.ts`: localStorage helpers for guest application data

**`src/hooks/`:**

- Purpose: Shared React hooks
- Key files:
  - `use-media-query.ts`: `useIsMobile()`, `useMediaQuery()`
  - `use-haptic.ts`: Haptic feedback for Tauri native
  - `use-pull-to-refresh.ts`: Pull-to-refresh gesture detection
  - `use-dot-grid-style.ts`: Animated dot grid background style

**`convex/lib/`:**

- Purpose: Backend shared utilities consumed by queries, mutations, and actions
- Key files:
  - `auth.ts`: `getUserId`, `requireAuth`, `requirePlatformAdmin`, `requireAnyOrgAdmin`, `requireSpaceAdmin`
  - `models.ts`: LLM model constants (`MODEL_FAST`, `MODEL_QUALITY`, `MODEL_GEMINI_FAST`, `MODEL_CONVERSATION`)
  - `logging.ts`: Structured logging helper
  - `limits.ts`: Field length constants
  - `debouncer.ts`: Server-side debounce wrapper using `@ikhrustalev/convex-debouncer`
  - `llmUsage.ts`: LLM usage logging helpers

**`convex/matching/`:**

- Purpose: Profile-to-opportunity matching pipeline
- Contains: `compute.ts` (entry point, Tier 1 + 3), `coarse.ts` (Tier 2), `queries.ts`, `mutations.ts`, `prompts.ts`, `validation.ts`

**`convex/aggregation/`:**

- Purpose: Fetches and upserts opportunities from external sources
- Contains: `sync.ts` (orchestrator), `eightyK.ts` (80,000 Hours), `aisafety.ts`, `aisafetyEvents.ts`, `validation.ts`, `enrichment.ts`, `dedup.ts`

**`convex/emails/`:**

- Purpose: Email templates and scheduled batch sending
- Contains: `templates.tsx` (React Email components), `send.ts`, `batchActions.ts` (cron-driven batches), `autoEmail.ts`, `unsubscribe.ts`

**`convex/agent/`:**

- Purpose: In-app AI profile builder agent (Claude Sonnet 4.6 via `@convex-dev/agent`)
- Contains: `index.ts` (agent definition with 18 tools), `actions.ts` (streaming turn handlers), `tools.ts` (all profile-writing tools), `queries.ts`, `threadOps.ts`, `utils.ts`

**`convex/_generated/`:**

- Purpose: Auto-generated by Convex CLI — typed API, data model, server helpers
- Generated: Yes — run `bunx convex dev` to regenerate
- Committed: Yes (required for TypeScript to resolve imports)
- Do not edit manually

## Key File Locations

**Entry Points:**

- `src/routes/__root.tsx`: App root layout and global providers
- `src/routes/index.tsx`: Landing page and authenticated dashboard
- `convex/http.ts`: Convex HTTP endpoint router
- `convex/crons.ts`: All scheduled job definitions
- `agent/cli.ts`: CLI admin agent entry point

**Configuration:**

- `tsconfig.json`: TypeScript (strict, `~/` → `./src/`, ES2022 target)
- `vite.config.ts`: Vite + TanStack Start + Nitro (Vercel preset) + Sentry
- `components.json`: shadcn/ui (new-york style, Tailwind v4, path alias `~/components/ui`)
- `convex/convex.config.ts`: Convex component registrations
- `convex/auth.config.ts`: Clerk JWT issuer domain
- `convex/schema.ts`: Complete database schema (source of truth for all tables)

**Core Logic:**

- `convex/profiles.ts`: Profile CRUD, completeness, match staleness triggering
- `convex/matching/compute.ts`: 3-tier matching pipeline entry point
- `convex/agent/index.ts`: AI profile builder agent definition
- `convex/lib/auth.ts`: All auth helper functions
- `convex/lib/models.ts`: LLM model selection constants
- `src/lib/platform.ts`: Tauri vs web platform detection

**State and Real-time:**

- Convex `useQuery` hooks in routes and components subscribe to live data via WebSocket
- `src/components/agent-sidebar/AgentSidebarProvider.tsx`: Only custom React Context for UI state

## Naming Conventions

**Files:**

- Routes: `kebab-case.tsx` (e.g., `mobile-shell.tsx`, `auth-header.tsx`)
- Components: `PascalCase.tsx` (e.g., `MatchCard.tsx`, `AgentSidebar.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-media-query.ts`, `use-haptic.ts`)
- Utilities: `camelCase.ts` (e.g., `matchScoring.ts`, `formatDeadline.ts`)
- Convex modules: `camelCase.ts` (e.g., `profiles.ts`, `spaceBookings.ts`)

**Directories:**

- Feature domains: `kebab-case` in both `src/components/` and `convex/`
- Convex sub-modules: `camelCase` (e.g., `careerActions/`, `spaceBookings/`)

**Convex exports:**

- Public: exported directly (`export const getProfile = query(...)`)
- Internal: prefixed with `internal` import path, using `internalQuery`/`internalMutation`/`internalAction`

**Route params:**

- Dynamic segments: `$paramName` (e.g., `$slug`, `$id`, `$userId`, `$programId`)

## Where to Add New Code

**New Page/Route:**

- Create `src/routes/[path]/index.tsx` or `src/routes/[path]/route.tsx`
- Export `Route = createFileRoute('[path]')({ component: ... })`
- Use `Authenticated`/`Unauthenticated`/`AuthLoading` from `convex/react` for auth branching

**New Feature Component:**

- Create `src/components/[domain]/ComponentName.tsx`
- Add barrel `index.ts` if domain has multiple related exports

**New Convex Public Query or Mutation:**

- Add to the relevant domain file (e.g., `convex/profiles.ts`, `convex/opportunities.ts`)
- Or create `convex/[domain]/queries.ts` / `convex/[domain]/mutations.ts` for a new domain
- Must include `args:` and `returns:` validators
- Run `bunx convex dev` to regenerate `_generated/`

**New Internal LLM Action:**

- Add `"use node"` at top of file
- Use `internalAction` from `_generated/server`
- Call external APIs (Anthropic, Google GenAI) directly — never `ctx.db`
- Use `ctx.runQuery` / `ctx.runMutation` for all DB access

**New Cron Job:**

- Add to `convex/crons.ts` using `crons.interval(...)` or `crons.cron(...)`
- Only use `crons.interval` or `crons.cron` — not `crons.hourly`/`crons.daily`/`crons.weekly` (see convex/CLAUDE.md)

**New shadcn/ui Component:**

- Add to `src/components/ui/` following existing file naming
- Install via `bunx shadcn@latest add [component]`

**New Shared Utility:**

- Pure function with no React/Convex dependencies: `src/lib/[name].ts`
- React hook: `src/hooks/use-[name].ts`
- Backend helper: `convex/lib/[name].ts`

## Special Directories

**`convex/_generated/`:**

- Purpose: Typed API surface auto-generated from Convex schema and function exports
- Generated: Yes, by `bunx convex dev` or `bunx convex codegen`
- Committed: Yes — required for TypeScript in CI

**`dist/`:**

- Purpose: Production build output from `vite build`
- Generated: Yes
- Committed: No (gitignored)

**`.planning/`:**

- Purpose: GSD planning system — milestones, phases, codebase maps
- Generated: By GSD commands and manual editing
- Committed: Yes

**`_bmad/` and `_bmad-output/`:**

- Purpose: BMAD AI framework artifacts and brainstorming outputs
- Generated: Partially (brainstorming outputs by AI)
- Committed: Yes

**`agent/`:**

- Purpose: Standalone CLI admin agent separate from the in-app `convex/agent/`
- Contains own `package.json`, `tsconfig.json`, and `node_modules`
- Excluded from root `tsconfig.json` (separate compilation unit)

---

_Structure analysis: 2026-03-10_
