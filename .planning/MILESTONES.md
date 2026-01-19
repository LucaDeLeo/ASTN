# Project Milestones: AI Safety Talent Network (ASTN)

## v1.1 Profile Input Speedup (Shipped: 2026-01-19)

**Delivered:** Faster profile creation via PDF/text upload with LLM extraction, review UI, and 4-way entry point wizard.

**Phases completed:** 7-10 (13 plans total)

**Key accomplishments:**

- PDF upload infrastructure with drag-drop, file picker, progress indicators, and 10MB limit
- Text paste fallback with collapsible input and soft character limit warning
- Claude Haiku 4.5 Vision extraction pipeline for structured data (name, location, education, work history)
- Smart skill matching with 0.7 fuzzy threshold suggesting ASTN skills from resume content
- Review & edit UI with field cards (accept/reject/edit) and expandable entries for multi-item sections
- Profile wizard with 4 entry points: upload PDF, paste text, manual entry, chat-first AI guidance

**Stats:**

- 74 files created/modified
- ~10,600 lines of TypeScript added
- 4 phases, 13 plans
- 2 days from v1.0 to v1.1 (2026-01-17 → 2026-01-19)

**Git range:** `feat(07-01)` → `docs(10-03)`

**What's next:** v1.2 or v2.0 based on BAISH pilot feedback — potential features include mobile responsiveness, advanced extraction (DOCX, publications), or application tracking

---

## v1.0 MVP (Shipped: 2026-01-18)

**Delivered:** Career command center for AI safety talent with smart matching, LLM-powered profiles, and org dashboard for BAISH pilot (50-100 profiles).

**Phases completed:** 1-6 (21 plans total)

**Key accomplishments:**

- Opportunity aggregation pipeline from 80K Hours and aisafety.com with daily sync
- Full authentication system (Google, GitHub OAuth + email/password)
- Rich profile wizard with AI safety skills taxonomy (39 skills) and LLM career coaching
- Smart matching engine with tier-based grouping (Great/Good/Exploring), explanations, and recommendations
- Email engagement with high-fit alerts and weekly personalized digests
- Org CRM with member directory, admin dashboard with stats, and CSV/JSON export

**Stats:**

- 289 files created/modified
- ~73,000 lines of TypeScript
- 6 phases, 21 plans
- 2 days from start to ship (2026-01-17 → 2026-01-18)

**Git range:** Initial commit → `f67e25b`

**What's next:** v1.1 — Mobile responsiveness, production hardening, or feature expansion based on pilot feedback

---

*Milestones file created: 2026-01-18*
