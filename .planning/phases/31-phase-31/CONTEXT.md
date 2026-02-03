

Now I have comprehensive context. Let me synthesize the implementation decisions for Phase 31.

---

### Implementation Decisions

**1. Org Self-Configuration: Extend Existing `organizations` Table vs. New Table**
- Decision: Extend the existing `organizations` table with optional fields (`contactEmail`, `website`, `socialLinks`, `hasCoworkingSpace`)
- Rationale: The org record is already created during Phase 30 approval (in `orgApplications.ts` approve mutation). Adding optional fields keeps queries simple and avoids joins. `website` already exists as optional in the application form — it just needs to be carried forward during approval. The roadmap notes explicitly say to extend `organizations`.
- Confidence: HIGH

**2. Logo Upload: Convex Storage ID vs. External URL String**
- Decision: Store logo as `logoStorageId: v.optional(v.id('_storage'))` alongside the existing `logoUrl: v.optional(v.string())`. Use Convex's built-in file storage (`generateUploadUrl` pattern already in `convex/upload.ts`). Serve via `ctx.storage.getUrl(storageId)`.
- Rationale: The upload infrastructure already exists. Storing a `_storage` ID is more reliable than external URLs and keeps logos under our control. The existing `logoUrl` field can remain for backward compat or be populated from `getUrl()` at query time.
- Confidence: HIGH

**3. Configuration Wizard UX: Multi-Step Wizard vs. Single-Page Sectioned Form**
- Decision: Single-page sectioned form with visual section separators (same pattern as the `/apply` form), not a multi-step wizard with step indicators.
- Rationale: The codebase has no multi-step wizard pattern. The apply form uses a single page with `border-t pt-4 mt-4` section breaks. Phase 31 has only 4 config areas (logo/description, invite link, space definition, custom fields). A single scrollable form with save-per-section is simpler and matches existing patterns. The "wizard" language in requirements means "guided setup," not necessarily paginated steps.
- Confidence: MEDIUM — user might prefer actual step-by-step wizard for onboarding feel

**4. Onboarding Checklist: Computed vs. Stored**
- Decision: Compute checklist from org + space field completeness at query time, not a separate table.
- Rationale: The roadmap explicitly says "computed from org + space field completeness, not a separate table." This avoids sync issues between a checklist table and actual data. A `getOnboardingProgress` query inspects which optional fields are populated.
- Confidence: HIGH

**5. Bulk Invite: Email-Only Approach vs. CSV Upload**
- Decision: Textarea where admin enters multiple email addresses (one per line or comma-separated). Each email generates a notification/email invite. No CSV upload.
- Rationale: The requirement says "bulk-invite initial members by entering multiple email addresses" — this directly implies a textarea, not file upload. Existing invite flow is token-based (`orgInviteLinks` table with `createInviteLink` mutation). Bulk invite should send the existing invite link to each email via notification, not create per-email tokens.
- Confidence: HIGH

**6. Bulk Invite Delivery: In-App Notification vs. Email**
- Decision: Use the existing notification system (`createNotification` via scheduler). Since invitees may not have ASTN accounts yet, we also need to send email. However, the codebase has no email sending infrastructure (no Resend, SendGrid, etc.).
- Rationale: Without an email service, bulk invites to non-members can only generate invite links that the admin copies and shares manually (e.g., via their own email/Slack). We should generate a shareable invite link (already exists) and allow the admin to copy it for distribution. The "bulk invite by email" may need to be simplified to "generate invite link + show copy button" for now.
- Confidence: LOW — this is an uncertainty (see below)

**7. Co-working Space: Separate `coworkingSpaces` Table vs. Embedded in `organizations`**
- Decision: New `coworkingSpaces` table with its own schema, linked to org via `orgId`.
- Rationale: The roadmap explicitly calls for a `coworkingSpaces` table. An org could theoretically have multiple spaces (e.g., different floors, rooms). Even if v1.5 targets one space per org, a separate table keeps the schema clean and extensible. Fields: `name`, `orgId`, `capacity`, `operatingHours` (per day-of-week), `timezone` (IANA string), `guestAccessEnabled`, `customVisitFields`.
- Confidence: HIGH

**8. Operating Hours Data Model: Minutes-From-Midnight Per Day-of-Week**
- Decision: Store operating hours as `{ dayOfWeek: number, openMinutes: number, closeMinutes: number, isClosed: boolean }[]` — an array of 7 objects (0=Sunday through 6=Saturday). Use minutes-from-midnight integers.
- Rationale: The roadmap explicitly says "minutes-from-midnight to avoid timezone conversion bugs." This is a proven pattern. The IANA timezone stored separately handles display conversion. An array of 7 day objects is explicit and queryable.
- Confidence: HIGH

**9. Custom Visit Application Fields Schema**
- Decision: Store as an array of field definitions: `{ fieldId: string, label: string, type: 'text' | 'textarea' | 'select' | 'checkbox', required: boolean, options?: string[] }[]`. Predefined field types only, no arbitrary JSON schema.
- Rationale: The roadmap says "predefined field types (text, textarea, select, checkbox)" and "template approach." A simple array of typed field definitions is enough. Phase 33 will render these into a form. Keeping it simple avoids over-engineering — orgs can add a few questions like "What project are you working on?" or "Dietary restrictions" without needing a full form builder.
- Confidence: HIGH

**10. Route Structure for Configuration**
- Decision: Place the configuration wizard at `/org/$slug/admin/setup` (new route). Space configuration at `/org/$slug/admin/space` (new route). Both under the existing `/org/$slug/admin/` layout.
- Rationale: Follows the existing pattern (`/org/$slug/admin/members/`, `/org/$slug/admin/settings`). A dedicated `/setup` route for initial onboarding keeps it separate from ongoing settings management (Phase 34's ADMIN-05 will provide the ongoing settings view).
- Confidence: HIGH

**11. Timezone Selection: Dropdown with All IANA Zones vs. Curated List**
- Decision: Use `Intl.supportedValuesOf('timeZone')` to populate a searchable combobox. Pre-select based on browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Rationale: No new dependency needed — the Intl API is available in all modern browsers. Auto-detecting the admin's timezone reduces friction. A combobox (shadcn Select with search) handles the ~400 timezone list.
- Confidence: HIGH

**12. Plan Split: Backend-First Then Frontend**
- Decision: Split into two plans — 31-01 (Schema + Backend mutations/queries for org config and space definition) and 31-02 (Frontend: setup wizard UI, onboarding checklist, space configuration form).
- Rationale: Matches the Phase 30 pattern (30-01 was backend, 30-02 was frontend). Backend-first lets us validate schema and mutations before building UI.
- Confidence: HIGH

---

### Uncertainties

> **Bulk invite delivery mechanism** — The codebase has no email-sending infrastructure. The requirement says "bulk-invite initial members by entering multiple email addresses," which implies sending emails.
> - Option A: Scope down to "generate invite link + copy button" (admin distributes manually via their own channels). Simplest, no new deps.
> - Option B: Add a lightweight email service (Convex + Resend integration). Enables actual email invites but adds a dependency and API key requirement.
> - Option C: Build email sending as a separate Phase 31.5 concern and do Option A for now.

> **Wizard UX feel** — Should the setup flow be a literal multi-step wizard (with step indicators, next/back buttons, progress bar) or a single scrollable form with sections?
> - Option A: Single-page sectioned form (matches existing patterns, simpler).
> - Option B: Multi-step wizard with step indicators (better onboarding UX, but no existing pattern to follow — would be new UI infrastructure).

---

### Claude's Discretion

- Exact field validation rules (min/max lengths for description, capacity limits)
- Toast message copy for success/error states
- Specific shadcn components for each form field (Input vs Textarea thresholds)
- Whether the onboarding checklist shows as a sidebar, banner, or card on the admin dashboard
- Icon choices for checklist items and nav entries
- Mobile responsive breakpoints for the configuration forms (will follow existing admin page patterns)
- Whether to show operating hours as a grid (Mon-Sun rows) or individual day accordions

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:** 
- **Timestamp:** 2026-02-03T04:11:27Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
