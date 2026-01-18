---
status: resolved
phase: 03-profiles
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-01-18T01:35:00Z
updated: 2026-01-18T01:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navigate to Profile Wizard
expected: After logging in, clicking "Edit Profile" in the header dropdown navigates to /profile/edit with a 7-step wizard visible in the sidebar.
result: pass

### 2. Basic Info Step - Auto-Save
expected: Fill in name and location fields. Values save automatically after leaving each field (no save button needed). Refreshing the page shows the saved values.
result: pass

### 3. Education Step - Add Entry
expected: Click "Add Education" button. Fill in institution, degree, field. Entry appears in list. Saved immediately.
result: pass

### 4. Work History Step - Add Entry
expected: Click "Add Work Experience" button. Fill in company, title, dates. Entry appears in list. Saved immediately.
result: issue
reported: "Doesn't work, when I tab to go to the next field it deletes the entry"
severity: major

### 5. Goals Step - Interest Selection
expected: See list of AI safety interest areas. Click to select multiple interests. Selections are highlighted and saved.
result: pass

### 6. Skills Step - Taxonomy Autocomplete
expected: Click in skills input and start typing. Autocomplete dropdown shows matching skills from taxonomy with category badges. Arrow keys navigate, Enter selects.
result: pass

### 7. Skills Step - Custom Skill Entry
expected: Type a skill not in taxonomy (e.g., "My Custom Skill"), press Enter. Custom skill appears as chip. Saved to profile.
result: pass

### 8. Skills Step - Soft Limit Warning
expected: Add 10+ skills. Amber warning message appears suggesting to keep focused, but you can still add more.
result: pass

### 9. Enrichment Step - Start Conversation
expected: Navigate to Enrichment step. See welcome message from career coach. Type a message about your background and press Enter. AI responds conversationally.
result: issue
reported: "Error: Could not resolve authentication method. Expected either apiKey or authToken to be set. ANTHROPIC_API_KEY not configured in Convex environment."
severity: blocker

### 10. Enrichment Step - Extraction Review
expected: After a few messages, say something like "summarize what you've learned" or "update my profile". Extraction panel appears with suggested profile fields. Can accept, reject, or edit each extraction.
result: skipped
reason: Depends on Test 9 (enrichment conversation) which is blocked

### 11. Privacy Step - Default Visibility
expected: Navigate to Privacy step. See three visibility options as cards: Public, Connections (default selected), Private. Click to change default.
result: pass

### 12. Privacy Step - Section Overrides
expected: Below default visibility, see per-section dropdowns. Each shows "Use default (X)" initially. Can override individual sections.
result: pass

### 13. Privacy Step - Hide from Orgs
expected: See organization hiding section. Can search for orgs or browse list. Selected orgs appear as chips. These orgs won't see your profile.
result: pass

### 14. Complete Profile Flow
expected: On Privacy step, see "Complete Profile" button instead of Next. Click it. Success animation plays (party popper). Redirects to profile view page.
result: pass

### 15. View Profile Page
expected: Navigate to /profile. See read-only display of all saved profile data: name, location, education, work history, skills, goals.
result: pass

### 16. Wizard Progress Sidebar
expected: Sidebar shows all 7 steps with completeness indicators (checkmarks for complete sections). Can click any step to jump directly to it.
result: pass

## Summary

total: 16
passed: 13
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Work history entry persists when tabbing between fields"
  status: resolved
  reason: "User reported: Doesn't work, when I tab to go to the next field it deletes the entry"
  severity: major
  test: 4
  root_cause: "handleBlur() in WorkHistoryStep.tsx uses AND condition requiring both organization AND title to be non-empty. When user tabs after filling first field, entry is filtered out and deleted."
  artifacts:
    - path: "src/components/profile/wizard/steps/WorkHistoryStep.tsx"
      issue: "Line 89-91: AND condition filters out partially-filled entries"
  resolution: "Changed AND to OR in filter conditions (handleBlur, removeEntry, onCheckedChange)"
  fix_commit: "128c9ea"
  debug_session: ".planning/debug/work-history-delete-on-tab.md"

- truth: "LLM enrichment conversation works with Claude API"
  status: resolved
  reason: "User reported: Error - Could not resolve authentication method. ANTHROPIC_API_KEY not configured in Convex environment."
  severity: blocker
  test: 9
  root_cause: "ANTHROPIC_API_KEY environment variable not configured in Convex. Code is correct - this is user setup, not a bug."
  artifacts:
    - path: "convex/enrichment/conversation.ts"
      issue: "No code issue - needs env var configured"
  resolution: "API key configured via npx convex env set ANTHROPIC_API_KEY"
  debug_session: ".planning/debug/anthropic-api-key-config.md"
