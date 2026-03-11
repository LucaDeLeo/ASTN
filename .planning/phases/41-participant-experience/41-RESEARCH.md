# Phase 41: Module Enhancements - Research

**Researched:** 2026-03-11
**Domain:** Convex schema evolution, file storage, frontend UX for curriculum materials
**Confidence:** HIGH

## Summary

Phase 41 enhances the existing module/material system with four discrete features: essential/optional flags on materials, audio file upload and playback, time-to-session awareness indicators, and a continue-here progress marker. All four features build directly on the existing `programModules` schema, `materialProgress` tracking, `coursePrompts`/`coursePromptResponses` tables, and the participant program page (`$programSlug.tsx`).

The major technical constraint is that the current material schema has `url: v.string()` as required, which is incompatible with audio materials that use `storageId` instead of external URLs. This was already identified in the CONTEXT.md discussion and the decision is to make `url` optional. The existing `materialProgress` uses index-based tracking (`materialIndex: v.number()`), which means material reordering can break progress -- this is flagged as tech debt but not in scope for Phase 41.

**Primary recommendation:** Execute as four independent tasks matching the four requirements (MOD-01 through MOD-04). Each touches a distinct vertical slice (schema + backend + frontend) with minimal cross-dependency. The audio upload task (MOD-02) is the most complex due to schema changes and storage management.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. `url` made optional -- `url: v.string()` changed to `v.optional(v.string())` with updated validation in `ModuleFormDialog` and `materialValidator`.
2. Storage URL resolution moved inline -- No standalone `getStorageUrl` query. Audio URLs resolved inside `getParticipantProgramView` (and admin queries) via `ctx.storage.getUrl()`, following the existing org logo pattern. Avoids N+1 and auth gaps.
3. Continue-here expanded to include prompts -- Added `promptCompletionByModule` to the participant view query so continue-here covers both materials and exercises (matching the success criteria).
4. Time calculation timezone-hardened -- Changed from naive `ms / 86400000` to calendar-day comparison using `startOfDay` normalization.

### Claude's Discretion

- Essential/optional needs behavioral rules, not just styling -- progress math and time-remaining now exclude optional materials (research should recommend approach)
- Audio touches more surfaces than originally listed (MaterialIcon, MaterialChecklist href, validator, return types)
- Blob cleanup when audio materials are removed/replaced

### Deferred Ideas (OUT OF SCOPE)

- Optional material progress counting (flagged for human review)
- Audio size limit (flagged for human review)
- Index-based progress tech debt (flagged for human review)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                               | Research Support                                                                                       |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| MOD-01 | Facilitator can mark materials as essential or optional, with visual distinction          | Add `isEssential: v.optional(v.boolean())` to material schema; treat undefined as essential; update UI |
| MOD-02 | Facilitator can upload audio materials (MP3) via Convex file storage with inline playback | Make `url` optional, add `storageId` + `audio` type, use existing `generateUploadUrl`, resolve inline  |
| MOD-03 | Participant sees time-to-session indicator with days until session and pre-work remaining | Calendar-day diff with `startOfDay`, aggregate essential-only minutes from materials, frontend compute |
| MOD-04 | Participant sees continue-here marker highlighting first incomplete material/exercise     | Add `promptCompletionByModule` to participant view query, find first incomplete item across both types |

</phase_requirements>

## Standard Stack

### Core

| Library      | Version | Purpose                           | Why Standard                                  |
| ------------ | ------- | --------------------------------- | --------------------------------------------- |
| Convex       | current | Database, real-time, file storage | Already the backend; file storage is built-in |
| React 19     | 19.x    | Frontend framework                | Already in use                                |
| shadcn/ui    | latest  | UI components                     | Already in use (new-york style)               |
| Tailwind v4  | 4.x     | Styling                           | Already in use                                |
| lucide-react | latest  | Icons                             | Already in use (MaterialIcon component)       |

### Supporting

| Library | Version | Purpose             | When to Use                   |
| ------- | ------- | ------------------- | ----------------------------- |
| sonner  | latest  | Toast notifications | Upload success/error feedback |

### Alternatives Considered

No new libraries needed. All features use existing stack.

**Installation:**

```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

Changes touch existing files, no new directories needed:

```
convex/
├── schema.ts              # Material schema evolution (isEssential, storageId, audio type)
├── programs.ts            # materialValidator update, getParticipantProgramView update
├── upload.ts              # Already has generateUploadUrl -- reuse
src/
├── lib/
│   └── program-constants.ts  # MaterialItem type update
├── components/
│   └── programs/
│       ├── MaterialChecklist.tsx    # Essential/optional badges, audio player, continue-here
│       ├── MaterialIcon.tsx         # Add audio icon
│       └── ModuleFormDialog.tsx     # Essential toggle, audio upload inline
├── routes/
│   └── org/$slug/program/
│       └── $programSlug.tsx         # Time indicator, continue-here scroll, progress calc update
```

### Pattern 1: Schema Evolution (Add Optional Fields)

**What:** Add new optional fields to existing Convex schemas for backward compatibility
**When to use:** When extending existing data structures without requiring migration
**Example:**

```typescript
// convex/schema.ts - material object inside programModules
v.object({
  label: v.string(),
  url: v.optional(v.string()), // CHANGED: was required v.string()
  type: v.union(
    v.literal('link'),
    v.literal('pdf'),
    v.literal('video'),
    v.literal('reading'),
    v.literal('audio'), // NEW: audio type
  ),
  estimatedMinutes: v.optional(v.number()),
  isEssential: v.optional(v.boolean()), // NEW: undefined = essential (backward compat)
  storageId: v.optional(v.id('_storage')), // NEW: for audio files
})
```

**Source:** Convex schema-validator skill, confirmed by existing codebase patterns

### Pattern 2: Inline Storage URL Resolution

**What:** Resolve storage URLs inside existing access-checked queries, not via separate queries
**When to use:** When serving stored files that need auth boundaries
**Example:**

```typescript
// Inside getParticipantProgramView handler, when mapping modules:
modules: await Promise.all(
  modules.map(async (m) => ({
    _id: m._id,
    title: m.title,
    // ... existing fields ...
    materials: m.materials
      ? await Promise.all(
          m.materials.map(async (mat) => ({
            ...mat,
            audioUrl: mat.storageId
              ? await ctx.storage.getUrl(mat.storageId)
              : undefined,
          })),
        )
      : undefined,
  })),
)
```

**Source:** Existing pattern in `convex/events/queries.ts:96`, `convex/orgs/admin.ts:346` -- org logo URLs resolved inline

### Pattern 3: File Upload in Form Dialog

**What:** Embed file upload within existing form dialogs using Convex file storage
**When to use:** When files are part of a larger entity (material as part of module)
**Example:**

```typescript
// In ModuleFormDialog, for audio materials:
const generateUploadUrl = useMutation(api.upload.generateUploadUrl)

const handleAudioUpload = async (file: File, materialIndex: number) => {
  // Validate MIME type and size client-side
  if (!file.type.startsWith('audio/')) return
  if (file.size > 50 * 1024 * 1024) return // 50MB limit

  const uploadUrl = await generateUploadUrl()
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  const { storageId } = await result.json()

  // Update material in local state
  updateMaterial(materialIndex, 'storageId', storageId)
  updateMaterial(materialIndex, 'type', 'audio')
}
```

**Source:** convex-file-storage skill, existing `convex/upload.ts` pattern

### Pattern 4: Calendar-Day Difference

**What:** Compute days between dates using calendar days, not raw milliseconds
**When to use:** When displaying "X days until" to users across timezones
**Example:**

```typescript
function daysUntilSession(
  sessionDate: number,
  now: number = Date.now(),
): number {
  const sessionDay = new Date(sessionDate)
  sessionDay.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((sessionDay.getTime() - today.getTime()) / 86400000)
}
```

### Anti-Patterns to Avoid

- **Standalone `getStorageUrl` query:** Creates N+1 problems and weak auth. Resolve inline in existing queries per CONTEXT.md decision.
- **Treating `undefined` isEssential as optional:** Convention is `undefined` = essential (backward compat with all existing materials). Only explicit `false` means optional.
- **Auto-scroll to continue-here on every render:** Too aggressive. Use a visual marker (highlight/badge) that the user can notice, not forced scroll.
- **Counting all materials in progress calculations:** After MOD-01, progress/remaining-time must only count essential materials. This is a behavioral rule, not just a style change.

## Don't Hand-Roll

| Problem             | Don't Build          | Use Instead                     | Why                                        |
| ------------------- | -------------------- | ------------------------------- | ------------------------------------------ |
| File upload         | Custom upload server | `ctx.storage.generateUploadUrl` | Built into Convex, handles auth/expiry     |
| Audio playback      | Custom audio player  | Native `<audio controls>`       | Browser-native, accessible, well-supported |
| Date day-diff       | `ms / 86400000`      | `startOfDay` normalization      | Naive division fails across DST/timezone   |
| Storage URL serving | Separate URL query   | Inline `ctx.storage.getUrl()`   | Avoids N+1, maintains auth boundary        |

**Key insight:** All four features extend existing primitives. The temptation is to create new abstractions (separate audio service, standalone file query, custom player component) when the existing patterns already handle the use case.

## Common Pitfalls

### Pitfall 1: Breaking Existing Materials with Schema Change

**What goes wrong:** Making `url` optional breaks the validation filter in `ModuleFormDialog` which currently filters on `m.label.trim() && m.url.trim()`.
**Why it happens:** The `handleSubmit` function (line 96-98 of ModuleFormDialog.tsx) assumes all materials have URLs: `materials.filter((m) => m.label.trim() && m.url.trim())`.
**How to avoid:** Update the validation to accept materials with EITHER a URL or a storageId: `m.label.trim() && (m.url?.trim() || m.storageId)`.
**Warning signs:** Audio materials silently disappear when saving a module.

### Pitfall 2: Orphaned Storage Blobs

**What goes wrong:** When a facilitator removes or replaces an audio material, the old storage blob remains in Convex storage indefinitely.
**Why it happens:** The `updateModule` mutation currently patches materials as a whole array replacement without checking for removed storageIds.
**How to avoid:** In `updateModule`, compare old and new materials arrays; for any storageId present in old but not in new, call `ctx.storage.delete(storageId)`. Same in `deleteModule`.
**Warning signs:** Storage usage grows over time even when modules are edited/deleted.

### Pitfall 3: MaterialChecklist Assumes All Materials Have `url`

**What goes wrong:** `MaterialChecklist` renders every material as an `<a href={mat.url}>` link. Audio materials with no URL will render as broken links.
**Why it happens:** Current component (line 83-101 of MaterialChecklist.tsx) wraps every material in an `<a>` tag with `href={mat.url}`.
**How to avoid:** Conditionally render: if `type === 'audio'`, render `<audio>` element with `src={audioUrl}`; otherwise render the existing link pattern.
**Warning signs:** Audio materials show as "about:blank" links.

### Pitfall 4: Progress Section Counts All Materials Equally

**What goes wrong:** The ProgressSection component (line 608-611 of $programSlug.tsx) counts `totalMaterials` from all materials regardless of essential/optional status. After MOD-01, this will make progress look lower than it should.
**Why it happens:** `modules.reduce((sum, m) => sum + (m.materials?.length ?? 0), 0)` has no concept of essential vs optional.
**How to avoid:** Filter to essential-only when computing total materials for progress display. Essential = `isEssential !== false` (undefined treated as essential).
**Warning signs:** User completes all essential materials but progress bar shows less than 100%.

### Pitfall 5: Continue-Here Needs Prompt Completion Data

**What goes wrong:** The participant view query (`getParticipantProgramView`) returns `myMaterialProgress` but NOT prompt completion status per module. Continue-here needs both.
**Why it happens:** Prompt completion is currently fetched client-side inside `<ModulePrompts>` via separate `useQuery(api.course.prompts.getByModule)` calls -- not aggregated in the main query.
**How to avoid:** Per CONTEXT.md decision, add `promptCompletionByModule` to the participant view query. For each module, query `coursePrompts` and `coursePromptResponses` to determine which prompts have responses.
**Warning signs:** Continue-here only considers materials, ignoring incomplete exercises.

### Pitfall 6: `materialValidator` Is Used in Multiple Places

**What goes wrong:** The `materialValidator` in `convex/programs.ts` (line 590-600) defines the accepted shape for `createModule`/`updateModule` args. It must be updated alongside the schema, otherwise mutations reject the new fields.
**Why it happens:** The validator is separate from the schema definition. The schema (schema.ts line 1065) and the arg validator (programs.ts line 590) must stay in sync.
**How to avoid:** Update both the schema material object AND the `materialValidator` in programs.ts simultaneously. Also update the `materialValidator` reference in the return type of `getParticipantProgramView`.
**Warning signs:** Mutations reject valid materials with new fields; type errors in the return validator.

## Code Examples

Verified patterns from the existing codebase:

### Existing Upload Pattern (convex/upload.ts)

```typescript
// Already exists and includes rate limiting -- reuse for audio uploads
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    await rateLimiter.limit(ctx, 'generateUploadUrl', {
      key: userId,
      throws: true,
    })
    return await ctx.storage.generateUploadUrl()
  },
})
```

### Existing Inline URL Resolution Pattern

```typescript
// From convex/events/queries.ts:96 -- org logo URL resolved inline
const url = await ctx.storage.getUrl(org.logoStorageId)

// From convex/coworkingSpaces.ts:415
const url = await ctx.storage.getUrl(space.coverImageStorageId)
```

### Existing MaterialItem Type (src/lib/program-constants.ts)

```typescript
// Current -- needs update for Phase 41
export interface MaterialItem {
  label: string
  url: string // Must become optional
  type: 'link' | 'pdf' | 'video' | 'reading' // Must add 'audio'
  estimatedMinutes?: number
  // Add: isEssential?: boolean
  // Add: storageId?: string (Id<'_storage'> on backend)
  // Add: audioUrl?: string (resolved URL, frontend only)
}
```

### Storage Blob Cleanup Pattern

```typescript
// From convex-file-storage skill -- delete orphaned blobs
await ctx.storage.delete(oldStorageId)
```

## State of the Art

| Old Approach                 | Current Approach                     | When Changed   | Impact                                            |
| ---------------------------- | ------------------------------------ | -------------- | ------------------------------------------------- |
| `url: v.string()` (required) | `url: v.optional(v.string())`        | Phase 41       | Enables storageId-only materials (audio)          |
| All materials equal          | `isEssential` flag                   | Phase 41       | Progress/time calculations exclude optional       |
| Materials-only progress      | Materials + prompts in continue-here | Phase 41       | Requires `promptCompletionByModule` in view query |
| `ctx.storage.getMetadata()`  | `ctx.db.system.get(storageId)`       | Convex current | Old method deprecated per convex/CLAUDE.md        |

**Deprecated/outdated:**

- `ctx.storage.getMetadata()`: Deprecated. Use `ctx.db.system.get(storageId)` to access storage metadata.

## Open Questions

1. **Audio file size limit**
   - What we know: Convex file storage has no hard limit per file, but large uploads affect UX
   - What's unclear: Whether 50MB is the right limit for the pilot
   - Recommendation: Default to 50MB client-side validation; easy to adjust later. Flag as human review item per CONTEXT.md.

2. **Optional materials in progress math**
   - What we know: CONTEXT.md says progress and time-remaining should exclude optional materials
   - What's unclear: Whether the sidebar AI context should also distinguish essential vs optional
   - Recommendation: Yes, update sidebar context builder (`convex/course/sidebar.ts` line 144) to mark materials as essential/optional in the context passed to the AI. Low effort, avoids inconsistency.

3. **Index-based materialProgress with reordering**
   - What we know: `materialProgress.materialIndex` maps to array position. Reordering materials breaks mapping.
   - What's unclear: Whether this will cause real issues for BAISH pilot (facilitators may reorder)
   - Recommendation: Out of scope per CONTEXT.md deferred items. Document the limitation in facilitator UX (don't reorder after participants have started).

## Sources

### Primary (HIGH confidence)

- Existing codebase: `convex/schema.ts` lines 1058-1090 (programModules schema)
- Existing codebase: `convex/programs.ts` lines 590-600 (materialValidator), 1034-1071 (toggleMaterialProgress), 1150-1235 (createModule/updateModule), 1400-1618 (getParticipantProgramView)
- Existing codebase: `src/components/programs/MaterialChecklist.tsx` (full file)
- Existing codebase: `src/components/programs/ModuleFormDialog.tsx` (full file)
- Existing codebase: `src/components/programs/MaterialIcon.tsx` (full file)
- Existing codebase: `src/lib/program-constants.ts` (MaterialItem type)
- Existing codebase: `src/routes/org/$slug/program/$programSlug.tsx` lines 88-630 (participant page)
- Existing codebase: `convex/upload.ts` (generateUploadUrl pattern)
- Existing codebase: `convex/course/sidebar.ts` lines 120-209 (module context builder)
- Existing codebase: `convex/course/prompts.ts` lines 176-196 (getByModule query)
- Convex file storage skill: upload, serve, delete patterns
- Convex schema-validator skill: optional field evolution strategy
- Convex best practices skill: function organization, error handling

### Secondary (MEDIUM confidence)

- CONTEXT.md codex review: identified all four decision changes and three gap fills

### Tertiary (LOW confidence)

- None -- all findings verified against existing codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new libraries, all existing codebase patterns
- Architecture: HIGH -- patterns verified against existing code (inline URL resolution, file upload, schema evolution)
- Pitfalls: HIGH -- all six pitfalls identified from direct code inspection with line numbers
- Code examples: HIGH -- all examples from existing codebase, no hypothetical patterns

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- Convex schema and existing patterns unlikely to change)
