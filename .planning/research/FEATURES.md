# Feature Research: AI Safety Talent Network (ASTN)

**Domain:** Career platform / Talent network for AI safety community
**Researched:** 2026-01-17
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature                                  | Why Expected                                                                                | Complexity | Notes                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User profiles with skills/experience** | Every career platform has them; users need to represent themselves                          | MEDIUM     | Must support AI safety-specific skills taxonomy (alignment research, governance, technical safety, etc.). LinkedIn/Wellfound set expectations for rich profiles with work history, education, skills |
| **Job/opportunity listings**             | Core purpose of any career platform; 80,000 Hours job board already serves this community   | LOW        | Can aggregate from existing sources (80K Hours, EA Forum, org career pages). 80K Hours currently lists 700+ roles                                                                                    |
| **Search and filtering**                 | Users expect to find relevant opportunities quickly                                         | MEDIUM     | Filter by role type, location, remote-friendly, experience level, cause area. Wellfound's transparent filters (salary, equity, company stage) are the benchmark                                      |
| **Email notifications/alerts**           | Standard across Indeed, LinkedIn, Handshake; 70% higher open rates for automated job alerts | LOW        | Segmentation is critical - users want relevant alerts, not spam. Weekly digest is the sweet spot for most job seekers                                                                                |
| **Mobile-responsive design**             | Expected for any modern web application                                                     | LOW        | Not a native app requirement, but must work well on mobile browsers                                                                                                                                  |
| **Privacy controls**                     | Users need to control visibility (especially if employed)                                   | MEDIUM     | LinkedIn's "Open to Work" visible/hidden toggle is the benchmark. Critical for current employees exploring options                                                                                   |
| **Application tracking (basic)**         | Users need to know what they've applied to                                                  | MEDIUM     | Note: Full application tracker is V2, but users need at minimum a list of opportunities they've interacted with                                                                                      |
| **Saved/bookmarked opportunities**       | Standard feature across all job platforms                                                   | LOW        | Simple but essential for job seekers managing multiple options                                                                                                                                       |

### Differentiators (Competitive Advantage)

Features that set ASTN apart from generic platforms and even 80,000 Hours.

| Feature                                            | Value Proposition                                                                                             | Complexity | Notes                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LLM-powered conversational profile creation**    | Reduces friction of profile creation; extracts nuanced information through conversation rather than forms     | HIGH       | Core innovation. Triplebyte pioneered adaptive assessments; this extends to profile building. Key insight: "People update profiles when they get value, not when asked"                                           |
| **Smart matching with explanations**               | Unlike black-box matching, ASTN explains WHY an opportunity fits (specific skills, background elements, etc.) | HIGH       | Triplebyte showed 4x improvement in pass rates with skills-based matching. Explanations build trust and help users understand their own profile gaps                                                              |
| **Acceptance probability estimation**              | Novel feature - LLM-estimated likelihood of success for each opportunity                                      | HIGH       | No existing platform does this explicitly. Related to Hired's "top applicant" signals and LinkedIn's "you'd be in top 10%" notifications. Must be calibrated carefully to avoid discouraging qualified candidates |
| **Personalized "what to do next" recommendations** | Career GPS - specific actionable steps based on profile and goals                                             | HIGH       | TalentGuard/Fuel50 do this for enterprise; rare in public career platforms. Goes beyond "jobs for you" to "skills to develop, people to talk to, paths to explore"                                                |
| **Community org dashboard (basic CRM)**            | Enables local EA/AI safety groups to track and support their members' career journeys                         | MEDIUM     | Unique to mission-driven talent networks. Handshake's university model is closest analogue. Must balance org visibility with individual privacy                                                                   |
| **Automated opportunity aggregation**              | Single source of truth for AI safety opportunities across 80K Hours, EA Forum, org career pages, etc.         | MEDIUM     | Indeed/LinkedIn aggregate at scale; doing this well for a niche is valuable. Job Boardly and similar tools make aggregation feasible without building scrapers                                                    |
| **AI safety-specific skill taxonomy**              | Structured understanding of technical alignment, governance, policy, field-building skills                    | MEDIUM     | No existing platform has this. 80K Hours has career paths but not a skills graph. Critical for meaningful matching                                                                                                |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this type of platform.

| Feature                                                 | Why Requested                              | Why Problematic                                                                                                                           | Alternative                                                                                    |
| ------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Real-time chat/messaging between all users**          | "Networking should be easy"                | Creates spam/cold outreach burden; overwhelming for popular candidates; platform becomes LinkedIn 2.0                                     | Structured introductions through local orgs; event-based connections; mutual interest matching |
| **Comprehensive application tracker with CRM features** | "I want one place for everything"          | Scope creep that delays core value; most users already have systems (spreadsheets, Notion); hard to integrate with external ATS           | V1: Simple "applied via ASTN" list. V2+: Consider if data shows users actually want this       |
| **Social feed / content posting**                       | "Build community like LinkedIn"            | Distracts from career focus; requires moderation; EA Forum already serves community discussion role                                       | Link to EA Forum posts; surface relevant discussions contextually                              |
| **Gamification (badges, points, leaderboards)**         | "Engagement drives retention"              | Feels manipulative in mission-driven context; people are motivated by impact, not points; creates perverse incentives (profile gaming)    | Celebrate real milestones (job placements, skill development) without artificial gamification  |
| **Bidding/auction system for talent**                   | "Let market determine value" (Hired model) | Inappropriate for mission-driven work; creates awkward dynamics in small community; most AI safety roles aren't competing on compensation | Standard matching with transparency about comp ranges                                          |
| **Video interviews / assessments**                      | "Better signal than resumes"               | High friction; many users employed and can't easily record; Triplebyte's acquisition suggests pure assessment model is challenging        | Conversational profile building captures similar signal with lower friction                    |
| **Automated application submission**                    | "Apply to 100 jobs with one click"         | Low-quality applications hurt everyone; AI safety orgs value thoughtful applications; creates noise for hiring managers                   | Better matching means fewer, higher-quality applications                                       |
| **Detailed analytics for job seekers**                  | "Show me conversion funnels"               | Creates anxiety; data is often not actionable; small community means small sample sizes are misleading                                    | Focus on actionable recommendations, not vanity metrics                                        |
| **Public profile view counts**                          | "Who's looking at me?"                     | Anxiety-inducing; often misleading; LinkedIn Premium's version is low-value                                                               | Only show when it's actionable (e.g., org explicitly interested)                               |

## Feature Dependencies

```
[User Authentication]
    └──requires──> [Database/Backend Infrastructure]

[Rich Profile Creation]
    └──requires──> [User Authentication]
    └──requires──> [AI Safety Skills Taxonomy]
    └──enhanced by──> [LLM Conversation Module]

[Opportunity Listings]
    └──requires──> [Database/Backend Infrastructure]
    └──enhanced by──> [Automated Aggregation]

[Smart Matching]
    └──requires──> [Rich Profile Creation]
    └──requires──> [Opportunity Listings]
    └──requires──> [AI Safety Skills Taxonomy]
    └──requires──> [LLM Integration]

[Match Explanations]
    └──requires──> [Smart Matching]
    └──requires──> [LLM Integration]

[Acceptance Probability]
    └──requires──> [Smart Matching]
    └──requires──> [LLM Integration]
    └──enhanced by──> [Historical Placement Data] (V2+)

[Personalized Recommendations]
    └──requires──> [Rich Profile Creation]
    └──requires──> [Smart Matching]
    └──requires──> [LLM Integration]

[Email Digests]
    └──requires──> [Smart Matching]
    └──requires──> [Email Infrastructure]
    └──requires──> [User Preferences]

[Org Dashboard]
    └──requires──> [User Authentication]
    └──requires──> [Organization Entities]
    └──requires──> [User-Org Relationships]
    └──conflicts──> [Complete Profile Privacy] (tension to manage)

[Automated Aggregation]
    └──requires──> [Opportunity Data Model]
    └──options──> [API Integrations OR Scraping Infrastructure]
```

### Dependency Notes

- **LLM Integration is cross-cutting:** Required for profile creation, matching, explanations, probability, and recommendations. Invest in solid LLM infrastructure early.
- **Skills Taxonomy is foundational:** Must be defined before meaningful matching can work. Should be built with community input.
- **Org Dashboard requires trust architecture:** Must solve "who can see what" before building org features. Individual privacy must be opt-in visible.
- **Aggregation can be parallel:** Opportunity aggregation doesn't depend on profiles and can be built/iterated independently.

## MVP Definition

### Launch With (V1)

Minimum viable product to validate core hypothesis: "People update profiles when they get value."

- [x] **User authentication with OAuth** - Low friction onboarding via Google/GitHub
- [x] **Basic profile creation (form-based)** - Must work even if LLM conversation fails
- [x] **LLM-powered profile enhancement** - Core differentiator; conversation that enriches form data
- [x] **Opportunity listings** - Aggregated from 80K Hours + manual additions
- [x] **Smart matching with explanations** - "Why this opportunity fits you"
- [x] **Acceptance probability (experimental)** - Clearly labeled as LLM-estimated, not guaranteed
- [x] **Personalized recommendations** - "What to do next" based on profile + goals
- [x] **Email digests** - Weekly personalized opportunity summaries
- [x] **Basic org dashboard** - For 3-5 pilot local groups, simple CRM (view members who opt-in, track referrals)

### Add After Validation (V1.x)

Features to add once core is working and we have user feedback.

- [ ] **Expanded aggregation sources** - Add EA Forum opportunities, individual org career pages - trigger: users request specific sources
- [ ] **Profile versioning/history** - Allow users to see how their profile evolved - trigger: users ask "what did I say before?"
- [ ] **Recommendation feedback loop** - "Was this helpful?" to improve recommendations - trigger: baseline recommendations working
- [ ] **Org analytics** - Aggregate (anonymized) insights for local groups - trigger: orgs request more visibility
- [ ] **Integration with calendar/scheduling** - For career calls/coffee chats - trigger: org coordinators request

### Future Consideration (V2+)

Features to defer until product-market fit is established.

- [ ] **Full application tracker** - Track applications across platforms, not just ASTN - why defer: scope creep, users have existing systems
- [ ] **Rejection analysis** - Learn from application outcomes - why defer: requires outcome data we won't have initially
- [ ] **Pre-fill applications** - Auto-populate external application forms - why defer: complex integrations, legal/privacy concerns
- [ ] **Collaborator matching** - Connect people for projects/research - why defer: different use case, validate career matching first
- [ ] **Reading/course tracking** - Track AI safety learning progress - why defer: out of core career focus
- [ ] **Public talent directory** - Browsable profiles for recruiters - why defer: privacy concerns, needs community trust first

## Feature Prioritization Matrix

| Feature                       | User Value | Implementation Cost | Priority                      |
| ----------------------------- | ---------- | ------------------- | ----------------------------- |
| LLM conversational profile    | HIGH       | HIGH                | P1 - Core differentiator      |
| Smart matching + explanations | HIGH       | HIGH                | P1 - Core value proposition   |
| Acceptance probability        | MEDIUM     | MEDIUM              | P1 - Novel, builds engagement |
| Personalized recommendations  | HIGH       | MEDIUM              | P1 - "What to do next" is key |
| Email digests                 | HIGH       | LOW                 | P1 - Low cost, high retention |
| Opportunity aggregation       | MEDIUM     | MEDIUM              | P1 - Foundation for matching  |
| Basic org dashboard           | MEDIUM     | MEDIUM              | P1 - Enables pilot partners   |
| OAuth authentication          | HIGH       | LOW                 | P1 - Table stakes             |
| Form-based profile (fallback) | HIGH       | LOW                 | P1 - Accessibility            |
| Skills taxonomy               | HIGH       | MEDIUM              | P1 - Foundational             |
| Privacy controls              | MEDIUM     | MEDIUM              | P1 - Trust-building           |
| Saved opportunities           | MEDIUM     | LOW                 | P2 - Expected but not urgent  |
| Profile versioning            | LOW        | LOW                 | P3 - Nice to have             |
| Calendar integrations         | LOW        | MEDIUM              | P3 - Future convenience       |

**Priority key:**

- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature                     | 80K Hours                      | LinkedIn                     | Wellfound           | Handshake                  | ASTN Approach                                 |
| --------------------------- | ------------------------------ | ---------------------------- | ------------------- | -------------------------- | --------------------------------------------- |
| **Profile depth**           | Minimal (just job board)       | Deep, self-reported          | Startup-focused     | Campus-focused             | Deep, LLM-enhanced, AI safety-specific        |
| **Matching logic**          | Manual browsing                | Keyword + behavior           | Role-based          | University-based           | LLM-powered with explanations                 |
| **Match explanations**      | N/A                            | "Top applicant" badge only   | N/A                 | N/A                        | Detailed, personalized explanations           |
| **Success probability**     | N/A                            | "Top 10%" indicators         | N/A                 | N/A                        | LLM-estimated acceptance probability          |
| **Career guidance**         | Blog/podcast (general)         | Learning courses             | N/A                 | Career services link       | Personalized "what to do next"                |
| **Opportunity aggregation** | Curated manually               | Own listings + company pages | Startup jobs only   | Campus + employer postings | Aggregated from multiple EA/AI safety sources |
| **Community org support**   | Links to local groups          | Company pages                | N/A                 | University career centers  | Local group CRM dashboards                    |
| **Email communications**    | Newsletter (general)           | Job alerts + social          | Job alerts          | Event + job alerts         | Personalized digest based on profile          |
| **Target audience**         | Impact-focused careers broadly | Everyone                     | Startup job seekers | College students           | AI safety talent specifically                 |

## Sources

### Career Platforms Analyzed

- [80,000 Hours Job Board](https://jobs.80000hours.org/) - Mission-aligned job aggregation for impact-focused careers
- [LinkedIn Premium features](https://premium.linkedin.com/) - Market leader for professional networking and job search
- [Wellfound (AngelList Talent)](https://wellfound.com/) - Startup-focused job platform with transparency on comp/equity
- [Handshake](https://joinhandshake.com/) - Campus recruiting platform with university-employer connections
- [Hired (now LHH)](https://www.lhh.com/us/en/hired/) - Curated tech talent marketplace
- [Triplebyte (acquired by Karat)](https://triplebyte.com/) - Skills-based technical assessment and matching

### Talent CRM and Community Platforms

- [Phenom Talent CRM](https://www.phenom.com/talent-crm) - Enterprise talent relationship management
- [Beamery](https://beamery.com/) - AI-powered talent CRM with skills matching
- [EA Opportunities Board](https://www.effectivealtruism.org/opportunities) - Effective altruism community opportunities

### Feature Research Sources

- [Job Matching Algorithms overview](https://www.mokahr.io/myblog/job-matching-algorithms/) - How AI is transforming talent acquisition
- [Career Newsletter Best Practices](https://www.smartdreamers.com/blog/9-best-practices-for-a-career-newsletter-to-drive-conversions) - Email engagement strategies
- [Job Aggregation Guide 2025](https://www.jobboardly.com/blog/job-board-scraping-complete-guide-2025) - Technical approaches to opportunity aggregation
- [AI Recruitment Guide 2025](https://www.herohunt.ai/blog/ai-recruitment-2025-the-extremely-in-depth-expert-guide-10k-words) - LLM applications in recruiting

### Confidence Notes

- **HIGH confidence:** Table stakes features (well-documented across platforms), competitive landscape (direct observation)
- **MEDIUM confidence:** LLM-powered features (emerging space, best practices still forming), acceptance probability (novel feature with limited precedent)
- **LOW confidence:** Long-term adoption patterns, community-specific preferences (will need to validate with users)

---

_Feature research for: AI Safety Talent Network (ASTN)_
_Researched: 2026-01-17_
