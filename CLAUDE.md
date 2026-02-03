# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Safety Talent Network (ASTN) - A career command center for AI safety talent. Users maintain profiles and get matched to opportunities with acceptance probability estimates. Initial pilot targets BAISH (Buenos Aires AI Safety Hub) with 50-100 profiles.

## Development Commands

```bash
# Start dev (runs Convex + Vite concurrently)
bun run dev

# Run only the web frontend
bun run dev:web

# Run only Convex backend
bun run dev:convex

# Type check and lint
bun run lint

# Format code
bun run format

# Build for production
bun run build
```

## Architecture

### Frontend Stack

- **TanStack Start** with file-based routing in `src/routes/`
- **TanStack Router + Query** integrated with Convex for data fetching
- **React 19** with React Compiler enabled (via babel-plugin-react-compiler)
- **shadcn/ui** (new-york style) with Tailwind v4
- Path alias: `~/` maps to `src/`

### Backend Stack

- **Convex** for database, real-time sync, and serverless functions
- **@convex-dev/auth** for authentication (GitHub, Google, Password providers)
- **Claude API** for LLM features (Sonnet 4.5 for quality, Haiku 4.5 for speed)

### Convex Structure

```
convex/
├── schema.ts          # Database schema (profiles, opportunities, matches, etc.)
├── auth.ts            # Auth configuration with password validation
├── profiles.ts        # Profile CRUD and completeness tracking
├── opportunities.ts   # Opportunity queries
├── crons.ts           # Daily opportunity sync at 6 AM UTC
├── aggregation/       # Fetches opportunities from 80K Hours + aisafety.com
├── enrichment/        # LLM-powered profile enrichment conversations
└── matching/          # Profile-to-opportunity matching logic
```

### Key Patterns

**Convex Actions with Node.js**: Files using external APIs (like Claude) require `"use node"` at the top.

**Internal vs Public Functions**: Use `internal` from `_generated/api` for functions that should only be called by other Convex functions, not the client.

**Profile Completeness**: Defined in `convex/profiles.ts` - tracks 7 sections (basicInfo, education, workHistory, careerGoals, skills, enrichment, privacy).

**Match Tiers**: Uses "great", "good", "exploring" labels (not percentages) per project requirements.

**No Vector Search**: Context for LLM calls is programmatically constructed, not using embeddings.

### Route Structure

- `/` - Home/landing
- `/login` - Authentication
- `/profile/*` - Profile management (protected)
- `/opportunities/*` - Browse opportunities (protected)
- `/matches` - View matched opportunities by tier (protected)
- `/matches/$id` - Match detail with explanation and recommendations (protected)
- `/admin/*` - Admin dashboard for org management

## Environment Variables

Required in `.env.local`:

- `VITE_CONVEX_URL` - Convex deployment URL
- `ANTHROPIC_API_KEY` - Set in Convex dashboard for LLM features
