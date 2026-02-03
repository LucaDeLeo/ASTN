import { useQuery } from 'convex/react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Spinner } from '~/components/ui/spinner'

interface BookingExportButtonProps {
  spaceId: Id<'coworkingSpaces'>
  orgSlug: string
  startDate: string // ISO date for export range
  endDate: string
}

// Status labels for export
const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  rejected: 'Rejected',
}

// Booking type labels
const bookingTypeLabels: Record<string, string> = {
  member: 'Member',
  guest: 'Guest',
}

export function BookingExportButton({
  spaceId,
  orgSlug,
  startDate,
  endDate,
}: BookingExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Fetch all bookings in the date range for export (no pagination needed)
  const data = useQuery(api.spaceBookings.admin.getAdminBookingsForDateRange, {
    spaceId,
    startDate,
    endDate,
    status: 'all',
    limit: 1000, // High limit for export
  })

  const bookings = data?.bookings ?? []

  const handleExport = (format: 'csv' | 'json') => {
    if (bookings.length === 0) return

    setIsExporting(true)

    try {
      const filename = `${orgSlug}-bookings-${startDate}-to-${endDate}.${format}`

      if (format === 'json') {
        exportJson(bookings, filename)
      } else {
        exportCsv(bookings, filename)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || !bookings.length}>
          {isExporting ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="size-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="size-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Type for booking data from the query
type ExportBooking = {
  _id: string
  date: string
  startMinutes: number
  endMinutes: number
  bookingType: string
  status: string
  workingOn?: string
  interestedInMeeting?: string
  rejectionReason?: string
  createdAt: number
  profile: {
    name: string | undefined
    headline: string | undefined
    organization: string | undefined
    title: string | undefined
    email: string | undefined
    isGuest: boolean
  } | null
  customFieldResponses: Array<{ fieldId: string; value: string }>
  approvedByName?: string
}

function exportJson(bookings: Array<ExportBooking>, filename: string) {
  const data = bookings.map((b) => transformBookingForExport(b))

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, filename)
}

function exportCsv(bookings: Array<ExportBooking>, filename: string) {
  const headers = [
    'Date',
    'Name',
    'Email',
    'Type',
    'Status',
    'Time Range',
    'Working On',
    'Interested In Meeting',
    'Created At',
    'Approved By',
    'Rejection Reason',
  ]

  const rows = bookings.map((b) => {
    const data = transformBookingForExport(b)
    return [
      escapeCsvField(data.date),
      escapeCsvField(data.name),
      escapeCsvField(data.email),
      escapeCsvField(data.type),
      escapeCsvField(data.status),
      escapeCsvField(data.timeRange),
      escapeCsvField(data.workingOn),
      escapeCsvField(data.interestedInMeeting),
      escapeCsvField(data.createdAt),
      escapeCsvField(data.approvedBy),
      escapeCsvField(data.rejectionReason),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

function transformBookingForExport(booking: ExportBooking) {
  return {
    date: booking.date,
    name: booking.profile?.name || 'Unknown',
    email: booking.profile?.email || '',
    type: bookingTypeLabels[booking.bookingType] || booking.bookingType,
    status: statusLabels[booking.status] || booking.status,
    timeRange: `${formatTime(booking.startMinutes)} - ${formatTime(booking.endMinutes)}`,
    workingOn: booking.workingOn || '',
    interestedInMeeting: booking.interestedInMeeting || '',
    createdAt: new Date(booking.createdAt).toISOString().split('T')[0],
    approvedBy: booking.approvedByName || '',
    rejectionReason: booking.rejectionReason || '',
  }
}

// Format minutes to display time
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
}

function escapeCsvField(value: string): string {
  if (!value) return '""'
  // Escape double quotes and wrap in quotes if contains comma, newline, or quotes
  const escaped = value.replace(/"/g, '""')
  if (
    escaped.includes(',') ||
    escaped.includes('\n') ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`
  }
  return escaped || '""'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
