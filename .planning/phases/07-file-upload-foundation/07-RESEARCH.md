# Phase 7: File Upload Foundation - Research

**Researched:** 2026-01-18
**Domain:** File upload infrastructure for PDF/text input with playful UI
**Confidence:** HIGH

## Summary

Phase 7 builds the file upload UI and infrastructure for resuming/CV input. The phase is scoped to upload mechanics only - extraction (Phase 8) and review UI (Phase 9) are separate. The implementation combines Convex's native file storage with react-dropzone for drag-and-drop, styled with existing shadcn/ui primitives and custom animations per the CONTEXT.md "playful confidence" direction.

The stack is well-established: Convex provides built-in file storage with a 3-step upload pattern (generate URL, POST file, save storageId), react-dropzone is the de facto React drag-drop library (9M+ weekly downloads), and shadcn/ui provides styled primitives. The codebase already has animation patterns (`tw-animate-css`, `animate-shake`) to build upon.

**Primary recommendation:** Use Convex `generateUploadUrl()` + react-dropzone for the upload zone, with custom CSS animations for the "playful" interactions specified in CONTEXT.md.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex File Storage | Built-in | Store uploaded files | Native to Convex, no additional deps. Auth-integrated, handles billing. |
| react-dropzone | ^14.3.x | Drag-and-drop zone | De facto React drag-drop library. 9M+ weekly npm downloads. TypeScript types included. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | (already installed) | CSS animations | For progress bars, transitions, shake animations. Already in package.json. |
| lucide-react | ^0.562.0 (already installed) | Icons | Upload, file, error, check icons. Already used throughout codebase. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native HTML5 drag-drop | react-dropzone abstracts browser quirks, handles edge cases, TypeScript support |
| Custom progress UI | @radix-ui/react-progress | Extra dependency for something achievable with Tailwind CSS |
| Convex storage | S3/R2 external | Unnecessary complexity, Convex storage is included and sufficient |

**Installation:**
```bash
npm install react-dropzone
```

That's the only new dependency needed.

## Architecture Patterns

### Recommended Component Structure
```
src/components/profile/upload/
├── DocumentUpload.tsx       # Main upload zone with drag-drop
├── FilePreview.tsx          # Shows selected file with remove option
├── UploadProgress.tsx       # Animated progress bar
├── TextPasteZone.tsx        # Textarea for paste fallback
└── hooks/
    └── useFileUpload.ts     # Upload state management
```

### Pattern 1: Convex 3-Step Upload Flow
**What:** Generate upload URL on client, POST file directly, save storageId via mutation
**When to use:** All file uploads to Convex storage
**Example:**
```typescript
// Source: Convex official docs
// convex/upload.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Auth check first
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    // Store metadata - actual file is in Convex storage
    // Document will be processed by Phase 8 extraction
    return await ctx.db.insert("uploadedDocuments", {
      userId: userId.subject,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      status: "pending_extraction",
      uploadedAt: Date.now(),
    });
  },
});
```

### Pattern 2: react-dropzone with Validation
**What:** Use useDropzone hook with accept/maxSize configuration
**When to use:** Drag-drop upload zones
**Example:**
```typescript
// Source: react-dropzone docs + shadcn patterns
import { useDropzone } from "react-dropzone";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
};

function DocumentUpload({ onFileSelect, onError }: Props) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        onError(error.code === "file-too-large"
          ? `File exceeds 10MB limit (yours: ${formatBytes(rejectedFiles[0].file.size)})`
          : error.code === "file-invalid-type"
          ? "Please upload a PDF file"
          : error.message
        );
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div {...getRootProps()} className={cn(
      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
      isDragActive && "border-primary bg-primary/5",
      isDragReject && "border-destructive bg-destructive/5"
    )}>
      <input {...getInputProps()} />
      {/* Content */}
    </div>
  );
}
```

### Pattern 3: Upload with Progress Tracking
**What:** Track upload progress via XMLHttpRequest or fetch with streaming
**When to use:** When showing progress percentage during upload
**Example:**
```typescript
// Source: Standard browser pattern
async function uploadWithProgress(
  file: File,
  uploadUrl: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.storageId);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
```

### Anti-Patterns to Avoid
- **HTTP Actions for upload:** 20MB limit, more complex CORS handling. Use generateUploadUrl instead.
- **Base64 in database:** Bloats database, Convex file storage is designed for binary files.
- **Custom drag-drop implementation:** Browser inconsistencies are numerous. Use react-dropzone.
- **File validation only on server:** Validate client-side for immediate feedback, server validates again.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop zone | Native drag events | react-dropzone | Browser inconsistencies, accessibility, file filtering complexity |
| File type validation | Manual MIME checking | react-dropzone `accept` prop | Handles extensions AND MIME types, graceful rejection |
| Upload progress | Custom fetch wrapper | XMLHttpRequest progress events | Built-in browser API, reliable progress calculation |
| Error shake animation | Custom keyframes | Existing `animate-shake` class | Already defined in app.css, 150ms, 2-3 oscillations |
| Spinner/loading | Custom SVG | Existing `Spinner` component | Already in codebase at `src/components/ui/spinner.tsx` |

**Key insight:** The codebase already has animation patterns and UI primitives. The "playful confidence" direction from CONTEXT.md requires custom styling, not custom components.

## Common Pitfalls

### Pitfall 1: File Validation Only on Drop
**What goes wrong:** Validation message appears after file is dropped, feels sluggish
**Why it happens:** Only checking in onDrop callback
**How to avoid:** Use react-dropzone's `isDragReject` to show immediate feedback during drag
**Warning signs:** No visual feedback until drop completes

### Pitfall 2: Missing Upload URL Expiration Handling
**What goes wrong:** Upload fails silently if user waits >1 hour between getting URL and uploading
**Why it happens:** Convex upload URLs expire in 1 hour
**How to avoid:** Generate URL immediately before upload, not on component mount. If upload fails with 403, regenerate URL and retry.
**Warning signs:** Intermittent upload failures for users who step away

### Pitfall 3: No Progress Feedback for Small Files
**What goes wrong:** Progress jumps 0% -> 100% instantly, looks broken
**Why it happens:** Small PDFs (50-200KB) upload faster than progress can render
**How to avoid:** Add minimum animation duration (e.g., 500ms) for the progress bar transition
**Warning signs:** Progress bar never visible for typical resume uploads

### Pitfall 4: Lost State on Network Error
**What goes wrong:** User loses file selection after network error, must re-select
**Why it happens:** Error clears component state
**How to avoid:** Keep file in state after error, show retry button that uses same file
**Warning signs:** Users re-dragging same file multiple times

### Pitfall 5: Accessibility Oversight
**What goes wrong:** Keyboard-only users can't upload
**Why it happens:** Relying solely on drag-drop without click/keyboard support
**How to avoid:** react-dropzone handles this, but test keyboard navigation. Include visible "Browse" button.
**Warning signs:** No focus outline on dropzone, can't trigger with Enter/Space

## Code Examples

Verified patterns from official sources and existing codebase:

### Custom Hook for Upload Flow
```typescript
// src/components/profile/upload/hooks/useFileUpload.ts
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

type UploadState =
  | { status: "idle" }
  | { status: "selected"; file: File }
  | { status: "uploading"; file: File; progress: number }
  | { status: "success"; file: File; storageId: string }
  | { status: "error"; file: File; error: string };

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const saveDocument = useMutation(api.upload.saveDocument);

  const selectFile = useCallback((file: File) => {
    setState({ status: "selected", file });
  }, []);

  const clearFile = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const upload = useCallback(async () => {
    if (state.status !== "selected") return;

    const { file } = state;
    setState({ status: "uploading", file, progress: 0 });

    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload with progress
      const storageId = await uploadWithProgress(
        file,
        uploadUrl,
        (progress) => setState({ status: "uploading", file, progress })
      );

      // Step 3: Save metadata
      await saveDocument({
        storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      setState({ status: "success", file, storageId });
    } catch (error) {
      setState({
        status: "error",
        file,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }, [state, generateUploadUrl, saveDocument]);

  const retry = useCallback(() => {
    if (state.status === "error") {
      setState({ status: "selected", file: state.file });
    }
  }, [state]);

  return { state, selectFile, clearFile, upload, retry };
}
```

### Progress Bar with Minimum Duration
```typescript
// Ensures progress bar is visible even for fast uploads
// Source: UX best practice pattern
function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

### Shake Animation on Error
```typescript
// Source: Existing codebase pattern in app.css
// Using the animate-shake class already defined
function ErrorMessage({ message, onDismiss }: Props) {
  const [shake, setShake] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShake(false), 150);
    return () => clearTimeout(timer);
  }, [message]); // Re-trigger on new error

  return (
    <div className={cn(
      "flex items-center gap-2 text-destructive text-sm",
      shake && "animate-shake"
    )}>
      <AlertCircle className="size-4" />
      <span>{message}</span>
      <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
        <X className="size-3" />
      </Button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom drag-drop events | react-dropzone hooks | 2020+ | Simplified API, better browser compat |
| XHR for all uploads | fetch() + XHR for progress | 2024 | fetch lacks upload progress, XHR still needed |
| External file storage | Convex built-in storage | Convex launch | No S3/R2 setup needed |

**Deprecated/outdated:**
- File reader API for upload: Not needed, POST file directly as body
- FormData for Convex uploads: Convex expects raw file body, not multipart

## Open Questions

Things that couldn't be fully resolved:

1. **Reveal animation design**
   - What we know: CONTEXT.md specifies "reveal animation - hidden element animates in to catch the file"
   - What's unclear: The specific visual design (character, shape, icon)
   - Recommendation: Claude's discretion per CONTEXT.md - implement with CSS transform/opacity animation, can be refined post-implementation

2. **Processing state visual distinction**
   - What we know: "Processing" should look different from "Uploading"
   - What's unclear: Exact animation style for processing
   - Recommendation: Use pulsing/breathing animation for processing vs linear progress for upload

## Sources

### Primary (HIGH confidence)
- Convex File Storage docs: https://docs.convex.dev/file-storage/upload-files
- react-dropzone docs: https://react-dropzone.js.org/
- Existing ASTN codebase: `src/components/ui/spinner.tsx`, `src/styles/app.css`
- Existing ASTN codebase: `src/components/profile/enrichment/ExtractionReview.tsx` - UI patterns

### Secondary (MEDIUM confidence)
- shadcn/ui dropzone examples (community, not official)
- XMLHttpRequest upload progress API (MDN)

### Tertiary (LOW confidence)
- None - all patterns verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Convex docs verified, react-dropzone is de facto standard
- Architecture: HIGH - Follows existing codebase patterns, Convex patterns documented
- Pitfalls: HIGH - Common patterns, verified against react-dropzone docs and Convex limits

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (stable libraries, 30-day validity)
