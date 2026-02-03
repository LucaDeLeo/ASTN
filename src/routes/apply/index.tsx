import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import { Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/apply/')({
  component: ApplyPage,
})

function ApplyPage() {
  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
              Apply to Join ASTN
            </h1>
            <p className="text-muted-foreground">
              Submit an application to register your organization on the AI
              Safety Talent Network.
            </p>
          </div>

          <AuthLoading>
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </AuthLoading>

          <Unauthenticated>
            <ApplicationFormUnauthenticated />
          </Unauthenticated>

          <Authenticated>
            <ApplicationForm />
          </Authenticated>
        </div>
      </main>
    </GradientBg>
  )
}

function ApplicationFormUnauthenticated() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Application</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input id="orgName" placeholder="e.g. AI Safety Hub" disabled />
          </div>
          <div>
            <Label htmlFor="description">
              Brief description of your organization
            </Label>
            <Textarea
              id="description"
              placeholder="What does your organization do?"
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. Buenos Aires" disabled />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="e.g. Argentina" disabled />
            </div>
          </div>
          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You need to sign in to submit an application.
            </p>
            <Button asChild>
              <Link to="/login">Sign in to submit</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationForm() {
  const navigate = useNavigate()
  const submitApplication = useMutation(api.orgApplications.submit)
  const profile = useQuery(api.profiles.getOrCreateProfile)

  const [orgName, setOrgName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [website, setWebsite] = useState('')
  const [reasonForJoining, setReasonForJoining] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Pre-fill from profile when it loads
  if (profile && !prefilled) {
    if (profile.name && !applicantName) {
      setApplicantName(profile.name)
    }
    if (profile.email && !applicantEmail) {
      setApplicantEmail(profile.email)
    }
    setPrefilled(true)
  }

  const isValid =
    orgName.trim() &&
    description.trim() &&
    city.trim() &&
    country.trim() &&
    reasonForJoining.trim() &&
    applicantName.trim() &&
    applicantEmail.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      await submitApplication({
        orgName: orgName.trim(),
        description: description.trim(),
        city: city.trim(),
        country: country.trim(),
        website: website.trim() || undefined,
        reasonForJoining: reasonForJoining.trim(),
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
      })
      toast.success('Application submitted!')
      navigate({ to: '/apply/status' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Application</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orgName">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. AI Safety Hub"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              Brief description of your organization{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your organization do? What is its mission?"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Buenos Aires"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Argentina"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
              type="url"
            />
          </div>

          <div>
            <Label htmlFor="reasonForJoining">
              Why do you want to join ASTN?{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reasonForJoining"
              value={reasonForJoining}
              onChange={(e) => setReasonForJoining(e.target.value)}
              placeholder="Tell us about your goals and how ASTN can help your organization..."
              rows={4}
              required
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Your Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicantName">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantName"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="applicantEmail">
                  Your Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantEmail"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
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
        </form>
      </CardContent>
    </Card>
  )
}
