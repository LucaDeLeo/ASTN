import { useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'

interface CustomField {
  fieldId: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  options?: Array<string>
  placeholder?: string
}

interface Props {
  spaceId: Id<'coworkingSpaces'>
  customFields: Array<CustomField>
}

// Type for pending application from query
type PendingApplication = Doc<'spaceBookings'> & {
  guestProfile: Doc<'guestProfiles'> | null
  customFieldResponses: Array<Doc<'visitApplicationResponses'>>
}

// Type for batch approve result
interface BatchApproveResult {
  bookingId: Id<'spaceBookings'>
  success: boolean
  error?: string
}

export function GuestApplicationQueue({ spaceId, customFields }: Props) {
  const pendingApplications = useQuery(
    api.guestBookings.getPendingGuestApplications,
    { spaceId },
  )
  const approveVisit = useMutation(api.guestBookings.approveGuestVisit)
  const rejectVisit = useMutation(api.guestBookings.rejectGuestVisit)
  const batchApprove = useMutation(api.guestBookings.batchApproveGuestVisits)

  const [selectedIds, setSelectedIds] = useState<Set<Id<'spaceBookings'>>>(
    new Set(),
  )
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<Id<'spaceBookings'> | null>(
    null,
  )
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Create a map from fieldId to label
  const fieldLabelMap = new Map<string, string>()
  for (const field of customFields) {
    fieldLabelMap.set(field.fieldId, field.label)
  }

  if (pendingApplications === undefined) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (pendingApplications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">
            No Pending Applications
          </p>
          <p className="text-sm text-slate-500">
            New guest visit requests will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  const toggleSelect = (id: Id<'spaceBookings'>) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingApplications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(
        new Set(pendingApplications.map((a: PendingApplication) => a._id)),
      )
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleApprove = async (bookingId: Id<'spaceBookings'>) => {
    setIsProcessing(true)
    try {
      await approveVisit({ bookingId })
      toast.success('Visit approved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectingId || rejectionReason.length < 10) {
      toast.error('Please provide a reason (at least 10 characters)')
      return
    }

    setIsProcessing(true)
    try {
      await rejectVisit({ bookingId: rejectingId, rejectionReason })
      toast.success('Visit rejected')
      setRejectDialogOpen(false)
      setRejectingId(null)
      setRejectionReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return

    setIsProcessing(true)
    try {
      const results = await batchApprove({
        spaceId,
        bookingIds: Array.from(selectedIds),
      })
      const successCount = results.filter(
        (r: BatchApproveResult) => r.success,
      ).length
      toast.success(
        `Approved ${successCount} of ${results.length} applications`,
      )
      setSelectedIds(new Set())
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Batch approval failed',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const openRejectDialog = (bookingId: Id<'spaceBookings'>) => {
    setRejectingId(bookingId)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Batch Actions Bar */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.size === pendingApplications.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-slate-600">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${pendingApplications.length} pending`}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={handleBatchApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="size-4 mr-2" />
            )}
            Approve Selected
          </Button>
        )}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {pendingApplications.map((application: PendingApplication) => (
          <Card key={application._id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(application._id)}
                  onCheckedChange={() => toggleSelect(application._id)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">
                        {application.guestProfile?.name ?? 'Unknown Guest'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {application.guestProfile?.email ?? 'No email'}
                      </p>
                      {application.guestProfile?.organization && (
                        <p className="text-sm text-slate-500">
                          {application.guestProfile.organization}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="mb-1">
                        {format(new Date(application.date), 'MMM d, yyyy')}
                      </Badge>
                      <p className="text-xs text-slate-500">
                        {formatTime(application.startMinutes)} -{' '}
                        {formatTime(application.endMinutes)}
                      </p>
                    </div>
                  </div>

                  {/* Custom Field Responses */}
                  {application.customFieldResponses.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(application._id)}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {expandedIds.has(application._id) ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                        View application details
                      </button>
                      {expandedIds.has(application._id) && (
                        <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-lg">
                          {application.customFieldResponses.map(
                            (response: Doc<'visitApplicationResponses'>) => (
                              <div key={response.fieldId}>
                                <p className="text-xs font-medium text-slate-500">
                                  {fieldLabelMap.get(response.fieldId) ??
                                    response.fieldId}
                                </p>
                                <p className="text-sm">
                                  {response.value || '(empty)'}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(application._id)}
                      disabled={isProcessing}
                    >
                      <Check className="size-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectDialog(application._id)}
                      disabled={isProcessing}
                    >
                      <X className="size-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Visit Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this visit request. The
              guest will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (at least 10 characters)..."
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || rejectionReason.length < 10}
            >
              {isProcessing ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
