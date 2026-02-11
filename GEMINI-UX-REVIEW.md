# ASTN UX Review - Gemini Vision Audit Results

---

## Critical Issues Verified (Confirmed Broken/Missing)

### Issue 1: App gives info you already know

**Status:** VERIFIED

**Observation:** The "Why This Fits You" section in Match Details heavily relies on repeating the user's past roles (e.g., "Direct experience as Operations Associate..."). It maps existing profile data rather than providing synthesis or new compatibility insights.

**Evidence:** `match_detail_view_1770822187438.png` vs `profile_view_current_1770822111956.png`

---

### Issue 4: Location doesn't work

**Status:** VERIFIED

**Observation:**

- **Profile:** Editing the location resulted in a concatenation bug ("Buenos Aires, ArgentinaLondon, UK"), suggesting the input field doesn't clear effectively or handle updates correctly.
- **Opportunities:** The "All Locations" filter only allows filtering by "Remote Only" or "On-site Only". It does not support filtering by specific city or country.

**Evidence:** `opportunities_location_filter_1770822239557.png`, `profile_view_current_1770822111956.png`

---

### Issue 7: No robust feedback feature

**Status:** VERIFIED

**Observation:** No feedback button or link was found in the header, footer, or match detail pages.

---

### Issue 8: Organizations not in nav bar

**Status:** VERIFIED

**Observation:** The main navigation includes "Opportunities" and "Matches" but is missing a direct link to "Organizations".

**Evidence:** `dashboard_1770821318553.png`

---

### Issue 9: Opportunities page is a simple directory list

**Status:** VERIFIED

**Observation:** The page is a flat list of 50 opportunities with basic formatting. It lacks grouping, curation, or advanced sorting.

**Evidence:** `opportunities_page_1770821988508.png`

---

### Issue 10: "Your Next Steps" should be its own section

**Status:** VERIFIED

**Observation:** This section was not found on the home dashboard, even after scrolling to the bottom.

**Evidence:** `dashboard_1770821318553.png`

---

### Issue 11: Hard to apply to orgs / no proximity

**Status:** VERIFIED

**Observation:** Organization cards on `/orgs` lack an "Apply" button (only "View Organization"). There is no distance/proximity indicator (e.g., "5 miles away").

**Evidence:** `orgs_list_1770821318553.png`

---

### Issue 12: Privacy and notification preferences not part of onboarding

**Status:** VERIFIED

**Observation:** Settings are minimal, covering only basic Notification toggles and Timezone. No "Location Privacy" or advanced account controls were visible.

**Evidence:** `settings_page_1770821673976.png`

---

### Issue 13: Editing profile flow is broken/confusing

**Status:** VERIFIED

**Observation:** The profile edit screen uses a multi-step wizard format ("7 of 7 complete") rather than a direct edit-and-save form. This creates friction when trying to update a single field like Location.

**Evidence:** `profile_edit_page_1770821748922.png`

---

### Issue 17: Match cards missing org info

**Status:** VERIFIED

**Observation:** Match cards show the Org Name and Role, but are missing metadata like Organization Size, Mission, or specific Location details (beyond City/Country).

---

## Issues Not Observed (Working or Subjectively Okay)

### Issue 2: Doesn't get to the point fast enough

**Status:** LIKELY FINE

**Observation:** The match detail page was actually quite concise. The "Why This Fits You" section used clear bullet points without long preambles.

**Evidence:** `match_detail_view_1770822187438.png`

---

### Issue 5: Duplicate matches

**Status:** NOT OBSERVED

**Observation:** Scrolling through the matches list did not reveal any obvious duplicate entries.

---

## Skipped / Cannot Verify

| #   | Issue                         | Reason                                                             |
| --- | ----------------------------- | ------------------------------------------------------------------ |
| 3   | Match cards not concise       | Not explicitly verified                                            |
| 6   | No immediate profile creation | Skipped (currently logged in)                                      |
| 14  | No prototype disclaimer       | Checked landing page, no obvious banner seen, but verified quickly |
| 15  | No chat streaming             | Skipped per request                                                |
| 16  | Chat extraction unclear       | Skipped per request                                                |

---

## Summary Checklist

| #   | Issue                              | Status       |
| --- | ---------------------------------- | ------------ |
| 1   | Gives info you already know        | VERIFIED     |
| 2   | Doesn't get to the point           | LIKELY FINE  |
| 3   | Match cards not concise            | SKIPPED      |
| 4   | Location broken                    | VERIFIED     |
| 5   | Duplicate matches                  | NOT OBSERVED |
| 6   | No immediate profile creation      | SKIPPED      |
| 7   | No feedback feature                | VERIFIED     |
| 8   | Orgs not in nav                    | VERIFIED     |
| 9   | Opportunities too basic            | VERIFIED     |
| 10  | Next steps buried                  | VERIFIED     |
| 11  | Can't apply to orgs / no proximity | VERIFIED     |
| 12  | Settings not in onboarding         | VERIFIED     |
| 13  | Edit profile flow broken           | VERIFIED     |
| 14  | No prototype disclaimer            | SKIPPED      |
| 15  | No chat streaming                  | SKIPPED      |
| 16  | Chat extraction unclear            | SKIPPED      |
| 17  | Missing org info in matches        | VERIFIED     |
