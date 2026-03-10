# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**

- TypeScript 5.9 - All frontend (`src/`) and backend (`convex/`) code
- TSX - React components throughout `src/components/` and `src/routes/`

**Secondary:**

- JavaScript (ESM) - `instrument.server.mjs` (Sentry server init), `public/script*.js`

## Runtime

**Environment:**

- Node.js (server-side rendering via TanStack Start + Nitro)
- Convex runtime (serverless functions; Node.js sandbox available via `"use node"` directive)

**Package Manager:**

- Bun (runtime + package manager)
- Lockfile: `bun.lock` present

## Frameworks

**Core:**

- TanStack Start 1.132 - Full-stack React framework with SSR, file-based routing
- TanStack Router 1.132 - Type-safe client-side routing in `src/routes/`
- TanStack Query 5.89 - Server state management, integrated with Convex via `@convex-dev/react-query`
- React 19.2 - UI framework with React Compiler enabled via `babel-plugin-react-compiler`
- Convex 1.32 - Backend database, real-time sync, serverless functions in `convex/`

**UI / Styling:**

- Tailwind CSS v4 - Utility CSS, configured via `@tailwindcss/vite` plugin
- shadcn/ui (new-york style) - Component library config in `components.json`
- Radix UI 1.4 - Headless primitives underlying shadcn components
- Lucide React 0.562 - Icon set
- Sonner 2.0 - Toast notifications
- `tw-animate-css` - Animation utilities

**Build / Dev:**

- Vite 7.1 - Dev server and bundler, config at `vite.config.ts`
- Nitro 3.0-alpha - Server preset: `vercel` (configured in `vite.config.ts`)
- `vite-tsconfig-paths` - Path alias resolution (`~/` → `src/`)
- concurrently 9.2 - Runs Convex + Vite dev servers in parallel

**Native (Tauri):**

- Tauri 2.10 - Desktop and mobile app wrapper
- Multiple Tauri plugins: `deep-link`, `http`, `notification`, `opener`, `os`, `store`
- Separate build config: `vite.config.tauri.ts` (not read; exists per scripts)

**Testing:**

- No test framework detected

## Key Dependencies

**LLM / AI:**

- `@anthropic-ai/sdk` 0.71 - Direct Anthropic API usage (enrichment pipeline in `convex/aggregation/enrichment.ts`)
- `@ai-sdk/anthropic` 3.0 + `ai` 6.0 - Vercel AI SDK (agent features)
- `@google/genai` 1.42 - Google Gemini API (matching pipeline in `convex/matching/compute.ts`)
- `@convex-dev/agent` 0.6-alpha - Convex agent framework (chat-driven profile builder)

**Convex Components:**

- `@convex-dev/persistent-text-streaming` 0.3 - LLM streaming responses via HTTP actions
- `@convex-dev/rate-limiter` 0.3 - Rate limiting for public Convex endpoints
- `@convex-dev/resend` 0.2 - Email sending component (wraps Resend)
- `@ikhrustalev/convex-debouncer` 0.1 - Server-side debouncing

**Data / Utilities:**

- Zod 3.25 - Runtime schema validation (used extensively in Convex function validators)
- `date-fns` 4.1 + `date-fns-tz` 3.2 - Date manipulation and timezone-aware operations
- `algoliasearch` 5.46 - Client for 80,000 Hours job board scraping
- `dompurify` 3.3 - HTML sanitization
- `marked` 17.0 - Markdown rendering
- `leaflet` 1.9 - Map rendering
- `exa-js` 2.4 - Exa web search API client
- `react-email` components - Transactional email templates in `convex/emails/templates.tsx`
- `@posthog/react` 1.8 + `posthog-node` 5.26 - Analytics
- `@sentry/tanstackstart-react` 10.42 - Error monitoring

**Infrastructure:**

- `resend` 6.7 - Transactional email (also used directly alongside `@convex-dev/resend`)
- `cmdk` 1.1 - Command menu
- `react-resizable-panels` 4 - Resizable panel layouts
- `react-dropzone` 14.3 - File upload
- `class-variance-authority` + `clsx` + `tailwind-merge` - Conditional class utilities

## Configuration

**Environment:**

- Client-side vars use `VITE_` prefix (exposed to browser bundle)
- Server-side vars set in Convex dashboard (never in `.env.local`)
- Key client vars: `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_PUBLIC_POSTHOG_KEY`
- `.env.example` documents all required variables; copy to `.env.local` for local dev

**Build:**

- `tsconfig.json` - Strict TypeScript, `bundler` module resolution, path alias `~/*` → `src/*`
- `vite.config.ts` - Main build config; Nitro preset `vercel`; PostHog + Sentry proxy rewrites
- `vercel.json` - Deployment headers (CSP, HSTS, etc.) and reverse proxy rewrites for PostHog/Sentry
- `eslint.config.mjs` - ESLint config
- `components.json` - shadcn/ui component generator config (new-york style, Tailwind v4)

**Git Hooks:**

- Husky + lint-staged: ESLint + Prettier on `*.ts`/`*.tsx`; Prettier only on `*.json`/`*.md`/`*.css`

## Platform Requirements

**Development:**

- Bun runtime required (scripts use `bunx`)
- Convex CLI (`bunx convex dev`) for backend development
- `bun run dev` starts both Convex and Vite concurrently

**Production:**

- Deployed to Vercel (Nitro `vercel` preset, `vercel.json` present)
- Convex cloud backend (separate deployment at `*.convex.cloud`)
- Domain: `safetytalent.org`

---

_Stack analysis: 2026-03-10_
