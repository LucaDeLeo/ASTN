# Architecture Research: Document Upload + LLM Extraction

**Domain:** PDF/Resume upload with AI extraction for profile auto-fill
**Researched:** 2026-01-18
**Overall Confidence:** HIGH (verified with Convex docs, Claude API docs, existing codebase patterns)

## Executive Summary

This document outlines the architecture for integrating document upload (PDF/text paste) with LLM-powered extraction into the existing ASTN profile creation flow. The design leverages existing patterns from the enrichment system while adding a new "upload-first" entry point.

**Key Insight:** The existing `enrichment/extraction.ts` already demonstrates the Claude tool-use pattern for structured extraction. The new document extraction will follow this same pattern but with a different input source (document text instead of conversation history).

---

## Component Overview

### New Components Required

| Component               | Location                               | Purpose                               |
| ----------------------- | -------------------------------------- | ------------------------------------- |
| `DocumentUpload`        | `src/components/profile/upload/`       | UI for file upload, drag-drop, paste  |
| `ExtractionPreview`     | `src/components/profile/upload/`       | Review extracted data before applying |
| `useDocumentExtraction` | `src/components/profile/upload/hooks/` | Client-side state management          |
| `uploadDocument`        | `convex/documents/upload.ts`           | Generate upload URL, store file       |
| `extractFromDocument`   | `convex/documents/extraction.ts`       | LLM extraction action                 |

### Existing Components to Modify

| Component        | Modification                                       |
| ---------------- | -------------------------------------------------- |
| `ProfileWizard`  | Add "Import" option before step 1                  |
| `EnrichmentStep` | Context-aware: skip questions about extracted data |
| `profiles.ts`    | Add `documentImportStatus` field tracking          |

---

## Data Flow

### Flow 1: PDF Upload Path

```
User uploads PDF
       |
       v
[1. Client: File validation]
  - Check file type (PDF only initially)
  - Check size (< 10MB)
  - Show upload progress
       |
       v
[2. Client -> Convex: Generate upload URL]
  ctx.storage.generateUploadUrl()
       |
       v
[3. Client: Upload to Convex storage]
  fetch(uploadUrl, { method: 'POST', body: file })
       |
       v
[4. Client -> Convex: Trigger extraction]
  extractFromDocument({ storageId })
       |
       v
[5. Convex Action: PDF to text]
  - Fetch blob: ctx.storage.get(storageId)
  - Parse PDF: pdf-parse or pdfjs-dist
  - Extract raw text
       |
       v
[6. Convex Action: LLM structured extraction]
  - Call Claude with tool_use
  - Extract: name, education[], workHistory[], skills[], etc.
       |
       v
[7. Client: Show extraction preview]
  - User reviews each field
  - Accept/reject/edit individual fields
       |
       v
[8. Client -> Convex: Apply to profile]
  profiles.updateField({ updates: acceptedFields })
       |
       v
[9. Continue to enrichment chat]
  - Chat is now context-aware of imported data
  - Skips questions about already-known info
```

### Flow 2: Text Paste Path

```
User pastes resume text
       |
       v
[1. Client: Text validation]
  - Check length (> 50 chars, < 50,000 chars)
       |
       v
[2. Client -> Convex: Direct extraction]
  extractFromText({ text: pastedContent })
       |
       v
[3-9. Same as PDF flow from step 6 onward]
```

### Flow 3: Skip to Manual Entry

```
User clicks "Start from scratch"
       |
       v
[1. Proceed directly to BasicInfoStep]
  - Existing flow unchanged
```

---

## Processing Location

### Client-Side (React)

| Operation                | Rationale                                 |
| ------------------------ | ----------------------------------------- |
| File validation          | Immediate feedback, no network round-trip |
| Upload progress tracking | Better UX with progress bar               |
| Extraction preview state | Local state for accept/reject/edit UI     |
| Form auto-fill           | Populate react-hook-form fields           |

### Server-Side (Convex Action with Node.js)

| Operation        | Rationale                                        |
| ---------------- | ------------------------------------------------ |
| PDF parsing      | Requires `pdf-parse` or `pdfjs-dist` (Node.js)   |
| Claude API calls | API key stays server-side, structured extraction |
| File storage     | Uses Convex built-in storage                     |

**Critical:** Extraction must be a Convex `action` (not `mutation`) because:

1. PDF parsing is CPU-intensive and may take time
2. Claude API calls are external network requests
3. Actions can run longer than mutations (10s vs 25ms budget)

---

## Schema Additions

```typescript
// convex/schema.ts additions

// Track document import status on profiles
profiles: defineTable({
  // ... existing fields ...

  // Document import tracking
  documentImport: v.optional(v.object({
    status: v.union(
      v.literal("none"),        // No document imported
      v.literal("processing"),  // Extraction in progress
      v.literal("completed"),   // Successfully extracted
      v.literal("failed")       // Extraction failed
    ),
    sourceType: v.optional(v.union(
      v.literal("pdf"),
      v.literal("text_paste")
    )),
    storageId: v.optional(v.id("_storage")),
    extractedAt: v.optional(v.number()),
    fieldsExtracted: v.optional(v.array(v.string())), // ["name", "education", "skills"]
  })),
})

// Optional: Store extraction history for debugging
documentExtractions: defineTable({
  profileId: v.id("profiles"),
  storageId: v.optional(v.id("_storage")),
  sourceType: v.union(v.literal("pdf"), v.literal("text_paste")),
  rawText: v.string(),           // Extracted text (for debugging)
  extractedData: v.string(),     // JSON stringified extraction result
  appliedFields: v.array(v.string()), // Which fields user accepted
  createdAt: v.number(),
}).index("by_profile", ["profileId"]),
```

---

## Integration with Existing Flow

### Modified Profile Wizard Steps

```
CURRENT FLOW:
1. basic -> 2. education -> 3. work -> 4. goals -> 5. skills -> 6. enrichment -> 7. privacy

NEW FLOW:
0. START (new)          <- Choose: Import PDF | Paste Text | Manual Entry
   |
   v (if import)
0a. UPLOAD/PASTE (new)  <- Upload file or paste text
   |
   v
0b. REVIEW (new)        <- Preview extracted data, accept/reject fields
   |
   v
1. basic -> ... -> 6. enrichment (context-aware) -> 7. privacy
```

### Context-Aware Enrichment Chat

The enrichment chat currently has this system prompt:

```
Current profile context:
{profileContext}
```

Modified to include import awareness:

```
Current profile context:
{profileContext}

This user imported their profile from a document. The following fields
were already extracted and confirmed:
{extractedFields}

Focus your questions on:
- Career aspirations and motivations (if not clear from document)
- Specific AI safety interests and research areas
- What they're seeking in their next role
- Any gaps or clarifications needed

Do NOT ask about: {alreadyKnownFields}
```

---

## PDF Parsing Strategy

### Recommended: `unpdf` (modern, maintained)

```typescript
// convex/documents/extraction.ts
'use node'

import { extractText } from 'unpdf'

export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer,
): Promise<string> {
  const { text } = await extractText(new Uint8Array(pdfBuffer))
  return text
}
```

**Why unpdf over pdf-parse:**

- **Active maintenance**: Part of UnJS ecosystem (same maintainers as nuxt, h3, ofetch)
- **Pure JavaScript**: No native dependencies, works in Convex Node.js runtime
- **Modern API**: Promise-based, TypeScript types included
- **pdf-parse is problematic**: Last updated 2019, has test file pollution issues, npm package contains suspicious test code

**Installation:**

```bash
npm install unpdf pdfjs-dist
```

**Cons:**

- No OCR (scanned PDFs won't work)
- May struggle with very complex layouts

### Alternative: Claude Vision (for complex/scanned PDFs)

Claude can accept PDF documents directly via base64 encoding:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20251001',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64EncodedPdf,
          },
        },
        {
          type: 'text',
          text: 'Extract structured profile information...',
        },
      ],
    },
  ],
  tools: [profileExtractionTool],
  tool_choice: { type: 'tool', name: 'extract_profile' },
})
```

**Recommendation:** Start with `pdf-parse` for v1.1. Add Claude Vision as fallback for scanned PDFs in future iteration.

---

## LLM Extraction Tool Schema

Extends existing pattern from `convex/enrichment/extraction.ts`:

```typescript
const profileExtractionTool: Anthropic.Tool = {
  name: 'extract_profile_info',
  description:
    'Extract structured profile information from a resume or CV document',
  input_schema: {
    type: 'object',
    properties: {
      // Basic Info
      name: {
        type: 'string',
        description: 'Full name of the person',
      },
      location: {
        type: 'string',
        description: 'Current location (city, country)',
      },
      headline: {
        type: 'string',
        description: 'Professional headline or current title',
      },

      // Education
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            institution: { type: 'string' },
            degree: { type: 'string' },
            field: { type: 'string' },
            startYear: { type: 'number' },
            endYear: { type: 'number' },
            current: { type: 'boolean' },
          },
          required: ['institution'],
        },
        description: 'Educational background entries',
      },

      // Work History
      workHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            organization: { type: 'string' },
            title: { type: 'string' },
            startDate: { type: 'string' }, // Will convert to timestamp
            endDate: { type: 'string' },
            current: { type: 'boolean' },
            description: { type: 'string' },
          },
          required: ['organization', 'title'],
        },
        description: 'Work experience entries',
      },

      // Skills
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Technical and professional skills',
      },

      // Career
      career_goals: {
        type: 'string',
        description: 'Career aspirations and goals mentioned',
      },
      ai_safety_interests: {
        type: 'array',
        items: { type: 'string' },
        description: 'AI safety topics or research areas of interest',
      },
    },
    required: ['name'],
  },
}
```

---

## File Constraints

| Constraint     | Value             | Rationale                                 |
| -------------- | ----------------- | ----------------------------------------- |
| Max file size  | 10 MB             | Convex storage limit, reasonable for PDFs |
| Allowed types  | `application/pdf` | Start focused, expand later               |
| Max text paste | 50,000 chars      | ~12,500 words, enough for any resume      |
| Min text paste | 50 chars          | Prevent accidental empty submissions      |

---

## Error Handling

### Upload Errors

| Error             | User Message                                  | Recovery    |
| ----------------- | --------------------------------------------- | ----------- |
| File too large    | "File exceeds 10MB limit. Try a smaller PDF." | Allow retry |
| Invalid file type | "Please upload a PDF file."                   | Allow retry |
| Upload failed     | "Upload failed. Please try again."            | Allow retry |

### Extraction Errors

| Error                 | User Message                                         | Recovery                |
| --------------------- | ---------------------------------------------------- | ----------------------- |
| PDF parsing failed    | "Unable to read PDF. Try pasting the text directly." | Offer paste alternative |
| LLM extraction failed | "Extraction failed. You can still enter manually."   | Skip to manual entry    |
| Empty extraction      | "No profile data found. Try a different document."   | Allow retry or manual   |

---

## Build Order (Suggested Implementation Sequence)

### Phase 1: Core Infrastructure (1-2 days)

1. **Schema updates** - Add `documentImport` field to profiles
2. **Upload mutation** - `generateUploadUrl` for documents
3. **Storage integration** - File upload flow to Convex storage

### Phase 2: Extraction Backend (2-3 days)

1. **PDF parsing** - Install `pdf-parse`, create text extraction helper
2. **LLM extraction action** - Claude tool-use for structured extraction
3. **Internal mutation** - Save extraction results

### Phase 3: Upload UI (2 days)

1. **DocumentUpload component** - Drag-drop zone, file picker, paste textarea
2. **useDocumentExtraction hook** - Upload progress, extraction state
3. **Loading states** - Progress indicators during upload/extraction

### Phase 4: Review UI (2 days)

1. **ExtractionPreview component** - Show extracted fields with accept/reject
2. **Field editing** - Allow inline edits before applying
3. **Apply to profile** - Map extracted data to profile fields

### Phase 5: Integration (1-2 days)

1. **ProfileWizard modification** - Add import step as entry point
2. **EnrichmentStep modification** - Context-aware prompts
3. **Flow routing** - Handle all entry paths (import, paste, manual)

### Phase 6: Polish (1 day)

1. **Error handling** - Graceful failures, clear messages
2. **Edge cases** - Empty PDFs, non-resume documents, etc.
3. **Analytics** - Track import success rates

---

## Architectural Decisions

### Decision 1: Convex Storage vs. External Storage

**Chosen:** Convex built-in storage

**Rationale:**

- Already integrated with Convex actions
- No additional setup (S3, Cloudflare R2, etc.)
- Files auto-deleted when removed from storage
- Simpler auth (uses Convex auth)

### Decision 2: PDF Parsing Location

**Chosen:** Server-side (Convex action with Node.js)

**Rationale:**

- `pdf-parse` requires Node.js
- Keeps PDF processing load off client
- Consistent behavior across browsers
- API key stays server-side

### Decision 3: Extraction Model

**Chosen:** Claude Haiku 4.5 (same as enrichment chat)

**Rationale:**

- Fast enough for extraction (~2-5 seconds)
- Cost-effective for single extractions
- Supports tool use for structured output
- Consistent with existing extraction patterns

### Decision 4: Extraction Review Pattern

**Chosen:** Field-by-field accept/reject (same as enrichment)

**Rationale:**

- Users already understand this pattern from enrichment
- Allows selective acceptance
- Supports inline editing
- Builds trust in AI extraction

---

## Integration Points with Existing Code

### Reusable from Enrichment

| Existing Code                  | Reuse For                             |
| ------------------------------ | ------------------------------------- |
| `ExtractionReview.tsx`         | Extend for document extraction fields |
| `useEnrichment.ts` patterns    | Similar state management pattern      |
| `extraction.ts` tool schema    | Extend for document fields            |
| Profile `updateField` mutation | Apply extracted data                  |

### New Code Paths

| New Code                     | Connects To                            |
| ---------------------------- | -------------------------------------- |
| `DocumentUpload`             | Feeds into `ExtractionPreview`         |
| `extractFromDocument` action | Calls Claude, returns structured data  |
| `uploadDocument` mutation    | Uses `ctx.storage.generateUploadUrl()` |

---

## Security Considerations

1. **File validation** - Check MIME type on both client and server
2. **Size limits** - Enforce 10MB limit at upload URL generation
3. **Auth required** - All upload/extraction endpoints require authenticated user
4. **No PII logging** - Don't log extracted personal information
5. **Storage cleanup** - Delete uploaded files after extraction (optional, based on needs)

---

## Future Considerations (Post-v1.1)

1. **OCR support** - Claude Vision for scanned documents
2. **LinkedIn import** - Parse LinkedIn profile exports
3. **Multiple document types** - Word docs, plain text files
4. **Batch import** - Multiple documents at once
5. **Version history** - Track what was extracted from which document

---

## Sources

**HIGH confidence (official docs, existing code):**

- Convex File Storage Documentation: https://docs.convex.dev/file-storage/upload-files
- Convex Actions Documentation: https://docs.convex.dev/functions/actions
- Claude Tool Use for Extraction: https://platform.claude.com/cookbook/tool-use-extracting-structured-json
- Claude PDF Support: https://platform.claude.com/docs/en/build-with-claude/pdf-support
- Existing ASTN enrichment patterns: `convex/enrichment/extraction.ts`

**MEDIUM confidence (community, npm):**

- unpdf library: https://github.com/unjs/unpdf (active UnJS ecosystem)
- pdf.js-extract: https://github.com/ffalt/pdf.js-extract (alternative if unpdf fails)

**AVOID:**

- pdf-parse: Last updated 2019, test file issues, no longer recommended
