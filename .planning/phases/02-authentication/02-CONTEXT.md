# Phase 2: Authentication - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely sign up and log in using Google OAuth, GitHub OAuth, or email/password. Sessions persist across browser refresh. Uses existing Convex Auth infrastructure (providers already configured in convex/auth.ts).

</domain>

<decisions>
## Implementation Decisions

### Sign-up/Login Flow

- Dedicated /login page (not modal or inline)
- Combined sign-in/sign-up with tabs on single page
- OAuth buttons first, then "or continue with email" divider, then email/password form
- Password requirements: 8+ characters with mixed case and number

### Post-Auth Behavior

- First-time users → redirect to profile setup
- Returning users → redirect to dashboard/home
- Avatar dropdown in header when logged in
- Dropdown items: Profile, Settings, Logout

### Error Handling

- Generic credential errors: "Invalid email or password" (don't reveal which is wrong)
- Password reset flow: email-based "Forgot password?" link
- Server errors: inline form error with subtle shake animation
- Error styling uses muted coral/red blend, not harsh red

### Account Linking

- Smart suggestion when email exists with different provider
- Show inline contextual hint: "Looks like you've signed in with Google before. [Continue with Google] or [use password instead]"
- Use coral-tinted info card (helpful tone, not error styling)

### Visual Presentation

- Centered form card on subtle gradient background (warm gray → coral tint at edges)
- Very subtle noise grain texture (2-3% opacity) for warmth
- Logo only above form (no tagline)
- OAuth buttons: branded with provider logo + "Continue with [Provider]"
- Full-form frosted glass overlay during loading (backdrop-blur + coral tint at 80%)
- Card: generous padding (40-48px), soft shadow with coral undertone, rounded corners (12-16px)

### Claude's Discretion

- Exact animation timings and easing curves
- Form field spacing and typography scale
- Tab component implementation details
- Specific error message wording beyond the patterns above

</decisions>

<specifics>
## Specific Ideas

- Loading overlay should use frosted glass effect (backdrop-blur) rather than solid overlay
- Error shake animation: gentle horizontal (150ms, 2-3 oscillations)
- Use OKLCH color format for error states (consistent with existing coral accent approach)
- "or" divider between OAuth and email form with ample spacing (32px minimum)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 02-authentication_
_Context gathered: 2026-01-17_
