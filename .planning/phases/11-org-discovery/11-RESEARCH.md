# Phase 11: Org Discovery - Research

**Researched:** 2026-01-19
**Domain:** Location-based organization discovery, geographic search, privacy-aware suggestions
**Confidence:** HIGH

## Summary

Phase 11 builds on a solid existing org infrastructure. The join flow, invite links, and membership system are already complete from Phase 10. The primary work involves: (1) extending the organizations schema with location fields, (2) creating a dashboard section for geography-based org suggestions, (3) building an org browse/search page with map view, and (4) adding location privacy settings to user profiles.

**Zero new npm dependencies required.** The existing stack handles everything:
- **Map view:** Leaflet via CDN (no npm package needed) or pure CSS/SVG approach
- **Location data:** Free text parsing + optional geocoding via external API
- **Horizontal carousel:** CSS scroll-snap (no carousel library needed)
- **Search:** Convex search indexes (already used for skillsTaxonomy)

**Primary recommendation:** Extend organizations schema with location fields, add location visibility to user profiles, and build UI components using existing shadcn patterns.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | 1.31.0 | Database, queries, real-time | Existing backend |
| TanStack Router | 1.132.2 | File-based routing | Already handles /org/\$slug routes |
| shadcn/ui | - | UI components | Card, Badge, Button patterns exist |
| lucide-react | 0.562.0 | Icons | MapPin, Building2, Users already used |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/* | Various | Accessible primitives | Select, Checkbox for filters |
| clsx/tailwind-merge | Latest | Styling utilities | Conditional classes |
| sonner | 2.0.7 | Toast notifications | Join success/error messages |

### No New Dependencies Required
| Instead of | Use | Why |
|------------|-----|-----|
| embla-carousel | CSS scroll-snap | Simpler, no JS, works great for 5 cards |
| react-leaflet | Leaflet via CDN | Avoid React wrapper overhead, simpler setup |
| @googlemaps/js-api-loader | Leaflet (OSM) | Free, no API key required |

## Architecture Patterns

### Recommended Schema Extensions

```typescript
// organizations table additions (extend existing)
organizations: defineTable({
  name: v.string(),
  slug: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  // NEW FIELDS:
  description: v.optional(v.string()),          // For org cards
  city: v.optional(v.string()),                 // "Buenos Aires", "San Francisco"
  country: v.optional(v.string()),              // "Argentina", "United States"
  coordinates: v.optional(v.object({            // For distance calculations
    lat: v.number(),
    lng: v.number(),
  })),
  isGlobal: v.optional(v.boolean()),            // True for orgs with no location
  memberCount: v.optional(v.number()),          // Denormalized for display
  upcomingEventCount: v.optional(v.number()),   // Denormalized for display (Phase 12)
})
  .index("by_name", ["name"])
  .index("by_slug", ["slug"])
  .index("by_country", ["country"])
  .index("by_city_country", ["city", "country"])
  .searchIndex("search_name", { searchField: "name" })
```

```typescript
// profiles table addition (extend existing privacySettings)
privacySettings: v.optional(
  v.object({
    defaultVisibility: v.union(...),
    sectionVisibility: v.optional(...),
    hiddenFromOrgs: v.optional(v.array(v.string())),
    // NEW FIELD:
    locationDiscoverable: v.optional(v.boolean()),  // Opt-in for org suggestions
  })
)
```

### Project Structure

```
convex/
├── organizations.ts           # Extend with location queries
├── orgs/
│   ├── directory.ts          # Extend with browse/search queries
│   ├── discovery.ts          # NEW: Geography-based suggestions
│   └── membership.ts         # Existing - no changes needed
│
src/
├── routes/
│   ├── index.tsx             # Add org suggestions section (authenticated)
│   └── orgs/
│       └── index.tsx         # NEW: Org browse/search page
├── components/
│   ├── org/
│   │   ├── OrgCard.tsx       # NEW: Rich card for suggestions/browse
│   │   ├── OrgCarousel.tsx   # NEW: Horizontal scroll container
│   │   ├── OrgMap.tsx        # NEW: Leaflet map component
│   │   └── OrgFilters.tsx    # NEW: Location/type filters
│   └── settings/
│       └── LocationPrivacyToggle.tsx  # NEW: Opt-in toggle
```

### Pattern 1: Horizontal Carousel with CSS Scroll-Snap

**What:** Native scrolling carousel without JS library
**When to use:** Dashboard org suggestions (5 cards, scrollable)
**Example:**
```tsx
// Source: CSS scroll-snap spec (W3C)
function OrgCarousel({ orgs }: { orgs: Org[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto scroll-snap-x scroll-snap-mandatory pb-4 -mx-4 px-4">
      {orgs.map((org) => (
        <div key={org._id} className="scroll-snap-start shrink-0 w-72">
          <OrgCard org={org} />
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Geography-Based Suggestions Query

**What:** Find orgs near user's location with fallback to global
**When to use:** Dashboard suggestions
**Example:**
```typescript
// Source: Existing Convex query patterns in orgs/directory.ts
export const getSuggestedOrgs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Check if user has location discoverability enabled
    if (!profile?.privacySettings?.locationDiscoverable) {
      // Return global orgs only
      return await ctx.db
        .query("organizations")
        .filter((q) => q.eq(q.field("isGlobal"), true))
        .take(5);
    }

    // Parse user location (city-level matching)
    const userCity = parseCity(profile.location); // e.g., "Buenos Aires"

    // 1. Same city first
    const localOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_city_country", (q) => q.eq("city", userCity))
      .take(3);

    // 2. Fill with global orgs
    const globalOrgs = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("isGlobal"), true))
      .take(5 - localOrgs.length);

    // 3. Filter out already-joined orgs
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const joinedOrgIds = new Set(memberships.map((m) => m.orgId));

    return [...localOrgs, ...globalOrgs]
      .filter((org) => !joinedOrgIds.has(org._id));
  },
});
```

### Pattern 3: Map + List Split View

**What:** Geographic org browse with map and list
**When to use:** /orgs browse page
**Example:**
```tsx
// Source: Standard split-view pattern
function OrgBrowsePage() {
  const [selectedOrg, setSelectedOrg] = useState<Id<"organizations"> | null>(null);

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Map - left side on desktop */}
      <div className="hidden lg:block w-1/2 h-full">
        <OrgMap
          onOrgSelect={setSelectedOrg}
          selectedOrgId={selectedOrg}
        />
      </div>

      {/* List - right side, scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <OrgFilters />
        <OrgList
          selectedOrgId={selectedOrg}
          onOrgSelect={setSelectedOrg}
        />
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Exposing exact user coordinates:** Never send user lat/lng to frontend. Do distance filtering server-side.
- **Real-time map subscriptions:** Don't use useQuery for map markers with many orgs. Fetch once, update on filter change.
- **Over-engineering map clustering:** With <50 orgs in pilot, simple markers suffice. Clustering is premature optimization.
- **Requiring location before signup:** Location should be opt-in after account creation, not during.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distance calculation | Custom Haversine | Server-side city matching | City-level is sufficient; exact distance is overkill |
| Map tiles | Self-hosted tiles | OpenStreetMap via Leaflet CDN | Free, reliable, no API key |
| Carousel | Custom scroll logic | CSS scroll-snap | Native, performant, accessible |
| Location autocomplete | Custom geocoder | Free text input with examples | MVP simplicity; autocomplete is Phase 2 |
| Org search | Custom fuzzy search | Convex searchIndex | Already proven with skillsTaxonomy |

**Key insight:** For a pilot with 50-100 users and ~20 orgs, city-level string matching beats coordinate-based distance calculations. Avoid premature optimization.

## Common Pitfalls

### Pitfall 1: Location Privacy Violation
**What goes wrong:** User location leaked to org admins or other users
**Why it happens:** Frontend receives user coordinates for map display
**How to avoid:**
- Filter orgs server-side using user location
- Never send user location to any API response
- Only expose org locations (public data)
**Warning signs:** Any query returning user location fields to non-owner

### Pitfall 2: Empty State Confusion
**What goes wrong:** User sees "No orgs near you" when they haven't enabled location
**Why it happens:** Missing distinction between "no location" and "no matches"
**How to avoid:**
- If location not enabled: Show prompt + global orgs as fallback
- If location enabled but no matches: Show "No local orgs yet" + global orgs
**Warning signs:** Empty carousel without explanation

### Pitfall 3: Already-Member Invite Link Handling
**What goes wrong:** User clicks invite link for org they already belong to, sees confusing error
**Why it happens:** Existing join flow (Phase 10) already handles this well
**How to avoid:** Current implementation in `/org/$slug/join.tsx` already shows "Already a Member" message
**Warning signs:** None - this is already solved!

### Pitfall 4: Map Library Bloat
**What goes wrong:** Bundle size increases 200KB+ from map libraries
**Why it happens:** Installing react-leaflet + leaflet as npm packages
**How to avoid:** Load Leaflet via CDN, initialize imperatively
**Warning signs:** Any map-related npm dependencies

### Pitfall 5: Coordinates Without Fallback
**What goes wrong:** Org created without coordinates, map throws errors
**Why it happens:** Assuming all orgs have coordinates
**How to avoid:**
- Coordinates are optional
- Filter orgs without coordinates from map view
- List view shows all orgs regardless of coordinates
**Warning signs:** TypeScript non-null assertions on coordinates

## Code Examples

### Org Card Component

```tsx
// Source: Existing MemberCard pattern in MemberDirectory.tsx
interface OrgCardProps {
  org: {
    _id: Id<"organizations">;
    name: string;
    slug?: string;
    logoUrl?: string;
    description?: string;
    city?: string;
    country?: string;
    memberCount?: number;
    upcomingEventCount?: number;
  };
  variant?: "carousel" | "list";
}

function OrgCard({ org, variant = "carousel" }: OrgCardProps) {
  return (
    <Card className={cn(
      "p-4 hover:shadow-md transition-shadow",
      variant === "carousel" && "w-72 shrink-0"
    )}>
      <div className="flex items-start gap-3">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={org.name}
            className="size-12 rounded-lg object-cover"
          />
        ) : (
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="size-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{org.name}</h3>
          {(org.city || org.country) && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="size-3" />
              {[org.city, org.country].filter(Boolean).join(", ")}
            </div>
          )}
        </div>
      </div>

      {org.description && (
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
          {org.description}
        </p>
      )}

      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          {org.memberCount ?? 0} members
        </span>
        {(org.upcomingEventCount ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {org.upcomingEventCount} upcoming
          </span>
        )}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full mt-4">
        <Link to="/org/$slug" params={{ slug: org.slug || "unknown" }}>
          View Organization
        </Link>
      </Button>
    </Card>
  );
}
```

### Location Privacy Toggle

```tsx
// Source: Existing NotificationPrefsForm pattern
function LocationPrivacyToggle() {
  const profile = useQuery(api.profiles.getOrCreateProfile);
  const updatePrivacy = useMutation(api.profiles.updatePrivacySettings);

  const isDiscoverable = profile?.privacySettings?.locationDiscoverable ?? false;

  const handleToggle = async (checked: boolean) => {
    await updatePrivacy({ locationDiscoverable: checked });
    toast.success(
      checked
        ? "Location-based suggestions enabled"
        : "Location-based suggestions disabled"
    );
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2 text-base font-medium">
          <MapPin className="size-4 text-primary" />
          Location-Based Suggestions
        </Label>
        <p className="text-sm text-slate-500">
          Get org suggestions based on your city. Your exact location is never shared.
        </p>
      </div>
      <Switch
        checked={isDiscoverable}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
```

### Leaflet Map Integration (CDN approach)

```tsx
// Source: Leaflet documentation
import { useEffect, useRef } from "react";

interface OrgMapProps {
  orgs: Array<{
    _id: Id<"organizations">;
    name: string;
    coordinates?: { lat: number; lng: number };
  }>;
  onOrgSelect: (id: Id<"organizations">) => void;
  selectedOrgId: Id<"organizations"> | null;
}

function OrgMap({ orgs, onOrgSelect, selectedOrgId }: OrgMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Leaflet loaded via CDN in index.html
    if (!mapRef.current || !window.L) return;

    const map = window.L.map(mapRef.current).setView([0, 0], 2);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Add markers for orgs with coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const orgsWithCoords = orgs.filter((o) => o.coordinates);

    orgsWithCoords.forEach((org) => {
      const marker = window.L.marker([org.coordinates!.lat, org.coordinates!.lng])
        .addTo(map)
        .bindPopup(org.name)
        .on("click", () => onOrgSelect(org._id));
    });
  }, [orgs, onOrgSelect]);

  return <div ref={mapRef} className="h-full w-full" />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Maps API | Leaflet + OSM | 2020s | Free, no API key, good enough for 20 orgs |
| Carousel libraries | CSS scroll-snap | 2022 | Zero JS, better performance |
| Coordinate-based search | City string matching | Always | Simple for MVP, upgrade later if needed |

**Deprecated/outdated:**
- Google Maps for small-scale projects: OSM/Leaflet is free and sufficient
- Heavy carousel libraries (Swiper, Slick): CSS scroll-snap handles this natively

## Open Questions

1. **Org data source:**
   - What we know: Current orgs are seeded via AI_SAFETY_ORGANIZATIONS constant
   - What's unclear: Who adds location data? Admin UI or seed script?
   - Recommendation: Extend seed script with location data for known orgs

2. **Map on mobile:**
   - What we know: Split view is desktop-only (hidden lg:block)
   - What's unclear: Should mobile have map at all?
   - Recommendation: List-only on mobile, map toggle as progressive enhancement

3. **Location input format:**
   - What we know: User profile has free-text location field
   - What's unclear: How to reliably parse "City, Country" from varied inputs
   - Recommendation: Basic string parsing + fallback to "global" if unparseable

## Sources

### Primary (HIGH confidence)
- `/Users/luca/dev/ASTN/convex/schema.ts` - Current organizations table
- `/Users/luca/dev/ASTN/convex/orgs/` - Existing org queries and mutations
- `/Users/luca/dev/ASTN/src/routes/org/$slug/join.tsx` - Existing join flow (already complete!)
- `/Users/luca/dev/ASTN/src/components/org/MemberDirectory.tsx` - Card patterns to follow

### Secondary (MEDIUM confidence)
- CSS scroll-snap specification (W3C)
- Leaflet documentation for CDN usage
- Convex search index documentation

### Tertiary (LOW confidence)
- Org location data population strategy (needs decision during planning)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies, all patterns verified
- Architecture: HIGH - Schema extensions straightforward, follows existing patterns
- Pitfalls: HIGH - Privacy patterns well-documented, existing join flow verified

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain)
