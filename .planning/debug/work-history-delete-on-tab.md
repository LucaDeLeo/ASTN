---
status: diagnosed
trigger: 'Work history entries are deleted when tabbing between fields in the profile wizard'
created: 2026-01-18T12:00:00Z
updated: 2026-01-18T12:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Race condition between useEffect sync and onBlur save
test: Analyzed code flow when user types in Title field then tabs to Organization
expecting: useEffect overwrites local state with stale server data before blur save completes
next_action: Document root cause and fix recommendation

## Symptoms

expected: User can tab between fields without losing entered data
actual: When user tabs to next field, the entry is deleted
errors: None reported
reproduction: Enter data in work history field, press tab to move to next field
started: Unknown - user reported issue

## Eliminated

## Evidence

- timestamp: 2026-01-18T12:05:00Z
  checked: WorkHistoryStep.tsx lines 61-65 - useEffect sync
  found: |
  useEffect(() => {
  if (profile?.workHistory) {
  setEntries(profile.workHistory);
  }
  }, [profile?.workHistory]);
  implication: This useEffect runs whenever profile.workHistory changes, overwriting local state

- timestamp: 2026-01-18T12:06:00Z
  checked: WorkHistoryStep.tsx lines 87-93 - handleBlur function
  found: |
  handleBlur filters entries requiring BOTH organization AND title to be non-empty:
  entries.filter((e) => e.organization.trim() !== "" && e.title.trim() !== "")
  implication: If user fills Title first and tabs to Organization, entry has empty organization and gets filtered out

- timestamp: 2026-01-18T12:07:00Z
  checked: EducationStep.tsx lines 72-75 - handleBlur function
  found: |
  handleBlur filters entries requiring ONLY institution to be non-empty:
  entries.filter((e) => e.institution.trim() !== "")
  implication: Education only requires ONE field, so entry survives when tabbing between fields

- timestamp: 2026-01-18T12:08:00Z
  checked: Race condition analysis
  found: |
  Sequence of events when user types in Title then tabs to Organization:
  1. User types "Research Scientist" in Title field
  2. Local state: entries[0] = { title: "Research Scientist", organization: "" }
  3. User presses Tab -> onBlur fires on Title field
  4. handleBlur() filters: entry has empty organization, so validEntries = []
  5. saveFieldImmediate("workHistory", []) saves EMPTY array to database
  6. Convex reactive query updates profile.workHistory to []
  7. useEffect triggers: setEntries([]) wipes local state
  8. Entry disappears from UI
     implication: This is the root cause - filtering requires both fields but user can only fill one at a time

## Resolution

root_cause: |
The handleBlur() function in WorkHistoryStep.tsx filters entries requiring BOTH
organization AND title to be non-empty before saving. When a user tabs from the
first field (Title) to the second field (Organization), the blur event fires and
saves an empty array because the entry has an empty organization. The useEffect
then syncs this empty array back to local state, deleting the entry.

EducationStep.tsx works correctly because it only requires ONE field (institution)
to be non-empty, so entries survive while the user is still filling them in.

fix: |
Option A (Recommended): Change the validation in handleBlur to match Education's pattern -
only require ONE of the required fields to be filled:

const validEntries = entries.filter(
(e) => e.organization.trim() !== "" || e.title.trim() !== ""
);

Option B: Don't save on blur at all - only save on explicit actions (checkbox toggle,
remove button) or when navigating away from the step.

Option C: Add a "saving" flag to prevent useEffect from overwriting local state while
a save is in progress.

verification: |
Test by:

1. Add new work entry
2. Type in Title field
3. Press Tab to move to Organization field
4. Verify entry persists
5. Fill in Organization
6. Verify entry saves with both fields

files_changed: []
