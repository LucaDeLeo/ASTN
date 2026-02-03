Now I have comprehensive context. Let me produce the implementation decisions analysis for Phase 30.

---

## Implementation Decisions for Phase 30: Platform Admin + Org Application

### Implementation Decisions

**1. Platform Admin Identity Model**
- Decision: Create a dedicated `platformAdmins` table with `userId` and `addedAt` fields, plus a `requirePlatformAdmin(ctx)` helper in `convex/lib/auth.ts`
- Rationale: Clean separation from org-level admin role. The existing `requireAnyOrgAdmin` checks if a user is admin of *any* org, but platform admin is a fundamentally different privilege (approving new orgs into ASTN). A separate table avoids overloading the org membership model and makes the platform admin concept explicit. Initial seeding via an internal mutation (same pattern as `bootstrapOrgAdmin`).
- Confidence: HIGH

**2. Org Applications as Separate Table (not extending `organizations`)**
- Decision: New `orgApplications` table with fields: `applicantUserId` (optional — allows unauthenticated submission), `applicantEmail`, `applicantName`, `orgName`, `description`, `city`, `country`, `website`, `reasonForJoining`, `status` (pending/approved/rejected/withdrawn), `rejectionReason`, `reviewedBy`, `reviewedAt`, `createdAt`
- Rationale: Applications are a distinct lifecycle from live orgs. Rejected applications shouldn't pollute the organizations table. Mirrors the `programParticipation` pattern where applications have their own status machine separate from the resource they reference. On approval, a new `organizations` record + `orgMemberships` admin record is created atomically in one mutation.
- Confidence: HIGH

**3. Application Status State Machine**
- Decision: `pending` → `approved` | `rejected` | `withdrawn`. No `draft` state. No re-submission after rejection.
- Rationale: Matches the simplicity principle from existing patterns (`programParticipation` uses pending/enrolled/completed/withdrawn/removed). For v1.5 scope, re-application can be handled by submitting a new application. The `withdrawn` state lets applicants cancel before review. Keeping it simple — 4 states, 3 transitions.
- Confidence: HIGH

**4. Duplicate Detection Strategy**
- Decision: Check for existing orgs and pending applications matching on normalized org name (case-insensitive, trimmed). No domain matching.
- Rationale: The success criteria says "submitting an application for an org that already exists or has a pending application is prevented." Name-based dedup is sufficient and implementable without requiring applicants to have a domain. Domain matching would be brittle (orgs may not have websites, or share domains). Use `.toLowerCase().trim()` comparison against both `organizations.name` and `orgApplications.orgName` where status ≠ rejected/withdrawn.
- Confidence: MEDIUM — may need to add fuzzy matching later if "AI Safety Hub Buenos Aires" vs "Buenos Aires AI Safety Hub" becomes an issue, but exact-normalized is the right starting point.

**5. Authentication for Application Submission**
- Decision: Require authentication before submitting an application. The form page itself is public (shows what's needed), but submission requires sign-in.
- Rationale: Success criteria #1 says "unauthenticated or authenticated user can submit." However, the applicant needs to receive notifications (criteria #3) and check status at a stable URL (criteria #4), both of which require a user identity. Requiring auth at submission time (not page load) keeps friction low while ensuring we can link the application to a user. The existing auth flow is fast (GitHub/Google OAuth).
- Confidence: MEDIUM — the requirement says "unauthenticated or authenticated." But practically, notification delivery and status checking require identity. If truly unauthenticated submission is needed, we'd need email-based status links, which adds scope.

**6. Platform Admin Routes Location**
- Decision: New routes at `/admin/applications` (list) and `/admin/applications/$id` (review detail), nested under existing `/admin/` route prefix. Application form at `/apply` (top-level, public-ish).
- Rationale: The existing `/admin/` prefix is already used for platform-wide admin tasks (opportunity management). Adding application review here is consistent. The apply form gets a clean top-level URL since it's a primary entry point for new orgs. Keeps org-specific routes (`/org/$slug/admin/`) separate from platform admin routes (`/admin/`).
- Confidence: HIGH

**7. Application Form Pattern**
- Decision: Plain `useState` per field, manual validation (check required fields non-empty), `toast` for feedback, `useMutation` for submission. No form library.
- Rationale: Every existing form in the codebase uses this pattern (opportunity form, program creation dialog, notification prefs). The application form has ~6 fields — not complex enough to warrant introducing react-hook-form. Consistent with codebase conventions.
- Confidence: HIGH

**8. Notification for Application Decisions**
- Decision: Extend the existing `notifications` table union type to include `org_application_approved` and `org_application_rejected`. Deliver in-app notifications with `actionUrl` pointing to the org config page (approved) or status page (rejected).
- Rationale: The notification infrastructure already exists with bell icon, unread counts, and action URLs. Adding two new notification types is minimal work and consistent with how event notifications work. No email for v1.5 — in-app only (matching current capabilities).
- Confidence: HIGH

**9. Application Status Page**
- Decision: Route at `/apply/status` — authenticated users see all their applications with current status. Each application shows status badge, submission date, and rejection reason if applicable.
- Rationale: Success criteria #4 requires a "stable URL" for checking status. A single page listing all the user's applications is simpler than per-application URLs and handles the case where someone applies for multiple orgs. Uses the same list pattern as other pages (cards with status badges).
- Confidence: HIGH

**10. Approval Side Effects**
- Decision: The `approveApplication` mutation atomically: (1) updates application status to `approved`, (2) creates the `organizations` record with data from the application, (3) creates an `orgMemberships` record with role `admin` for the applicant, (4) schedules a notification to the applicant. All in one Convex mutation (transactional).
- Rationale: Convex mutations are transactional — if any step fails, none persist. This prevents orphaned orgs or memberships. The applicant becomes the first admin automatically (matching existing pattern where first member becomes admin). Notification is scheduled via `ctx.scheduler.runAfter(0, ...)` to keep the mutation fast.
- Confidence: HIGH

**11. Review Queue UI Pattern**
- Decision: Table/card list with status filter tabs (All / Pending / Approved / Rejected), client-side pagination at 25 items, inline approve/reject buttons for pending items. Rejection requires a reason (modal/dialog with textarea).
- Rationale: Mirrors the member management table pattern in `/org/$slug/admin/members/`. Status tabs are more useful than a dropdown filter for a review queue where "Pending" is the primary view. Inline actions reduce clicks for the common case. Rejection reason is required by success criteria #3.
- Confidence: HIGH

---

### Uncertainties

> **Unauthenticated application submission**: The success criteria says "unauthenticated or authenticated user can submit." My proposed decision requires auth at submission time. This is a genuine tension.
> - Option A: Require auth at submission (proposed) — simpler, enables notifications and status checking natively
> - Option B: Allow truly unauthenticated submission with just email — requires email-based status check links, email notification delivery, and later account linking. Significantly more scope.
> - **Recommendation:** Option A unless the product intent is specifically to minimize friction for org founders who aren't ASTN users yet.

> **Platform admin seeding**: How should the first platform admin be designated?
> - Option A: Hardcoded email list in environment variable (e.g., `PLATFORM_ADMIN_EMAILS`) — simple, checked at query time
> - Option B: `platformAdmins` table seeded via internal mutation (like `bootstrapOrgAdmin`) — more flexible, can add/remove without redeploy
> - **Recommendation:** Option B (table + seed mutation), consistent with existing bootstrap patterns. The env var approach doesn't fit Convex's model well since env vars aren't reactive.

---

### Claude's Discretion

- Exact field ordering and layout of the application form (grouping, spacing)
- Whether the review queue uses a table (desktop) + card (mobile) dual layout or just cards — will follow the member list pattern which does both
- Index design on `orgApplications` table (likely `by_status`, `by_applicant`, `by_orgName`)
- Exact wording of validation error messages and toast notifications
- Whether to add a search/filter on the status page (probably unnecessary for v1.5 — applicants won't have dozens of applications)
- Badge color scheme for application statuses (will follow existing badge color conventions)

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:** 
- **Timestamp:** 2026-02-03T03:42:34Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
