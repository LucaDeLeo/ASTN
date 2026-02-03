Now I have a comprehensive understanding of the codebase. Let me produce the implementation decisions analysis.

---

## Implementation Decisions

### **1. Guest Account Creation Mechanism**

- **Decision:** Use real `@convex-dev/auth` Password accounts (not Anonymous provider) for guests with a minimal signup flow (name + email only). Create a new `guestProfiles` table to store guest-specific data separately from full ASTN profiles.
- **Rationale:** The v1.5 requirements explicitly state "lightweight guest account" (GUEST-01). Password accounts provide persistent identity needed for: notifications, revisiting application status, and later conversion to full members. The Anonymous provider would lose identity on browser clear. Separating `guestProfiles` from `profiles` ensures guests don't trigger engagement scoring, matching, or CRM features (per research notes).
- **Confidence:** HIGH

---

### **2. Guest Visit Application Data Storage**

- **Decision:** Store guest visit applications as `spaceBookings` entries with `bookingType: 'guest'` and `status: 'pending'`. Create a new `visitApplicationResponses` table to store custom form field responses, linked by `spaceBookingId`.
- **Rationale:** The schema already has `bookingType: 'member' | 'guest'` and `status: 'pending' | 'rejected'` - this infrastructure was designed for Phase 33. Using the existing table keeps booking logic unified. Separate `visitApplicationResponses` table keeps form data cleanly separated and supports variable field schemas per org.
- **Confidence:** HIGH

---

### **3. Approval Workflow Pattern**

- **Decision:** Follow the `orgApplications` approval pattern: pending → approved/rejected status with `reviewedBy`, `reviewedAt`, and optional `rejectionReason`. Add `approvedBy: Id<'orgMemberships'>` to spaceBookings for guest bookings.
- **Rationale:** The orgApplications pattern is proven, well-tested, and familiar. It includes async notification via scheduler. Reusing this pattern reduces cognitive load and ensures consistency across the codebase.
- **Confidence:** HIGH

---

### **4. Public Visit Request Page Route**

- **Decision:** Create `/org/$slug/visit` as a public page (no auth required to view) that checks `guestAccessEnabled` flag, then prompts signup/login before form submission.
- **Rationale:** GUEST-07 requires "public visit request page" that non-members can access. The page itself is public, but submitting an application requires authentication (for notification delivery and status tracking). This mirrors how org application works (form is public-viewable, submission requires auth).
- **Confidence:** HIGH

---

### **5. Guest-to-Member Conversion Path**

- **Decision:** When a guest creates a full ASTN profile, pre-fill from `guestProfiles` by matching on `userId`. Set `guestProfiles.becameMember = true` and `convertedToProfileId = <profileId>`. Do NOT delete the guest profile (audit trail).
- **Rationale:** GUEST-08 requires "guest info pre-fills ASTN profile." Same userId means direct lookup. Keeping guest profiles preserves visit history for ADMIN-08 (guest conversion tracking). The `becameMember` flag enables quick conversion stats.
- **Confidence:** HIGH

---

### **6. Guest Visibility on Attendee View**

- **Decision:** Extend `getBookingAttendees` query to include guests with `status: 'confirmed'` (not 'pending'). For guests, return data from `guestProfiles` instead of `profiles` table, with a `isGuest: true` flag for UI differentiation.
- **Rationale:** GUEST-06 requires "guests appear on attendee view with same consent-based visibility." The consent is already captured in `spaceBookings.consentToProfileSharing`. Guests only appear after approval (confirmed status), not while pending.
- **Confidence:** HIGH

---

### **7. Notification Types**

- **Decision:** Add these notification types to schema:
  - `guest_visit_approved` — when org approves visit
  - `guest_visit_rejected` — when org rejects visit
  - `guest_visit_pending` — confirmation to guest that application received
- **Rationale:** GUEST-05 requires "guest notified of approval/rejection." Three types cover the full lifecycle. This matches the orgApplication notification pattern (approved/rejected).
- **Confidence:** HIGH

---

### **8. Custom Form Field Rendering**

- **Decision:** Render form fields from `coworkingSpaces.customVisitFields` dynamically. Store responses in `visitApplicationResponses` with `fieldId` + `value` pairs. Validate required fields in mutation.
- **Rationale:** GUEST-02/GUEST-03 require custom form fields. The `customVisitFields` schema was defined in Phase 31 with `type: text | textarea | select | checkbox`. Phase 33 just renders and submits these. JSON storage for responses keeps the schema stable.
- **Confidence:** HIGH

---

### **9. Batch Approval (GUEST-10)**

- **Decision:** Create `batchApproveGuestVisits` mutation that accepts array of booking IDs, validates org admin permission for each, and processes in a single transaction. Notifications scheduled separately per guest.
- **Rationale:** GUEST-10 requires batch approve. Convex mutations are transactional, so batch update is safe. Individual notifications ensure each guest gets their own message.
- **Confidence:** HIGH

---

### **10. Guest Profile Schema**

- **Decision:** `guestProfiles` table with:
  - `userId`, `name`, `email` (required)
  - `phone`, `organization`, `title` (optional)
  - `visitCount`, `firstVisitDate`, `lastVisitDate` (tracking)
  - `becameMember`, `becameMemberAt`, `convertedToProfileId` (conversion)
- **Rationale:** Minimal required fields match "lightweight" requirement. Tracking fields support GUEST-09 (visit history) and ADMIN-08 (conversion tracking). Conversion fields enable pre-fill and audit.
- **Confidence:** HIGH

---

### **11. Guest Authentication Guard**

- **Decision:** Create `requireGuestOrMember(ctx, spaceId)` helper that allows either org members OR users with `guestProfiles` to access certain endpoints. Guest-specific mutations check for pending/confirmed bookings.
- **Rationale:** Guests need authenticated access to check their application status, cancel pending applications, etc. A unified helper prevents code duplication while maintaining clear authorization boundaries.
- **Confidence:** MEDIUM — May need refinement based on exact endpoint requirements

---

### **12. Schema Modifications**

- **Decision:** Extend `spaceBookings` table with:
  - `approvedBy: v.optional(v.id('orgMemberships'))`
  - `approvedAt: v.optional(v.number())`
  - `rejectionReason: v.optional(v.string())`
- **Rationale:** These fields track the approval decision for guests, matching the orgApplications pattern. Optional because member bookings auto-confirm.
- **Confidence:** HIGH

---

## Uncertainties

### **Guest Signup UI Location**

> Should the guest signup happen on the `/org/$slug/visit` page itself (embedded form), or redirect to a separate `/signup/guest` page?

- **Option A (Recommended):** Inline signup form on `/org/$slug/visit` page with tab between "Sign in" and "Create account". Reduces friction.
- **Option B:** Redirect to `/login` with return URL. More consistent with existing auth flow but adds navigation step.

**Recommendation:** Option A for minimal friction, but need to verify this works with `@convex-dev/auth` Password provider.

---

### **Email Verification for Guests**

> Should guests verify their email before submitting a visit application?

- **Option A (Recommended):** No verification required before submission; verify later if they want notifications. Prioritizes conversion.
- **Option B:** Require email verification before form submission. Ensures valid contact info but adds friction.

**Note:** Existing org application flow doesn't require email verification.

---

## Claude's Discretion

- Exact field names in `visitApplicationResponses` table (e.g., `fieldId` vs `fieldKey`)
- Order of form fields in the guest visit application UI
- Specific validation error messages for invalid form data
- Whether to show capacity warnings to guests on the public visit page
- Toast notification copy for approval/rejection
- Animation timing for form submission feedback
- Mobile breakpoints for the visit application form layout

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:**
- **Timestamp:** 2026-02-03T05:22:05Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
