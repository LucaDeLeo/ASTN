import { useQuery } from 'convex/react'
import { MapPin, Search, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
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
import { Button } from '~/components/ui/button'

interface OrgFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  country: string | undefined
  onCountryChange: (value: string | undefined) => void
}

export function OrgFilters({
  searchQuery,
  onSearchChange,
  country,
  onCountryChange,
}: OrgFiltersProps) {
  const countries = useQuery(api.orgs.discovery.getOrgCountries)

  const hasFilters = searchQuery || country

  const clearFilters = () => {
    onSearchChange('')
    onCountryChange(undefined)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search input */}
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      {/* Country filter */}
      <Select
        value={country ?? 'all'}
        onValueChange={(val) =>
          onCountryChange(val === 'all' ? undefined : val)
        }
      >
        <SelectTrigger className="w-full sm:w-48">
          <MapPin className="size-4 mr-2 text-slate-400" />
          <SelectValue placeholder="All countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All countries</SelectItem>
          {countries?.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
