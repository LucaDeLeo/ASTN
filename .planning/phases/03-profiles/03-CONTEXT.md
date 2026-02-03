# Phase 3: Profiles - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create and manage rich profiles capturing their background, skills, and goals. Includes form-based data entry with multi-step wizard, AI safety skills selection, LLM-powered enrichment conversation, privacy controls, and completeness tracking with feature unlocks.

</domain>

<decisions>
## Implementation Decisions

### Form flow & structure

- Multi-step wizard (not single page or cards)
- Claude determines optimal step grouping based on field relationships
- Auto-save on blur — each field saves when user leaves it
- Linear progression with "Skip for now" option on each step
- Users can skip steps and return later to complete them

### Skills selection experience

- Freeform input with taxonomy suggestions — type freely, system suggests matches from AI safety taxonomy
- Tag-based chips UI — skills appear as removable chips (like GitHub topics)
- Soft limit with guidance — suggest "pick your top 10" but allow more if needed

### LLM enrichment conversation

- Integrated as a wizard step (not separate or post-completion)
- Career coach tone — friendly, exploratory ("Tell me about what draws you to AI safety...")
- Auto-extract and fill — LLM extracts info and updates profile fields automatically
- Required for full profile completeness — must have at least one exchange for 100%
- Adaptive length — LLM decides when it has enough info (could be 3 or 12 exchanges)
- Show summary at end — "Here's what I learned about you" review before saving
- Full control over extractions — user can accept/reject/edit each extraction
- Continuable anytime — "Continue enrichment" button on profile, context preserved

### Completeness & privacy

- Checklist of sections (not progress bar or ring) — shows which sections done vs remaining
- Display during wizard — see progress update as you complete steps
- Dedicated privacy step in wizard — focused attention on privacy settings
- Section-level granularity — hide specific sections from specific orgs
- Org selection: search + browse hybrid — search bar with autocomplete plus expandable org list
- Prompt user to choose default visibility during wizard
- LinkedIn-style visibility controls — dropdowns per section

### Claude's Discretion

- Optimal wizard step grouping and field organization
- Skill proficiency levels (whether to include and how)
- Unlock tier structure for completeness thresholds
- Loading states and error handling
- Exact timing for auto-save debounce

</decisions>

<specifics>
## Specific Ideas

- LinkedIn-style visibility dropdowns for privacy controls
- Tag-based chips like GitHub topics for skills
- Career coach conversation tone — exploratory, not interrogative
- Summary review screen after LLM conversation showing extractions with accept/reject/edit controls

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-profiles_
_Context gathered: 2026-01-17_
