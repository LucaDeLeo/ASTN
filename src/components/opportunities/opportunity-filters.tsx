import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { MobileFilters } from './mobile-filters'
import { Button } from '~/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Events & Training' },
]

const JOB_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'research', label: 'Research' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'policy', label: 'Policy' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

const EVENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'conference', label: 'Conference' },
  { value: 'course', label: 'Course' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'talk', label: 'Talk' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'other', label: 'Other' },
]

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'onsite', label: 'On-site Only' },
]

export function getCategoryOptions(type?: string) {
  if (type === 'event') return EVENT_CATEGORIES
  if (type === 'job') return JOB_CATEGORIES
  return JOB_CATEGORIES // default to job categories when showing all
}

// Search params type for the opportunities route
type OpportunitySearchParams = {
  type?: string
  role?: string
  location?: string
  q?: string
}

export function OpportunityFilters() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/opportunities/' })

  const typeFilter = search.type || 'all'
  const roleType = search.role || 'all'
  const locationFilter = search.location || 'all'
  const searchTerm = search.q || ''

  const categoryOptions = getCategoryOptions(
    typeFilter !== 'all' ? typeFilter : undefined,
  )

  const updateFilter = useCallback(
    (key: keyof OpportunitySearchParams, value: string) => {
      void navigate({
        to: '/opportunities',
        search: (prev: OpportunitySearchParams) => {
          const newSearch = { ...prev }
          if (value === '' || value === 'all') {
            delete newSearch[key]
          } else {
            newSearch[key] = value
          }
          // Reset category when type changes (different value spaces)
          if (key === 'type') {
            delete newSearch.role
          }
          return newSearch
        },
      })
    },
    [navigate],
  )

  const clearFilters = () => {
    void navigate({
      to: '/opportunities',
      search: {},
    })
  }

  const hasActiveFilters =
    typeFilter !== 'all' ||
    roleType !== 'all' ||
    locationFilter !== 'all' ||
    searchTerm !== ''

  return (
    <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile filters */}
        <div className="md:hidden">
          <MobileFilters
            typeFilter={typeFilter}
            roleType={roleType}
            locationFilter={locationFilter}
            searchTerm={searchTerm}
            onTypeChange={(v) => updateFilter('type', v)}
            onRoleChange={(v) => updateFilter('role', v)}
            onLocationChange={(v) => updateFilter('location', v)}
            onSearchChange={(v) => updateFilter('q', v)}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
          {/* Search */}
          <InputGroup className="w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => updateFilter('q', e.target.value)}
            />
          </InputGroup>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(v) => updateFilter('type', v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter (contextual: role types for jobs, event types for events) */}
          <Select
            value={roleType}
            onValueChange={(v) => updateFilter('role', v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location/Remote Filter */}
          <Select
            value={locationFilter}
            onValueChange={(v) => updateFilter('location', v)}
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
  )
}
