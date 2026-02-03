import { useMutation } from 'convex/react'
import { format } from 'date-fns'
import { Calendar, ExternalLink, MapPin, Video } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'

export interface EventCardProps {
  event: {
    _id: Id<'events'>
    title: string
    startAt: number
    endAt?: number
    location?: string
    isVirtual: boolean
    url: string
    coverUrl?: string
    org: {
      name: string
      slug?: string
      logoUrl?: string
    }
  }
}

export function EventCard({ event }: EventCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const hasRecorded = useRef(false)
  const recordView = useMutation(api.notifications.mutations.recordEventView)

  // Track event view when card becomes visible
  useEffect(() => {
    const currentRef = cardRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !hasRecorded.current) {
          hasRecorded.current = true
          recordView({ eventId: event._id })
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(currentRef)

    return () => observer.disconnect()
  }, [event._id, recordView])

  // Format: "Fri, Jan 24 at 6:00 PM"
  const formattedDate = format(event.startAt, "EEE, MMM d 'at' h:mm a")

  return (
    <a
      ref={cardRef}
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0">
        <div className="flex items-start gap-3">
          {/* Event cover or org logo or calendar icon */}
          <div className="shrink-0">
            {event.coverUrl ? (
              <img
                src={event.coverUrl}
                alt={event.title}
                className="size-14 rounded-lg object-cover"
              />
            ) : event.org.logoUrl ? (
              <img
                src={event.org.logoUrl}
                alt={`${event.org.name} logo`}
                className="size-14 rounded-lg object-cover bg-slate-50 border border-slate-100"
              />
            ) : (
              <div className="size-14 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="size-6 text-slate-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {event.title}
            </h4>

            {/* Date/time */}
            <p className="text-sm text-slate-600 mt-1">{formattedDate}</p>

            {/* Location or Online badge */}
            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
              {event.isVirtual ? (
                <Badge variant="secondary" className="text-xs py-0 gap-1">
                  <Video className="size-3" />
                  Online
                </Badge>
              ) : event.location ? (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              ) : null}
            </div>

            {/* Org name */}
            <p className="text-xs text-slate-400 mt-1.5">{event.org.name}</p>
          </div>

          {/* External link icon */}
          <ExternalLink className="size-4 text-slate-400 shrink-0 mt-1" />
        </div>
      </Card>
    </a>
  )
}
