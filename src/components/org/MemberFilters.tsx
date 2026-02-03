import { useState } from 'react'
import { CalendarDays, Filter, MapPin, Search, Sparkles, X } from 'lucide-react'
import type { EngagementLevel } from '~/components/engagement/EngagementBadge'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '~/components/ui/responsive-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export interface MemberFiltersType {
  search?: string
  engagementLevels?: Array<EngagementLevel>
  skills?: Array<string>
  locations?: Array<string>
  joinedAfter?: number
  joinedBefore?: number
  directoryVisibility?: 'visible' | 'hidden' | 'all'
}

interface MemberFiltersProps {
  filters: MemberFiltersType
  onFiltersChange: (filters: MemberFiltersType) => void
  availableSkills: Array<string>
  availableLocations: Array<string>
}

export function MemberFilters({
  filters,
  onFiltersChange,
  availableSkills,
  availableLocations,
}: MemberFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const hasFilters =
    filters.search ||
    (filters.engagementLevels && filters.engagementLevels.length > 0) ||
    (filters.skills && filters.skills.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    filters.joinedAfter ||
    filters.joinedBefore ||
    (filters.directoryVisibility && filters.directoryVisibility !== 'all')

  const clearFilters = () => {
    onFiltersChange({})
  }

  // Helper to convert timestamp to YYYY-MM-DD for date input
  const timestampToDateString = (timestamp: number | undefined): string => {
    if (!timestamp) return ''
    return new Date(timestamp).toISOString().split('T')[0]
  }

  // Helper to convert YYYY-MM-DD to timestamp
  const dateStringToTimestamp = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined
    return new Date(dateStr).getTime()
  }

  // Build active filter chips for mobile
  const activeFilters: Array<{
    key: string
    label: string
    onRemove: () => void
  }> = []

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => onFiltersChange({ ...filters, search: undefined }),
    })
  }
  if (filters.engagementLevels && filters.engagementLevels.length > 0) {
    const engagementLabels: Record<EngagementLevel, string> = {
      highly_engaged: 'Active',
      moderate: 'Moderate',
      at_risk: 'At Risk',
      new: 'New',
      inactive: 'Inactive',
    }
    activeFilters.push({
      key: 'engagement',
      label: engagementLabels[filters.engagementLevels[0]],
      onRemove: () =>
        onFiltersChange({ ...filters, engagementLevels: undefined }),
    })
  }
  if (filters.skills && filters.skills.length > 0) {
    activeFilters.push({
      key: 'skills',
      label: filters.skills[0],
      onRemove: () => onFiltersChange({ ...filters, skills: undefined }),
    })
  }
  if (filters.locations && filters.locations.length > 0) {
    activeFilters.push({
      key: 'locations',
      label: filters.locations[0],
      onRemove: () => onFiltersChange({ ...filters, locations: undefined }),
    })
  }
  if (filters.joinedAfter || filters.joinedBefore) {
    activeFilters.push({
      key: 'dates',
      label: 'Date range',
      onRemove: () =>
        onFiltersChange({
          ...filters,
          joinedAfter: undefined,
          joinedBefore: undefined,
        }),
    })
  }
  if (filters.directoryVisibility && filters.directoryVisibility !== 'all') {
    activeFilters.push({
      key: 'visibility',
      label: filters.directoryVisibility === 'visible' ? 'Visible' : 'Hidden',
      onRemove: () =>
        onFiltersChange({ ...filters, directoryVisibility: undefined }),
    })
  }

  return (
    <div className="mb-6">
      {/* Mobile: Chips + Filter button */}
      <div className="md:hidden space-y-3">
        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="pr-1 gap-1"
              >
                {filter.label}
                <button
                  onClick={filter.onRemove}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter button */}
        <ResponsiveSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <ResponsiveSheetTrigger asChild>
            <Button variant="outline" className="w-full min-h-11">
              <Filter className="size-4 mr-2" />
              Filter Members
              {hasFilters && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </ResponsiveSheetTrigger>
          <ResponsiveSheetContent className="overflow-y-auto">
            <ResponsiveSheetHeader>
              <ResponsiveSheetTitle>Filter Members</ResponsiveSheetTitle>
            </ResponsiveSheetHeader>

            <div className="space-y-6 py-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or email..."
                    value={filters.search ?? ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        search: e.target.value || undefined,
                      })
                    }
                    className="pl-10 min-h-11"
                  />
                </div>
              </div>

              {/* Engagement Level */}
              <div className="space-y-2">
                <Label>Engagement</Label>
                <Select
                  value={filters.engagementLevels?.[0] ?? 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      engagementLevels:
                        value === 'all'
                          ? undefined
                          : [value as EngagementLevel],
                    })
                  }
                >
                  <SelectTrigger className="min-h-11">
                    <Sparkles className="size-4 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Levels" />
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
              </div>

              {/* Skills */}
              {availableSkills.length > 0 && (
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <Select
                    value={filters.skills?.[0] ?? 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        skills: value === 'all' ? undefined : [value],
                      })
                    }
                  >
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder="All Skills" />
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
                </div>
              )}

              {/* Location */}
              {availableLocations.length > 0 && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={filters.locations?.[0] ?? 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        locations: value === 'all' ? undefined : [value],
                      })
                    }
                  >
                    <SelectTrigger className="min-h-11">
                      <MapPin className="size-4 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="All Locations" />
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
                </div>
              )}

              {/* Join Date Range */}
              <div className="space-y-2">
                <Label>Joined Between</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={timestampToDateString(filters.joinedAfter)}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        joinedAfter: dateStringToTimestamp(e.target.value),
                      })
                    }
                    className="min-h-11"
                  />
                  <Input
                    type="date"
                    value={timestampToDateString(filters.joinedBefore)}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        joinedBefore: dateStringToTimestamp(e.target.value),
                      })
                    }
                    className="min-h-11"
                  />
                </div>
              </div>

              {/* Directory Visibility */}
              <div className="space-y-2">
                <Label>Directory Visibility</Label>
                <Select
                  value={filters.directoryVisibility ?? 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      directoryVisibility:
                        value === 'all'
                          ? undefined
                          : (value as 'visible' | 'hidden' | 'all'),
                    })
                  }
                >
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {hasFilters && (
                <Button
                  variant="outline"
                  className="flex-1 min-h-11"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
              <Button
                className="flex-1 min-h-11"
                onClick={() => setSheetOpen(false)}
              >
                Show Results
              </Button>
            </div>
          </ResponsiveSheetContent>
        </ResponsiveSheet>
      </div>

      {/* Desktop: Keep existing inline layout */}
      <div className="hidden md:flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="pl-10"
          />
        </div>

        {/* Engagement filter */}
        <Select
          value={filters.engagementLevels?.[0] ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              engagementLevels:
                value === 'all' ? undefined : [value as EngagementLevel],
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
            value={filters.skills?.[0] ?? 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                skills: value === 'all' ? undefined : [value],
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
            value={filters.locations?.[0] ?? 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                locations: value === 'all' ? undefined : [value],
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
          value={filters.directoryVisibility ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              directoryVisibility:
                value === 'all'
                  ? undefined
                  : (value as 'visible' | 'hidden' | 'all'),
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
    </div>
  )
}
