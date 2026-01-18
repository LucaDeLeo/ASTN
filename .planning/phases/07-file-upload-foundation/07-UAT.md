---
status: diagnosed
phase: 07-file-upload-foundation
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md
started: 2026-01-18T23:15:00Z
updated: 2026-01-19T00:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Drag PDF onto Upload Zone
expected: Drag a PDF file onto the upload zone. The zone should show a "reveal" animation with a Sparkles icon indicating it's ready to receive the file.
result: pass (fixed)
note: Originally failed - zone collapsed during drag. Fixed by keeping idle content rendered but invisible.

### 2. Drop PDF and See File Preview
expected: After dropping the PDF, you see a file preview showing the filename, file size, and buttons to remove or replace the file.
result: pass

### 3. Click to Browse for File
expected: Click the upload zone (or a button within it) to open the system file picker. Select a PDF and it appears in the preview.
result: pass

### 4. Upload Progress Indicator
expected: After selecting a file and initiating upload, a progress bar appears showing upload percentage that fills smoothly as the file uploads.
result: pass

### 5. File Size Limit Displayed
expected: The upload zone clearly displays "10MB" or similar text indicating the maximum file size before attempting upload.
result: pass

### 6. Reject Invalid File Type
expected: Try to drag a non-PDF file (like a .txt or image). The zone shows a rejection state (shake animation) and displays an error message.
result: pass

### 7. Text Paste Zone - Expand
expected: Click the "Or paste text instead" link (or similar). A textarea expands with animation to allow pasting career info.
result: pass

### 8. Text Paste Zone - Character Count
expected: Paste text into the textarea. A character count is displayed. If you paste very long text (>10k chars), a soft warning appears but doesn't block input.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
fixed: 1

## Gaps

- truth: "Upload zone maintains shape when dragging file over it"
  status: fixed
  reason: "User reported: the size is all wrong, it becomes a thin rectangle but it should mostly preserve the shape it has before. Or smoothly morph."
  severity: major
  test: 1
  root_cause: "Idle content conditionally unmounted when isDragActive=true. Reveal overlay is absolute-positioned so doesn't contribute height. Container collapses."
  fix_applied: "Changed to always render idle content but toggle visibility with opacity-0/invisible classes"
  commit: "aeb985e"
