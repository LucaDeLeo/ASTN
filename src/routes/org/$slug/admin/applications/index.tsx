import { Link, createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Shield,
} from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useDotGridStyle } from '~/hooks/use-dot-grid-style'

export const Route = createFileRoute('/org/$slug/admin/applications/')({
  component: AdminApplicationsPage,
})

type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  waitlisted: 'bg-purple-50 text-purple-700 border-purple-200',
}

function AdminApplicationsPage() {
  const { slug } = Route.useParams()
  const dotGridStyle = useDotGridStyle()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const featured = useQuery(
    api.orgOpportunities.getFeatured,
    org ? { orgId: org._id } : 'skip',
  )

  // Loading
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen" style={dotGridStyle}>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <Spinner className="size-8 mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen" style={dotGridStyle}>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Organization Not Found
            </h1>
          </div>
        </main>
      </div>
    )
  }

  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen" style={dotGridStyle}>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Shield className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Admin Access Required
            </h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={dotGridStyle}>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Link
              to="/org/$slug/admin"
              params={{ slug }}
              className="hover:text-slate-700 transition-colors"
            >
              Admin
            </Link>
            <span>/</span>
            <span className="text-slate-700">Applications</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                Applications
              </h1>
              <p className="text-muted-foreground mt-1">
                Review and manage opportunity applications
              </p>
            </div>
          </div>

          {featured ? (
            <ApplicationsTable
              opportunityId={featured._id}
              opportunityTitle={featured.title}
            />
          ) : (
            <Card className="p-8 text-center">
              <FileText className="size-8 text-slate-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No opportunities created yet. Create a featured opportunity to
                start receiving applications.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function ApplicationsTable({
  opportunityId,
  opportunityTitle,
}: {
  opportunityId: Id<'orgOpportunities'>
  opportunityTitle: string
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const applications = useQuery(api.opportunityApplications.listByOpportunity, {
    opportunityId,
    statusFilter:
      statusFilter !== 'all' ? (statusFilter as ApplicationStatus) : undefined,
  })
  const updateStatus = useMutation(api.opportunityApplications.updateStatus)
  const exportCsv = useAction(api.opportunityApplications.exportApplications)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportCsv({ opportunityId })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `applications-${opportunityTitle.toLowerCase().replace(/\s+/g, '-')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatusChange = async (
    applicationId: Id<'opportunityApplications'>,
    newStatus: ApplicationStatus,
  ) => {
    await updateStatus({ applicationId, status: newStatus })
  }

  return (
    <div>
      {/* Filters & Export */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="waitlisted">Waitlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {applications === undefined ? (
        <div className="py-12 text-center">
          <Spinner className="size-8 mx-auto" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="size-8 text-slate-400 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {statusFilter !== 'all'
              ? `No ${STATUS_LABELS[statusFilter as ApplicationStatus].toLowerCase()} applications.`
              : 'No applications received yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_120px_120px_100px_32px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Name</span>
            <span>Email</span>
            <span>Career Stage</span>
            <span>Submitted</span>
            <span>Status</span>
            <span />
          </div>

          {applications.map((app) => {
            const r = app.responses as Record<string, unknown>
            const isExpanded = expandedId === app._id
            return (
              <Card key={app._id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : app._id)}
                >
                  <div className="grid grid-cols-[1fr_1fr_120px_120px_100px_32px] gap-2 items-center px-4 py-3 text-sm">
                    <span className="font-medium truncate">
                      {String(r.firstName ?? '')} {String(r.lastName ?? '')}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {String(r.email ?? '')}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {String(r.careerStage ?? '')}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </span>
                    <span>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_COLORS[app.status as ApplicationStatus]
                        }
                      >
                        {STATUS_LABELS[app.status as ApplicationStatus]}
                      </Badge>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-4">
                    <ApplicationDetail
                      responses={r}
                      status={app.status as ApplicationStatus}
                      applicationId={app._id}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ApplicationDetail({
  responses,
  status,
  applicationId,
  onStatusChange,
}: {
  responses: Record<string, unknown>
  status: ApplicationStatus
  applicationId: Id<'opportunityApplications'>
  onStatusChange: (
    id: Id<'opportunityApplications'>,
    s: ApplicationStatus,
  ) => void
}) {
  const r = responses

  const sections = [
    {
      title: 'Course Preferences',
      fields: [
        {
          label: 'Applying as',
          value: Array.isArray(r.applyingAs)
            ? (r.applyingAs as Array<string>).join(', ')
            : String(r.applyingAs ?? ''),
        },
        { label: 'Round', value: String(r.roundPreference ?? '') },
        {
          label: 'Open to alternative placement',
          value: r.openToAlternativePlacement ? 'Yes' : 'No',
        },
      ],
    },
    {
      title: 'Personal Info',
      fields: [
        {
          label: 'Name',
          value: `${String(r.firstName ?? '')} ${String(r.lastName ?? '')}`,
        },
        { label: 'Email', value: String(r.email ?? '') },
        { label: 'Profile URL', value: String(r.profileUrl ?? '') },
        {
          label: 'Other profile',
          value: String(r.otherProfileLink ?? ''),
        },
        {
          label: 'Fields of study',
          value: Array.isArray(r.fieldsOfStudy)
            ? (r.fieldsOfStudy as Array<string>).join(', ')
            : String(r.fieldsOfStudy ?? ''),
        },
        { label: 'Career stage', value: String(r.careerStage ?? '') },
        { label: 'Location', value: String(r.location ?? '') },
      ],
    },
    {
      title: 'Essays',
      fields: [
        {
          label: 'How course helps contribute to AI safety',
          value: String(r.howCourseHelps ?? ''),
        },
        {
          label: 'AI safety engagement',
          value: String(r.aiSafetyEngagement ?? ''),
        },
        {
          label: 'Relevant skills',
          value: String(r.relevantSkills ?? ''),
        },
        {
          label: 'Proudest achievement',
          value: String(r.proudestAchievement ?? ''),
        },
      ],
    },
    {
      title: 'Referral & Consents',
      fields: [
        {
          label: 'Where heard about course',
          value: String(r.howHeardAbout ?? ''),
        },
        {
          label: 'Nominee email',
          value: String(r.nomineeEmail ?? ''),
        },
        {
          label: 'Can mention name',
          value:
            r.canMentionName === true
              ? 'Yes'
              : r.canMentionName === false
                ? 'No'
                : '',
        },
        {
          label: 'Form feedback',
          value: String(r.applicationFeedback ?? ''),
        },
        {
          label: 'Data sharing consent',
          value: r.dataShareConsent ? 'Yes' : 'No',
        },
        {
          label: 'Diversity data consent',
          value: r.diversityDataConsent ? 'Yes' : 'No',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {section.title}
          </h4>
          <div className="space-y-2">
            {section.fields
              .filter((f) => f.value)
              .map((field) => (
                <div key={field.label}>
                  <span className="text-xs text-muted-foreground">
                    {field.label}
                  </span>
                  <p className="text-sm whitespace-pre-wrap">{field.value}</p>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Status update */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <span className="text-sm font-medium">Update status:</span>
        <Select
          value={status}
          onValueChange={(val) =>
            onStatusChange(applicationId, val as ApplicationStatus)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
