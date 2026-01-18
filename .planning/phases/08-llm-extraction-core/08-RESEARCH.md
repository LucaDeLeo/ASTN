# Phase 8: LLM Extraction Core - Research

**Researched:** 2026-01-18
**Domain:** Claude Haiku PDF extraction, Convex actions, structured data extraction
**Confidence:** HIGH

## Summary

This phase builds on the existing ASTN patterns for Claude API integration (already used in enrichment and matching modules). The key technical challenge is sending PDF content from Convex storage to Claude's Messages API using the **document content type** with base64-encoded PDF data.

The ASTN codebase already has proven patterns for:
- Claude Haiku 4.5 integration with tool calling (`convex/enrichment/extraction.ts`)
- Structured output extraction via forced tool_choice (`convex/matching/compute.ts`)
- File upload and storage handling (`convex/upload.ts`)

The primary new capability needed is retrieving stored files as blobs and converting to base64 for Claude's PDF-native processing.

**Primary recommendation:** Use Claude's native PDF support via `type: "document"` content blocks with base64 encoding, combined with forced tool calling for structured JSON output. Follow existing ASTN patterns from `matching/compute.ts`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.71.2 | Claude API client | Already in use in ASTN |
| convex | ^1.31.0 | Backend framework | Already in use in ASTN |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Buffer (Node.js built-in) | - | Base64 encoding | Converting Blob to base64 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native PDF support | pdf.js text extraction | Native PDF gives visual layout understanding; text-only loses formatting context |
| Tool calling | JSON mode | Tool calling provides guaranteed schema; JSON mode less reliable |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── extraction/              # New module for document extraction
│   ├── pdf.ts               # PDF extraction action (use node)
│   ├── text.ts              # Text extraction action (use node)
│   ├── prompts.ts           # Extraction prompts and tool definitions
│   └── mutations.ts         # Save extraction results
```

### Pattern 1: Claude PDF Document Content Block
**What:** Send PDF as base64-encoded document content type
**When to use:** Processing any PDF for extraction
**Example:**
```typescript
// Source: Anthropic API documentation + existing ASTN patterns
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 4096,
  tools: [extractProfileTool],
  tool_choice: { type: "tool", name: "extract_profile_info" },
  system: EXTRACTION_SYSTEM_PROMPT,
  messages: [{
    role: "user",
    content: [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: pdfBase64  // Base64-encoded PDF content
        }
      },
      {
        type: "text",
        text: "Extract the profile information from this resume/CV."
      }
    ]
  }]
});
```

### Pattern 2: Convex Storage Blob to Base64
**What:** Retrieve stored file and convert to base64
**When to use:** Before sending to Claude API
**Example:**
```typescript
// Source: Convex file storage docs + Discord community examples
const blob = await ctx.storage.get(storageId);
if (!blob) {
  throw new Error("Document not found in storage");
}

// Convert Blob to ArrayBuffer to Buffer to base64
const arrayBuffer = await blob.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const base64 = buffer.toString("base64");
```

### Pattern 3: Forced Tool Choice for Structured Output
**What:** Force Claude to return structured JSON via tool calling
**When to use:** When exact schema is required
**Example:**
```typescript
// Source: Existing ASTN pattern from convex/matching/compute.ts
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 4096,
  tools: [extractProfileTool],
  tool_choice: { type: "tool", name: "extract_profile_info" }, // Force this tool
  // ...
});

// Extract structured output from tool use
const toolUse = response.content.find(block => block.type === "tool_use");
if (!toolUse || toolUse.type !== "tool_use") {
  throw new Error("No tool use in response");
}
const extractedData = toolUse.input as ExtractionResult;
```

### Pattern 4: Retry with Exponential Backoff
**What:** Handle transient API failures gracefully
**When to use:** All external API calls
**Example:**
```typescript
// Retry logic pattern
async function extractWithRetry(
  ctx: ActionCtx,
  storageId: Id<"_storage">,
  maxRetries: number = 3
): Promise<ExtractionResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await performExtraction(ctx, storageId);
    } catch (error) {
      lastError = error as Error;
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Anti-Patterns to Avoid
- **Don't convert PDF to images first:** Claude's native PDF support handles multi-page documents better than image-by-image processing
- **Don't use JSON mode without tool_choice:** Tool calling with forced choice is more reliable for structured output
- **Don't store extracted data directly:** All extracted data goes to user review first (per CONTEXT.md decisions)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom pdf.js parsing | Claude native PDF | Claude understands layout, tables, multi-column text |
| Structured output | Parse free-text response | Tool calling with forced choice | Guaranteed schema compliance |
| Skill matching | String contains/includes | Fuzzy matching with `string-similarity-js` | Already in project, handles variations |
| Base64 encoding | Manual byte manipulation | Node.js Buffer | Battle-tested, handles edge cases |

**Key insight:** Claude's native PDF support (released late 2024) is specifically optimized for document understanding. It handles visual layout, tables, headers, and multi-column text that pure text extraction would lose or mangle.

## Common Pitfalls

### Pitfall 1: Not Using "use node" Directive
**What goes wrong:** Actions fail silently or with cryptic errors
**Why it happens:** Claude SDK requires Node.js APIs (fetch, Buffer, etc.)
**How to avoid:** Always add `"use node";` at the top of files using Anthropic SDK
**Warning signs:** "Buffer is not defined" or fetch-related errors

### Pitfall 2: Forgetting Blob Null Check
**What goes wrong:** Runtime error when file was deleted or never uploaded
**Why it happens:** `ctx.storage.get()` returns `null` if file doesn't exist
**How to avoid:** Always check: `if (!blob) throw new Error("File not found")`
**Warning signs:** "Cannot read properties of null" errors

### Pitfall 3: PDF Size Limits
**What goes wrong:** Claude API rejects request or returns truncated results
**Why it happens:** Very large PDFs exceed token limits
**How to avoid:** Check file size before processing; typical resumes are well under limits
**Warning signs:** API errors about context length; Phase 7 already limits to 10MB

### Pitfall 4: Assuming All Fields Present
**What goes wrong:** Null reference errors when accessing optional fields
**Why it happens:** Resumes vary wildly in content - some have no education, some no email
**How to avoid:** Make all extracted fields optional in the tool schema; handle nulls in UI
**Warning signs:** TypeError when accessing `.length` or iterating arrays

### Pitfall 5: Not Handling Scanned/Image-Only PDFs
**What goes wrong:** Empty extraction results with no clear error
**Why it happens:** Some PDFs are scanned images with no extractable text layer
**How to avoid:** Check if extraction returned meaningful data; provide clear user feedback
**Warning signs:** All fields null or empty strings despite valid-looking PDF

## Code Examples

Verified patterns from official sources and existing ASTN code:

### Tool Definition for Profile Extraction
```typescript
// Based on existing pattern from convex/enrichment/extraction.ts
// Extended for resume extraction fields
const extractProfileTool: Anthropic.Tool = {
  name: "extract_profile_info",
  description: "Extract structured profile information from a resume/CV document",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Full name of the person"
      },
      email: {
        type: "string",
        description: "Email address if found"
      },
      location: {
        type: "string",
        description: "City, state/country location"
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            institution: { type: "string" },
            degree: { type: "string" },
            field: { type: "string" },
            startYear: { type: "number" },
            endYear: { type: "number" },
            current: { type: "boolean" }
          },
          required: ["institution"]
        },
        description: "Educational background entries"
      },
      workHistory: {
        type: "array",
        items: {
          type: "object",
          properties: {
            organization: { type: "string" },
            title: { type: "string" },
            startDate: { type: "string", description: "YYYY-MM format" },
            endDate: { type: "string", description: "YYYY-MM format or 'present'" },
            description: { type: "string" }
          },
          required: ["organization", "title"]
        },
        description: "Work experience entries"
      },
      skills_mentioned: {
        type: "array",
        items: { type: "string" },
        description: "Technical and professional skills mentioned"
      }
    },
    required: ["name"]  // Only name is truly required
  }
};
```

### Skill Matching Against Taxonomy
```typescript
// Match extracted skills against ASTN skills taxonomy
// Using string-similarity-js already in project
import { stringSimilarity } from "string-similarity-js";

const SIMILARITY_THRESHOLD = 0.7;

function matchSkillsToTaxonomy(
  extractedSkills: string[],
  taxonomySkills: Array<{ name: string; category: string; aliases?: string[] }>
): string[] {
  const matched: Set<string> = new Set();

  for (const extracted of extractedSkills) {
    const extractedLower = extracted.toLowerCase();

    for (const taxSkill of taxonomySkills) {
      // Direct match
      if (taxSkill.name.toLowerCase() === extractedLower) {
        matched.add(taxSkill.name);
        continue;
      }

      // Alias match
      if (taxSkill.aliases?.some(a => a.toLowerCase() === extractedLower)) {
        matched.add(taxSkill.name);
        continue;
      }

      // Fuzzy match
      if (stringSimilarity(extracted, taxSkill.name) >= SIMILARITY_THRESHOLD) {
        matched.add(taxSkill.name);
      }
    }
  }

  return Array.from(matched);
}
```

### System Prompt for Extraction
```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured profile information from resumes and CVs.

Your task is to extract:
1. Basic information: name, email, location
2. Education history: institutions, degrees, fields of study, dates
3. Work history: organizations, job titles, dates, descriptions
4. Skills: technical skills, tools, frameworks, languages

Guidelines:
- Extract only information that is explicitly stated in the document
- For dates, use your best judgment to infer years when only partial info is given
- For work history, include brief descriptions of responsibilities if available
- For skills, include both technical skills (Python, PyTorch) and domain skills (machine learning, NLP)
- If information is ambiguous or missing, omit that field rather than guessing
- Handle multi-column layouts and varying resume formats

Use the extract_profile_info tool to return the structured data.`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PDF text extraction + prompt | Native PDF document support | November 2024 | Better layout understanding, handles tables/columns |
| JSON mode for structured output | Tool calling with forced choice | 2024 | More reliable schema compliance |
| Image-per-page processing | Direct PDF support (up to 100 pages) | November 2024 | Simpler code, better context |

**Deprecated/outdated:**
- Manual PDF.js text extraction before sending to Claude: Native PDF support is superior
- Using claude-3-haiku model: Use claude-haiku-4-5-20251001 (already used in ASTN)

## Open Questions

Things that couldn't be fully resolved:

1. **Exact PDF page/size limits for Haiku 4.5**
   - What we know: General limit is ~100 pages, ~32MB
   - What's unclear: Exact limits for Haiku specifically (vs Sonnet/Opus)
   - Recommendation: Test with typical resumes (1-5 pages); should be well within limits

2. **Token costs for PDF vs text**
   - What we know: PDFs are tokenized as images internally
   - What's unclear: Exact token count formula for PDFs
   - Recommendation: Monitor costs in production; typical resume ~$0.001 as projected

## Sources

### Primary (HIGH confidence)
- Anthropic API documentation - PDF support format with `type: "document"`
- Existing ASTN codebase (`convex/enrichment/extraction.ts`, `convex/matching/compute.ts`)
- Convex documentation - File storage `ctx.storage.get()` API

### Secondary (MEDIUM confidence)
- Multiple community examples showing same base64 pattern
- AWS Bedrock documentation (uses same Anthropic format)

### Tertiary (LOW confidence)
- Blog posts about PDF processing performance (dated, may be outdated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing ASTN dependencies
- Architecture: HIGH - Extending proven patterns from matching/enrichment
- Pitfalls: HIGH - Based on documented API limitations and common issues

**Research date:** 2026-01-18
**Valid until:** 2026-03-18 (60 days - Claude API is stable)
