# TODO

> For detailed UX audit with page-by-page breakdowns, see [`.planning/review/ux-review.md`](.planning/review/ux-review.md)

---

## Bugs

- [ ] Location doesn't work — _partially fixed: `formatLocation.ts` handles period→comma, but edge cases remain with inconsistent source data_
- [x] Some matches are duplicated — _fixed: fuzzy dedup in `convex/aggregation/dedup.ts` + match mutation duplicate prevention_
- [ ] Location string formatting inconsistent ("San Francisco Bay Area.USA" — period instead of comma) — _partially fixed: `formatLocation()` handles this case, but source data still varies across aggregators_
- [ ] Bottom mobile nav bar sometimes visible on desktop — _`MobileShell` is gated by `useIsMobile()` hook but `BottomTabBar` has no defensive `md:hidden` class; likely a hydration/resize race condition. One-line fix: add `md:hidden` to the `<nav>` in `bottom-tab-bar.tsx`_

---

## LLM / Matching Quality

- [x] Extraction biased toward technical profiles — ignores governance/policy interests, prioritizes short courses over actual degrees and current work experience _(Augusto: BlueDot courses weighted more than his Sociology degree and current comms/governance role)_
- [ ] Matches skew too senior and too technical — suggests AI Engineer / Research Manager to beginners, scarce governance/communications options _(Augusto)_
- [x] Need more tags for non-technical profiles (governance, policy, communications, operations)
- [x] "Research communications" as the only communications tag is too narrow _(Augusto)_
- [ ] Match explanations repeat info you already know — make them conciser, get to the point faster
- [x] Model feels sycophantic in enrichment chat _(Augusto)_
- [ ] Put better info about the org in each match — _schema only stores org name + logo, no description/mission fields_

---

## Chat / Enrichment Experience

- [x] Chat input box too small — should be multi-line like WhatsApp Web, not a single line _(Augusto)_
- [x] Can't do line breaks when chatting — need Shift+Enter for newlines _(Augusto)_
- [x] Add streaming to chat
- [x] Extract info in a better, clearer way
- [x] Consider moving chat to its own separate section/page — _moved to persistent sidebar; `/profile/agent` is a legacy redirect_
- [x] Robustify chatbot prompt so it knows PDFs/CVs can be read and processed — _added document processing capability and CV/resume mention to system prompt_
- [x] Agent should explain its own capabilities to the user (what it can do, file uploads, etc.) — _system prompt now lists all 5 capabilities and instructs agent to mention them when asked_
- [x] Improve mobile LLM chat view — _responsive bubbles (95%/80%), touch-target buttons, responsive padding, safe-area inset for notched devices_

---

## Profile Agent UX

- [x] Tool call cards too wide and visually heavy — compact with max-width, truncation, color-coded icons
- [x] Tool calls grouped above message text — now render inline via `message.parts` ordering
- [x] Tool call labels don't match profile section labels — updated to "Updated skills", "Updated looking for", etc.
- [x] No visual feedback when profile sections change — highlight ring animation + auto-scroll to changed section
- [x] Page-level scroll bar on agent page — fixed with `h-screen overflow-hidden` on GradientBg

---

## Onboarding / Profile Flow

- [ ] Should prompt profile creation immediately upon landing (when not signed up)
- [x] Fix the flow for editing your profile (heading says "Create" even when editing) — _fixed: `ProfileSectionCard` uses dynamic title props_
- [ ] Make privacy and notification preferences an explicit part of onboarding; unify all settings and make them easily accessible
- [ ] Revamp entire profile + settings flow — `/settings` route now exists with notification prefs, privacy, and location toggle, but still needs a unified UX pass tying profile editing + settings together
- [x] Add info to landing page explaining it's a prototype and what features are available — _"Prototype" badge in hero section_
- [ ] Add application form fields as standard profile fields — career stage, fields of study, location, profile URL / LinkedIn, other profile link, proudest achievement, AI safety engagement, relevant skills. Pre-fill applications from profile and keep profile as the canonical source.
- [ ] Robustify LinkedIn link parser — _backend `validateLinkedInUrl()` in `convex/extraction/linkedin.ts` is solid (handles protocol, subdomains, query params, normalizes to canonical form). **Frontend** regex in `LinkedInImport.tsx` is the weak link: just checks `linkedin.com/in/` loosely, doesn't handle `/pub/` legacy URLs. Fix frontend to match backend robustness._
- [ ] When a user gets linked from BAISH CRM, prompt them to upload their CV — _no referral URL params exist (`?ref=`, `?source=`). BAISH import is server-side only (`baishImport.ts` pulls from Airtable). Users arriving from BAISH get no special onboarding flow or CV prompt._

---

## Opportunities / Matches UX

- [ ] Maybe remove opportunities as a standalone page, simplify to a directory list
- [x] Move "your next steps" to its own section — _implemented as "Your Next Moves" in `CareerActionsSection`_
- [ ] Add visa/residency/citizenship eligibility filters — some positions require NDAs or citizenship _(Augusto: RAND example)_ — _work authorization exists in profile match prefs but not as a browsable filter on opportunities page_
- [x] Replace "Not Found" salary displays — hide or say "Salary not listed" — _both `MatchCard` and `OpportunityCard` check before rendering_
- [x] Make match cards fully clickable (currently only title text is clickable) — _entire card wrapped in `<Link>`_

---

## Email / Deliverability

- [x] Add List-Unsubscribe headers (RFC 8058) to all emails — HMAC-signed one-click unsubscribe
- [x] Set `UNSUBSCRIBE_SECRET` on prod
- [ ] Verify Gmail shows native "Unsubscribe" button next to sender name — _headers implemented, needs manual Gmail verification_
- [ ] Add unsubscribe link to email footer templates (currently just "Manage notification preferences")
- [ ] Email notifications for org admins (new applications, profile updates, etc.) — _no admin email system exists; current emails are user-facing only (match alerts, weekly digests, event digests). Org admin actions only create in-app notifications via `createNotification()` in `orgApplications.ts`_

---

## Navigation / Global

- [x] Organizations in nav bar — _(1ad29c4)_
- [ ] Make it easy to apply to orgs and see which are near — _`/orgs` has map + search + country filters; "apply" flow still unclear_
- [x] Add robust feedback feature — _`feedback-dialog.tsx` with floating button, backend mutation, hamburger menu integration_
- [x] Add active states to navigation — _`activeProps` on desktop, `isActive()` on mobile bottom tabs, profile nav highlighting_
- [ ] If user is admin of an org, show org name prominently in the nav bar — _org name currently only appears in breadcrumbs on admin sub-pages (`OrgName / Admin / Members`); global `AuthHeader` and hamburger menu show no org context_

---

## User Feedback (Augusto, 12 Feb 2026)

**Positive:**

- Overall experience good, intuitive and fast
- Enrichment conversation good for orienting and niching, gave good feedback
- Auto-fill from conversation worked well, only minor tweaks needed

**Issues:** captured in sections above, marked with _(Augusto)_

## far out ideas

I'm thinking we could expose an API or like a way to have curl commands or like ways to like sync data down such that people can have like mostly the same flow of like look through applications, see if like profile fits, like have the agent like find jobs or opportunities for you, but have it so they do it through their OpenCloud or like similar kind of assistant. Like local assistants are the way of the future? We don't want to force people to use our bot with our API key and our system to get the value from what we want to provide. They should be able to use their own assistance if they want.
