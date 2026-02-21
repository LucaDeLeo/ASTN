import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { getCategoryOptions } from './opportunity-filters'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '~/components/ui/responsive-sheet'

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Events & Training' },
]

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'onsite', label: 'On-site Only' },
]

interface MobileFiltersProps {
  typeFilter: string
  roleType: string
  locationFilter: string
  searchTerm: string
  onTypeChange: (value: string) => void
  onRoleChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSearchChange: (value: string) => void
  onClearFilters: () => void
}

export function MobileFilters({
  typeFilter,
  roleType,
  locationFilter,
  searchTerm,
  onTypeChange,
  onRoleChange,
  onLocationChange,
  onSearchChange,
  onClearFilters,
}: MobileFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const categoryOptions = getCategoryOptions(
    typeFilter !== 'all' ? typeFilter : undefined,
  )

  // Build active filter chips
  const activeFilters: Array<{
    key: string
    label: string
    onRemove: () => void
  }> = []

  if (typeFilter && typeFilter !== 'all') {
    const typeLabel =
      TYPE_OPTIONS.find((t) => t.value === typeFilter)?.label || typeFilter
    activeFilters.push({
      key: 'type',
      label: typeLabel,
      onRemove: () => onTypeChange('all'),
    })
  }

  if (roleType && roleType !== 'all') {
    const roleLabel =
      categoryOptions.find((r) => r.value === roleType)?.label || roleType
    activeFilters.push({
      key: 'role',
      label: roleLabel,
      onRemove: () => onRoleChange('all'),
    })
  }

  if (locationFilter && locationFilter !== 'all') {
    const locLabel =
      LOCATION_OPTIONS.find((l) => l.value === locationFilter)?.label ||
      locationFilter
    activeFilters.push({
      key: 'location',
      label: locLabel,
      onRemove: () => onLocationChange('all'),
    })
  }

  if (searchTerm) {
    activeFilters.push({
      key: 'search',
      label: `"${searchTerm}"`,
      onRemove: () => onSearchChange(''),
    })
  }

  return (
    <div className="space-y-3">
      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="pr-1 gap-1">
              {filter.label}
              <button
                onClick={filter.onRemove}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={onClearFilters}
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
            Filter Opportunities
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </ResponsiveSheetTrigger>
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader>
            <ResponsiveSheetTitle>Filter Opportunities</ResponsiveSheetTitle>
          </ResponsiveSheetHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                type="search"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="min-h-11"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter || 'all'} onValueChange={onTypeChange}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={roleType || 'all'} onValueChange={onRoleChange}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={locationFilter || 'all'}
                onValueChange={onLocationChange}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply button */}
          <Button
            className="w-full min-h-11"
            onClick={() => setSheetOpen(false)}
          >
            Show Results
          </Button>
        </ResponsiveSheetContent>
      </ResponsiveSheet>
    </div>
  )
}
