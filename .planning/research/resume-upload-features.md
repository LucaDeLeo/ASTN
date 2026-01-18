# Features Research: Resume Upload + Auto-Fill

**Domain:** Career platform profile import (resume/CV parsing for auto-fill)
**Researched:** 2026-01-18
**Overall confidence:** HIGH (well-established domain with clear user expectations)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or frustrating.

### 1. Multi-Format Upload Support

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| PDF support | Primary format for resumes/CVs | Low | Most common format, ~70% of uploads |
| Word/DOCX support | Second-most common format | Low | Important for less tech-savvy users |
| Drag-and-drop | Visual drop zone for files | Low | Users expect this over "Browse" buttons |
| Click-to-browse fallback | Traditional file picker | Low | Required for accessibility |
| File size limits shown | Display "Max 5MB" upfront | Low | Prevents failed uploads |
| File type restrictions | Clear messaging on supported types | Low | "PDF & DOCX only" prominently shown |

**Why expected:** Users are conditioned by LinkedIn, job boards, and ATS systems. Drag-and-drop without explanations of limits creates frustration.

### 2. Progress & Status Indicators

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| Upload progress bar | Visual feedback during upload | Low | Critical - no feedback = user clicks multiple times |
| Processing indicator | "Analyzing your resume..." state | Low | Users need to know something is happening |
| Success/failure states | Clear outcome messaging | Low | "Parsed successfully" or clear error |
| Time estimate | "Usually takes 10-30 seconds" | Low | Sets expectations |

**Why expected:** Resume parsing takes longer than instant form submission. Users abandon without feedback.

### 3. Editable Extracted Data

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| Review before save | Show extracted data, let user edit before committing | Medium | THE critical UX - users hate auto-commits |
| Inline editing | Edit fields directly in review screen | Medium | Don't make users navigate elsewhere |
| Field-by-field confirmation | Visual checkmarks/accept buttons | Low | Let users approve each section |
| Easy correction of errors | Clear "Edit" affordance on each field | Low | Parsing is never 100% accurate |

**Why expected:** #1 complaint in job applications is "I uploaded my resume but still had to fix everything manually." The review step is where you earn trust.

### 4. Clear Field Mapping

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| Visual mapping display | Show what was extracted to which field | Medium | "Name: John Doe -> Profile Name" |
| Unmapped data handling | Show data that couldn't be mapped | Medium | Users want to know nothing was lost |
| Empty field indicators | Highlight fields resume didn't populate | Low | Shows gaps to fill manually |

**Why expected:** Users don't trust black-box parsing. Transparency builds confidence.

### 5. Text Paste Alternative

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| Paste text option | Raw text area for copy/paste | Low | For users without file access |
| LinkedIn copy support | Works with LinkedIn "Save as PDF" | Medium | Common source of profile data |

**Why expected:** Mobile users, users without file access, or users who want to paste specific sections only.

### 6. Error Handling & Recovery

| Sub-feature | Description | Complexity | Notes |
|-------------|-------------|------------|-------|
| Clear error messages | "Could not read this PDF format" | Low | Not just "Error occurred" |
| Retry option | Easy "Try again" button | Low | Don't make users start over |
| Manual entry fallback | "Enter manually instead" option | Low | Escape hatch when parsing fails |
| Partial success handling | "Extracted 5 of 8 sections" | Medium | Better than all-or-nothing |

**Why expected:** Parsing fails ~15-25% of the time depending on resume format complexity.

---

## Differentiators

Features that would set ASTN apart from typical resume upload experiences.

### 1. Smart Skills Mapping to Taxonomy

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| Taxonomy-aware extraction | Map free-form skills to ASTN's 39-skill taxonomy | High | Medium |
| Skill suggestion | "Detected 'ML safety' - matches 'AI Alignment' in our taxonomy" | High | Medium |
| Confidence display | "High match" / "Possible match" for skill mappings | Medium | Low |
| Easy skill correction | Dropdown to select correct taxonomy skill | Medium | Low |

**Why differentiating:** Generic parsers extract skills as free text. ASTN can map to its AI safety taxonomy, reducing manual selection from 39 skills.

### 2. AI Safety Context Understanding

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| Domain-specific parsing | Recognize AI safety orgs, roles, terminology | High | Medium |
| Organization recognition | "Anthropic" -> AI safety company (vs generic tech) | Medium | Low |
| Role type inference | "Research Scientist at MIRI" -> "Research" role type | Medium | Medium |
| Interest extraction | Detect AI safety interests from project descriptions | Medium | High |

**Why differentiating:** Generic parsers don't understand that "alignment researcher" is different from "ML engineer." LLM-powered parsing can capture AI safety context.

### 3. Gap Identification for Enrichment

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| Completeness score | "Resume filled 60% of your profile" | Medium | Low |
| Missing section callouts | "No career goals detected - enrichment chat can help" | High | Low |
| Enrichment prompt seeding | Pass resume context to enrichment conversation | High | Medium |
| Suggested questions | "We couldn't detect your AI safety interests - tell us more?" | Medium | Medium |

**Why differentiating:** Ties directly into ASTN's enrichment chat feature. Resume import becomes first step in a guided profile-building flow.

### 4. Intelligent Deduplication

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| Existing data detection | "You already have 2 work entries - merge or replace?" | High | Medium |
| Smart merge | Add new entries without duplicating existing | Medium | Medium |
| Update vs. overwrite choice | User controls whether to supplement or replace | High | Low |

**Why differentiating:** Users may upload multiple resumes over time or have partial profiles. Don't destroy existing work.

### 5. LinkedIn PDF Optimization

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| LinkedIn format recognition | Detect LinkedIn export structure | Medium | Medium |
| Optimized LinkedIn parsing | Handle LinkedIn's specific PDF layout | Medium | Medium |
| "Export from LinkedIn" instructions | Help users get their data out | Low | Low |

**Why differentiating:** LinkedIn PDF export is a common source. Generic parsers struggle with LinkedIn's format. Optimizing for it shows polish.

### 6. Batch Context Extraction

| Feature | Description | Value | Complexity |
|---------|-------------|-------|------------|
| Project description parsing | Extract project details, not just job titles | Medium | Medium |
| Achievement extraction | Pull out quantified achievements | Medium | Medium |
| Research output detection | Identify papers, publications | High | Medium |

**Why differentiating:** AI safety roles often involve research and projects. Generic parsers focus on job titles/dates but miss the substantive work that matters for matching.

---

## Anti-Features

Things to deliberately NOT build. Common mistakes in resume parsing.

### 1. Auto-Save Without Review

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Immediately saving parsed data to profile | Users lose trust, parsing errors become permanent | ALWAYS show review screen before commit |
| "We've updated your profile" without consent | Feels invasive, causes data quality issues | "Review what we found" -> explicit save |

**Why avoid:** #1 complaint in job application UX is losing control over data. Users want to see and approve.

### 2. Blocking Full Manual Entry

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Requiring upload before manual entry | Some users prefer manual, some have parsing issues | Upload is optional enhancement, not gate |
| No skip/bypass option | Frustrating when upload fails | Clear "Enter manually instead" escape hatch |

**Why avoid:** Parse failures happen 15-25% of time. Forcing users through a broken flow drives abandonment.

### 3. Over-Aggressive Skill Inference

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automatically selecting taxonomy skills | Creates inaccurate profiles | SUGGEST skills, let user confirm |
| Inferring skills from job titles alone | "Software Engineer" doesn't mean they know all 39 skills | Use full context, still require confirmation |

**Why avoid:** False skill attribution harms matching quality. Better to under-extract and let enrichment chat fill gaps.

### 4. Opaque Parsing

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| "Black box" with no visibility | Users can't trust or correct results | Show what was extracted from where |
| No indication of unrecognized content | Users wonder if data was lost | "These sections weren't mapped: [list]" |

**Why avoid:** Trust is critical. Users need to understand what happened to their data.

### 5. Complex Multi-Step Wizards

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| 5-step confirmation process | Fatigue leads to abandonment | Single review screen with all data |
| Required confirmation for each field | Too tedious for 15+ fields | Bulk approve with easy edit access |

**Why avoid:** The goal is to SAVE time. If reviewing takes as long as manual entry, feature fails.

### 6. Silent Failure

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Generic "Error occurred" | Users don't know what went wrong or what to do | Specific error + suggested action |
| Parsing fails with no feedback | Users think system is broken | "Could not parse this PDF format. Try saving as plain PDF or paste text below." |

**Why avoid:** Parsing fails often. Good error handling determines whether users retry or abandon.

### 7. Mandatory Data Retention

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Storing uploaded resume permanently | Privacy concerns, GDPR issues | Delete after extraction (or make optional) |
| No option to remove uploaded file | Users want control | Clear "Delete uploaded file" option |

**Why avoid:** Resume files contain sensitive data. Extract what's needed, don't hoard.

---

## UX Patterns

Common UX flows for resume upload in career platforms.

### Pattern 1: Upload-Review-Confirm (Recommended)

```
[Upload Zone]                    [Processing]              [Review Screen]           [Profile]
+------------------+            +----------+           +------------------+      +---------+
|  Drag & drop     |            |          |           | Name: John Doe   |      | Saved!  |
|  your resume     |--Upload--->| Parsing  |--Done---->| [Edit]           |-Save->|         |
|  PDF or DOCX     |            |   ...    |           |                  |      |         |
|  -------------   |            |          |           | Experience:      |      |         |
|  or click browse |            +----------+           | - Anthropic...   |      |         |
+------------------+                                   | [Edit] [Delete]  |      +---------+
                                                       |                  |
                                                       | Skills detected: |
                                                       | [ ] AI Alignment |
                                                       | [ ] ML Safety    |
                                                       |                  |
                                                       | [Save to Profile]|
                                                       +------------------+
```

**Best for:** New users creating profiles. Review screen is the key trust-building moment.

### Pattern 2: Inline Enhancement (For Existing Profiles)

```
[Profile Form]                          [Modal/Sidebar]
+----------------------------+         +------------------+
| Name: _________________    |         | Import from:     |
| Location: _____________    |         | [Upload Resume]  |
| [Import from Resume v]-----+-------->| [Paste Text]     |
|                            |         | [LinkedIn PDF]   |
| Work History:              |         +------------------+
| + Add experience           |                 |
|                            |                 v
|                            |         +------------------+
|                            |         | Found 3 entries: |
|                            |<--------| [Import All]     |
|                            |         | [Select Which]   |
+----------------------------+         +------------------+
```

**Best for:** Users with partial profiles who want to supplement, not replace.

### Pattern 3: Alternative Entry Points

```
1. Onboarding flow:    "Upload resume to get started" -> Full parse
2. Profile page:       "Import from resume" button -> Enhancement mode
3. Text paste:         "Don't have a file? Paste your experience" -> Text parse
4. LinkedIn import:    "Export from LinkedIn" instructions -> LinkedIn-optimized parse
```

**Key insight:** Offer multiple paths. Some users have files, some don't. Some want to replace, some want to add.

### Pattern 4: Error Recovery Flow

```
[Upload]-->Parse Fails-->+-------------------------------+
                         | We couldn't read this file.   |
                         |                               |
                         | Try:                          |
                         | - Re-save as standard PDF     |
                         | - Paste text instead          |
                         | - Enter manually              |
                         |                               |
                         | [Try Different File] [Paste] [Manual]
                         +-------------------------------+
```

**Key insight:** Always provide a way forward. Never dead-end.

---

## Field Mapping

What resume fields map to which ASTN profile fields.

### Core Field Mappings

| Resume Content | ASTN Profile Field | Extraction Complexity | Notes |
|---------------|-------------------|----------------------|-------|
| Full name | `name` | Low | Usually clear at top |
| Email | (via auth) | N/A | Already have from login |
| Location/Address | `location` | Medium | May need normalization (city only) |
| Title/Headline | `headline` | Low | First line under name often |
| Summary/About | Seed for `enrichmentSummary` | Medium | Good context for enrichment |
| **Education** | | | |
| Institution name | `education[].institution` | Low | |
| Degree | `education[].degree` | Low | |
| Field of study | `education[].field` | Medium | Often combined with degree |
| Graduation year | `education[].endYear` | Low | |
| **Work History** | | | |
| Company name | `workHistory[].organization` | Low | |
| Job title | `workHistory[].title` | Low | |
| Start date | `workHistory[].startDate` | Medium | Various formats (Jan 2020, 2020-01) |
| End date | `workHistory[].endDate` | Medium | "Present" handling |
| Current role | `workHistory[].current` | Low | Infer from "Present" or no end date |
| Description | `workHistory[].description` | Low | Bullet points or paragraphs |
| **Skills** | | | |
| Skills list | `skills` (via taxonomy mapping) | High | Free text -> 39-skill taxonomy |

### Taxonomy Skill Mapping (AI Safety Specific)

| Resume Skill Text | Potential ASTN Taxonomy Match | Confidence |
|-------------------|------------------------------|------------|
| "Machine Learning" | Technical - ML/AI | High |
| "AI Safety" | Technical - AI Safety Research | High |
| "Alignment research" | Technical - AI Alignment | High |
| "Interpretability" | Technical - Interpretability | High |
| "Policy analysis" | Governance - AI Policy | High |
| "Python" | Technical - Programming | High |
| "Research" | Research - General | Medium (too broad) |
| "Communication" | Meta - Communication | Medium |
| "Project management" | Operations - Project Management | Medium |

**Recommendation:** Use LLM to suggest taxonomy mappings with confidence scores. Present to user for confirmation. Don't auto-select.

### Fields NOT Extracted (Intentional)

| Data in Resume | Why Not Extract |
|---------------|-----------------|
| Phone number | Not in schema, privacy concern |
| Full address | Only need city/region for `location` |
| References | Not relevant to matching |
| Hobbies/Interests | Unless AI safety related |
| Photo | Not in schema |
| Social links | Could add LinkedIn URL later |

### Fields Resume Can't Fill (Enrichment Chat Territory)

| ASTN Field | Why Not From Resume |
|------------|---------------------|
| `careerGoals` | Rarely in resumes, needs conversation |
| `aiSafetyInterests` | Needs structured selection, not free text |
| `seeking` | Current intent, not historical data |
| `privacySettings` | User preference, not resume content |
| `pronouns` | Increasingly included, but still rare |

**Implication:** Resume import + enrichment chat are complementary. Resume fills facts, enrichment fills intent.

---

## Implementation Recommendations

### Phase 1: Core Upload (MVP)

1. PDF upload with drag-and-drop
2. Basic extraction: name, education, work history
3. Review screen with inline editing
4. Manual taxonomy skill selection (no auto-mapping)
5. Text paste alternative

### Phase 2: Smart Enhancement

1. DOCX support
2. LLM-powered skill taxonomy suggestions
3. LinkedIn PDF format optimization
4. Gap identification -> enrichment chat prompts
5. Merge/update mode for existing profiles

### Phase 3: Polish

1. Batch processing (multiple files)
2. Research output detection (papers, publications)
3. AI safety organization recognition
4. Confidence scoring and uncertainty display

---

## Sources

- Equip.co: How AI Resume Parsers Extract Skills (2026) - HIGH confidence
- Filestack: File Upload UI Best Practices (2025) - HIGH confidence
- Greenhouse: Candidate-Friendly Application Experience (2025) - MEDIUM confidence
- JobHuntr: Autofill Job Application Tools (2025) - MEDIUM confidence
- Refuel.ai: Parsing Resumes with LLMs (2024) - MEDIUM confidence
- LinkedIn Help: Save Profile as PDF - HIGH confidence
- Multiple UX Design articles on job application frustrations - MEDIUM confidence
- Lightcast Skills Taxonomy documentation - HIGH confidence
- V7 Labs: Resume Parsing Agent - MEDIUM confidence
- 4Spot Consulting: AI-Powered Skills Taxonomies (2025) - MEDIUM confidence
- Resumly.ai: AI Skill Extraction (2025) - MEDIUM confidence
