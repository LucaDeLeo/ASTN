import { Link, useNavigate } from '@tanstack/react-router'
import { Building2, Calendar, MapPin, Users } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

export interface OrgCardProps {
  org: {
    _id: Id<'organizations'>
    name: string
    slug?: string
    logoUrl?: string
    description?: string
    city?: string
    country?: string
    memberCount?: number
    upcomingEventCount?: number
  }
  variant?: 'carousel' | 'list'
}

export function OrgCard({ org, variant = 'carousel' }: OrgCardProps) {
  const location = [org.city, org.country].filter(Boolean).join(', ')
  const slug = org.slug ?? org._id
  const navigate = useNavigate()

  const handleNavigate = () => {
    navigate({ to: '/org/$slug', params: { slug } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNavigate()
    }
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={org.name}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className={
        (variant === 'carousel'
          ? 'w-72 p-4 flex flex-col'
          : 'w-full p-4 flex flex-col') +
        ' cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      }
    >
      {/* Logo and name */}
      <div className="flex items-start gap-3 mb-3">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={`${org.name} logo`}
            className="size-12 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="size-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Building2 className="size-6 text-slate-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{org.name}</h3>
          {location && (
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {org.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-1">
          {org.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        {org.memberCount !== undefined && org.memberCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className="size-3.5" />
            <span>
              {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        )}
        {org.upcomingEventCount !== undefined && org.upcomingEventCount > 0 && (
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>
              {org.upcomingEventCount} upcoming{' '}
              {org.upcomingEventCount === 1 ? 'event' : 'events'}
            </span>
          </div>
        )}
      </div>

      {/* Action button - not a separate tab stop since card handles navigation */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full mt-auto"
        tabIndex={-1}
      >
        <Link to="/org/$slug" params={{ slug }} tabIndex={-1}>
          View Organization
        </Link>
      </Button>
    </Card>
  )
}
