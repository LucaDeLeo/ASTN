# Phase 10: Wizard Integration - Research

**Researched:** 2026-01-19
**Domain:** Profile creation wizard orchestration and state management
**Confidence:** HIGH

## Summary

This phase is orchestration work, not greenfield development. All the building blocks exist: upload components (DocumentUpload, TextPasteZone), extraction pipeline (useExtraction, useFileUpload), review UI (ResumeExtractionReview), enrichment chat (EnrichmentChat, useEnrichment), and manual profile forms (ProfileWizard with 7 step components). The current test-upload page demonstrates the complete upload-to-profile flow but is disconnected from the main profile wizard.

The challenge is wiring these pieces into a cohesive wizard with four entry points (upload, paste, manual, chat-first), step indicators, and proper state management to preserve data when users navigate between steps.

**Primary recommendation:** Create a new ProfileCreationWizard component that orchestrates the existing pieces through a 3-step flow (Input -> Review -> Enrich), using React state or URL search params for wizard step tracking, and reusing all existing hooks and components.

## Standard Stack

This phase uses only existing project patterns - no new libraries needed.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Router | Current | URL-based state, search params | Already used for step param in /profile/edit |
| Convex React | Current | Data mutations, queries | All profile data goes through Convex |
| React 19 | Current | Component state, hooks | Project foundation |

### Supporting (Already Available)
| Component/Hook | Location | Purpose |
|---------------|----------|---------|
| useFileUpload | src/components/profile/upload/hooks/ | File selection and upload state machine |
| useExtraction | src/components/profile/upload/hooks/ | Extraction lifecycle management |
| useResumeReview | src/components/profile/extraction/hooks/ | Review item state (accept/reject/edit) |
| useEnrichment | src/components/profile/enrichment/hooks/ | Chat message handling and extraction |
| useAutoSave | src/components/profile/wizard/hooks/ | Profile field auto-save |

### No New Libraries Required
All state management, routing, and UI patterns are established in the codebase.

## Architecture Patterns

### Current Implementation Structure
```
src/components/profile/
├── upload/
│   ├── hooks/
│   │   ├── useFileUpload.ts      # File upload state machine
│   │   └── useExtraction.ts       # Extraction lifecycle
│   ├── DocumentUpload.tsx         # Drag-drop PDF upload
│   ├── TextPasteZone.tsx          # Collapsible text paste
│   ├── FilePreview.tsx            # Selected file display
│   ├── UploadProgress.tsx         # Upload progress bar
│   ├── ExtractionProgress.tsx     # Extraction stage indicator
│   ├── ExtractionError.tsx        # Error with retry/fallback
│   └── index.ts                   # Barrel export
├── extraction/
│   ├── hooks/
│   │   └── useResumeReview.ts     # Review item state management
│   ├── ResumeExtractionReview.tsx # Review extracted data
│   ├── ExtractionFieldCard.tsx    # Single field review
│   ├── ExpandableEntryCard.tsx    # Education/work entry review
│   └── types.ts                   # ExtractedData types
├── enrichment/
│   ├── hooks/
│   │   └── useEnrichment.ts       # Chat + extraction logic
│   ├── EnrichmentChat.tsx         # Chat UI component
│   └── ExtractionReview.tsx       # Post-chat extraction review
└── wizard/
    ├── hooks/
    │   └── useAutoSave.ts         # Debounced profile saves
    ├── ProfileWizard.tsx          # Main wizard container
    ├── WizardProgress.tsx         # Side nav with completeness
    └── steps/
        ├── BasicInfoStep.tsx
        ├── EducationStep.tsx
        ├── WorkHistoryStep.tsx
        ├── GoalsStep.tsx
        ├── SkillsStep.tsx
        ├── EnrichmentStep.tsx
        └── PrivacyStep.tsx
```

### Recommended Wizard Flow Structure
```
ProfileCreationWizard (new component)
├── WizardStepIndicator (new - "1. Input -> 2. Review -> 3. Enrich")
│
├── Step 1: Input Selection
│   ├── Entry point cards (4 options)
│   ├── Upload flow (DocumentUpload + FilePreview + UploadProgress)
│   ├── Text paste flow (TextPasteZone)
│   ├── Direct to manual (ProfileWizard step="basic")
│   └── Direct to chat (EnrichmentStep)
│
├── Step 2: Review (conditional - only if extraction)
│   ├── ResumeExtractionReview (existing)
│   ├── Back button (preserves extracted data)
│   └── Apply -> Summary screen
│
└── Step 3: Enrich
    ├── Summary screen (after apply)
    │   └── "Profile is X% complete. Skip enrichment?" button
    ├── EnrichmentStep (existing)
    └── Skip to manual entry
```

### Pattern 1: Wizard State Machine
**What:** Track wizard progress through discriminated union state
**When to use:** Multi-step flows with conditional paths
**Example:**
```typescript
// Recommended pattern based on existing useFileUpload and useExtraction
type WizardState =
  | { step: "input"; entryPoint?: "upload" | "paste" | "manual" | "chat" }
  | { step: "uploading"; file: File; progress: number }
  | { step: "extracting"; stage: ExtractionStage }
  | { step: "review"; extractedData: ExtractedData }
  | { step: "summary"; appliedData: AppliedData; completeness: number }
  | { step: "enrich"; fromExtraction?: boolean }
  | { step: "manual"; currentStep: StepId };

// Or simpler URL-based approach (matches existing /profile/edit)
const searchSchema = z.object({
  wizardStep: z.enum(["input", "review", "enrich", "manual"]).default("input"),
  entryPoint: z.enum(["upload", "paste", "manual", "chat"]).optional(),
  fromExtraction: z.boolean().optional(),
});
```

### Pattern 2: Grid Overlay Transitions
**What:** Overlay all states in same grid cell, transition with opacity/scale
**When to use:** Smooth transitions between wizard states without layout jumps
**Example:** Already implemented in test-upload.tsx
```tsx
<div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
  <div className={cn(
    "transition-all duration-500 ease-out",
    isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
  )}>
    {/* Content for this state */}
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Building new extraction logic:** All extraction is done - use existing hooks
- **New routes for each wizard step:** Use search params within single route
- **Separate state for each flow:** Compose existing hooks, don't duplicate state
- **Custom chat implementation:** EnrichmentChat and useEnrichment already exist

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload state | Custom state + effects | `useFileUpload` hook | Already handles idle/selected/uploading/success/error transitions |
| Extraction lifecycle | Custom polling | `useExtraction` hook | Handles polling, stages, retry logic |
| Review item tracking | useState for each item | `useResumeReview` hook | Manages accept/reject/edit for all extracted fields |
| Chat messages | Custom message state | `useEnrichment` hook | Handles messages, loading, extraction trigger |
| Profile auto-save | Manual save calls | `useAutoSave` hook | Debounced saves with immediate option |
| Completeness calculation | Custom logic | `api.profiles.getMyCompleteness` | Server-side calculation with all section rules |

**Key insight:** Phase 10 is pure orchestration. Every data operation and UI component already exists. The work is composing them into a unified flow.

## Common Pitfalls

### Pitfall 1: Losing Data on Back Navigation
**What goes wrong:** User uploads, extracts, then clicks back - extraction data is lost
**Why it happens:** React state is lost on component unmount
**How to avoid:**
- Keep extracted data in parent component state when navigating back
- Use `useState` with lifted state, not route navigation that unmounts
- Store extraction result at wizard level, not upload step level
**Warning signs:** Back button causes full flow reset

### Pitfall 2: Context Loss in Enrichment
**What goes wrong:** User uploads resume, applies to profile, starts enrichment - chat asks redundant questions
**Why it happens:** Chat doesn't know extraction happened
**How to avoid:**
- Already solved: `conversation.ts` reads profile context including work history, education, skills
- Pass `fromExtraction: true` to EnrichmentStep (already implemented)
- Auto-greet triggers context-aware opening message (already implemented in 09-03)
**Warning signs:** Chat asks "tell me about your work experience" when work history just imported

### Pitfall 3: Step Indicator Disconnect
**What goes wrong:** Step indicator shows "2. Review" but user is in upload error state
**Why it happens:** Wizard step and sub-step state not properly tracked
**How to avoid:**
- Track high-level step (Input/Review/Enrich) separately from sub-state
- Step indicator reflects high-level only
- Sub-states (uploading, error, etc.) are within a step, not separate steps
**Warning signs:** Step indicator jumps around during errors

### Pitfall 4: Manual Entry Transition
**What goes wrong:** User clicks "Skip to Manual Entry" from review - loses extraction context
**Why it happens:** Manual entry assumed to be fresh start
**How to avoid:**
- "Skip to Manual Entry" should still apply extracted data first (or ask)
- Or preserve extracted data in session for manual review later
- Clear user intent: skip means "don't want to review, just fill manually"
**Warning signs:** User clicks skip, profile is empty instead of having extracted data

## Code Examples

Verified patterns from existing codebase:

### Auto-trigger Extraction After Upload (test-upload.tsx)
```typescript
// Source: src/routes/test-upload.tsx lines 48-56
useEffect(() => {
  if (
    uploadState.status === "success" &&
    extractionState.status === "idle"
  ) {
    void extractFromDocument(uploadState.documentId);
  }
}, [uploadState, extractionState.status, extractFromDocument]);
```

### Apply Extracted Data to Profile (test-upload.tsx)
```typescript
// Source: src/routes/test-upload.tsx lines 80-93
const handleApplyToProfile = async (data: AppliedData) => {
  setIsApplying(true);
  try {
    await applyExtractedProfile({ extractedData: data });
    handleStartOver();
    void navigate({
      to: "/profile/edit",
      search: { step: "enrichment", fromExtraction: "true" }
    });
  } catch (error) {
    console.error("Failed to apply extraction:", error);
  } finally {
    setIsApplying(false);
  }
};
```

### Auto-greet After Extraction (EnrichmentStep.tsx)
```typescript
// Source: src/components/profile/wizard/steps/EnrichmentStep.tsx lines 52-64
useEffect(() => {
  if (
    fromExtraction &&
    profile?._id &&
    messages.length === 0 &&
    !isLoading &&
    !hasAutoGreeted.current
  ) {
    hasAutoGreeted.current = true;
    void sendMessage("Hi! I just imported my resume. Can you help me complete my profile?");
  }
}, [fromExtraction, profile?._id, messages.length, isLoading, sendMessage]);
```

### URL Search Params for Step (profile/edit.tsx)
```typescript
// Source: src/routes/profile/edit.tsx lines 8-21
const stepSchema = z.enum([
  "basic", "education", "work", "goals", "skills", "enrichment", "privacy",
]);

const searchSchema = z.object({
  step: stepSchema.optional().default("basic"),
  fromExtraction: z.string().optional(),
});

export const Route = createFileRoute("/profile/edit")({
  validateSearch: searchSchema,
  component: ProfileEditPage,
});
```

### Profile Completeness Query (WizardProgress.tsx)
```typescript
// Source: src/components/profile/wizard/WizardProgress.tsx lines 46-47
const completeness = useQuery(api.profiles.getMyCompleteness);
const completedCount = completeness?.completedCount ?? 0;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| test-upload.tsx as demo | Integrated wizard | Phase 10 | test-upload becomes development artifact |
| Direct to wizard steps | Entry point selection | Phase 10 | Users choose how to start profile creation |
| Enrichment optional | Enrichment as default path | 09-03 | Auto-greet encourages completion |

**Current state:**
- test-upload.tsx contains complete upload -> extract -> review -> apply flow
- Profile wizard has 7 manual steps with navigation
- Enrichment chat is a wizard step, not standalone
- These are separate flows that need to be unified

## Open Questions

Things that couldn't be fully resolved:

1. **Route vs Component for Wizard**
   - What we know: /profile/edit uses URL search params for step
   - What's unclear: Should new wizard be same route with extended params, or new /profile/create route?
   - Recommendation: Extend /profile/edit with new "input" step as entry point, or create /profile/create that redirects to /profile/edit after setup

2. **LinkedIn PDF Instructions**
   - What we know: CONTEXT.md specifies "How to get your LinkedIn PDF" link
   - What's unclear: No existing instructions content in codebase
   - Recommendation: Create as expandable/modal content, planner should spec exact UX

3. **Chat-first Entry Point Behavior**
   - What we know: Should ask "Do you have a CV I could look at?" before starting questions
   - What's unclear: How to trigger upload flow mid-conversation
   - Recommendation: Chat-first starts enrichment, if user mentions CV, show inline upload option or link to restart with upload

## Sources

### Primary (HIGH confidence)
- `src/components/profile/wizard/ProfileWizard.tsx` - Existing wizard implementation
- `src/components/profile/upload/hooks/useFileUpload.ts` - Upload state machine
- `src/components/profile/upload/hooks/useExtraction.ts` - Extraction lifecycle
- `src/components/profile/extraction/ResumeExtractionReview.tsx` - Review UI
- `src/routes/test-upload.tsx` - Complete flow demonstration
- `convex/enrichment/conversation.ts` - Context-aware chat implementation
- `convex/profiles.ts` - Completeness calculation, applyExtractedProfile mutation

### Secondary (MEDIUM confidence)
- `.planning/phases/09-review-apply-ui/09-03-SUMMARY.md` - UX decisions from Phase 9
- `.planning/phases/10-wizard-integration/10-CONTEXT.md` - User decisions for Phase 10

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase
- Architecture: HIGH - Clear patterns established in test-upload.tsx
- Pitfalls: HIGH - Based on actual code review, not speculation
- Open questions: MEDIUM - Route structure decision depends on project conventions

**Research date:** 2026-01-19
**Valid until:** 30 days (stable domain, no external dependencies)
