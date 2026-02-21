import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
} from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const Route = createFileRoute('/org/$slug/apply/$opportunityId')({
  component: ApplyPage,
})

const CAREER_STAGES = [
  'Undergraduate student',
  'Masters student',
  'PhD student',
  'Postdoc / Early career researcher',
  'Mid-career professional',
  'Senior professional',
  'Career changer',
  'Other',
]

const FIELDS_OF_STUDY = [
  'Computer Science',
  'Machine Learning / AI',
  'Mathematics',
  'Statistics',
  'Physics',
  'Philosophy',
  'Cognitive Science',
  'Neuroscience',
  'Economics',
  'Political Science',
  'Law',
  'Biology',
  'Engineering',
  'Psychology',
  'Other',
]

type FormData = {
  applyingAs: Array<string>
  roundPreference: string
  openToAlternativePlacement: boolean
  firstName: string
  lastName: string
  email: string
  profileUrl: string
  otherProfileLink: string
  fieldsOfStudy: Array<string>
  careerStage: string
  location: string
  howCourseHelps: string
  aiSafetyEngagement: string
  relevantSkills: string
  proudestAchievement: string
  howHeardAbout: string
  nomineeEmail: string
  canMentionName: boolean | null
  applicationFeedback: string
  dataShareConsent: boolean
  diversityDataConsent: boolean
}

function ApplyPage() {
  const { slug, opportunityId } = Route.useParams()
  const { user } = useUser()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const opportunity = useQuery(api.orgOpportunities.get, {
    id: opportunityId as Id<'orgOpportunities'>,
  })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const existingApplication = useQuery(
    api.opportunityApplications.getMyApplication,
    opportunity ? { opportunityId: opportunity._id } : 'skip',
  )
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const submitApplication = useMutation(api.opportunityApplications.submit)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [preFilled, setPreFilled] = useState(false)

  const [form, setForm] = useState<FormData>({
    applyingAs: ['Participant'],
    roundPreference: 'Intensive (6-day)',
    openToAlternativePlacement: false,
    firstName: '',
    lastName: '',
    email: '',
    profileUrl: '',
    otherProfileLink: '',
    fieldsOfStudy: [],
    careerStage: '',
    location: '',
    howCourseHelps: '',
    aiSafetyEngagement: '',
    relevantSkills: '',
    proudestAchievement: '',
    howHeardAbout: '',
    nomineeEmail: '',
    canMentionName: null,
    applicationFeedback: '',
    dataShareConsent: false,
    diversityDataConsent: false,
  })

  // Pre-fill from profile + Clerk user
  if (profile && user && !preFilled) {
    const nameParts = (profile.name || user.fullName || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const email = user.primaryEmailAddress?.emailAddress || ''
    const location = profile.location || ''
    const profileUrl = profile.linkedinUrl || ''
    const fieldsFromProfile = (profile.education || [])
      .map((e) => e.field)
      .filter((f): f is string => !!f)
      .filter((f) => FIELDS_OF_STUDY.includes(f))
      .slice(0, 3)

    setForm((prev) => ({
      ...prev,
      firstName: firstName || prev.firstName,
      lastName: lastName || prev.lastName,
      email: email || prev.email,
      location: location || prev.location,
      profileUrl: profileUrl || prev.profileUrl,
      fieldsOfStudy:
        fieldsFromProfile.length > 0 ? fieldsFromProfile : prev.fieldsOfStudy,
    }))
    setPreFilled(true)
  }

  // Loading states
  if (
    org === undefined ||
    opportunity === undefined ||
    membership === undefined
  ) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-100 rounded w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
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

  // Must be a member to apply
  if (!membership) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <h1 className="text-2xl font-display text-foreground mb-4">
              Membership Required
            </h1>
            <p className="text-slate-600 mb-6">
              You need to be a member of {org.name} to apply for this
              opportunity.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Join {org.name}
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Already applied or just submitted
  if (existingApplication || submitted) {
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

  const updateField = <TKey extends keyof FormData>(
    field: TKey,
    value: FormData[TKey],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (
    field: 'applyingAs' | 'fieldsOfStudy',
    value: string,
  ) => {
    setForm((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      }
      if (field === 'fieldsOfStudy' && current.length >= 3) return prev
      return { ...prev, [field]: [...current, value] }
    })
  }

  const isValid =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.profileUrl &&
    form.fieldsOfStudy.length > 0 &&
    form.careerStage &&
    form.location &&
    form.howCourseHelps &&
    form.aiSafetyEngagement &&
    form.relevantSkills &&
    form.proudestAchievement

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      await submitApplication({
        opportunityId: opportunity._id,
        responses: form,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit application:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasPreFilledData =
    preFilled &&
    (form.firstName || form.lastName || form.email || form.location)

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
                Learn more about this course
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

          {/* Section 1: Course Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Understand current safety techniques. Map the gaps. Identify
                where you can contribute. All in 30 hours.
              </p>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">
                    Intensive (6-day, in-person)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dates</span>
                  <span className="font-medium">March 9 &ndash; 14, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">
                    University of Buenos Aires
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Commitment</span>
                  <span className="font-medium">
                    ~5 hours/day (2h class + 3h reading), 30h total
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">Free (pay-what-you-want)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Facilitated by</span>
                  <span className="font-medium">AI safety experts</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Who this is for</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    ML researchers who want to take big bets on impactful
                    research ideas
                  </li>
                  <li>
                    Software engineers who want to scale AI safety research
                  </li>
                  <li>
                    Policy professionals who need deep technical understanding
                  </li>
                </ul>
                <p className="text-xs">
                  Don&apos;t fit these perfectly? Apply anyway. We bet on drive
                  and ambition, not CVs.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                You are applying as a participant for the intensive round.
              </p>
            </CardContent>
          </Card>

          {/* Section 2: Personal Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileUrl">
                  Profile URL <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Provide a link for your LinkedIn profile or your CV. We prefer
                  LinkedIn.
                </p>
                <Input
                  id="profileUrl"
                  value={form.profileUrl}
                  onChange={(e) => updateField('profileUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherProfileLink">
                  Link to any other profile
                </Label>
                <p className="text-xs text-muted-foreground">
                  E.g. your CV, GitHub, personal website, blog.
                </p>
                <Input
                  id="otherProfileLink"
                  value={form.otherProfileLink}
                  onChange={(e) =>
                    updateField('otherProfileLink', e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              {/* Fields of study */}
              <div className="space-y-2">
                <Label>
                  What is the closest match to your field(s) of study?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select up to three, including past or present studies.
                </p>
                <div className="flex flex-wrap gap-2">
                  {FIELDS_OF_STUDY.map((field) => {
                    const selected = form.fieldsOfStudy.includes(field)
                    const disabled = !selected && form.fieldsOfStudy.length >= 3
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => toggleArrayField('fieldsOfStudy', field)}
                        disabled={disabled}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : disabled
                              ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                              : 'border-slate-300 text-slate-600 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {field}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Career stage */}
              <div className="space-y-2">
                <Label>
                  What is your current career stage?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.careerStage}
                  onValueChange={(val) => updateField('careerStage', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your career stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  Where will you be based during this course?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Essays */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Essays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="howCourseHelps">
                  How do you expect this course will help you contribute to
                  making AI go well? <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  We suggest 3-7 bullet points. Tell us your game plan: What
                  steps will you take post-course? How does this course unlock
                  those moves? What&apos;s your theory of change for AI safety?
                </p>
                <Textarea
                  id="howCourseHelps"
                  value={form.howCourseHelps}
                  onChange={(e) =>
                    updateField('howCourseHelps', e.target.value)
                  }
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiSafetyEngagement">
                  How have you engaged with the AI safety field so far?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show us you&apos;re not starting from zero. This could include
                  projects, blog posts, resources you&apos;ve read, or events
                  you&apos;ve attended or organised.
                </p>
                <Textarea
                  id="aiSafetyEngagement"
                  value={form.aiSafetyEngagement}
                  onChange={(e) =>
                    updateField('aiSafetyEngagement', e.target.value)
                  }
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relevantSkills">
                  What skills have you developed that could be used to make AI
                  go well? <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Technical and non-technical skills both matter. This could be
                  policy/governance experience, technical background, research
                  skills, or communications experience.
                </p>
                <Textarea
                  id="relevantSkills"
                  value={form.relevantSkills}
                  onChange={(e) =>
                    updateField('relevantSkills', e.target.value)
                  }
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proudestAchievement">
                  Tell us about one achievement you&apos;re most proud of{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  We&apos;re looking for builders, not just thinkers. That one
                  project you pulled off, the system you changed, the community
                  you built, or the challenge everyone said couldn&apos;t be
                  solved. This is your chance to brag!
                </p>
                <Textarea
                  id="proudestAchievement"
                  value={form.proudestAchievement}
                  onChange={(e) =>
                    updateField('proudestAchievement', e.target.value)
                  }
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Referral & Consents */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Referral &amp; Consents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomineeEmail">
                  Know someone exceptional who should take this course? Share
                  their email below.
                </Label>
                <p className="text-xs text-muted-foreground">
                  You can nominate more than one person. If we think
                  they&apos;re a good fit, we may reach out to them.
                </p>
                <Input
                  id="nomineeEmail"
                  type="email"
                  value={form.nomineeEmail}
                  onChange={(e) => updateField('nomineeEmail', e.target.value)}
                  placeholder="someone@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Can we mention your name if we reach out to them?</Label>
                <div className="flex gap-4">
                  {[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                  ].map((option) => (
                    <label
                      key={String(option.value)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="canMentionName"
                        checked={form.canMentionName === option.value}
                        onChange={() =>
                          updateField('canMentionName', option.value)
                        }
                        className="size-4 accent-primary"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationFeedback">
                  Do you have any feedback on this application form?
                </Label>
                <Textarea
                  id="applicationFeedback"
                  value={form.applicationFeedback}
                  onChange={(e) =>
                    updateField('applicationFeedback', e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>
                    Can we share your data with third-party AI safety
                    organisations?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    If you opt-in, we may share parts of your application with
                    organisations we trust. They may email you with jobs or
                    other opportunities. This will not affect your application
                    decision. You can opt-out at any time.
                  </p>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.dataShareConsent}
                    onCheckedChange={(checked) =>
                      updateField('dataShareConsent', checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    Yes, I consent to sharing my data with third-party AI safety
                    organisations
                  </span>
                </label>

                <div className="space-y-1 pt-2">
                  <Label>Diversity data consent</Label>
                  <p className="text-xs text-muted-foreground">
                    We value diverse contributions towards making AI safe. If
                    you opt-in, we&apos;ll collect information for diversity,
                    equality and inclusion monitoring. We won&apos;t share your
                    specific data outside BlueDot Impact.
                  </p>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.diversityDataConsent}
                    onCheckedChange={(checked) =>
                      updateField('diversityDataConsent', checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    Yes, I consent to providing diversity data for monitoring
                    purposes
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pb-8">
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
