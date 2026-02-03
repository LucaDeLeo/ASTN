# UX Review: AI Safety Talent Network

**Date:** January 22, 2026
**Reviewer:** Claude (Opus 4.5)
**Design Standard:** Frontend Design Skill Guidelines

---

## Executive Summary

The ASTN site has solid functionality and a clean foundation, but falls into the "generic AI tool" aesthetic trap. The design is functional but forgettable — it doesn't communicate the urgency and importance of AI Safety work. With the frontend-design skill guidelines as our standard, this review identifies areas where the site can move from "serviceable" to "memorable."

---

## Global Issues

### 1. Typography

**Issue:** Uses system fonts / generic sans-serif throughout
**Impact:** Bland, unmemorable, looks like every other SaaS tool
**Recommendation:** Select a distinctive display font for headings (consider: Clash Display, Cabinet Grotesk, General Sans) paired with a refined body font. The monospace font used for job titles is a nice touch but inconsistently applied.

### 2. Color Palette

**Issue:** Coral/salmon primary (#F87171 range) on cream background feels soft and generic
**Impact:** Doesn't convey the seriousness of AI Safety work
**Recommendation:** Consider a more intentional palette. Options:

- Deep navy/slate with coral accents (professional + urgency)
- Black/white with a single bold accent (editorial feel)
- Rich earth tones (groundedness, long-term thinking)

### 3. Iconography

**Issue:** Generic outline icons (building icon for all organizations, calendar icon, etc.)
**Impact:** Missed opportunity for brand identity
**Recommendation:** Either commit to a cohesive custom icon set or remove unnecessary icons. The current state is "icon soup."

### 4. Empty States

**Issue:** All empty states look identical (centered icon + message + button)
**Impact:** Repetitive, doesn't guide users effectively
**Recommendation:** Vary empty states based on context. Use illustrations or more creative layouts.

---

## Page-by-Page Review

### Home Page (/)

**Issues:**

1. **No hero section or welcome** - Jumps straight into "Suggested Organizations" which shows "No organizations near you yet" for new users. Cold first impression.
2. **Redundant empty states** - "No organizations" and "No upcoming events" back-to-back creates a wall of "nothing here"
3. **Weak CTA hierarchy** - "Browse Organizations" button has same weight as "Browse Opportunities" button
4. **No personalization visible** - For logged-in users, should show profile completion status, recent activity, or personalized recommendations prominently

**Recommendations:**

- Add a personalized welcome header with quick stats
- Collapse empty sections or show them differently
- Create visual hierarchy between primary and secondary actions

### Opportunities Page (/opportunities)

**Issues:**

1. **Filter bar lacks visual weight** - Search, role filter, and location filter feel disconnected
2. **Card density too low** - Lots of whitespace, only 3 opportunities visible per screen
3. **Location display inconsistent** - "San Francisco Bay Area.USA" — period instead of comma, inconsistent formatting
4. **"Not Found" for salary** - Shows "Not Found" instead of omitting or saying "Salary not listed"
5. **"Last verified: about 22 hours ago"** - Monospace font here is jarring; the precision feels unnecessary ("1 day ago" would suffice)
6. **Tags (Research, Engineering) placement** - Far right, easy to miss

**Recommendations:**

- Tighten card layout, show more opportunities
- Fix location string formatting
- Hide or rephrase missing salary data gracefully
- Move category tags closer to title

### Opportunity Detail Page (/opportunities/:id)

**Issues:**

1. **Sparse layout** - Content centered in a narrow column with massive margins
2. **Bullet points use asterisks** - Should render as proper bullets in the "About This Role" section
3. **"Not Found" for salary visible** - Same issue as list view
4. **No breadcrumb or clear back navigation** - "Back to all opportunities" at bottom is easy to miss
5. **"Apply Now" button isolated** - Could be sticky or more prominent

**Recommendations:**

- Consider two-column layout for richer content display
- Add sticky header or sidebar with Apply CTA
- Proper markdown rendering for bullet lists

### Matches Page (/matches)

**Issues:**

1. **"1 Saved" collapsible is confusing** - Green banner with "1 Saved" doesn't clearly communicate what it is
2. **Tier labels (Good, Great, Exploring) not visible on list** - Only "Good match" badge on cards
3. **Match card click target unclear** - Need to click title text, not the whole card (discoverability issue)
4. **"Your Growth Areas" section excellent** - Best designed part of the site! Skills to build + Experience to gain is genuinely useful

**Recommendations:**

- Make entire card clickable
- Add visual tier indicators (maybe colored sidebar on cards)
- Consider collapsible sections for match tiers if many matches

### Match Detail Page (/matches/:id)

**Issues:**

1. **"Good match" badge top-left feels weak** - Could be more celebratory or informative
2. **Recommendations section tags (skill, experience, for this role)** - Different colored pills are nice but small text is hard to read
3. **"Interview Likelihood" experimental badge** - Good disclaimer but "experimental" feels uncertain. Maybe "beta" or just remove the label
4. **Duplicate content** - "About This Opportunity" repeats info from opportunity detail page

**Recommendations:**

- Make the match tier more visually prominent
- Differentiate this page more from opportunity detail
- Consider a comparison view (your profile vs. requirements)

### Profile Page (/profile)

**Issues:**

1. **"Your profile is 86% complete" banner** - Yellow background on cream is low contrast
2. **Section cards all identical** - Basic Information, Education, Work History all have same visual treatment
3. **Long work history entries** - Text runs long without visual breaks
4. **"Event Attendance: No events attended yet"** - Empty section at bottom feels like an afterthought
5. **Edit Profile button far from content** - Top right, easy to miss

**Recommendations:**

- Add visual variety to section cards
- Consider timeline visualization for work history
- Make profile completion more engaging (gamification?)

### Profile Edit Flow (/profile/edit)

**Issues:**

1. **"Create Your Profile" heading** - Confusing for existing users editing their profile
2. **Four input methods displayed equally** - Should emphasize recommended method more
3. **Step indicator (1. Input → 2. Review → 3. Enrich)** - Good concept but visually weak
4. **"How to get your LinkedIn PDF" collapsed by default** - Useful help hidden

**Recommendations:**

- Dynamic heading based on whether creating or editing
- Stronger visual hierarchy for recommended path
- Consider a wizard/stepper pattern with better progress indication

### Organizations Page (/orgs)

**Issues:**

1. **Map takes 50% of viewport** - Large but shows no markers (presumably because no orgs have coordinates)
2. **Org cards very sparse** - Just name + generic icon
3. **No description or preview** - Need to click "View Organization" to learn anything
4. **Country filter "All countries"** - But organizations don't show countries

**Recommendations:**

- Show org descriptions or key info in cards
- Add member counts, event counts, or activity indicators
- Map should show something useful or be removed/minimized

### Organization Detail Page (/org/:slug)

**Issues:**

1. **Extremely minimal** - Just name, member count, and "No visible members yet"
2. **No org description, links, or context**
3. **No join/follow button visible** - How do users engage?

**Recommendations:**

- Add organization descriptions, websites, social links
- Show upcoming events from this org
- Add clear join/follow CTA

### Settings Page (/settings)

**Issues:**

1. **Multiple "Save Changes" buttons** - One per section, could be consolidated
2. **Layout uses 50% of screen width** - Right half entirely empty
3. **Toggles and checkboxes mixed** - Inconsistent input patterns
4. **Event Reminders checkboxes** - All three always checked, feels like default state

**Recommendations:**

- Consolidate save actions or auto-save
- Use full width or add helpful content in sidebar
- Group related settings more logically

### Navigation & Global UI

**Issues:**

1. **Logo/brand mark missing** - Just text "AI Safety Talent Network"
2. **Nav items lack visual feedback** - Hard to tell which page is active
3. **User dropdown menu items cramped** - Profile, Settings, Logout could use icons
4. **Theme toggle separate from user menu** - Could be consolidated in settings

**Recommendations:**

- Design a simple logo/mark
- Add active state indicators to nav
- Review touch targets for mobile

---

## Dark Mode Observations

Dark mode exists and works, but:

- Cards have heavy dark background (#1f2937 range) that feels oppressive
- Coral accent color doesn't adapt for dark mode (could be brighter)
- Some text contrast issues on secondary text

---

## Positive Highlights

1. **"Why This Fits You" section** - Personalized match explanations are genuinely valuable
2. **"Your Growth Areas"** - Skills to build + Experience to gain is excellent UX
3. **Interview Likelihood indicator** - Brave and useful, even if experimental
4. **Recommendations per match** - Tagged by type (skill, experience, for this role)
5. **Profile completeness tracking** - Good motivation mechanic
6. **Multiple profile input methods** - Resume upload, AI chat, paste, manual — good flexibility
7. **Location privacy controls** - Thoughtful privacy-first approach
8. **Dark mode available** - Table stakes but appreciated

---

## Priority Actions

### High Priority (Polish Issues)

1. Fix location string formatting inconsistencies
2. Replace "Not Found" salary displays
3. Make match cards fully clickable
4. Add active states to navigation
5. Improve empty state variety

### Medium Priority (Design System)

1. Select and implement distinctive typography
2. Refine color palette for more character
3. Standardize card designs and spacing
4. Improve dark mode contrast

### Lower Priority (Enhancements)

1. Add logo/brand mark
2. Create custom illustrations for empty states
3. Redesign home page with personalized welcome
4. Add organization descriptions and richer cards
