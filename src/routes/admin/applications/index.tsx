import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  MapPin,
  Shield,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { RejectApplicationDialog } from '~/components/admin/RejectApplicationDialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export const Route = createFileRoute('/admin/applications/')({
  component: AdminApplicationsPage,
})

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'withdrawn'
type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

const PAGE_SIZE = 25

function AdminApplicationsPage() {
  const isPlatformAdmin = useQuery(api.orgApplications.checkPlatformAdmin)

  if (isPlatformAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (!isPlatformAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-4">
          Platform Admin Access Required
        </h1>
        <p className="text-slate-600">
          You need platform admin access to view the application review queue.
        </p>
      </div>
    )
  }

  return <ReviewQueue />
}

function ReviewQueue() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [page, setPage] = useState(1)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{
    id: Id<'orgApplications'>
    orgName: string
  } | null>(null)

  const queryStatus =
    statusFilter === 'all' ? undefined : (statusFilter as ApplicationStatus)
  const applications = useQuery(api.orgApplications.listAll, {
    status: queryStatus,
  })
  const approveApplication = useMutation(api.orgApplications.approve)

  const handleTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  const handleApprove = async (applicationId: Id<'orgApplications'>) => {
    try {
      await approveApplication({ applicationId })
      toast.success('Application approved! Organization created.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to approve application',
      )
    }
  }

  const handleRejectClick = (
    applicationId: Id<'orgApplications'>,
    orgName: string,
  ) => {
    setRejectTarget({ id: applicationId, orgName })
    setRejectDialogOpen(true)
  }

  if (applications === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE))
  const paginatedApplications = applications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-foreground mb-1">
          Org Applications
        </h1>
        <p className="text-muted-foreground text-sm">
          Review and manage organization applications to join ASTN.
        </p>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter}>
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                No {statusFilter === 'all' ? '' : statusFilter} applications
                found.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop: Table layout */}
              <div className="hidden md:block">
                <div className="rounded-lg border bg-background">
                  <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <div>Organization</div>
                    <div>Applicant</div>
                    <div>Location</div>
                    <div>Submitted</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  {paginatedApplications.map((app) => (
                    <ApplicationRow
                      key={app._id}
                      application={app}
                      onApprove={handleApprove}
                      onReject={handleRejectClick}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile: Card list */}
              <div className="md:hidden space-y-3">
                {paginatedApplications.map((app) => (
                  <ApplicationMobileCard
                    key={app._id}
                    application={app}
                    onApprove={handleApprove}
                    onReject={handleRejectClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}-
                    {Math.min(page * PAGE_SIZE, applications.length)} of{' '}
                    {applications.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {rejectTarget && (
        <RejectApplicationDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          applicationId={rejectTarget.id}
          orgName={rejectTarget.orgName}
        />
      )}
    </div>
  )
}

interface ApplicationData {
  _id: Id<'orgApplications'>
  orgName: string
  description: string
  applicantName: string
  applicantEmail: string
  city: string
  country: string
  website?: string
  status: ApplicationStatus
  createdAt: number
  rejectionReason?: string
}

const statusBadgeConfig: Record<
  ApplicationStatus,
  {
    label: string
    variant: 'outline' | 'default' | 'destructive' | 'secondary'
  }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'secondary' },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusBadgeConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function ApplicationRow({
  application,
  onApprove,
  onReject,
}: {
  application: ApplicationData
  onApprove: (id: Id<'orgApplications'>) => void
  onReject: (id: Id<'orgApplications'>, orgName: string) => void
}) {
  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b last:border-b-0 items-center text-sm">
      <div>
        <p className="font-medium text-foreground">{application.orgName}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {application.description}
        </p>
      </div>
      <div>
        <p className="text-foreground">{application.applicantName}</p>
        <p className="text-xs text-muted-foreground">
          {application.applicantEmail}
        </p>
      </div>
      <div className="text-muted-foreground">
        {application.city}, {application.country}
      </div>
      <div className="text-muted-foreground">
        {formatDistanceToNow(application.createdAt, { addSuffix: true })}
      </div>
      <div>
        <StatusBadge status={application.status} />
      </div>
      <div className="flex items-center gap-2">
        {application.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => onApprove(application._id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(application._id, application.orgName)}
            >
              <XCircle className="size-3.5 mr-1" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ApplicationMobileCard({
  application,
  onApprove,
  onReject,
}: {
  application: ApplicationData
  onApprove: (id: Id<'orgApplications'>) => void
  onReject: (id: Id<'orgApplications'>, orgName: string) => void
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {application.orgName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {application.applicantName}
              </p>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {application.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {application.city}, {application.country}
          </span>
          {application.website && (
            <span className="flex items-center gap-1">
              <Globe className="size-3" />
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Website
              </a>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatDistanceToNow(application.createdAt, { addSuffix: true })}
          </span>
        </div>

        {application.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onApprove(application._id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(application._id, application.orgName)}
              className="flex-1"
            >
              <XCircle className="size-3.5 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
