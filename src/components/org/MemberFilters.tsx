import { CalendarDays, Filter, MapPin, Search, Sparkles, X } from "lucide-react";
import type { EngagementLevel } from "~/components/engagement/EngagementBadge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export interface MemberFiltersType {
  search?: string;
  engagementLevels?: EngagementLevel[];
  skills?: string[];
  locations?: string[];
  joinedAfter?: number;
  joinedBefore?: number;
  directoryVisibility?: "visible" | "hidden" | "all";
}

interface MemberFiltersProps {
  filters: MemberFiltersType;
  onFiltersChange: (filters: MemberFiltersType) => void;
  availableSkills: string[];
  availableLocations: string[];
}

export function MemberFilters({
  filters,
  onFiltersChange,
  availableSkills,
  availableLocations,
}: MemberFiltersProps) {
  const hasFilters =
    filters.search ||
    (filters.engagementLevels && filters.engagementLevels.length > 0) ||
    (filters.skills && filters.skills.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    filters.joinedAfter ||
    filters.joinedBefore ||
    (filters.directoryVisibility && filters.directoryVisibility !== "all");

  const clearFilters = () => {
    onFiltersChange({});
  };

  // Helper to convert timestamp to YYYY-MM-DD for date input
  const timestampToDateString = (timestamp: number | undefined): string => {
    if (!timestamp) return "";
    return new Date(timestamp).toISOString().split("T")[0];
  };

  // Helper to convert YYYY-MM-DD to timestamp
  const dateStringToTimestamp = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    return new Date(dateStr).getTime();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg mb-6">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value || undefined })
          }
          className="pl-10"
        />
      </div>

      {/* Engagement filter */}
      <Select
        value={filters.engagementLevels?.[0] ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            engagementLevels:
              value === "all" ? undefined : [value as EngagementLevel],
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <Sparkles className="size-4 mr-1 text-slate-400" />
          <SelectValue placeholder="Engagement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="highly_engaged">Active</SelectItem>
          <SelectItem value="moderate">Moderate</SelectItem>
          <SelectItem value="at_risk">At Risk</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Skills filter */}
      {availableSkills.length > 0 && (
        <Select
          value={filters.skills?.[0] ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              skills: value === "all" ? undefined : [value],
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="size-4 mr-1 text-slate-400" />
            <SelectValue placeholder="Skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {availableSkills.map((skill) => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Location filter */}
      {availableLocations.length > 0 && (
        <Select
          value={filters.locations?.[0] ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              locations: value === "all" ? undefined : [value],
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <MapPin className="size-4 mr-1 text-slate-400" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {availableLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Join date range - From */}
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-slate-400" />
        <Input
          type="date"
          placeholder="Joined after"
          value={timestampToDateString(filters.joinedAfter)}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              joinedAfter: dateStringToTimestamp(e.target.value),
            })
          }
          className="w-[140px]"
        />
        <span className="text-slate-400 text-sm">to</span>
        <Input
          type="date"
          placeholder="Joined before"
          value={timestampToDateString(filters.joinedBefore)}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              joinedBefore: dateStringToTimestamp(e.target.value),
            })
          }
          className="w-[140px]"
        />
      </div>

      {/* Directory visibility filter */}
      <Select
        value={filters.directoryVisibility ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            directoryVisibility:
              value === "all"
                ? undefined
                : (value as "visible" | "hidden" | "all"),
          })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="visible">Visible</SelectItem>
          <SelectItem value="hidden">Hidden</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="size-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
