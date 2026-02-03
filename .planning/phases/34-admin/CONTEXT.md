Now I have a comprehensive understanding of Phase 34 requirements and the existing codebase patterns. Let me analyze and document the implementation decisions.

## Implementation Decisions

**[1. Dashboard Structure - Unified vs. Separate Pages]**

- Decision: Extend existing `/org/$slug/admin/` dashboard with new co-working stats cards and add tabs/navigation to bookings-focused views within existing `/org/$slug/admin/guests.tsx` and a new bookings calendar page
- Rationale: The org admin dashboard (`/org/$slug/admin/index.tsx`) already has the "Co-working" quick action button linking to `/org/$slug/admin/space`. Following the established pattern, we should add a dedicated bookings/calendar admin page (e.g., `/org/$slug/admin/bookings`) for ADMIN-01, ADMIN-02, ADMIN-04, and add utilization stats to the main admin dashboard. ADMIN-03 (guest queue) is already at `/org/$slug/admin/guests.tsx`. This maintains the existing navigation patterns.
- Confidence: HIGH

**[2. Today's Bookings Overview Component (ADMIN-01)]**

- Decision: Create a `TodayBookings` component showing a summary card on the main admin dashboard, with full details accessible via the bookings page. Display confirmed member + guest bookings for current date with profile thumbnails and time ranges.
- Rationale: Follows the existing quick stats card pattern (memberCount, adminCount, etc.) on the admin dashboard. Full calendar view goes on dedicated bookings page.
- Confidence: HIGH

**[3. Calendar vs. List View for Upcoming Bookings (ADMIN-02)]**

- Decision: Provide both views with tabs on `/org/$slug/admin/bookings`. Use `react-day-picker` (already installed in Phase 32) for calendar view. List view shows chronological booking cards grouped by date.
- Rationale: The milestone explicitly calls for "calendar or list view". react-day-picker is already a project dependency and matches the member booking UI. Tabs pattern is established (see guests.tsx with TabsList/TabsContent).
- Confidence: HIGH

**[4. Booking History with Date Range Filtering (ADMIN-04)]**

- Decision: Add a "History" tab to the bookings page with date range picker (start date, end date inputs). Query uses existing `by_space_date` index with date range filter. Display past bookings including cancelled ones with status badges.
- Rationale: Follows the time range selector pattern from org admin dashboard (`TimeRange` state with Select component). Leverages existing spaceBookings indexes.
- Confidence: HIGH

**[5. Manual Booking Management (ADMIN-06)]**

- Decision: Add "Add Booking" button on bookings page opening a dialog with member selector (dropdown of org members) + date/time picker. Add cancel button to individual booking cards (admin can cancel any booking, not just their own). Create new mutations `adminCreateBooking` and `adminCancelBooking` in `convex/spaceBookings.ts` with `requireOrgAdmin` checks.
- Rationale: Matches the existing mutation pattern for admin operations (see `guestBookings.ts` approve/reject). Dialog pattern used throughout (see `CreateProgramDialog.tsx`).
- Confidence: HIGH

**[6. Space Settings in Admin Context (ADMIN-05)]**

- Decision: Keep space configuration at existing `/org/$slug/admin/space.tsx`. This requirement is already fulfilled by Phase 31 implementation.
- Rationale: The space.tsx page already provides capacity, hours, and custom guest form configuration. ADMIN-05 is "the ongoing admin management view for what Phase 31 creates" per the roadmap.
- Confidence: HIGH

**[7. Utilization Statistics (ADMIN-07)]**

- Decision: Create a new query `getSpaceUtilizationStats` returning: weekly/monthly utilization rates (bookings / capacity × days), peak days (day-of-week distribution), average daily bookings, and trend data. Display using existing `DistributionBar` component pattern from `OrgStats.tsx`. Add to main admin dashboard in a "Space Utilization" card.
- Rationale: Follows the OrgStats component patterns (distribution bars, percentage calculations). Stats live on main dashboard like engagement/completeness stats.
- Confidence: HIGH

**[8. Guest Conversion Tracking (ADMIN-08)]**

- Decision: Query `guestProfiles` where `becameMember = true` for this org's space visitors. Show as a stat card: "X guests converted to members (Y% conversion rate)". Requires joining guestProfiles with spaceBookings to filter by org.
- Rationale: The schema already has `becameMember` and `convertedToProfileId` fields on guestProfiles. Follow stat card pattern.
- Confidence: HIGH

**[9. CSV Export for Bookings (ADMIN-09)]**

- Decision: Create a `BookingExportButton` component following the exact pattern of `ExportButton.tsx`. Export columns: Date, Guest Name/Member Name, Email, Time Range, Status, Working On, Interested In, Created At, Approved By (for guests). Client-side CSV generation using the same `escapeCsvField` and `downloadBlob` helpers.
- Rationale: Direct reuse of established export pattern. Client-side generation avoids action complexity and works well for reasonable booking volumes.
- Confidence: HIGH

**[10. Guest Application Queue Location (ADMIN-03)]**

- Decision: Keep dedicated queue at `/org/$slug/admin/guests.tsx` which already exists. Add a link/badge to this page from the new bookings page showing pending application count. No changes needed to existing implementation.
- Rationale: Phase 33 already implemented the guest queue with batch operations. ADMIN-03 calls for "dedicated dashboard view" which exists.
- Confidence: HIGH

**[11. New Backend Queries Needed]**

- Decision: Create new queries in a new `convex/spaceBookings/admin.ts` file:
  - `getAdminBookingsForDateRange` - paginated bookings for calendar/list/history views
  - `getTodaysBookings` - today's confirmed bookings with profiles
  - `getSpaceUtilizationStats` - aggregated utilization metrics
  - `getGuestConversionStats` - conversion metrics for this org's guests
- Rationale: Follows file organization pattern (see `convex/orgs/admin.ts`). Keep admin queries separate from member-facing queries.
- Confidence: HIGH

**[12. New Route Structure]**

- Decision: Add `/org/$slug/admin/bookings.tsx` as the main bookings management page with tabs for Today/Calendar/List/History. Add link from admin dashboard quick actions.
- Rationale: Follows established route structure pattern. Keep bookings separate from guest management (guests.tsx) per the roadmap's explicit ADMIN-03 separation.
- Confidence: HIGH

### Uncertainties

> None requiring human input - all decisions can be resolved using established codebase patterns.

### Claude's Discretion

- Exact stat card layout and ordering on dashboard
- Whether to show mini calendar preview on main dashboard vs. just a link
- Specific column ordering in CSV export
- Whether history tab defaults to last 7 or 30 days
- Styling details for capacity utilization visualization (bar chart vs. percentage text)

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:**
- **Timestamp:** 2026-02-03T06:07:20Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
