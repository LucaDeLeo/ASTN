import { Link, createFileRoute } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'
import DOMPurify from 'dompurify'
import { Building2, Loader2, Mail, Shield } from 'lucide-react'
import { marked } from 'marked'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute(
  '/org/$slug/admin/opportunities/$oppId/email',
)({
  component: EmailComposePage,
})

type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'

const ALL_STATUSES: Array<{
  value: ApplicationStatus
  label: string
}> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
]

function EmailComposePage() {
  const { slug, oppId } = Route.useParams()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const opportunity = useQuery(api.orgOpportunities.get, {
    id: oppId as Id<'orgOpportunities'>,
  })
  // Fetch all applications (no status filter) for client-side filtering
  const allApplications = useQuery(
    api.opportunityApplications.listByOpportunity,
    opportunity ? { opportunityId: opportunity._id } : 'skip',
  )
  // Check for active poll (for {{poll_link}} support)
  const activePoll = useQuery(
    api.availabilityPolls.getPollByOpportunity,
    opportunity ? { opportunityId: opportunity._id } : 'skip',
  )

  const [selectedStatuses, setSelectedStatuses] = useState<
    Set<ApplicationStatus>
  >(new Set(ALL_STATUSES.map((s) => s.value)))
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [hasSent, setHasSent] = useState(false)

  const sendBroadcast = useAction(
    api.emails.adminBroadcastAction.sendBroadcastToApplicants,
  )

  const recipientCount = useMemo(() => {
    if (!allApplications) return 0
    const seen = new Set<string>()
    for (const app of allApplications) {
      if (!selectedStatuses.has(app.status as ApplicationStatus)) continue
      const key = app.guestEmail ?? app.userId ?? app._id
      seen.add(key)
    }
    return seen.size
  }, [allApplications, selectedStatuses])

  const previewHtml = useMemo(() => {
    if (!body.trim()) return ''
    return DOMPurify.sanitize(marked.parse(body, { async: false, gfm: true }))
  }, [body])

  const toggleStatus = (status: ApplicationStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  const handleSend = async () => {
    if (!opportunity || isSending || hasSent) return
    setIsSending(true)
    try {
      const result = await sendBroadcast({
        opportunityId: opportunity._id,
        statuses: Array.from(selectedStatuses),
        subject: subject.trim(),
        markdownBody: body,
        pollId: activePoll?._id,
        pollLinkBase: activePoll
          ? `${window.location.origin}/org/${slug}/poll/${activePoll.accessToken}`
          : undefined,
      })
      if (result.failed === 0) {
        toast.success(
          `Email sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}`,
        )
      } else {
        toast.warning(
          `Sent to ${result.sent}, failed for ${result.failed} recipient${result.failed !== 1 ? 's' : ''}`,
        )
      }
      setHasSent(true)
    } catch (err) {
      console.error('Broadcast send failed:', err)
      toast.error('Failed to send emails')
    } finally {
      setIsSending(false)
    }
  }

  if (
    org === undefined ||
    membership === undefined ||
    opportunity === undefined
  ) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Spinner className="size-8 mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50">
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
      <div className="min-h-screen bg-slate-50">
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Mail className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Opportunity Not Found
            </h1>
            <Button asChild>
              <Link to="/org/$slug/admin/opportunities" params={{ slug }}>
                Back to Opportunities
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const canSend =
    subject.trim() &&
    body.trim() &&
    selectedStatuses.size > 0 &&
    recipientCount > 0 &&
    !hasSent

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <Link
              to="/org/$slug/admin/opportunities"
              params={{ slug }}
              className="hover:text-slate-700 transition-colors"
            >
              Opportunities
            </Link>
            <span>/</span>
            <Link
              to="/org/$slug/admin/opportunities/$oppId"
              params={{ slug, oppId }}
              className="hover:text-slate-700 transition-colors"
            >
              {opportunity.title}
            </Link>
            <span>/</span>
            <span className="text-slate-700">Email</span>
          </div>

          <h1 className="text-2xl font-display font-semibold text-foreground mb-6">
            Email Applicants
          </h1>

          {/* Status filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {ALL_STATUSES.map((s) => (
                  <label
                    key={s.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedStatuses.has(s.value)}
                      onCheckedChange={() => toggleStatus(s.value)}
                    />
                    <span className="text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {allApplications === undefined
                  ? 'Loading recipients...'
                  : `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} selected`}
              </p>
            </CardContent>
          </Card>

          {/* Compose + Preview */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Compose */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compose</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Welcome to the AI Safety Course"
                    disabled={hasSent}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email-body">Body (Markdown)</Label>
                  <Textarea
                    id="email-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="Write your message here... Markdown is supported."
                    disabled={hasSent}
                  />
                  {activePoll && activePoll.status !== 'finalized' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use{' '}
                      <code className="bg-slate-100 px-1 rounded text-[11px]">
                        {'{{poll_link}}'}
                      </code>{' '}
                      to include each applicant&apos;s unique availability poll
                      link.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-sm">
                    {/* Logo */}
                    <div className="text-center mb-4">
                      <img
                        src="/logo.png"
                        alt="ASTN"
                        className="h-10 mx-auto"
                      />
                    </div>
                    {/* Greeting */}
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Hi Jane,
                    </p>
                    {previewHtml ? (
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Start typing to see a preview...
                      </p>
                    )}
                    {/* Footer */}
                    <hr className="my-4 border-gray-200" />
                    <p className="text-xs text-gray-400 text-center">
                      AI Safety Talent Network
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      safetytalent.org
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Send */}
          <div className="mt-6 flex justify-end">
            {hasSent ? (
              <Button disabled>
                <Mail className="size-4 mr-2" />
                Sent
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!canSend || isSending}>
                    {isSending ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="size-4 mr-2" />
                        Send to {recipientCount} applicant
                        {recipientCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send email?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send &quot;{subject}&quot; to {recipientCount}{' '}
                      applicant
                      {recipientCount !== 1 ? 's' : ''}. This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend}>
                      Send
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
