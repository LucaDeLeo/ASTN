# Phase 1 Context: Foundation + Opportunities

> Implementation decisions gathered through discussion. Downstream agents (researcher, planner, executor) should treat these as constraints, not suggestions.

## Opportunity Display

**Visual Tone**: Lyra aesthetic with coral accent
- Boxy/sharp edges, geometric precision
- Mono fonts for titles (technical, precise feel)
- Light theme default with coral/salmon accent color
- Card-based layout with subtle hover lift
- Tasteful motion: staggered reveals on load, smooth transitions

**Card Information Density**: Key details visible
- Title, organization, location, role type, salary range (if available)
- Not minimal (users need context to decide what to click)
- Not exhaustive (save full details for detail page)

**Organization Identity**: Logo prominent
- Organization logo as primary visual anchor on cards
- Sharp corners on logo container (Lyra style)
- Requires sourcing/storing logos via Quikturn API
- Builds brand recognition for AI safety orgs

**Detail View**: Full page navigation
- Clicking an opportunity navigates to dedicated page
- Complete information, apply button, related opportunities
- Not modal or slide-over — full reading experience
- Consistent Lyra aesthetic with sharp geometry

## Search & Filter UX

**Filter Layout**: Top bar (inline)
- Horizontal filter bar above results
- Compact, familiar pattern
- Not sidebar — preserve horizontal space for cards

**Filter Categories**: Balanced mix
- Role type (research, engineering, ops, etc.)
- Location / remote status
- Organization
- Deadline (as secondary filter)

**Filter Behavior**: URL-synced instant
- Results update immediately as filters change
- Filter state reflected in URL for sharing/bookmarking
- Shareable links like `/opportunities?role=research&remote=true`

**Search Role**: Secondary to filters
- Filters are primary discovery method
- Small search available for specific keyword needs
- Not a prominent search bar — users browse, not search

## Scraping Approach

**Freshness**: Daily sync
- Update from sources once per day
- Balance between freshness and simplicity
- Cron job or scheduled function

**Removal Handling**: Auto-archive
- When opportunity disappears from source, automatically archive
- Mark as closed/expired, remove from active listings
- No manual review required

**Duplicate Handling**: Merge automatically
- Detect duplicates by title + organization matching
- Show as single listing with multiple source links
- User sees one card, can click to see "Also listed on: ..."

**Attribution**: Subtle footer with hyperlink
- Small attribution at bottom of detail page
- "Source: 80K Hours" with hyperlink to original listing
- Honest provenance without dominating the UI

## Admin Experience

**Admin Users**: Single admin
- Just you managing the system
- No role management or multi-user access control needed
- Simple auth check: is this user the admin?

**Entry Method**: Simple form
- Single page form with all opportunity fields
- Straightforward for occasional manual additions
- No wizard or multi-step flow needed

**Admin Location**: Separate /admin section
- Dedicated admin area at `/admin`
- Clear separation from public browsing experience
- Admin-only navigation and pages

**Admin Scope**: CRUD + basic stats
- List, add, edit, delete opportunities
- Basic analytics: total opportunities, view counts, source breakdown
- Scraper status visibility (last sync, errors) implied for debugging

## Deferred Ideas

None captured during this discussion.

---
*Context gathered: 2026-01-17*
*Updated: 2026-01-17 — Lyra style, coral accent, tasteful motion*
*Phase: 1 - Foundation + Opportunities*
