import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  UserCircle,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface Props {
  spaceId: Id<'coworkingSpaces'>
}

interface GuestGroup {
  guestUserId: string
  name: string
  email: string
  organization?: string
  becameMember: boolean
  totalVisits: number
  approvedCount: number
  rejectedCount: number
  firstVisitDate?: string
  lastVisitDate?: string
  visits: Array<{
    bookingId: Id<'spaceBookings'>
    date: string
    startMinutes: number
    endMinutes: number
    status: 'confirmed' | 'rejected'
  }>
}

export function GuestVisitHistory({ spaceId }: Props) {
  const visitHistory = useQuery(api.guestBookings.getGuestVisitHistory, {
    spaceId,
  })
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set())

  // Group bookings by guest
  const groupedByGuest = useMemo(() => {
    if (!visitHistory) return []

    const guestMap = new Map<string, GuestGroup>()

    for (const booking of visitHistory) {
      const userId = booking.userId
      const existing = guestMap.get(userId)

      const visit = {
        bookingId: booking._id,
        date: booking.date,
        startMinutes: booking.startMinutes,
        endMinutes: booking.endMinutes,
        status: booking.status as 'confirmed' | 'rejected',
      }

      if (existing) {
        existing.visits.push(visit)
        existing.totalVisits++
        if (booking.status === 'confirmed') {
          existing.approvedCount++
        } else {
          existing.rejectedCount++
        }
        // Update date range
        if (
          !existing.firstVisitDate ||
          booking.date < existing.firstVisitDate
        ) {
          existing.firstVisitDate = booking.date
        }
        if (!existing.lastVisitDate || booking.date > existing.lastVisitDate) {
          existing.lastVisitDate = booking.date
        }
      } else {
        guestMap.set(userId, {
          guestUserId: userId,
          name: booking.guestProfile?.name ?? 'Unknown Guest',
          email: booking.guestProfile?.email ?? 'No email',
          organization: booking.guestProfile?.organization,
          becameMember: booking.guestProfile?.becameMember ?? false,
          totalVisits: 1,
          approvedCount: booking.status === 'confirmed' ? 1 : 0,
          rejectedCount: booking.status === 'rejected' ? 1 : 0,
          firstVisitDate: booking.date,
          lastVisitDate: booking.date,
          visits: [visit],
        })
      }
    }

    // Sort guests by most recent visit
    return Array.from(guestMap.values()).sort((a, b) => {
      const aDate = a.lastVisitDate ?? ''
      const bDate = b.lastVisitDate ?? ''
      return bDate.localeCompare(aDate)
    })
  }, [visitHistory])

  // Calculate totals
  const totals = useMemo(() => {
    return groupedByGuest.reduce(
      (acc, guest) => ({
        totalGuests: acc.totalGuests + 1,
        totalApproved: acc.totalApproved + guest.approvedCount,
        totalRejected: acc.totalRejected + guest.rejectedCount,
      }),
      { totalGuests: 0, totalApproved: 0, totalRejected: 0 },
    )
  }, [groupedByGuest])

  const toggleExpanded = (userId: string) => {
    const newExpanded = new Set(expandedGuests)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedGuests(newExpanded)
  }

  if (visitHistory === undefined) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (groupedByGuest.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">No Visit History</p>
          <p className="text-sm text-slate-500">
            Approved and rejected guest visits will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.totalGuests}</p>
                <p className="text-sm text-slate-500">Total Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.totalApproved}</p>
                <p className="text-sm text-slate-500">Approved Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.totalRejected}</p>
                <p className="text-sm text-slate-500">Rejected Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="size-5" />
            Visit History by Guest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groupedByGuest.map((guest) => (
              <div
                key={guest.guestUserId}
                className="border rounded-lg overflow-hidden"
              >
                {/* Guest Header - Clickable */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(guest.guestUserId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserCircle className="size-6 text-slate-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-slate-500">{guest.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {guest.totalVisits} visits
                    </Badge>
                    {guest.becameMember && (
                      <Badge variant="default">Member</Badge>
                    )}
                    {expandedGuests.has(guest.guestUserId) ? (
                      <ChevronUp className="size-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Visit Details */}
                {expandedGuests.has(guest.guestUserId) && (
                  <div className="border-t bg-slate-50 p-4 space-y-2">
                    {guest.visits.map((visit) => (
                      <div
                        key={visit.bookingId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="size-4 text-slate-400" />
                          <span className="text-sm">
                            {format(new Date(visit.date), 'MMMM d, yyyy')}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTime(visit.startMinutes)} -{' '}
                            {formatTime(visit.endMinutes)}
                          </span>
                        </div>
                        <Badge
                          variant={
                            visit.status === 'confirmed'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {visit.status === 'confirmed'
                            ? 'Approved'
                            : 'Rejected'}
                        </Badge>
                      </div>
                    ))}
                    {guest.firstVisitDate && (
                      <p className="text-xs text-slate-500 mt-2 pl-3">
                        First visit:{' '}
                        {format(new Date(guest.firstVisitDate), 'MMM d, yyyy')}
                        {guest.lastVisitDate &&
                          guest.lastVisitDate !== guest.firstVisitDate && (
                            <>
                              {' '}
                              | Last visit:{' '}
                              {format(
                                new Date(guest.lastVisitDate),
                                'MMM d, yyyy',
                              )}
                            </>
                          )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`
}
