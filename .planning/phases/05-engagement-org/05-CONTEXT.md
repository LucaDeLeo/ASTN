# Phase 5: Engagement + Org - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Two capabilities: (1) Email notifications to retain users — match alerts and weekly digests, (2) Org admin dashboard for BAISH visibility into members with aggregate stats and exports. The pilot targets BAISH as the initial org.

</domain>

<decisions>
## Implementation Decisions

### Email Triggers & Timing
- Daily batch for match alerts (not immediate, not weekly-only)
- Send match alert emails at 8-9 AM user local time
- Weekly digest sent Sunday evening
- Only "great" tier matches trigger alerts (not good/exploring)

### Email Content & Format
- Match alert emails include full detail: title, org, match explanation, AND recommendations ("what to do next")
- Weekly digest includes new matches + profile improvement nudges (not engagement stats)
- HTML emails with ASTN branding (logo, colors, buttons)

### Notification Preferences
- Ask users to set notification preferences during onboarding (not defaulted on/off)
- Moderate granularity: each notification type (alerts, digest) can be on/off plus frequency choice
- Dedicated /settings page for notification preferences (not in profile wizard)

### Org Membership Model
- Open + admin curation: anyone can join org, admins can remove members
- First user to create/join an org becomes initial admin
- Admins can promote other members to admin role (multiple admins allowed)
- Joining an org means admins can see your full profile (no opt-out from admin visibility)

### Org Invite System
- Admin has invite link to share for others to join
- When joining via invite, user is prompted to choose directory visibility

### Member Directory
- Org has member directory page (e.g., /org/baish)
- Members control their own visibility in directory
- Visibility prompt appears when joining org (ask, not defaulted)

### Org Dashboard Features
- View-only for membership (no add/remove through dashboard, just curate by removing)
- Export available: full profile data in CSV or JSON (admin choice)
- Aggregate stats: member count, skills distribution, profile completeness % (straightforward aggregates only)

### Claude's Discretion
- Email tone (professional vs warm — context-appropriate)
- Notification pause/snooze feature UX
- Invite link model (shareable vs single-use)
- Exact export field mapping
- Stats visualization approach

</decisions>

<specifics>
## Specific Ideas

- "Some orgs are just local community hubs and others are serious research labs" — model should accommodate both, but pilot focuses on BAISH as community hub
- Invite link workflow inspired by Discord/Slack join links
- Directory visibility is member-controlled, asked during join flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-engagement-org*
*Context gathered: 2026-01-18*
