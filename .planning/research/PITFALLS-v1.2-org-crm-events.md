# Pitfalls Research: Org CRM, Events, and Engagement (v1.2)

**Project:** AI Safety Talent Network - Milestone v1.2
**Domain:** Organization CRM, events management, attendance tracking, engagement scoring
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH (verified against Convex patterns and industry sources)

---

## Context

This research focuses on pitfalls specific to v1.2 features:
- Org discovery (geography-based suggestions, searchable list, invite links)
- Local events (orgs create events, members get configurable notifications)
- Post-event attendance flow ("Did you attend?" -> feedback form)
- Attendance tracked on member profiles
- Org dashboard as full CRM (member list, profiles, engagement history)
- LLM-computed engagement levels with admin override

The core v1.0/v1.1 pitfalls (cold start, profile decay, LLM hallucination, aggregation fragility, privacy) remain relevant and are documented in PITFALLS.md.

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or fundamental feature failure.

---

### Pitfall 1: Notification Fatigue Leading to Complete Disengagement

**What goes wrong:** Users receive too many notifications (event reminders, org updates, new matches, admin messages) and either disable all notifications or abandon the platform entirely. Studies show notification-overloaded users disengage completely rather than adjusting preferences.

**Why it happens:**
- Each feature (events, matches, org updates) adds "helpful" notifications without coordination
- Default notification settings are too aggressive
- No distinction between urgent and informational notifications
- No batching or digest options from day one
- Multiple orgs means multiplicative notification load

**Consequences:**
- Users turn off ALL notifications, missing genuinely important match alerts
- Engagement metrics collapse as users stop returning
- The "flywheel" of profile freshness breaks when users miss value-delivering notifications
- v1.0's core value proposition (smart matching + recommendations keeping profiles fresh) fails

**Prevention:**
1. Design notification system with batching/digest as default, not an afterthought
2. Implement notification budget per user per day (e.g., max 3 non-urgent)
3. Build granular preferences from the start: per-org, per-notification-type
4. Use smart throttling: suppress duplicate/similar notifications within time window
5. Implement quiet hours and timezone-aware delivery (already have timezone in profile)
6. Use a notification priority hierarchy:
   - URGENT: New high-fit match (immediate)
   - NORMAL: Event reminders, org updates (batched daily)
   - LOW: Digest items (weekly)

**Detection (warning signs):**
- Notification permission revocation rates increasing
- Declining email open rates week-over-week
- Users explicitly disabling notifications in settings
- Support requests complaining about "too many emails"
- Users who joined orgs but have notifications disabled

**Convex-specific consideration:**
Use scheduled functions (crons) to batch notifications rather than sending real-time on each event. The existing `notificationPreferences` in the profile schema already supports `weeklyDigest` - extend this pattern.

**Phase to address:** MUST be designed in the notification infrastructure phase, not bolted on later.

**Sources:** Courier.com guide on notification fatigue (2026), Atlassian notification management, Kannect community notification guide (2025), MagicBell notification fatigue research

---

### Pitfall 2: LLM Engagement Scoring Without Human Override Creates Trust Collapse

**What goes wrong:** Admins see engagement scores computed by LLM that feel wrong or unfair, have no way to understand why, and lose trust in the entire CRM system. Members who are highly engaged offline (in-person events, volunteer work, one-on-one conversations) appear as "low engagement" because the LLM only sees digital signals.

**Why it happens:**
- LLM scoring is opaque - no explanation of inputs/weights
- The model optimizes for measurable digital signals, missing offline engagement
- No mechanism for admins to correct obviously wrong scores
- No transparency to members about how they're being scored
- AI safety community is particularly sensitive to opaque AI systems

**Consequences:**
- Admins ignore the engagement system entirely (defeating the purpose)
- Members feel unfairly labeled, damaging trust in the platform
- CRM decisions made on flawed data lead to poor outreach targeting
- Potential ethical issues if engagement scores affect opportunity visibility

**Prevention:**
1. Design override mechanism from day one: admins can adjust scores with audit trail
2. Make scoring explainable: show what signals contributed to the score
   - "Profile updated: +10, Attended 2 events: +20, No activity in 60 days: -15"
3. Include manual engagement signals: admin can log "had coffee chat" as engagement
4. Allow members to see their own engagement factors (optional transparency)
5. Use LLM for suggestions/assistance, not final authority
6. Document that scores are "computed estimates" and can be overridden
7. Consider engagement "levels" rather than numeric scores to avoid false precision

**Detection (warning signs):**
- Admins not looking at engagement dashboard
- Complaints about "unfair" or "inaccurate" scores
- Visibly engaged members showing as inactive
- Admins asking "why is X scored so low?"
- Members questioning their engagement status

**Convex-specific consideration:**
Store both computed score and admin override as separate fields. Use a query that returns the override if present, computed otherwise. Log override history for audit.

```typescript
// Schema pattern
engagementScore: v.object({
  computed: v.number(),
  computedAt: v.number(),
  override: v.optional(v.number()),
  overrideBy: v.optional(v.id("orgMemberships")),
  overrideAt: v.optional(v.number()),
  overrideReason: v.optional(v.string()),
})
```

**Phase to address:** Must be architected during engagement scoring design phase; retrofitting transparency is hard.

**Sources:** Higher Logic engagement scoring myths, iMIS engagement scoring implementation guide, arXiv research on LLM-as-Judge inconsistencies (2025), TrustJudge paper on LLM scoring

---

### Pitfall 3: Post-Event Attendance Tracking That No One Completes

**What goes wrong:** The "Did you attend?" post-event flow has <10% completion rate, making attendance data unreliable. Engagement metrics based on incomplete attendance data are worse than no data at all because they're misleadingly incomplete.

**Why it happens:**
- Survey sent too late (>24 hours after event)
- Survey too long or asks for detailed feedback before confirming attendance
- No incentive to respond
- Survey looks like a marketing email and gets ignored
- Multiple events create survey fatigue (see Pitfall 1)

**Consequences:**
- Attendance records are incomplete and unreliable
- Engagement scores based on spotty data are misleading
- Org admins can't trust the CRM data
- The "self-maintaining" CRM promise fails
- Members who always attend appear less engaged than those who respond to surveys

**Prevention:**
1. **Separate attendance confirmation (1-click) from feedback (optional follow-up)**
   - First: "Did you attend [Event Name]? [Yes] [No]" - one click, done
   - Later (if Yes): "Want to share feedback? [Give Feedback] [Skip]"
2. Send attendance confirmation within 2-4 hours of event end
3. Make confirmation dead simple: single-tap from email/notification
4. Don't batch attendance confirmations - send individually per event
5. Consider incentives: profile completeness boost, "active member" badge
6. Use multiple channels: in-app notification + email, let user choose
7. Pre-populate attendance for check-in events (QR code at door)
8. Send reminder 24h later if no response, then accept "unknown" and move on

**Detection (warning signs):**
- Attendance confirmation rate below 30%
- Long delay between event end and attendance logging
- Members complaining about survey spam
- Orgs questioning attendance data accuracy
- Feedback rates much lower than confirmation rates

**Convex-specific consideration:**
Design the data model to track:
- RSVP status (yes/no/maybe)
- Attendance status (confirmed_attended, confirmed_not_attended, no_response)
- Confirmation timestamp (to measure response time)
- Feedback (separate, optional)

**Phase to address:** Events phase - design the flow before building the feedback system.

**Sources:** Explori survey best practices, ASAE post-event surveys guide (2024), SurveySensum post-event feedback analysis (2025), SurveyMonkey event survey guide

---

### Pitfall 4: Real-Time CRM Dashboard Creates Performance/Cost Explosion

**What goes wrong:** The org dashboard subscribes to every member's profile, events, and attendance in real-time. With 50+ members, this creates hundreds of active Convex subscriptions, causing slow load times and exceeding bandwidth quotas.

**Why it happens:**
- Convex's reactivity is powerful but expensive for aggregate views
- Dashboard naively subscribes to each member's full profile
- No pagination or virtualization for member lists
- Every profile update triggers re-renders for all admins viewing dashboard
- Real-time updates on aggregate stats cause constant re-computation

**Consequences:**
- Dashboard becomes unusably slow at scale (>3s load time)
- Convex bandwidth costs spike unexpectedly
- Admins avoid the dashboard due to poor performance
- May hit rate limits during high-activity periods (e.g., post-event)

**Prevention:**
1. **Don't use real-time subscriptions for aggregate CRM views** - use periodic refresh or pull-to-refresh
2. Implement server-side pagination for member lists (Convex cursor-based pagination)
3. Create summary/aggregate queries that return counts/stats, not full records
4. Use indexes aggressively: `by_org`, `by_engagement_tier`, `by_last_active`
5. Consider denormalized "org stats" document updated via mutations:
   ```typescript
   orgStats: defineTable({
     orgId: v.id("organizations"),
     memberCount: v.number(),
     activeCount: v.number(), // active in last 30 days
     avgEngagement: v.number(),
     updatedAt: v.number(),
   })
   ```
6. Fetch full profile data only when admin clicks into a member detail view
7. Use virtual scrolling for member lists (TanStack Virtual)

**Detection (warning signs):**
- Dashboard load time >2 seconds
- Convex dashboard showing high bandwidth usage when admins are active
- Console warnings about too many subscriptions
- Users reporting "laggy" or "slow" dashboard experience
- Cost spikes correlated with admin dashboard usage

**Convex-specific consideration:**
The existing schema has good indexes (`by_org`, `by_user`). For CRM:
- Add index on `orgMemberships` by `[orgId, lastActive]` for sorting
- Consider `useQuery` with `{ enabled: false }` for expensive queries, manually trigger refresh
- Use Convex actions for expensive aggregations that don't need real-time

**Phase to address:** CRM dashboard architecture phase - decide query patterns before building UI.

**Sources:** Convex Stack article on real-time database patterns, Convex Discord discussions on subscription limits, Convex tutorial on scaling, Convex GitHub issue #95 on bandwidth concerns

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded user experience.

---

### Pitfall 5: Invite Link Security Vulnerabilities

**What goes wrong:** Invite links become a vector for unauthorized access, spam accounts, or org infiltration. Links get shared publicly (posted on Twitter, forums), expire inappropriately, or don't track who invited whom for accountability.

**Why it happens:**
- Invite tokens are guessable or predictable (sequential IDs, timestamps)
- No expiration or single-use options
- No audit trail of invite usage
- Links work forever even after admin who created them leaves
- No rate limiting on invite redemption
- No mechanism to revoke compromised links

**Consequences:**
- Unauthorized users join private orgs
- Spam/bot accounts infiltrate communities
- No accountability for who invited problematic members
- Admins lose control over org membership
- AI safety community (security-conscious) loses trust

**Prevention:**
1. Use cryptographically random tokens (UUID v4 minimum)
2. Default to expiring invites (7 days) with admin option to extend or make permanent
3. Track invite creator and redemption in audit log (already have `createdBy` in schema)
4. Invalidate all invites when creator loses admin role (or make this configurable)
5. Rate limit invite redemption per IP (e.g., 3 per hour per IP)
6. Allow admins to revoke specific invite links
7. Consider requiring admin approval for new members (optional org setting)
8. Show invite link usage stats: "This link has been used X times"

**Detection (warning signs):**
- Unusual spike in new members from single invite link
- Members from unexpected locations/patterns
- Multiple accounts from same IP using invite links
- Reports of invite links shared publicly

**Schema consideration:**
The current `orgInviteLinks` table has `token`, `createdBy`, `expiresAt`. Consider adding:
- `usageCount: v.number()`
- `maxUses: v.optional(v.number())`
- `revokedAt: v.optional(v.number())`

**Phase to address:** Org discovery/invite links phase.

---

### Pitfall 6: Geography-Based Suggestions Expose Location Privacy

**What goes wrong:** The org discovery feature suggests orgs based on user location, but this inadvertently reveals location data to org admins or leaks through API responses. Privacy-conscious AI safety community members are particularly sensitive to location tracking.

**Why it happens:**
- Location stored at city level is still identifying for small communities
- API returns location data that frontend filters (leaky abstraction)
- Org admins can see "nearby potential members" (exposes user locations)
- No clear consent for location-based features
- Location inferred from IP even when not explicitly provided

**Consequences:**
- Users feel surveilled ("how did they know I'm in Buenos Aires?")
- Trust damage in privacy-focused AI safety community
- Potential GDPR/privacy regulation issues (location is PII)
- Users provide fake locations, breaking the feature entirely
- Users disable location sharing, reducing feature value

**Prevention:**
1. Explicit consent for location-based suggestions with clear explanation
   - "Enable location-based org suggestions? We'll suggest orgs in your area."
2. Use coarse location (country/region) for suggestions, not city
3. **Never expose user location to org admins** through discovery features
4. Filter on backend, not frontend - don't send location data to client
5. Allow users to opt out of location-based discovery entirely
6. Consider "interest-based" discovery as alternative/complement to geography
7. Don't auto-detect location from IP - require explicit input
8. Add to privacy settings: "Show me in location-based suggestions: Yes/No"

**Detection (warning signs):**
- User complaints about privacy or "how did you know where I am"
- Users entering obviously fake locations ("Antarctica")
- Low opt-in rate for location features (<30%)
- Location field left blank more often than other fields

**Schema consideration:**
The current `profiles` table has `location: v.optional(v.string())`. For v1.2, consider:
- Separate `locationDisplay` (what user wants shown) from `locationRegion` (for matching)
- Add `locationConsent: v.boolean()` for location-based features
- Consider storing region/country separately from city

**Phase to address:** Org discovery phase - design privacy model before building feature.

**Sources:** FTC location data protection guidance (2024), Carnegie Mellon location-sharing privacy research, arXiv privacy risk in GeoData survey (2024)

---

### Pitfall 7: Event RSVP No-Shows Destroy Event Planning

**What goes wrong:** 40-60% of RSVPs don't show up for free community events, making it impossible to plan capacity, catering, or venue size. This wastes org resources and frustrates consistent attendees who can't get spots.

**Why it happens:**
- No cost to RSVP, so people RSVP speculatively ("maybe I'll go")
- No reminder system or reminders ignored
- No consequences for repeated no-shows
- RSVPs made too far in advance (plans change)
- No waitlist to backfill cancellations
- Social pressure to RSVP yes even when uncertain

**Consequences:**
- Orgs over-provision (wasted resources) or under-provision (poor experience)
- Event hosts lose trust in RSVP data
- Engaged members frustrated by "full" events that aren't actually full
- Org admins stop using the platform for events
- No-show members appear engaged (RSVP'd) when they're not

**Prevention:**
1. Send reminder 24h and 2h before event with **easy cancel option prominent**
   - "Can't make it anymore? [Cancel RSVP]" should be as easy as confirming
2. Track no-show history on member profiles (visible to admins only)
3. Implement waitlist with automatic promotion when spots open
4. Consider "commitment" mechanisms:
   - "This event has limited spots. Please only RSVP if you're confident you can attend."
5. Allow "Maybe/Interested" responses that don't count toward capacity
6. Close RSVPs 24-48h before event to encourage commitment
7. Show historical attendance rate: "You've attended 3 of 5 events you RSVP'd to"
8. For repeat no-shows, require confirmation: "You've missed your last 2 RSVPs. Are you sure?"

**Detection (warning signs):**
- RSVP-to-attendance ratio below 60%
- Org admins complaining about planning uncertainty
- Events consistently under/over capacity
- Engaged members complaining about "full" events
- Waitlisted members who would have attended miss out

**Schema consideration:**
Events table will need:
```typescript
eventRsvps: defineTable({
  eventId: v.id("events"),
  userId: v.string(),
  status: v.union(
    v.literal("going"),
    v.literal("maybe"),
    v.literal("not_going"),
    v.literal("waitlist")
  ),
  rsvpAt: v.number(),
  cancelledAt: v.optional(v.number()),
  attended: v.optional(v.boolean()), // confirmed post-event
  attendanceConfirmedAt: v.optional(v.number()),
})
```

Track at profile level:
```typescript
// In orgMemberships or separate table
eventStats: v.object({
  rsvpCount: v.number(),
  attendedCount: v.number(),
  noShowCount: v.number(),
})
```

**Phase to address:** Events phase - RSVP system design.

**Sources:** Glue Up RSVP no-show reduction guide (2025), Skift Meetings no-show analysis (2025), SocioPlace RSVP management (2025)

---

### Pitfall 8: Member Directory Search Performance at Scale

**What goes wrong:** Org admin searches for members by name/skill/location using client-side filtering, which becomes unusable at 100+ members. Search is slow, results incomplete, and filtering doesn't work as expected.

**Why it happens:**
- Initial implementation fetches all members to client and filters
- Text search without proper indexes is slow
- Multiple filter criteria (name + skill + location) compound the problem
- Pagination not implemented for search results
- Search doesn't handle typos or variations

**Prevention:**
1. Use Convex search indexes from the start (already have `searchIndex` pattern in schema)
2. Implement server-side filtering and pagination
3. Build for 1000 members even if starting with 50 (BAISH pilot)
4. Add indexes for common filter combinations
5. Consider faceted search for large orgs (show counts per filter)
6. Handle partial matches and typos (Convex search supports this)

**Schema consideration:**
Current `profiles` table has `searchIndex("search_name", { searchField: "name" })`. For CRM:
- Add search on skills, location
- Create composite query for filtered member search
- Use cursor-based pagination

**Phase to address:** CRM dashboard phase.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rework.

---

### Pitfall 9: Event Timezone Confusion

**What goes wrong:** Events display in wrong timezone for users, causing missed events or confusion. Particularly problematic for global AI safety community with members across timezones.

**Prevention:**
1. Store all event times in UTC
2. Display in user's configured timezone (already have `timezone` in `notificationPreferences`)
3. Show timezone explicitly: "2:00 PM PST (5:00 PM your time)"
4. Send reminders in user's timezone
5. Handle daylight saving transitions (use IANA timezone names, not offsets)
6. For online events, consider showing multiple timezones

**Phase to address:** Events phase - data model and display.

---

### Pitfall 10: Engagement History Without Drill-Down Context

**What goes wrong:** Admin sees "attended 3 events" but can't see which events or when. The engagement history is counters, not a log. Can't understand the engagement pattern.

**Prevention:**
1. Store engagement as timestamped events, not just counters
2. Allow drilling into engagement details: "Click to see events attended"
3. Include context: event name, date, any feedback given
4. Show engagement timeline visualization
5. Export engagement history for reporting

**Schema consideration:**
```typescript
engagementEvents: defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),
  type: v.union(
    v.literal("event_rsvp"),
    v.literal("event_attended"),
    v.literal("profile_updated"),
    v.literal("feedback_given"),
    v.literal("admin_logged") // manual entry by admin
  ),
  referenceId: v.optional(v.string()), // event ID, etc.
  timestamp: v.number(),
  notes: v.optional(v.string()),
}).index("by_user_org", ["userId", "orgId"])
  .index("by_org_recent", ["orgId", "timestamp"])
```

**Phase to address:** Engagement scoring phase - data model.

---

### Pitfall 11: Org Admin Permissions Without Audit Trail

**What goes wrong:** Admin makes changes (removes member, changes roles, overrides engagement) but there's no record of who did what. When issues arise, can't determine what happened.

**Prevention:**
1. Log all admin actions with timestamp, actor, and details
2. Make audit log visible to admins (for accountability)
3. Consider immutable audit log (append-only)
4. Include in audit: member removals, role changes, invite link actions, engagement overrides

**Phase to address:** CRM dashboard phase.

---

## Phase-Specific Risk Summary

| Phase | Likely Pitfall | Risk Level | Mitigation Priority |
|-------|---------------|------------|---------------------|
| Org Discovery | Location privacy exposure (#6) | HIGH | Design consent model first |
| Org Discovery | Invite link security (#5) | MEDIUM | Secure tokens, expiration, audit |
| Events | Post-event tracking abandonment (#3) | CRITICAL | 1-click confirmation, separate from feedback |
| Events | RSVP no-shows (#7) | HIGH | Reminders + waitlist + history |
| Events | Timezone confusion (#9) | LOW | UTC storage, local display |
| CRM Dashboard | Performance explosion (#4) | CRITICAL | No real-time for aggregates |
| CRM Dashboard | Search scaling (#8) | MEDIUM | Server-side search from day one |
| CRM Dashboard | Missing audit trail (#11) | LOW | Log admin actions |
| Engagement Scoring | LLM trust collapse (#2) | HIGH | Explainability + override |
| Engagement Scoring | History without context (#10) | MEDIUM | Log events, not counters |
| Notifications | Notification fatigue (#1) | CRITICAL | Budget + batching + preferences |

---

## Convex-Specific Technical Warnings

### Subscription Costs for Dashboard Views

The current schema has good indexes. For CRM:
- **DO NOT** create a query that subscribes to all members' full profiles
- **DO** use aggregation queries that return only needed fields
- **DO** implement virtual scrolling (TanStack Virtual) for member lists
- **DO** consider denormalized stats documents updated on changes

### Existing Schema Extensions Needed

Current `orgMemberships` is well-structured. For v1.2, consider adding:
```typescript
// To orgMemberships
lastActive: v.optional(v.number()), // for sorting/filtering
engagementTier: v.optional(v.union(
  v.literal("highly_engaged"),
  v.literal("engaged"),
  v.literal("at_risk"),
  v.literal("inactive")
)),
```

Events table needed (new):
```typescript
events: defineTable({
  orgId: v.id("organizations"),
  title: v.string(),
  description: v.optional(v.string()),
  startTime: v.number(), // UTC timestamp
  endTime: v.optional(v.number()),
  location: v.optional(v.string()),
  isOnline: v.boolean(),
  onlineUrl: v.optional(v.string()),
  capacity: v.optional(v.number()),
  rsvpDeadline: v.optional(v.number()),
  createdBy: v.id("orgMemberships"),
  createdAt: v.number(),
})
.index("by_org", ["orgId"])
.index("by_org_upcoming", ["orgId", "startTime"])
```

### Real-Time vs Polling Trade-offs

| Feature | Real-Time? | Rationale |
|---------|-----------|-----------|
| Member list in dashboard | No | Too many subscriptions; use pagination + refresh |
| Event RSVP count | Yes | Single number, low bandwidth |
| Individual member detail | Yes | Single subscription when viewing |
| Engagement score changes | No | Batch compute, not real-time |
| New event notifications | Via scheduled function | Batch, not real-time push |

---

## Relationship to v1.0/v1.1 Pitfalls

Several v1.0/v1.1 pitfalls from PITFALLS.md interact with v1.2 features:

| v1.0/v1.1 Pitfall | v1.2 Interaction |
|-------------------|------------------|
| Profile Decay (#2) | Engagement scoring can detect decay; events create update prompts |
| Privacy Violations (#5) | Location-based discovery adds new privacy surface |
| LLM Hallucination (#3) | LLM engagement scoring adds new hallucination risk |
| Disintermediation (#7) | Org features may increase retention through community |

---

## Sources

**Notification Fatigue:**
- Courier.com: "How to Reduce Notification Fatigue: 7 Proven Product Strategies" (2026)
- MagicBell: "Conscious Design: Help Users Avoid Notification Fatigue" (2025)
- Atlassian: "FOMO vs info: managing notification overload" (2025)
- Kannect: "6 Tips to Engage Members Without Overwhelming Them" (2025)

**Engagement Scoring:**
- iMIS Blog: "How to Implement Member Engagement Scoring" (2025)
- Higher Logic: "5 Myths About Measuring Member Engagement"
- Marketing General: "The Why and How of Member Engagement Scoring"
- Appcues: "5 Fatal User Engagement Metric Mistakes"
- arXiv: "TrustJudge: Inconsistencies of LLM-as-a-Judge" (2025)

**Event Management:**
- Glue Up: "How to Reduce Your Event RSVP No-Show Rate" (2025)
- Skift Meetings: "No-Shows Create Stress, Wreak Havoc on Events" (2025)
- Sched: "7 Common Mistakes Event Planners Make When Gathering Feedback" (2025)
- EventX: "Event Attendance Tracking: 5 Methods for 2025 Success"

**Post-Event Surveys:**
- Explori: "5 Top Tips To Increase Your Post-Event Survey Response Rates"
- ASAE: "5 Best Practices for Creating and Sharing Post-Event Surveys" (2024)
- SurveySensum: "Post Event Feedback Survey: Why Most Fail" (2025)

**Location Privacy:**
- FTC: "Protecting consumers' location data: Key takeaways" (2024)
- arXiv: "Privacy risk in GeoData: A survey" (2024)
- Carnegie Mellon: "Location-Sharing Technologies: Privacy Risks and Controls"

**CRM/Membership Management:**
- Higher Logic: "How to Get Customers or Members to Complete Profiles"
- Neon One: "Best Membership Management Software for Nonprofits 2026"
- Agile Growth Labs: "7 Common CRM Problems and Their Solutions" (2025)

**Convex-Specific:**
- Convex Stack: "A Guide to Real-Time Databases"
- Convex Stack: "Optimize Transaction Throughput: 3 Patterns for Scaling"
- Convex Docs: "Scaling Your App" tutorial
- Convex Discord: Discussions on subscription limits and bandwidth

---

*Pitfalls research for: ASTN v1.2 - Org CRM, Events, Engagement*
*Researched: 2026-01-19*
