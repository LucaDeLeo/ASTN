import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  FileText,
  Link2,
  Pencil,
  Plus,
  Shield,
  Star,
} from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import { OpportunityFormDialog } from '~/components/opportunities/OpportunityFormDialog'
import { AuthHeader } from '~/components/layout/auth-header'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'
import { useDotGridStyle } from '~/hooks/use-dot-grid-style'

export const Route = createFileRoute('/org/$slug/admin/opportunities/')({
  component: AdminOpportunitiesPage,
})

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-50 text-slate-600 border-slate-200',
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

const TYPE_LABELS: Record<string, string> = {
  course: 'Course',
  fellowship: 'Fellowship',
  job: 'Job',
  other: 'Other',
}

function AdminOpportunitiesPage() {
  const { slug } = Route.useParams()
  const dotGridStyle = useDotGridStyle()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const opportunities = useQuery(
    api.orgOpportunities.listAllByOrg,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )

  const [dialogOpen, setDialogOpen] = useState(false)

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
            <span className="text-slate-700">Opportunities</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                Opportunities
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your organization&apos;s opportunities and application
                forms
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              New Opportunity
            </Button>
          </div>

          {/* List */}
          {opportunities === undefined ? (
            <div className="py-12 text-center">
              <Spinner className="size-8 mx-auto" />
            </div>
          ) : opportunities.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="size-8 text-slate-400 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No opportunities yet. Create one to start receiving
                applications.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create First Opportunity
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const fieldCount = Array.isArray(opp.formFields)
                  ? (opp.formFields as Array<unknown>).length
                  : 0
                return (
                  <Card key={opp._id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {opp.title}
                          </span>
                          {opp.featured && (
                            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{TYPE_LABELS[opp.type] ?? opp.type}</span>
                          <span className="text-slate-300">|</span>
                          <span>
                            {fieldCount} form field
                            {fieldCount !== 1 ? 's' : ''}
                          </span>
                          {opp.deadline && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span>
                                Deadline:{' '}
                                {new Date(opp.deadline).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[opp.status] ?? ''}
                      >
                        {opp.status}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy application link"
                        onClick={async () => {
                          const url = `${window.location.origin}/org/${slug}/apply/${opp._id}`
                          try {
                            await navigator.clipboard.writeText(url)
                            toast.success('Application link copied')
                          } catch {
                            toast.error('Failed to copy link')
                          }
                        }}
                      >
                        <Link2 className="size-4" />
                      </Button>

                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/org/$slug/admin/opportunities/$oppId"
                          params={{ slug, oppId: opp._id }}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Create dialog */}
          <OpportunityFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            orgId={org._id}
            slug={slug}
          />
        </div>
      </main>
    </div>
  )
}
