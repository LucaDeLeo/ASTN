# TODO

> For detailed UX audit with page-by-page breakdowns, see [`.planning/review/ux-review.md`](.planning/review/ux-review.md)

---

## Bugs

- [ ] Location doesn't work
- [ ] Some matches are duplicated
- [ ] Location string formatting inconsistent ("San Francisco Bay Area.USA" — period instead of comma) — _see UX review_

---

## LLM / Matching Quality

- [x] Extraction biased toward technical profiles — ignores governance/policy interests, prioritizes short courses over actual degrees and current work experience _(Augusto: BlueDot courses weighted more than his Sociology degree and current comms/governance role)_
- [ ] Matches skew too senior and too technical — suggests AI Engineer / Research Manager to beginners, scarce governance/communications options _(Augusto)_
- [x] Need more tags for non-technical profiles (governance, policy, communications, operations)
- [x] "Research communications" as the only communications tag is too narrow _(Augusto)_
- [ ] Match explanations repeat info you already know — make them conciser, get to the point faster
- [x] Model feels sycophantic in enrichment chat _(Augusto)_
- [ ] Put better info about the org in each match

---

## Chat / Enrichment Experience

- [x] Chat input box too small — should be multi-line like WhatsApp Web, not a single line _(Augusto)_
- [x] Can't do line breaks when chatting — need Shift+Enter for newlines _(Augusto)_
- [x] Add streaming to chat
- [x] Extract info in a better, clearer way
- [ ] Consider moving chat to its own separate section/page

---

## Onboarding / Profile Flow

- [ ] Should prompt profile creation immediately upon landing (when not signed up)
- [ ] Fix the flow for editing your profile (heading says "Create" even when editing) — _see UX review_
- [ ] Make privacy and notification preferences an explicit part of onboarding; unify all settings and make them easily accessible
- [ ] Add info to landing page explaining it's a prototype and what features are available

---

## Opportunities / Matches UX

- [ ] Maybe remove opportunities as a standalone page, simplify to a directory list
- [ ] Move "your next steps" to its own section
- [ ] Add visa/residency/citizenship eligibility filters — some positions require NDAs or citizenship _(Augusto: RAND example)_
- [ ] Replace "Not Found" salary displays — hide or say "Salary not listed" — _see UX review_
- [ ] Make match cards fully clickable (currently only title text is clickable) — _see UX review_

---

## Navigation / Global

- [ ] Organizations in nav bar — _done (1ad29c4)_
- [ ] Make it easy to apply to orgs and see which are near
- [ ] Add robust feedback feature
- [ ] Add active states to navigation — _see UX review_

---

## User Feedback (Augusto, 12 Feb 2026)

**Positive:**

- Overall experience good, intuitive and fast
- Enrichment conversation good for orienting and niching, gave good feedback
- Auto-fill from conversation worked well, only minor tweaks needed

**Issues:** captured in sections above, marked with _(Augusto)_
