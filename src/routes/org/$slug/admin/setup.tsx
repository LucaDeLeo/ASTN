import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Building2,
  Copy,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Spinner } from '~/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const Route = createFileRoute('/org/$slug/admin/setup')({
  component: OrgAdminSetup,
})

const SOCIAL_PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'discord', label: 'Discord' },
  { value: 'other', label: 'Other' },
]

function OrgAdminSetup() {
  const { slug } = Route.useParams()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const orgProfile = useQuery(
    api.orgs.admin.getOrgProfile,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )
  const inviteLinks = useQuery(
    api.orgs.admin.getInviteLinks,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )

  // Mutations
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const saveOrgLogo = useMutation(api.orgs.admin.saveOrgLogo)
  const removeOrgLogo = useMutation(api.orgs.admin.removeOrgLogo)
  const updateOrgProfile = useMutation(api.orgs.admin.updateOrgProfile)
  const getOrCreateInviteLink = useMutation(
    api.orgs.admin.getOrCreateInviteLink,
  )

  // Form state
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [socialLinks, setSocialLinks] = useState<
    Array<{ platform: string; url: string }>
  >([])
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isSavingSocial, setIsSavingSocial] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false)

  // Populate form when profile loads
  useEffect(() => {
    if (orgProfile) {
      setDescription(orgProfile.description || '')
      setContactEmail(orgProfile.contactEmail || '')
      setWebsite(orgProfile.website || '')
      setSocialLinks(orgProfile.socialLinks || [])
    }
  }, [orgProfile])

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Org not found
  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Organization Not Found
            </h1>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Not an admin
  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    setIsUploadingLogo(true)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error('Failed to upload file')
      }

      const { storageId } = await result.json()

      // Save to org
      await saveOrgLogo({ orgId: org._id, storageId })
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    setIsRemovingLogo(true)
    try {
      await removeOrgLogo({ orgId: org._id })
      toast.success('Logo removed')
    } catch (error) {
      console.error('Failed to remove logo:', error)
      toast.error('Failed to remove logo. Please try again.')
    } finally {
      setIsRemovingLogo(false)
    }
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingDetails(true)

    try {
      await updateOrgProfile({
        orgId: org._id,
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
      })
      toast.success('Details saved successfully')
    } catch (error) {
      console.error('Failed to save details:', error)
      toast.error('Failed to save details. Please try again.')
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSocial(true)

    try {
      // Filter out empty links
      const validLinks = socialLinks.filter(
        (link) => link.platform && link.url.trim(),
      )
      await updateOrgProfile({
        orgId: org._id,
        socialLinks: validLinks,
      })
      toast.success('Social links saved successfully')
    } catch (error) {
      console.error('Failed to save social links:', error)
      toast.error('Failed to save social links. Please try again.')
    } finally {
      setIsSavingSocial(false)
    }
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: 'twitter', url: '' }])
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const updateSocialLink = (
    index: number,
    field: 'platform' | 'url',
    value: string,
  ) => {
    setSocialLinks(
      socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    )
  }

  const handleGenerateInviteMessage = async () => {
    const emails = bulkEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean)

    if (emails.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter((e) => !emailRegex.test(e))

    if (invalidEmails.length > 0) {
      toast.error(
        `Invalid email(s): ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`,
      )
      return
    }

    setIsGeneratingMessage(true)
    try {
      const { token } = await getOrCreateInviteLink({ orgId: org._id })
      const inviteUrl = `${window.location.origin}/org/${slug}/join?token=${token}`

      const message = `You've been invited to join ${org.name} on ASTN!

Click the link below to create your account and join:
${inviteUrl}`

      setGeneratedMessage(message)
      toast.success('Invite message generated')
    } catch (error) {
      console.error('Failed to generate invite:', error)
      toast.error('Failed to generate invite. Please try again.')
    } finally {
      setIsGeneratingMessage(false)
    }
  }

  const copyInviteMessage = () => {
    navigator.clipboard.writeText(generatedMessage)
    toast.success('Message copied to clipboard')
  }

  // Get current logo URL
  const logoUrl = orgProfile?.resolvedLogoUrl || orgProfile?.logoUrl

  // Get active invite link
  const activeInviteLink = inviteLinks?.[0]
  const inviteUrl = activeInviteLink
    ? `${window.location.origin}/org/${slug}/join?token=${activeInviteLink.token}`
    : null

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link
                to="/org/$slug"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                {org.name}
              </Link>
              <span>/</span>
              <Link
                to="/org/$slug/admin"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-700">Setup</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">
              Organization Setup
            </h1>
            <p className="text-slate-600 mt-1">
              Configure your organization profile and settings
            </p>
          </div>

          {orgProfile === undefined ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section 1: Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Logo</CardTitle>
                  <CardDescription>
                    Upload a logo for your organization (max 5MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {/* Logo preview */}
                    <div className="size-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={org.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-10 text-slate-400" />
                      )}
                    </div>

                    {/* Upload controls */}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImagePlus className="size-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={isRemovingLogo}
                          className="text-destructive hover:text-destructive"
                        >
                          {isRemovingLogo ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 mr-2" />
                          )}
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Organization Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A brief description of your organization..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@example.org"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.org"
                      />
                    </div>

                    <Button type="submit" disabled={isSavingDetails}>
                      {isSavingDetails ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-4 mr-2" />
                          Save Details
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Section 3: Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                  <CardDescription>
                    Add links to your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSocialLinks} className="space-y-4">
                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={link.platform}
                          onValueChange={(value) =>
                            updateSocialLink(index, 'platform', value)
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_PLATFORMS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            updateSocialLink(index, 'url', e.target.value)
                          }
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialLink(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSocialLink}
                      >
                        <Plus className="size-4 mr-2" />
                        Add Link
                      </Button>
                      {socialLinks.length > 0 && (
                        <Button type="submit" disabled={isSavingSocial}>
                          {isSavingSocial ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="size-4 mr-2" />
                              Save Social Links
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Section 4: Invite Link & Bulk Invite */}
              <Card>
                <CardHeader>
                  <CardTitle>Invite Members</CardTitle>
                  <CardDescription>
                    Share an invite link or bulk-invite members by email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Active invite link */}
                  <div className="space-y-2">
                    <Label>Invite Link</Label>
                    {inviteUrl ? (
                      <div className="flex gap-2">
                        <Input
                          value={inviteUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(inviteUrl)
                            toast.success('Link copied!')
                          }}
                        >
                          <Copy className="size-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          No active invite link.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await getOrCreateInviteLink({ orgId: org._id })
                              toast.success('Invite link created!')
                            } catch (error) {
                              toast.error('Failed to create invite link')
                            }
                          }}
                        >
                          Generate Invite Link
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bulk invite */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulkEmails">
                        Invite Members by Email
                      </Label>
                      <Textarea
                        id="bulkEmails"
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        placeholder="Enter email addresses, one per line"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter email addresses separated by new lines or commas
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateInviteMessage}
                      disabled={isGeneratingMessage || !bulkEmails.trim()}
                    >
                      {isGeneratingMessage ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Invite Message'
                      )}
                    </Button>

                    {generatedMessage && (
                      <div className="space-y-2">
                        <Label>Generated Message</Label>
                        <Textarea
                          value={generatedMessage}
                          readOnly
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={copyInviteMessage}
                          >
                            <Copy className="size-4 mr-2" />
                            Copy Message
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Copy this message and send it to your members via
                            email, Slack, or any other channel.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
