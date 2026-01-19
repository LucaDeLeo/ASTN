# `AI Safety Talent Network — Feedback Request`

*`Draft for feedback • January 2026`*

---

## `TL;DR`

`We've built a career command center for AI safety — a platform where individuals maintain a living profile, track their entire application journey, and get matched to opportunities. Local orgs get a self-maintaining CRM, and opportunity posters reach high-fit candidates without changing their existing workflows. Try it now at` [`astn-gold.vercel.app`](https://astn-gold.vercel.app)`.`

`The core insight: people will keep profiles updated if they get real value back. Not because you ask them to, but because it gets them jobs, tracks their progress, helps them learn from rejections, and gives them actionable next steps.`

---

## `Try It Now`

**`Live at:`** [`astn-gold.vercel.app`](https://astn-gold.vercel.app)

`Sign up with GitHub, Google, or email to test the current build.`

### `What's Working Today`

| `Feature` | `Status` |
| :---- | :---- |
| `Profile wizard (basic info, education, work, skills, goals)` | `✅ Live` |
| `Resume upload with AI extraction` | `✅ Live` |
| `AI career coach conversation (enrichment)` | `✅ Live` |
| `Opportunity browsing with search/filters` | `✅ Live` |
| `AI-powered matching (great/good/exploring tiers)` | `✅ Live` |
| `Match explanations with strengths, gaps, recommendations` | `✅ Live` |
| `Organization discovery and joining` | `✅ Live` |
| `Member directory` | `✅ Live` |
| `Event browsing and RSVP (via Luma integration)` | `✅ Live` |
| `Email digests and match alerts` | `✅ Live` |
| `Event attendance feedback` | `✅ Live` |

### `Coming Soon`

- `Application tracker + rejection analysis`
- `Pre-filled applications`
- `Career capital recommendations`
- `Cross-org discovery`

---

## `The Problem`

### `For Individuals`

- **`Overwhelming discovery:`** `Opportunities scattered across job boards, Twitter, mailing lists, Slack channels`  
- **`No personalized guidance:`** `Generic advice doesn't help you figure out what you should apply for`  
- **`The limbo problem:`** `Between paid opportunities, it's hard to know what to do to stay on track`  
- **`Easy to miss deadlines:`** `That perfect-fit fellowship closed last week and you never saw it`  
- **`No feedback loop:`** `You apply, get rejected, never learn why. Next cycle you make the same mistakes. Your application history lives in scattered emails and forgotten spreadsheets.`

### `For Local Orgs (Student Groups, Hubs)`

- **`CRM death spiral:`** `You build an Airtable, beg people to fill it out, data goes stale, leadership graduates, repeat`  
- **`Reinventing the wheel:`** `Every org builds janky member tracking independently`  
- **`Isolation:`** `No visibility into what other groups worldwide are doing`

### `For Opportunity Posters (Programs, Employers)`

- **`Passive posting:`** `Tweet it, post on 80k, hope the right people see it`  
- **`No proactive discovery:`** `Can't find qualified candidates outside your existing network`  
- **`Signal-to-noise:`** `Generic applicants make it hard to find high-fit candidates`

---

## `The Solution`

`A three-sided network where the individual getting value is the atomic unit. Everything else is a consequence.`

`Individual keeps profile fresh`

    `` `↓ (because)` ``

`They receive good matches + learn from rejections`

    `` `↓ (which means)` ``

`Org CRM stays current automatically`

    `` `↓ (which means)` ``

`Opportunity posters reach right people`

    `` `↓ (which means)` ``

`More opportunities flow in`

    `` `↓ (reinforcing loop)` ``

---

## `What Each User Gets`

### `Individuals: "Your AI Safety Career Command Center"`

**`Not a job board. The single place where your entire AI safety journey lives.`**

#### `✅ Live Now`

- **`Smart matching with explanations:`** `Not just "here's an opportunity" but "here's WHY this is right for you and what's strong/weak in your fit"`
- **`Never miss high-fit opportunities:`** `Weekly digests, instant notifications for great matches`
- **`Rich profile building:`** `Form wizard + AI career coach conversation to capture your full background`

#### `🔜 Coming Soon`

- **`Application tracker:`** `Log where you've applied, outcomes, and notes. No more scattered spreadsheets. See your full history in one place.`
- **`Rejection analysis:`** `When you don't get in, our LLM analyzes your profile against the opportunity and gives you a hypothesis: "Gap: They emphasize ML engineering experience; your profile shows research but limited production code. Consider: contributing to MATS scholars' codebases or taking on engineering-heavy bounties."`
- **`Career capital recommendations:`** `Personalized "what to do next" — skill gaps to fill, people to connect with, projects to work on while you're between programs`
- **`Pre-filled applications:`** `Your rich profile generates draft answers for common application questions. You tweak, you submit.`

**`The learning loop:`** `Apply → Track outcome → Get analysis → Build missing pieces → Apply smarter next cycle`

**`The key unlock:`** `Pre-fill and rejection analysis only work when your profile is detailed enough. This gamifies completion while ensuring quality.`

`┌──────────────────────────────────────────────────────────┐`

`│  YOUR PROFILE: 67% Complete                    [████░░]  │`

`├──────────────────────────────────────────────────────────┤`

`│  ✅ UNLOCKED: Opportunity matching, weekly digest        │`

`│  🔒 AT 85%: Pre-fill applications, rejection analysis    │`

`│                                                          │`

`│  TO LEVEL UP:                                            │`

`│  • Add AI safety engagement history (+12%)               │`

`│  • Describe a project you've worked on (+8%)             │`

`└──────────────────────────────────────────────────────────┘`

### `Local Orgs: "A CRM That Maintains Itself"` `✅ Live`

**`The reframe:`** `The platform isn't a tracking tool you impose on members. It's a gift you give them during onboarding.`

- `Members keep their own profiles updated (because they get value)` `✅`
- `You see your whole community: who they are, what they're looking for, what they're working on` `✅`
- `Connect your members to global opportunities` `✅`
- `No more chasing people for updates` `✅`
- `Event management with Luma integration` `✅`
- `Member directory with engagement tracking` `✅`

**`Coming:`** `Cross-org discovery, meta-network of org leaders`

### `Opportunity Posters: "Change Nothing. Get Better Candidates."`

**`The value prop:`** `Zero extra work.`

- `Keep posting on 80k, keep tweeting — we aggregate from existing sources`  
- `We match against our rich profile database`  
- `We push high-fit candidates to your opportunities (with their consent)`  
- `You get better signal-to-noise without adopting a new platform`

---

## `How It Works Technically`

### `Living Profiles`

`Built through a combination of structured form + LLM conversation:`

- `Background (education, work, technical skills)`  
- `AI safety engagement history (courses, projects, writing)`  
- `Research interests and career goals`  
- `What they're seeking (jobs, programs, grants, collaborators, mentorship)`  
- `Constraints (location, timing, visa status)`  
- `Application history and outcomes (to power rejection analysis and learning)`

`The LLM counselor isn't just a chatbot — it's the mechanism to elicit rich enough data to power matching, recommendations, and pre-fill. It gives real advice grounded in 80k-style thinking and the AI safety landscape.`

### `Opportunity Matching`

- `Aggregates from 80k job board, aisafety.com, plus manual posts`  
- `Hard filters (location, career stage) + LLM-scored soft fit`  
- `Explains the match: "Strong technical background matches their requirements. Your interpretability interest aligns with their research focus. Gap: they emphasize publications, your profile doesn't highlight any."`

### `Rejection Analysis`

- `User logs outcome (rejected, accepted, waitlisted, ghosted)`  
- `LLM compares profile snapshot at application time vs. opportunity requirements`  
- `Generates hypothesis about gaps + actionable recommendations`  
- `Tracks patterns across multiple applications: "You've been rejected from 3 research programs; all emphasized publication record. Priority: get a paper out."`

### `Smart Notifications`

- `Weekly digest (default)`  
- `Immediate notification for high-fit matches`  
- `User controls frequency and channels`

---

## `Build Status`

### `✅ Shipped`

| `Feature` | `Description` |
| :---- | :---- |
| `Rich profile (form + LLM conversation)` | `Foundation for everything` |
| `User portal with prioritized opportunity feed` | `The "command center" experience` |
| `Fit scoring + explanations` | `Core value: "why this is right for you"` |
| `Org CRM view` | `Member directory, event management, engagement tracking` |
| `Email digests + match alerts` | `Reach people who don't check portal` |
| `AI career coach (enrichment)` | `LLM-powered profile building and advice` |
| `Organization discovery + joining` | `Find and join AI safety communities` |
| `Event integration (Luma)` | `Browse events, RSVP, give feedback` |

### `🔜 In Progress`

| `Feature` | `Why It Matters` |
| :---- | :---- |
| `Application tracker + rejection analysis` | `Core differentiator: learn from every cycle` |
| `Career capital recommendations` | `Differentiator: "what to do" not just "where to apply"` |
| `Pre-fill applications` | `Killer feature: friction reduction` |

### `📋 Future`

- `"Insist" escalation for very high-fit (multi-channel nudges)`
- `Collaboration matching (find people working on similar problems)`
- `Cross-org discovery`
- `Sophisticated career pathing with milestone tracking`

---

## `Current Status`

**`Currently piloting with BAISH`** `(Buenos Aires AI Safety Hub)`

- `Platform live at` [`astn-gold.vercel.app`](https://astn-gold.vercel.app)
- `Workshop-based onboarding available — guided sessions to create quality profiles`
- `Collecting feedback on the core experience (hence this document)`
- `Iterating based on real usage patterns`

**`Next steps:`**

- `Build application tracker and rejection analysis`
- `Expand to partner orgs with replicable playbook`

---

## `Positioning`

**`Not competing with existing players — complementing them:`**

- **`80,000 Hours job board:`** `We drive traffic to them, aggregate their listings`  
- **`aisafety.com:`** `Same — aggregate, not replace`  
- **`EA Forum profiles:`** `We're active matching, not passive directory`

`The differentiation is proactive, personalized matching, rejection analysis, and application friction reduction — things no one else does.`

---

## `Open Questions (Feedback Welcome!)`

### `1. Does this solve a real problem for you?`

- `If you're an individual: Would you invest time in a detailed profile for these features? What would make it worth it?`  
- `If you run a local org: Would this solve your CRM problem? What's missing?`  
- `If you post opportunities: Would aggregated, high-fit candidate matches be valuable? What would you need to trust the matching?`

### `2. Pre-fill applications`

`Is reducing application friction a big deal? How much time do you spend on applications that ask similar questions?`

### `3. Career capital recommendations`

`Would personalized "what to do next" advice (based on your profile + the landscape) be valuable? More valuable than opportunity matching?`

### `4. Profile completeness gating`

`Does unlocking features at higher profile completion feel motivating or annoying?`

### `5. The "insist" mechanism`

`For very high-fit opportunities (where we're confident you should apply), how aggressive should we be? Email → text → human outreach? Where does helpful become annoying?`

### `6. Rejection analysis`

`Would speculative "why you might not have gotten in" analysis be valuable, even knowing it's LLM-generated guesswork? Would it change how you prepare for future applications?`

### `7. What's missing?`

`What would make this a must-use for you?`

---

## `What We'd Love From You`

1. **`Your honest reaction`** `— Does this excite you, bore you, confuse you?`  
2. **`Which features matter most`** `— If we could only build two things, which two?`  
3. **`Red flags`** `— What would prevent you from using this?`  
4. **`Comparisons`** `— What's closest to this that exists? What works/doesn't work about those?`

---

*`Feedback to: [luca@baish.com.ar]`*
