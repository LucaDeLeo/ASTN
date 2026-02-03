# Pitfalls Research: AI Safety Talent Network

**Domain:** Career platform / talent network for AI safety field
**Researched:** 2026-01-17
**Confidence:** HIGH (marketplace dynamics well-documented, AI-specific risks verified through multiple sources)

## Critical Pitfalls

### Pitfall 1: Cold Start Death - The Empty Room Problem

**What goes wrong:**
Platform launches with profiles but no opportunities (or vice versa). Users arrive, see no matches, leave, never return. You get one chance to deliver value on first visit. With only 50-100 pilot users, the pool is too small to generate meaningful matches, causing immediate abandonment.

**Why it happens:**
Two-sided marketplaces require both sides to have value simultaneously. Job seekers need opportunities; opportunity providers need talent. Building one side first without the other creates a "ghost town" experience.

**How to avoid:**

1. **Aggregate opportunities first** - Before launch, manually curate and import AI safety opportunities from 80,000 Hours, EA job boards, academic positions, company career pages
2. **Workshop-based onboarding** (your current plan) - Create immediate value through live matching during workshops, not passive profile creation
3. **Start with single-player value** - Give users career insights, skill gap analysis, or personalized recommendations even with zero matches
4. **Seed with "fake" density** - Show "Here are opportunities that would match your profile" even before full matching is live

**Warning signs:**

- Users create profile but never return (track return visits within 7 days)
- Session length under 2 minutes after profile creation
- No engagement with match notifications
- Qualitative feedback: "Nothing here for me"

**Phase to address:**
**Phase 1 (MVP)** - Build opportunity aggregation BEFORE user-facing features. The matching engine is worthless without opportunities to match.

---

### Pitfall 2: Profile Decay - The Stale Database Death Spiral

**What goes wrong:**
Profiles become outdated within months. Users get new skills, change jobs, leave the field entirely. Recruiters/matchers see stale data, lose trust, stop using platform. Users who don't see activity stop updating. Negative feedback loop accelerates.

**Why it happens:**
Users have no incentive to update unless they get value. Most career platforms ask for updates without giving anything in return. Life changes happen; profile updates don't.

**How to avoid:**

1. **Value-driven updates** (your core bet) - "Update your profile to get better recommendations" works only if recommendations actually improve
2. **Automatic enrichment** - Periodically pull updates from LinkedIn (with permission), infer from activity patterns
3. **Micro-updates** - Don't ask users to "update profile"; ask specific questions: "Did you complete that alignment course?" "Still interested in technical research roles?"
4. **Activity signals over profiles** - Track engagement (what they click, apply for) as implicit preference updates
5. **Decay indicators** - Show profile freshness score to both users and matchers

**Warning signs:**

- Average profile age exceeds 6 months
- Declining update rate (measure: profiles updated this month / active profiles)
- Bounce rate from opportunity providers increases
- Match success rate drops over time despite growing user base

**Phase to address:**
**Phase 2** - Build engagement loops and recommendation value before scaling. Scaling with stale profiles creates worse matching, not better.

---

### Pitfall 3: LLM Hallucination in Recommendations - Confident Lies

**What goes wrong:**
LLM-generated recommendations confidently suggest irrelevant opportunities, invent job requirements, hallucinate organization details, or fabricate acceptance probability. Users lose trust quickly - one bad recommendation undermines ten good ones.

**Why it happens:**
LLMs optimize for plausible-sounding output, not factual accuracy. Job descriptions may not exist in training data. Acceptance probability predictions require data you don't have. The model doesn't know what it doesn't know.

**How to avoid:**

1. **Ground all LLM output** - Never generate facts; only summarize, match, or rank verified data
2. **Explicit uncertainty** - Display confidence ranges, not point estimates ("45-65% estimated fit" not "55% match")
3. **Show your work** - "This matched because: [specific skill alignment], [stated interest in org]"
4. **Human-in-the-loop for high-stakes** - Flag recommendations for review before showing
5. **Avoid acceptance probability entirely in MVP** - This is your highest-risk feature. Consider replacing with simpler "fit factors" that explain matching rationale without predicting outcomes

**Warning signs:**

- User reports of obviously wrong recommendations
- Recommendations for organizations user explicitly excluded
- Acceptance probability wildly mismatched with actual outcomes (if tracked)
- Users stop clicking on recommendations

**Phase to address:**
**Phase 2-3** - If including LLM recommendations, start with simple retrieval + ranking. Add generation features only with robust guardrails. Delay acceptance probability until you have outcome data to validate.

---

### Pitfall 4: Opportunity Aggregation Fragility

**What goes wrong:**
Scraped opportunities break when source sites change. APIs get rate-limited or deprecated. Aggregated listings become stale, duplicated, or disappear. Users apply to closed positions. Trust erodes.

**Why it happens:**
AI safety opportunities are scattered across: 80,000 Hours job board, EA job boards, academic positions (scattered across university sites), company career pages (Anthropic, OpenAI, DeepMind), research lab postings. Each source has different structure, update frequency, and fragility.

**How to avoid:**

1. **Prefer official APIs and partnerships** - Negotiate data feeds with major employers and job boards rather than scraping
2. **Multiple sources per opportunity** - Cross-reference listings to detect staleness
3. **Staleness detection** - Mark listings with "Last verified: X" and age them out
4. **Manual curation for core opportunities** - AI safety is small enough that manual oversight is feasible
5. **User-reported dead links** - Make it easy to flag stale listings, reward reporters
6. **Graceful degradation** - When aggregation fails, show cached data with clear "may be outdated" warnings

**Warning signs:**

- Increased dead link reports
- Scraping error rates exceed 10%
- Time since last successful sync per source exceeds 24 hours
- Duplicate listings appearing

**Phase to address:**
**Phase 1 (MVP)** - Build robust aggregation infrastructure. Consider starting with curated manual collection for pilot, then automate. Aggregation is infrastructure, not a feature to ship fast.

---

### Pitfall 5: Privacy and Data Handling Violations

**What goes wrong:**
Career information is highly sensitive. Profiles leak, enabling targeted recruiting or discrimination. GDPR/privacy compliance failures create legal liability. Users discover their data is being used unexpectedly. Trust destroyed, potential fines.

**Why it happens:**
Career platforms handle sensitive data: current employer, salary expectations, career goals, disabilities/accommodations. Even public information becomes sensitive when aggregated. Small teams often lack privacy expertise.

**How to avoid:**

1. **Minimal data collection** - Don't ask for what you don't need. Salary? Current employer? Only if essential for matching.
2. **User control over visibility** - Let users hide from specific organizations (e.g., current employer)
3. **Clear consent flows** - Explain how data will be used before collecting
4. **Data retention policy from day one** - 6-12 months post last activity, then delete or require re-consent
5. **No LLM training on user data** - Be explicit: "Your profile is never used to train AI models"
6. **Data portability** - Users can export their data anytime
7. **Privacy-preserving matching** - Consider matching without exposing raw profiles until both sides consent

**Warning signs:**

- Users asking "who can see my profile?"
- No clear answer to "how long do you keep my data?"
- Using third-party LLM APIs that may train on inputs
- No consent tracking for data usage

**Phase to address:**
**Phase 1 (MVP)** - Build privacy-respecting architecture from the start. Retrofitting privacy is exponentially harder.

---

### Pitfall 6: Niche Market Depth Illusion

**What goes wrong:**
AI safety is a small field. At any given time, there may only be 50-200 relevant opportunities worldwide. This creates false scarcity perception - users think "platform has no opportunities" when reality is "field has limited opportunities." Platform blamed for market reality.

**Why it happens:**
Users compare to LinkedIn/Indeed with thousands of jobs. AI safety positions are rare, competitive, often filled through networks before posting. Even perfect aggregation can't create opportunities that don't exist.

**How to avoid:**

1. **Set expectations explicitly** - "AI safety is a competitive field with ~X active opportunities. We show you all of them."
2. **Expand opportunity types** - Include research positions, grants, collaborations, mentorship, not just jobs
3. **Related opportunities** - Show adjacent positions (ML safety at non-safety-focused orgs, policy roles, etc.)
4. **Skill-building pathways** - When matches are sparse, show "here's how to become qualified for future opportunities"
5. **Waitlist/alert features** - "No matches today, but we'll notify you when [criteria] appears"
6. **Community value** - Build value beyond matching: events, discussions, resources

**Warning signs:**

- User feedback: "There's nothing here for me" (when there genuinely are few opportunities)
- Comparison to mainstream job boards
- High churn despite good matching on available opportunities
- Users not understanding the platform shows the _whole_ market

**Phase to address:**
**Phase 2** - After MVP proves matching works, expand value proposition beyond job matching to include community, skill development, and network features.

---

### Pitfall 7: Disintermediation - Users Leave After First Match

**What goes wrong:**
User finds opportunity through platform, applies, gets hired. They never return. Employer and candidate now have a direct relationship. Platform loses both sides. No recurring value captured.

**Why it happens:**
Unlike Uber (ongoing rides) or Airbnb (ongoing stays), job matching is episodic. People don't job-hunt continuously. Once connected, continued platform use adds friction, not value.

**How to avoid:**

1. **Career lifecycle value** - Not just matching, but skill tracking, career progression, alumni network
2. **Field development focus** - Users stay because platform helps grow AI safety talent broadly, not just their job search
3. **Community, not just transactions** - Build ongoing engagement through content, events, peer connections
4. **Organizational relationships** - Provide ongoing value to employers (talent pipeline, field insights) beyond one-off hires
5. **Success stories** - Track and celebrate placements to demonstrate value even for passive users

**Warning signs:**

- Users go dormant immediately after successful match
- Organizations post once, don't return
- No engagement between active job searches
- Community features unused

**Phase to address:**
**Phase 3** - After core matching works, invest in ongoing engagement features. But design from Phase 1 with lifecycle in mind.

---

### Pitfall 8: Filter Bubble in Matching - Homogeneous Talent Pools

**What goes wrong:**
Matching algorithm optimizes for "safe" matches, reinforcing existing patterns. Non-traditional candidates never surface. Organizations see same profiles repeatedly. Field diversity stagnates. Platform amplifies existing biases.

**Why it happens:**
ML matching learns from historical success patterns. If past hires were certain backgrounds, algorithm replicates this. "Similar to successful candidates" means "similar to who was already hired."

**How to avoid:**

1. **Diversity metrics in matching** - Track and optimize for diverse candidate exposure, not just match accuracy
2. **Exploration in recommendations** - Deliberately surface non-obvious matches with explanation
3. **Bias audits** - Regularly analyze: are certain backgrounds systematically ranked lower?
4. **Career pathway matching** - Match on potential and trajectory, not just current credentials
5. **Organization-side diversity prompts** - "Consider these candidates who don't match traditional criteria but show strong potential"

**Warning signs:**

- Demographic patterns in top recommendations
- Same candidates appearing in all recommendations
- Non-traditional backgrounds systematically lower-ranked
- Organizations reporting "we see the same people everywhere"

**Phase to address:**
**Phase 3** - Once matching works, audit and adjust for bias. But log demographic data from Phase 1 to enable future audits.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut                                           | Immediate Benefit        | Long-term Cost                                            | When Acceptable                                          |
| -------------------------------------------------- | ------------------------ | --------------------------------------------------------- | -------------------------------------------------------- |
| Hardcoding opportunity sources                     | Fast initial aggregation | Brittle when sources change; can't add new sources easily | Never in production; OK for prototype only               |
| LLM-as-database (generating instead of retrieving) | Impressive demos         | Hallucination risk, inconsistent results                  | Never for factual content                                |
| No profile versioning                              | Simpler data model       | Can't detect decay, can't show change over time           | MVP only; add versioning by Phase 2                      |
| Storing raw scraped HTML                           | Quick parsing            | Legal risk, storage bloat, breaks when source changes     | Never; extract and discard                               |
| Synchronous matching on page load                  | Simpler architecture     | Slow page loads as data grows                             | OK under 1000 profiles; queue-based by Phase 2           |
| Email-only authentication                          | Fastest to implement     | No identity verification, fake profile risk               | OK for private pilot; add verification for public launch |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration                           | Common Mistake                                 | Correct Approach                                                                        |
| ------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| LinkedIn profile import               | Assuming OAuth scope includes all profile data | Explicitly request each field; scope has changed. Some fields require special approval. |
| Job board scraping                    | Treating it as stable data source              | Build monitoring for changes; expect breakage; have fallback                            |
| LLM APIs (OpenAI, Anthropic)          | Sending sensitive profile data                 | Use self-hosted or privacy-respecting endpoints; never send salary/employer data        |
| Email delivery                        | Not implementing proper SPF/DKIM               | Match notification emails get marked as spam; users miss opportunities                  |
| Calendar integration (for interviews) | Assuming timezone handling is automatic        | Explicitly store and convert timezones; AI safety is global                             |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap                                                | Symptoms                  | Prevention                                    | When It Breaks        |
| --------------------------------------------------- | ------------------------- | --------------------------------------------- | --------------------- |
| Real-time matching computation                      | Works instantly at pilot  | Pre-compute matches; update on profile change | ~500 profiles         |
| Loading all opportunities for client-side filtering | Snappy initial experience | Paginate and filter server-side               | ~1000 opportunities   |
| Synchronous opportunity refresh                     | Always fresh data         | Background jobs with freshness indicators     | When sources exceed 5 |
| Full-text search on profile JSON                    | Simple implementation     | Proper search index (Algolia, Elasticsearch)  | ~2000 profiles        |
| Single database for reads/writes                    | Simple architecture       | Read replicas for queries                     | ~100 concurrent users |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake                                    | Risk                                            | Prevention                                             |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------ |
| Profile visible to anyone with link        | Current employer finds out user is job hunting  | Require authentication; implement visibility controls  |
| No rate limiting on search                 | Competitor scrapes entire talent pool           | Rate limit searches; require auth for detailed results |
| Recommendation explanations leak criteria  | Organizations game the system                   | Keep matching criteria abstract; don't reveal weights  |
| Admin access to all profiles without audit | Privacy violations, insider data theft          | Audit logging for admin actions; minimize access       |
| Storing salary expectations in plaintext   | Data breach exposes sensitive compensation data | Encrypt at rest; need-to-know access only              |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall                                           | User Impact                                     | Better Approach                                              |
| ------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Requiring full profile before showing any value   | High abandonment                                | Show "preview" matches after minimal input                   |
| Long forms without progress indication            | Feels endless; abandonment                      | Clear steps, save progress, show what you'll get             |
| Generic match explanations                        | Users don't trust matches they don't understand | Specific: "Matched because you listed [X] and they want [Y]" |
| No distinction between "no matches" vs "checking" | Users think platform is broken                  | Clear loading states; explain empty states                   |
| Hiding opportunity age                            | Users apply to closed positions                 | Show "Posted X days ago", "Last verified" prominently        |
| Requiring resume upload to start                  | Friction; not everyone has resume ready         | Start with quick form; resume optional enhancement           |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Profile matching:** Often missing preference weighting - verify users can prioritize what matters (location? remote? org type?)
- [ ] **Opportunity display:** Often missing application deadline tracking - verify stale listings are aged out
- [ ] **LLM recommendations:** Often missing hallucination guardrails - verify generated content is grounded in actual data
- [ ] **Email notifications:** Often missing unsubscribe/frequency controls - verify compliance with email laws (CAN-SPAM/GDPR)
- [ ] **Search functionality:** Often missing search history/saved searches - verify users can resume where they left off
- [ ] **Profile privacy:** Often missing "hide from [specific org]" - verify users can exclude current employer
- [ ] **Matching algorithm:** Often missing diversity exposure metrics - verify not just showing "similar to who was hired before"
- [ ] **Data export:** Often missing machine-readable export - verify GDPR portability compliance

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall                     | Recovery Cost | Recovery Steps                                                                                      |
| --------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| Cold start (no activity)    | MEDIUM        | Pause public launch; focus on manual curation and community building; restart with density          |
| Stale profiles              | MEDIUM        | Re-engagement campaign with specific value proposition; consider sunset and restart for worst cases |
| LLM hallucination incident  | HIGH          | Public acknowledgment; remove LLM feature temporarily; relaunch with guardrails and user education  |
| Aggregation breaks          | LOW           | Fall back to cached data; prioritize manual curation for critical sources                           |
| Privacy violation           | HIGH          | Legal review immediately; user notification; potential platform pause; rebuild trust slowly         |
| Niche market disappointment | MEDIUM        | Reset expectations; expand to adjacent opportunities; add non-matching value                        |
| Disintermediation           | LOW           | Expected; focus on field-building mission; track influence even without platform retention          |
| Filter bubble discovered    | MEDIUM        | Transparent acknowledgment; publish audit results; implement fixes with communication               |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall               | Prevention Phase | Verification                                                             |
| --------------------- | ---------------- | ------------------------------------------------------------------------ |
| Cold start            | Phase 1 (MVP)    | Pilot has 3+ opportunities per active user segment at launch             |
| Profile decay         | Phase 2          | Track profile update rate; maintain >50% updated in last 90 days         |
| LLM hallucination     | Phase 2-3        | All LLM output grounded; hallucination reports <1% of recommendations    |
| Aggregation fragility | Phase 1 (MVP)    | Monitoring alerts within 1 hour of source failure; 95% uptime            |
| Privacy violations    | Phase 1 (MVP)    | GDPR audit complete before public launch; user visibility controls exist |
| Niche market depth    | Phase 2          | Users understand market size; satisfaction despite limited matches       |
| Disintermediation     | Phase 3          | Lifecycle features exist; engagement beyond job search                   |
| Filter bubble         | Phase 3          | Diversity metrics tracked; bias audit complete before scale              |

## Sources

**Marketplace Dynamics:**

- [NFX: 19 Tactics to Solve the Chicken-or-Egg Problem](https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem)
- [Sharetribe: The Chicken and Egg Problem](https://www.sharetribe.com/marketplace-glossary/chicken-and-egg-problem/)
- [Joe Procopio: Why Two-Sided Marketplaces Self-Destruct](https://marker.medium.com/how-two-sided-marketplaces-self-destruct-ce6658a8fc81)
- [Smart Job Board: Chicken Egg Problem for Job Boards](https://www.smartjobboard.com/blog/chicken-egg-problem-for-job-boards/)

**Profile Freshness:**

- [Crew.work: Automatic Profile Enrichment in ATS](https://blog.crew.work/en/automatic-profile-enrichment-in-ats-why-it-pays-off)

**LLM Risks:**

- [AIMultiple: AI Hallucination Research 2026](https://research.aimultiple.com/ai-hallucination/)
- [Evidently AI: LLM Hallucination Examples](https://www.evidentlyai.com/blog/llm-hallucination-examples)
- [Dextra Labs: LLM Hallucinations in Enterprise AI](https://dextralabs.com/blog/llm-hallucinations-enterprise-ai-risks-control/)
- [FairNow: Executive's Guide to LLM Risks](https://fairnow.ai/executives-guide-risks-of-llms/)

**Job Matching Accuracy:**

- [Torre: Job-Matching Model](https://torre.ai/jobmatchingmodel)
- [TalentAdore: How AI Matching Is Transforming Recruitment](https://talentadore.com/blog/ai-matching-recruitment)
- [Brookings: Digital Footprints and Job Matching](https://www.brookings.edu/articles/digital-footprints-and-job-matching-the-new-frontier-of-ai-driven-hiring/)
- [Arxiv: Fairness in AI-Driven Recruitment](https://arxiv.org/html/2405.19699v2)

**Privacy/GDPR:**

- [AvoMind: Top 5 GDPR Mistakes in Recruitment](https://www.avomind.com/post/gdpr-recruitment-5-costly-compliance-mistakes-and-how-to-avoid-them)
- [Workable: GDPR Compliance Guide for Recruiting](https://resources.workable.com/tutorial/gdpr-compliance-guide-recruiting)
- [SmartRecruiters: GDPR Recruitment FAQ](https://www.smartrecruiters.com/resources/gdpr-recruiting/recruitment-gdpr-faq/)

**Aggregation Legal:**

- [Oxylabs: How to Scrape Job Postings 2025](https://oxylabs.io/blog/web-scraping-job-postings)
- [Scrapeless: Is It Legal to Scrape Google Jobs](https://www.scrapeless.com/en/blog/legal-scrape-google-jobs)

**Filter Bubbles:**

- [Medium: Filter Bubble, Echo Chamber, Rabbit Hole](https://medium.com/understanding-recommenders/when-you-hear-filter-bubble-echo-chamber-or-rabbit-hole-think-feedback-loop-7d1c8733d5c)
- [Arxiv: Filter Bubbles in Recommender Systems](https://arxiv.org/html/2307.01221)

**AI Safety Market:**

- [SignalFire: State of Tech Talent 2025](https://www.signalfire.com/blog/signalfire-state-of-talent-report-2025)
- [RiseWorks: AI Talent Salary Report 2025](https://www.riseworks.io/blog/ai-talent-salary-report-2025)

**Community Building:**

- [Sprout Social: Niche Communities](https://sproutsocial.com/insights/niche-communities/)
- [Version One: Network Effects in Marketplaces](https://versionone.vc/network-effects/)

**Fake Profiles/Trust:**

- [FTC Consumer Alerts: Job Platform Scams](https://consumer.ftc.gov/consumer-alerts/2023/08/scammers-impersonate-well-known-companies-recruit-fake-jobs-linkedin-other-job-platforms)
- [Netcraft: Recruitment Scams](https://www.netcraft.com/blog/diving-into-the-talent-pool-threat-actors-target-job-seekers-with-complex-recruitment-scams/)

---

_Pitfalls research for: AI Safety Talent Network_
_Researched: 2026-01-17_
