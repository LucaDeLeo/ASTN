import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import { validateResponses } from '../../../../../convex/lib/formFields'
import type { Id } from '../../../../../convex/_generated/dataModel'
import type { FormField } from '../../../../../convex/lib/formFields'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { DynamicFormRenderer } from '~/components/opportunities/DynamicFormRenderer'
import { Button } from '~/components/ui/button'
import { saveGuestApplicationEmail } from '~/lib/pendingGuestApplication'

export const Route = createFileRoute('/org/$slug/apply/$opportunityId')({
  loader: async ({ context, params }) => {
    const [org, opportunity] = await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.orgs.directory.getOrgBySlug, { slug: params.slug }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.orgOpportunities.get, {
          id: params.opportunityId as Id<'orgOpportunities'>,
        }),
      ),
    ])
    return { org, opportunity }
  },
  head: ({ loaderData }) => {
    const org = loaderData?.org
    const opportunity = loaderData?.opportunity
    const orgName = org?.name ?? 'Organization'
    const title = opportunity
      ? `${opportunity.title} — Apply at ${orgName}`
      : `Apply — ${orgName}`
    const rawDesc = opportunity?.description ?? ''
    const description =
      rawDesc.length > 155 ? rawDesc.slice(0, 152) + '...' : rawDesc
    const fallback = `Apply for this opportunity at ${orgName} on AI Safety Talent Network.`

    return {
      meta: [
        { title },
        { name: 'description', content: description || fallback },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description || fallback },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description || fallback },
      ],
    }
  },
  component: ApplyPage,
})

// Well-known keys that can be pre-filled from profile data
const PROFILE_PREFILL_KEYS = [
  'firstName',
  'lastName',
  'email',
  'location',
  'profileUrl',
] as const

function ApplyPage() {
  const { slug, opportunityId } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const { user } = useUser()

  const { data: org } = useSuspenseQuery(
    convexQuery(api.orgs.directory.getOrgBySlug, { slug }),
  )
  const { data: opportunity } = useSuspenseQuery(
    convexQuery(api.orgOpportunities.get, {
      id: opportunityId as Id<'orgOpportunities'>,
    }),
  )
  const existingApplication = useQuery(
    api.opportunityApplications.getMyApplication,
    isAuthenticated && opportunity
      ? { opportunityId: opportunity._id }
      : 'skip',
  )
  const profile = useQuery(
    api.profiles.getOrCreateProfile,
    isAuthenticated ? {} : 'skip',
  )
  const submitApplication = useMutation(api.opportunityApplications.submit)
  const submitGuestApplication = useMutation(
    api.opportunityApplications.submitGuest,
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAsGuest, setSubmittedAsGuest] = useState(false)
  const [preFilled, setPreFilled] = useState(false)
  const [responses, setResponses] = useState<Record<string, unknown>>({})

  const formFields = (opportunity?.formFields ?? []) as Array<FormField>

  // Pre-fill from profile + Clerk user (only when authenticated)
  if (
    isAuthenticated &&
    profile &&
    user &&
    !preFilled &&
    formFields.length > 0
  ) {
    const nameParts = (profile.name || user.fullName || '').split(' ')
    const profileData: Record<string, string> = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.primaryEmailAddress?.emailAddress || '',
      location: profile.location || '',
      profileUrl: profile.linkedinUrl || '',
    }

    const updates: Record<string, unknown> = {}
    for (const key of PROFILE_PREFILL_KEYS) {
      if (profileData[key] && !responses[key]) {
        updates[key] = profileData[key]
      }
    }

    if (Object.keys(updates).length > 0) {
      setResponses((prev) => ({ ...prev, ...updates }))
    }
    setPreFilled(true)
  }

  if (!org || !opportunity) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <h1 className="text-2xl font-display text-foreground mb-4">
              Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              This opportunity doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Already applied (authenticated user) or just submitted
  if (existingApplication || (submitted && !submittedAsGuest)) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Application Submitted
            </h1>
            <p className="text-slate-600 mb-6">
              Your application for <strong>{opportunity.title}</strong> has been
              submitted. You&apos;ll hear back from the organizers soon.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to {org.name}
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Guest success page: submitted as guest, prompt to create account
  if (submittedAsGuest) {
    const guestEmail = String(responses.email ?? '')
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Application Submitted
            </h1>
            <p className="text-slate-600 mb-6">
              Your application for <strong>{opportunity.title}</strong> has been
              submitted. You&apos;ll hear back from the organizers soon.
            </p>
            {guestEmail && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Create an account to track your application
                </p>
                <p>
                  Sign up with the same email ({guestEmail}) to view your
                  application status and join {org.name}.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {guestEmail && (
                <Button
                  onClick={() => {
                    saveGuestApplicationEmail(guestEmail)
                    navigate({ to: '/login' })
                  }}
                >
                  <UserPlus className="size-4 mr-2" />
                  Create Account
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link to="/org/$slug" params={{ slug }}>
                  Back to {org.name}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  // No form fields configured
  if (formFields.length === 0) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <h1 className="text-2xl font-display text-foreground mb-4">
              Application Form Not Available
            </h1>
            <p className="text-slate-600 mb-6">
              The application form for this opportunity hasn&apos;t been
              configured yet. Please check back later.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to {org.name}
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  const validationErrors = validateResponses(formFields, responses)
  const isValid = validationErrors.length === 0

  const handleChange = (key: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (isAuthenticated) {
        await submitApplication({
          opportunityId: opportunity._id,
          responses,
        })
        setSubmitted(true)
      } else {
        const email = String(responses.email ?? '')
          .trim()
          .toLowerCase()
        if (!email) return
        await submitGuestApplication({
          opportunityId: opportunity._id,
          guestEmail: email,
          responses,
        })
        setSubmitted(true)
        setSubmittedAsGuest(true)
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasPreFilledData =
    isAuthenticated &&
    preFilled &&
    PROFILE_PREFILL_KEYS.some((key) => responses[key])

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link
            to="/org/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to {org.name}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-semibold text-foreground">
              {opportunity.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {opportunity.description}
            </p>
            {opportunity.externalUrl && (
              <a
                href={opportunity.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                Learn more
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {/* Pre-fill banner */}
          {hasPreFilledData && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 text-sm text-blue-800">
              <Info className="size-4 mt-0.5 shrink-0" />
              <span>
                Some fields have been pre-filled from your ASTN profile. Review
                and edit as needed.
              </span>
            </div>
          )}

          {/* Dynamic form */}
          <DynamicFormRenderer
            formFields={formFields}
            responses={responses}
            onChange={handleChange}
          />

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 pb-8">
            <Button variant="ghost" asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Cancel
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </div>
      </main>
    </GradientBg>
  )
}
