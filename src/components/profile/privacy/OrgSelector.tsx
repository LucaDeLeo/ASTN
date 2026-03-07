import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { Building2, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'

interface OrgSelectorProps {
  selectedOrgs: Array<string>
  onOrgsChange: (orgs: Array<string>) => void
}

export function OrgSelector({ selectedOrgs, onOrgsChange }: OrgSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrowse, setShowBrowse] = useState(false)

  const allOrgs = useQuery(api.organizations.listOrganizations)
  const searchResults = useQuery(
    api.organizations.searchOrganizations,
    searchQuery.trim() ? { query: searchQuery } : 'skip',
  )

  // Filter out orgs the user is a member of (members can't hide from their own orgs)
  const userMemberships = useQuery(api.orgs.membership.getUserMemberships)
  const memberOrgIds = useMemo(
    () => new Set(userMemberships?.map((m) => m.orgId.toString()) ?? []),
    [userMemberships],
  )

  // Get selected organization details (exclude member orgs from selection)
  const selectedOrgDetails =
    allOrgs?.filter(
      (org) => selectedOrgs.includes(org._id) && !memberOrgIds.has(org._id),
    ) ?? []

  // Filter available orgs to exclude ones the user belongs to
  const availableOrgs = useMemo(
    () => allOrgs?.filter((org) => !memberOrgIds.has(org._id)) ?? [],
    [allOrgs, memberOrgIds],
  )
  const filteredSearchResults = useMemo(
    () => searchResults?.filter((org) => !memberOrgIds.has(org._id)) ?? [],
    [searchResults, memberOrgIds],
  )

  const toggleOrg = (orgId: string) => {
    if (selectedOrgs.includes(orgId)) {
      onOrgsChange(selectedOrgs.filter((id) => id !== orgId))
    } else {
      onOrgsChange([...selectedOrgs, orgId])
    }
  }

  const removeOrg = (orgId: string) => {
    onOrgsChange(selectedOrgs.filter((id) => id !== orgId))
  }

  return (
    <div className="space-y-4">
      {/* Selected organizations as chips */}
      {selectedOrgDetails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOrgDetails.map((org) => (
            <Badge
              key={org._id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <Building2 className="size-3 mr-1" />
              {org.name}
              <button
                onClick={() => removeOrg(org._id)}
                className="ml-1 hover:bg-slate-300 rounded-full p-0.5 transition-colors"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      {/* Search results */}
      {searchQuery.trim() && searchResults && (
        <div className="border rounded-md max-h-48 overflow-y-auto">
          {filteredSearchResults.length === 0 ? (
            <p className="p-3 text-sm text-slate-500 text-center">
              No organizations found
            </p>
          ) : (
            <div className="divide-y">
              {filteredSearchResults.map((org) => (
                <button
                  key={org._id}
                  onClick={() => toggleOrg(org._id)}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors ${
                    selectedOrgs.includes(org._id) ? 'bg-slate-50' : ''
                  }`}
                >
                  <span className="text-sm">{org.name}</span>
                  {selectedOrgs.includes(org._id) && (
                    <Badge variant="default" className="text-xs">
                      Hidden
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse toggle */}
      {!searchQuery.trim() && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowBrowse(!showBrowse)}
            className="text-slate-600 hover:text-foreground"
          >
            {showBrowse ? (
              <>
                <ChevronUp className="size-4 mr-1" />
                Hide all organizations
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1" />
                Browse all organizations
              </>
            )}
          </Button>

          {/* Browse list */}
          {showBrowse && allOrgs && (
            <div className="mt-2 border rounded-md max-h-64 overflow-y-auto">
              {availableOrgs.length === 0 ? (
                <p className="p-3 text-sm text-slate-500 text-center">
                  No organizations available
                </p>
              ) : (
                <div className="divide-y">
                  {availableOrgs.map((org) => (
                    <label
                      key={org._id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedOrgs.includes(org._id)}
                        onCheckedChange={() => toggleOrg(org._id)}
                      />
                      <span className="text-sm">{org.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        Selected organizations won&apos;t see your profile in search results or
        matches. Organizations you&apos;ve joined always have access to your
        profile.
      </p>
    </div>
  )
}
