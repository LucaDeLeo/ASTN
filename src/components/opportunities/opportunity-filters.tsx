import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { MobileFilters } from "./mobile-filters";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const ROLE_TYPES = [
  { value: "all", label: "All Roles" },
  { value: "research", label: "Research" },
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
  { value: "policy", label: "Policy" },
  { value: "other", label: "Other" },
];

const LOCATION_OPTIONS = [
  { value: "all", label: "All Locations" },
  { value: "remote", label: "Remote Only" },
  { value: "onsite", label: "On-site Only" },
];

// Search params type for the opportunities route
type OpportunitySearchParams = {
  role?: string;
  location?: string;
  q?: string;
};

export function OpportunityFilters() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/opportunities/" });

  const roleType = search.role || "all";
  const locationFilter = search.location || "all";
  const searchTerm = search.q || "";

  const updateFilter = useCallback(
    (key: keyof OpportunitySearchParams, value: string) => {
      navigate({
        to: "/opportunities",
        search: (prev: OpportunitySearchParams) => {
          const newSearch = { ...prev };
          if (value === "" || value === "all") {
            delete newSearch[key];
          } else {
            newSearch[key] = value;
          }
          return newSearch;
        },
      });
    },
    [navigate]
  );

  const clearFilters = () => {
    navigate({
      to: "/opportunities",
      search: {},
    });
  };

  const hasActiveFilters =
    roleType !== "all" || locationFilter !== "all" || searchTerm !== "";

  return (
    <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile filters */}
        <div className="md:hidden">
          <MobileFilters
            roleType={roleType}
            locationFilter={locationFilter}
            searchTerm={searchTerm}
            onRoleChange={(v) => updateFilter("role", v)}
            onLocationChange={(v) => updateFilter("location", v)}
            onSearchChange={(v) => updateFilter("q", v)}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Desktop filters - existing layout */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
          {/* Search - Secondary per CONTEXT.md */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Role Type Filter */}
          <Select value={roleType} onValueChange={(v) => updateFilter("role", v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role Type" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location/Remote Filter */}
          <Select
            value={locationFilter}
            onValueChange={(v) => updateFilter("location", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-500 dark:text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
