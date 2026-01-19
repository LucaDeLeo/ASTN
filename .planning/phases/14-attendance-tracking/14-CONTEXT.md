# Phase 14: Attendance Tracking - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users confirm event attendance and provide feedback after events. System prompts users post-event, tracks responses, and displays attendance history. Engagement scoring based on attendance is Phase 15.

</domain>

<decisions>
## Implementation Decisions

### Post-event prompt timing
- Send "Did you attend?" notification 1 hour after event ends
- If no response, send follow-up next morning (9 AM user local time)
- Stop after 2 prompts — mark as "Unknown" if no response
- Use user's configured notification channel preferences (in-app, email, or both)

### Confirmation flow
- Three response options: Yes / No / Partial (attended part of it)
- Snooze button available — delays prompt to next morning
- Prompt appears in both notification center AND dashboard card for visibility
- Users can retroactively mark attendance for events in past 2 weeks only

### Feedback collection
- Feedback prompt appears immediately after confirming attendance (Yes or Partial)
- Feedback forms are admin-configurable with full form builder functionality
- Visibility per-form: admin can set to public, aggregated only, or anonymized
- Soft nudge before allowing skip ("Are you sure you don't want to share feedback?")

### Attendance history display
- Summary on user profile, full chronological list on dedicated page
- Full details per event: name, date, org, attendance status (full/partial), feedback given
- Most recent first

### Privacy model
- Host org ALWAYS sees attendance at their events (implicit consent from attending)
- User controls: whether attendance shows on public profile (other users can see)
- User controls: whether other orgs (not the host) can see their attendance

### Claude's Discretion
- Multi-day event handling (prompt after final day vs daily check-ins)
- Default feedback form if admin doesn't configure one (simple stars + optional text suggested)
- Exact timing logic for "1 hour after event ends" edge cases

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-attendance-tracking*
*Context gathered: 2026-01-19*
