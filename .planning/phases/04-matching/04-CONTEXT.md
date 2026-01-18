# Phase 4: Matching - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Smart matching between user profiles and opportunities. Users receive matched opportunities with explanations of why each fits, LLM-estimated probability of success, and personalized recommendations for improving fit. Match generation logic and UI display.

</domain>

<decisions>
## Implementation Decisions

### Match presentation
- Hybrid sorting: new high-fit matches prioritized, then by match strength
- Match strength shown as tier labels ("Great match" / "Good match" / "Worth exploring"), not percentages
- Standard card density: title, org, tier badge, location, 2-3 line explanation
- Group matches by tier (sections for each tier level)

### Explanation format
- Bullet point structure, not prose
- Include strengths + one actionable gap ("one thing that would strengthen your application")
- Encouraging tone ("This could be a strong fit...")
- Length: Claude's discretion based on match complexity (2-5 bullets)

### Probability display
- Dual framing: stage confidence on card ("Strong chance of interview"), candidate ranking in detail ("Likely top 20% of applicants")
- Small inline "(experimental)" label next to estimates
- Opt-out capability: Claude's discretion on whether to implement

### Recommendation style
- Mix of 1 specific action + 1-2 general guidance per match
- Placement: on match detail page AND aggregated in separate "Your growth areas" dashboard section
- Themed grouping: "Skills to build", "Experiences to gain"
- Same encouraging tone as match explanations for consistency

### Claude's Discretion
- Explanation length based on match complexity
- Whether to implement probability opt-out toggle
- Exact tier thresholds and cutoffs
- Loading and empty states
- Error handling

</decisions>

<specifics>
## Specific Ideas

- Probability should be about reaching stages in recruiting process, not just binary "acceptance"
- Candidate ranking framing as "top X% of applicants" provides competitive context
- Recommendations should be actionable enough that users know concrete next steps

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-matching*
*Context gathered: 2026-01-18*
