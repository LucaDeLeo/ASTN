# Plan 31-01 Summary: Schema + Backend — Org Configuration & Co-working Space

## Completed: 2026-02-03

## What Was Built

### Schema Extensions (convex/schema.ts)

**Organizations table additions:**

- `logoStorageId: v.optional(v.id('_storage'))` — Convex storage reference for uploaded logo
- `contactEmail: v.optional(v.string())` — Organization contact email
- `website: v.optional(v.string())` — Organization website URL
- `socialLinks: v.optional(v.array(v.object({ platform, url })))` — Social media links
- `hasCoworkingSpace: v.optional(v.boolean())` — Denormalized flag for quick checks

**New coworkingSpaces table:**

- `orgId`, `name`, `capacity`, `timezone` (IANA)
- `operatingHours` — Array of 7 day objects with `dayOfWeek`, `openMinutes`, `closeMinutes`, `isClosed`
- `guestAccessEnabled` — Toggle for guest visit applications
- `customVisitFields` — Array of field definitions (text, textarea, select, checkbox types)
- Index: `by_org`

### Backend Functions (convex/orgs/admin.ts)

**New queries:**

- `getOrgProfile` — Returns full org with resolved logo URL
- `getOnboardingProgress` — Computed checklist with 5 steps: logo, description, contact, invite, space

**New mutations:**

- `updateOrgProfile` — Update description, contactEmail, website, socialLinks
- `saveOrgLogo` — Store logo via Convex storage, delete old logo
- `removeOrgLogo` — Remove logo from storage and org
- `getOrCreateInviteLink` — Ensure active invite link exists for bulk invite flow

### Co-working Space Module (convex/coworkingSpaces.ts)

**Queries:**

- `getSpaceByOrg` — Admin-only query for space config
- `getSpaceByOrgPublic` — Member-accessible query for booking pages

**Mutations:**

- `createSpace` — Create space with validation (one per org, 7 days, capacity > 0)
- `updateSpace` — Update any space field with validation
- `deleteSpace` — Delete space and update org's hasCoworkingSpace flag
- `updateCustomVisitFields` — Validate and save custom visit form fields

## Validation Implemented

- Operating hours must have exactly 7 entries (one per day 0-6)
- Close time must be after open time for open days
- Capacity must be > 0
- Select fields must have at least one option
- Field IDs must be unique and non-empty
- One space per org limit enforced

## Decisions Made

1. **Logo storage**: Used Convex storage (`_storage` table) rather than external URLs
2. **Onboarding checklist**: Computed at query time rather than stored in a table
3. **Operating hours format**: Minutes-from-midnight integers to avoid timezone bugs
4. **Custom fields schema**: Simple typed array rather than arbitrary JSON schema

## Files Changed

- `convex/schema.ts` — Added organization fields + coworkingSpaces table
- `convex/orgs/admin.ts` — Added org profile and onboarding queries/mutations
- `convex/coworkingSpaces.ts` — New file with full CRUD for spaces

## Commit

`63e0d38` — feat(31-01): add org configuration + coworking space schema and backend
