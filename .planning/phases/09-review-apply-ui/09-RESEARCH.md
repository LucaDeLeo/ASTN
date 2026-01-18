# Phase 9: Review & Apply UI - Research

**Researched:** 2026-01-18
**Domain:** React UI components, Convex data mapping, existing ASTN patterns
**Confidence:** HIGH

## Summary

This phase builds on well-established ASTN patterns. The existing `ExtractionReview` component from enrichment chat provides the exact UI pattern to follow: card-based rows with accept/reject/edit icons, field counter footer, and "Apply to Profile" action. The extraction schema from Phase 8 aligns closely with the profile schema, requiring only date format conversion for work history.

The technical challenge is minimal - the core patterns already exist. The work is primarily assembly: reusing `ExtractionReview` patterns for resume data, adding expandable cards for multi-entry fields (education, work history), and wiring up the existing `profiles.updateField` mutation.

**Primary recommendation:** Clone the `ExtractionReview` component pattern, extend it for resume extraction fields (education array, work history array), add expandable card UI for multi-entry items, and reuse `SkillsInput` component for skill editing.

## Standard Stack

The established libraries/tools for this domain:

### Core (All Already in ASTN)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in use |
| shadcn/ui | new-york | Component primitives | Already configured |
| Tailwind v4 | - | Styling | Already configured |
| lucide-react | - | Icons (Check, X, Pencil, ChevronDown) | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn (from ~/lib/utils) | - | Conditional class names | Styling states |
| Convex React | ^1.31.0 | Data mutations | Profile updates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clone ExtractionReview | Modify original | Original is specific to enrichment fields; separate component cleaner |
| Build custom accordion | Radix Accordion | Radix adds complexity; simple CSS disclosure sufficient |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/profile/
├── extraction/              # New module for extraction review
│   ├── ExtractionReviewCard.tsx    # Single field card (reusable)
│   ├── ExpandableEntryCard.tsx     # For education/work arrays
│   ├── ResumeExtractionReview.tsx  # Main review container
│   ├── hooks/
│   │   └── useExtractionReview.ts  # State management for review
│   └── index.ts
├── upload/                   # Existing - integrate with
├── wizard/                   # Existing - profile forms
└── skills/                   # Existing - reuse SkillsInput
```

### Pattern 1: ExtractionReview Card Pattern (Existing)
**What:** Card-based row with field label, value display, and action icons (accept/reject/edit)
**When to use:** All extracted fields
**Example:** (from `src/components/profile/enrichment/ExtractionReview.tsx`)
```typescript
<Card className={cn(
  "p-4 transition-all duration-200",
  status === "accepted" && "border-green-300 bg-green-50/50",
  status === "rejected" && "border-slate-200 bg-slate-50 opacity-60"
)}>
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-slate-900">{label}</h4>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => onAccept()}>
        <Check className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onReject()}>
        <X className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit()}>
        <Pencil className="size-4" />
      </Button>
    </div>
  </div>
</Card>
```

### Pattern 2: Field Counter Footer (Existing)
**What:** "X of Y fields will be applied" counter with Apply button
**When to use:** Bottom of review UI
**Example:** (from `ExtractionReview.tsx`)
```typescript
<div className="flex items-center justify-between pt-4 border-t">
  <p className="text-sm text-slate-500">
    {acceptedCount} of {totalFields} fields will be applied
  </p>
  <Button onClick={onApply} disabled={!hasAcceptedFields || isApplying}>
    Apply to Profile
  </Button>
</div>
```

### Pattern 3: Expandable Card for Multi-Entry Fields
**What:** Collapsed summary with expand/collapse toggle
**When to use:** Education array, Work History array
**Example pattern:**
```typescript
<Card className="p-4">
  <button
    onClick={() => setExpanded(!expanded)}
    className="flex items-center justify-between w-full"
  >
    <div>
      <h4 className="font-medium">{entry.title} at {entry.organization}</h4>
      <p className="text-sm text-slate-500">{dateRange}</p>
    </div>
    <ChevronDown className={cn(
      "size-4 transition-transform",
      expanded && "rotate-180"
    )} />
  </button>
  {expanded && (
    <div className="mt-4 pt-4 border-t space-y-3">
      {/* Full entry details with inline edit */}
    </div>
  )}
</Card>
```

### Pattern 4: Auto-Save on Blur (Existing)
**What:** Save changes immediately when field loses focus
**When to use:** Inline editing mode
**Example:** (from `WorkHistoryStep.tsx`)
```typescript
<Input
  value={value}
  onChange={(e) => setLocalValue(e.target.value)}
  onBlur={() => onUpdateValue(field, localValue)}
/>
```

### Anti-Patterns to Avoid
- **Don't create separate Accept All button:** Context specifies individual field control only
- **Don't show percentages:** Context specifies field counter (e.g., "8 of 12 fields"), not percentages
- **Don't add undo functionality:** Context says no undo after applying

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill selection UI | Custom multi-select | `SkillsInput` from `~/components/profile/skills/` | Already handles taxonomy, search, chip display |
| Card component | Custom div styling | `Card` from shadcn/ui | Consistent with app styling |
| Button icon variants | Custom button styles | `Button variant="ghost" size="icon-sm"` | Already configured in shadcn |
| Status badges | Custom spans | `Badge` from shadcn/ui | Consistent styling |
| Date format conversion | Manual string parsing | Existing helpers in `WorkHistoryStep.tsx` | `parseDateInput`, `formatDateForInput` |
| Profile updates | Custom API calls | `profiles.updateField` mutation | Already handles auth, validation |

**Key insight:** All UI primitives and profile update logic already exist. The work is composition, not creation.

## Common Pitfalls

### Pitfall 1: Date Format Mismatch
**What goes wrong:** Work history dates fail to save or display incorrectly
**Why it happens:** Extraction returns `startDate: "2022-01"` (string), profile schema expects `startDate: number` (Unix timestamp)
**How to avoid:** Convert dates before applying:
```typescript
// Extraction format: "2022-01" or "present"
// Profile format: Unix timestamp (number)
const parseDateString = (dateStr?: string): number | undefined => {
  if (!dateStr || dateStr === "present") return undefined;
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, 1).getTime();
};
```
**Warning signs:** Work history entries missing dates in profile after applying

### Pitfall 2: Not Handling Missing Profile
**What goes wrong:** Applying extraction crashes when user has no profile yet
**Why it happens:** Profile might be null if user went straight to upload without visiting profile edit
**How to avoid:** Create profile before applying if it doesn't exist:
```typescript
const profile = useQuery(api.profiles.getOrCreateProfile);
const createProfile = useMutation(api.profiles.create);

const handleApply = async () => {
  let profileId = profile?._id;
  if (!profileId) {
    profileId = await createProfile();
  }
  await applyExtraction(profileId, selectedFields);
};
```
**Warning signs:** "Profile not found" errors on apply

### Pitfall 3: Overwriting vs Merging Arrays
**What goes wrong:** Existing education/work/skills get replaced instead of merged
**Why it happens:** Using simple assignment instead of merge strategy
**How to avoid:** Implement merge strategy per CONTEXT.md (Claude's discretion item):
```typescript
// Recommendation: Replace for initial empty arrays, prompt for non-empty
const mergeArrays = (existing: Array<T> | undefined, extracted: Array<T>) => {
  if (!existing || existing.length === 0) return extracted;
  // For non-empty: could prompt user or append with dedup
  return [...existing, ...extracted.filter(e => !isDuplicate(e, existing))];
};
```
**Warning signs:** User loses existing profile data after applying extraction

### Pitfall 4: State Sync After Apply
**What goes wrong:** UI still shows review screen after successful apply
**Why it happens:** Not resetting extraction state and navigating to next step
**How to avoid:** Clear state and redirect after apply:
```typescript
const handleApply = async () => {
  await applyExtraction(/*...*/);
  resetExtractionState();
  navigate({ to: "/profile/edit", search: { step: "enrichment" } });
};
```
**Warning signs:** User confused about what happened after clicking Apply

### Pitfall 5: Not Showing Placeholders for Missing Fields
**What goes wrong:** Missing fields invisible to user, unclear what wasn't extracted
**Why it happens:** Only rendering fields that have values
**How to avoid:** Show all possible fields with placeholder for missing:
```typescript
{extractedData.email ? (
  <ValueDisplay value={extractedData.email} />
) : (
  <PlaceholderText>Not found in document</PlaceholderText>
)}
```
**Warning signs:** User thinks extraction worked perfectly when fields are missing

## Code Examples

Verified patterns from existing ASTN code:

### Extraction Item Type (Extend from Enrichment)
```typescript
// Source: src/components/profile/enrichment/hooks/useEnrichment.ts (adapted)
export type ExtractionStatus = "pending" | "accepted" | "rejected" | "edited";

export interface ResumeExtractionItem {
  id: string;  // Unique key for React
  field: keyof ExtractedData | `education.${number}` | `workHistory.${number}`;
  label: string;
  value: unknown;
  editedValue?: unknown;
  status: ExtractionStatus;
}
```

### Date Conversion Utilities (From WorkHistoryStep)
```typescript
// Source: src/components/profile/wizard/steps/WorkHistoryStep.tsx
// Convert extraction string format to profile timestamp format
const convertExtractionDate = (dateStr?: string): number | undefined => {
  if (!dateStr || dateStr.toLowerCase() === "present") return undefined;
  const [year, month] = dateStr.split("-").map(Number);
  if (isNaN(year) || isNaN(month)) return undefined;
  return new Date(year, month - 1, 1).getTime();
};

// Convert profile timestamp to display string
const formatDateForDisplay = (timestamp?: number): string => {
  if (!timestamp) return "Present";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};
```

### Profile Update with Multiple Fields
```typescript
// Source: convex/profiles.ts - updateField mutation
// Call with all accepted fields at once
await updateField({
  profileId,
  updates: {
    name: acceptedData.name,
    location: acceptedData.location,
    education: acceptedData.education,
    workHistory: convertedWorkHistory,
    skills: acceptedData.skills,
  },
});
```

### Skills Input Reuse
```typescript
// Source: src/components/profile/wizard/steps/SkillsStep.tsx
// For editing skills in extraction review
<SkillsInput
  selectedSkills={editedSkills}
  onSkillsChange={(skills) => onUpdateValue("skills", skills)}
  maxSuggested={10}
/>
```

## Data Mapping Reference

### Extraction Schema to Profile Schema

| Extracted Field | Profile Field | Conversion Needed |
|-----------------|---------------|-------------------|
| `name` | `name` | None (string to string) |
| `email` | - | Not in profile schema (display only) |
| `location` | `location` | None (string to string) |
| `education[].institution` | `education[].institution` | None |
| `education[].degree` | `education[].degree` | None |
| `education[].field` | `education[].field` | None |
| `education[].startYear` | `education[].startYear` | None (number to number) |
| `education[].endYear` | `education[].endYear` | None (number to number) |
| `education[].current` | `education[].current` | None (boolean to boolean) |
| `workHistory[].organization` | `workHistory[].organization` | None |
| `workHistory[].title` | `workHistory[].title` | None |
| `workHistory[].startDate` | `workHistory[].startDate` | String "YYYY-MM" to Unix timestamp |
| `workHistory[].endDate` | `workHistory[].endDate` | String "YYYY-MM"/"present" to timestamp/undefined |
| `workHistory[].current` | `workHistory[].current` | None (already boolean from extraction) |
| `workHistory[].description` | `workHistory[].description` | None |
| `skills` | `skills` | None (already matched to taxonomy) |
| `rawSkills` | - | For display/reference only |

### Fields Extracted vs Profile Fields

**Fields extraction provides:**
- Basic: name, email, location
- Education: institution, degree, field, startYear, endYear, current
- Work: organization, title, startDate, endDate, current, description
- Skills: matched skills, rawSkills

**Profile fields NOT from extraction (handled by enrichment chat):**
- `pronouns` - Personal preference
- `headline` - Needs user crafting
- `careerGoals` - Conversational extraction better
- `aiSafetyInterests` - Conversational extraction better
- `seeking` - Conversational extraction better
- `enrichmentSummary` - LLM-generated from conversation
- `privacySettings` - User choice

## Integration Points

### Entry Point: test-upload.tsx to Review UI
Current flow ends at success display. Phase 9 replaces success state with review UI:

```typescript
// In test-upload.tsx, replace success state content:
{extractionState.status === "success" && (
  <ResumeExtractionReview
    extractedData={extractionState.extractedData}
    onApply={handleApplyToProfile}
    onSkip={handleSkipToEnrichment}
  />
)}
```

### Exit Point: Review UI to Enrichment Chat
After apply, navigate to enrichment step per CONTEXT.md:

```typescript
const navigate = useNavigate();

const handleApplyComplete = () => {
  navigate({ to: "/profile/edit", search: { step: "enrichment" } });
};
```

### Where Review UI Lives
Two options per CONTEXT.md (Claude's discretion):

**Option A: Dedicated Page (Recommended)**
- New route `/profile/import` or similar
- Clean separation of concerns
- Can be deep-linked from upload flow

**Option B: Wizard Step**
- Add "import" as first step before "basic"
- Tighter integration with wizard
- More complex conditional routing

**Recommendation:** Dedicated page at `/profile/import` that redirects to `/profile/edit?step=enrichment` after apply.

## Open Questions

Things that couldn't be fully resolved:

1. **Merge vs Replace for Non-Empty Arrays**
   - What we know: Context says "Claude's discretion" for merge strategy
   - What's unclear: User preference for existing data
   - Recommendation: For MVP, replace if empty, prompt if non-empty with "Replace all" or "Add to existing" options

2. **Email Field Display**
   - What we know: Email extracted but not in profile schema
   - What's unclear: Should it be shown or hidden in review?
   - Recommendation: Show with "(not saved - for verification only)" note

3. **Low-Confidence Indicator Style**
   - What we know: Context says "subtle badge or color"
   - What's unclear: Exact visual treatment
   - Recommendation: Use amber/yellow tint like "edited" status: `bg-amber-50 border-amber-200`

## Sources

### Primary (HIGH confidence)
- ASTN codebase: `src/components/profile/enrichment/ExtractionReview.tsx` - UI pattern
- ASTN codebase: `src/components/profile/wizard/steps/WorkHistoryStep.tsx` - Date conversion
- ASTN codebase: `convex/schema.ts` - Profile and extraction schemas
- ASTN codebase: `convex/extraction/prompts.ts` - ExtractionResult type
- Phase 8 summaries: Integration patterns and decisions

### Secondary (MEDIUM confidence)
- Phase 9 CONTEXT.md: User decisions from discussion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already exist in ASTN
- Architecture: HIGH - Following established patterns exactly
- Pitfalls: HIGH - Based on actual schema differences found in codebase

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - internal codebase patterns stable)
