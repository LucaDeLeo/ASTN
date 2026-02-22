import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  AlertTriangle,
  Building2,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import type { DayHours } from '~/components/org/OperatingHoursEditor'
import type { VisitField } from '~/components/org/VisitFieldsEditor'
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
import { Spinner } from '~/components/ui/spinner'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
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
import {
  OperatingHoursEditor,
  getDefaultOperatingHours,
} from '~/components/org/OperatingHoursEditor'
import {
  TimezoneSelector,
  getBrowserTimezone,
} from '~/components/org/TimezoneSelector'
import { VisitFieldsEditor } from '~/components/org/VisitFieldsEditor'

export const Route = createFileRoute('/org/$slug/admin/space')({
  component: OrgAdminSpace,
})

const PRESET_AMENITIES = [
  'WiFi',
  'External Monitors',
  'Standing Desks',
  'Coffee/Tea',
  'Kitchen',
  'Meeting Rooms',
  'Printer',
  'Lockers',
  'Phone Booths',
  'Parking',
  'Bike Storage',
  'Showers',
  'Air Conditioning',
  'Whiteboard',
]

function OrgAdminSpace() {
  const { slug } = Route.useParams()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const space = useQuery(
    api.coworkingSpaces.getSpaceByOrg,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )

  // Mutations
  const createSpaceMut = useMutation(api.coworkingSpaces.createSpace)
  const updateSpaceMut = useMutation(api.coworkingSpaces.updateSpace)
  const deleteSpaceMut = useMutation(api.coworkingSpaces.deleteSpace)
  const updateCustomVisitFields = useMutation(
    api.coworkingSpaces.updateCustomVisitFields,
  )
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const saveSpaceCoverImage = useMutation(
    api.coworkingSpaces.saveSpaceCoverImage,
  )
  const removeSpaceCoverImage = useMutation(
    api.coworkingSpaces.removeSpaceCoverImage,
  )

  // Core settings state
  const [name, setName] = useState('Main Co-working Space')
  const [capacity, setCapacity] = useState(20)
  const [timezone, setTimezone] = useState(getBrowserTimezone())
  const [operatingHours, setOperatingHours] = useState<Array<DayHours>>(
    getDefaultOperatingHours(),
  )
  const [guestAccessEnabled, setGuestAccessEnabled] = useState(false)
  const [customVisitFields, setCustomVisitFields] = useState<Array<VisitField>>(
    [],
  )

  // Landing page content state
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [addressNote, setAddressNote] = useState('')
  const [amenities, setAmenities] = useState<Array<string>>([])
  const [customAmenity, setCustomAmenity] = useState('')
  const [houseRules, setHouseRules] = useState('')

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)
  const [isSavingFields, setIsSavingFields] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isRemovingCover, setIsRemovingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Populate form when space loads
  useEffect(() => {
    if (space) {
      setName(space.name)
      setCapacity(space.capacity)
      setTimezone(space.timezone)
      setOperatingHours(space.operatingHours)
      setGuestAccessEnabled(space.guestAccessEnabled)
      setCustomVisitFields(space.customVisitFields || [])
      setDescription(space.description || '')
      setAddress(space.address || '')
      setAddressNote(space.addressNote || '')
      setAmenities(space.amenities || [])
      setHouseRules(space.houseRules || '')
    }
  }, [space])

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

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await createSpaceMut({
        orgId: org._id,
        name: name.trim(),
        capacity,
        timezone,
        operatingHours,
        guestAccessEnabled,
      })
      toast.success('Co-working space created successfully')
    } catch (error) {
      console.error('Failed to create space:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create space',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space) return
    setIsSaving(true)

    try {
      await updateSpaceMut({
        spaceId: space._id,
        name: name.trim(),
        capacity,
        timezone,
        operatingHours,
        guestAccessEnabled,
      })
      toast.success('Space settings saved')
    } catch (error) {
      console.error('Failed to update space:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSpace = async () => {
    if (!space) return
    setIsDeleting(true)

    try {
      await deleteSpaceMut({ spaceId: space._id })
      toast.success('Co-working space deleted')
      // Reset form to defaults
      setName('Main Co-working Space')
      setCapacity(20)
      setTimezone(getBrowserTimezone())
      setOperatingHours(getDefaultOperatingHours())
      setGuestAccessEnabled(false)
      setCustomVisitFields([])
      setDescription('')
      setAddress('')
      setAddressNote('')
      setAmenities([])
      setHouseRules('')
    } catch (error) {
      console.error('Failed to delete space:', error)
      toast.error('Failed to delete space. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveCustomFields = async () => {
    if (!space) return
    setIsSavingFields(true)

    try {
      // Filter out fields with empty labels
      const validFields = customVisitFields.filter((f) => f.label.trim())
      await updateCustomVisitFields({
        spaceId: space._id,
        customVisitFields: validFields,
      })
      toast.success('Custom fields saved')
    } catch (error) {
      console.error('Failed to save custom fields:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save custom fields',
      )
    } finally {
      setIsSavingFields(false)
    }
  }

  const handleSaveLandingContent = async () => {
    if (!space) return
    setIsSavingContent(true)

    try {
      await updateSpaceMut({
        spaceId: space._id,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        addressNote: addressNote.trim() || undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        houseRules: houseRules.trim() || undefined,
      })
      toast.success('Landing page content saved')
    } catch (error) {
      console.error('Failed to save landing content:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save landing content',
      )
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !space) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    setIsUploadingCover(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) throw new Error('Failed to upload file')

      const { storageId } = await result.json()
      await saveSpaceCoverImage({ spaceId: space._id, storageId })
      toast.success('Cover image uploaded')
    } catch (error) {
      console.error('Failed to upload cover image:', error)
      toast.error('Failed to upload cover image. Please try again.')
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleRemoveCover = async () => {
    if (!space) return
    setIsRemovingCover(true)
    try {
      await removeSpaceCoverImage({ spaceId: space._id })
      toast.success('Cover image removed')
    } catch (error) {
      console.error('Failed to remove cover image:', error)
      toast.error('Failed to remove cover image. Please try again.')
    } finally {
      setIsRemovingCover(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    )
  }

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim()
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed])
      setCustomAmenity('')
    }
  }

  const hasSpace = space !== null && space !== undefined

  // Resolve cover image URL
  const coverUrl = space?.coverImageUrl ?? null

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
              <span className="text-slate-700">Co-working Space</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">
              Co-working Space
            </h1>
            <p className="text-slate-600 mt-1">
              {hasSpace
                ? 'Manage your co-working space settings'
                : 'Set up a co-working space for your organization'}
            </p>
          </div>

          {space === undefined ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main space configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    <CardTitle>
                      {hasSpace ? 'Space Settings' : 'Set Up Co-working Space'}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {hasSpace
                      ? 'Configure capacity, operating hours, and access settings'
                      : 'Configure your co-working space so members can book daily spots'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={hasSpace ? handleUpdateSpace : handleCreateSpace}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Space Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Main Space"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Daily Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min={1}
                          value={capacity}
                          onChange={(e) =>
                            setCapacity(parseInt(e.target.value) || 1)
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum people per day
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <TimezoneSelector
                        value={timezone}
                        onChange={setTimezone}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Operating Hours</Label>
                      <OperatingHoursEditor
                        value={operatingHours}
                        onChange={setOperatingHours}
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <Switch
                        id="guestAccess"
                        checked={guestAccessEnabled}
                        onCheckedChange={setGuestAccessEnabled}
                      />
                      <div>
                        <Label htmlFor="guestAccess" className="cursor-pointer">
                          Allow guest visitors
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Non-members can apply to visit your space
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {hasSpace ? 'Saving...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Save className="size-4 mr-2" />
                            {hasSpace ? 'Save Changes' : 'Create Space'}
                          </>
                        )}
                      </Button>

                      {hasSpace && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4 mr-2" />
                              Delete Space
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="size-5 text-destructive" />
                                Delete Co-working Space?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the co-working
                                space configuration. Members will no longer be
                                able to book spots. This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteSpace}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete Space'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Landing Page Content (only when space exists) */}
              {hasSpace && (
                <Card>
                  <CardHeader>
                    <CardTitle>Landing Page Content</CardTitle>
                    <CardDescription>
                      Customize what visitors see on your space&apos;s public
                      page
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cover Image */}
                    <div className="space-y-3">
                      <Label>Cover Image</Label>
                      {coverUrl ? (
                        <div className="relative rounded-lg overflow-hidden border">
                          <img
                            src={coverUrl}
                            alt="Space cover"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => coverInputRef.current?.click()}
                              disabled={isUploadingCover}
                            >
                              {isUploadingCover ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                'Replace'
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={handleRemoveCover}
                              disabled={isRemovingCover}
                            >
                              {isRemovingCover ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {isUploadingCover ? (
                            <Loader2 className="size-6 text-muted-foreground animate-spin" />
                          ) : (
                            <>
                              <ImagePlus className="size-6 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Upload a cover image (max 5MB)
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="spaceDescription">About this space</Label>
                      <Textarea
                        id="spaceDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell visitors about your co-working space..."
                        rows={4}
                      />
                    </div>

                    {/* Address */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="spaceAddress">Street Address</Label>
                        <Input
                          id="spaceAddress"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g., 123 Main St, Suite 4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressNote">
                          Directions / Access Note
                        </Label>
                        <Input
                          id="addressNote"
                          value={addressNote}
                          onChange={(e) => setAddressNote(e.target.value)}
                          placeholder="e.g., Ring bell #4, 2nd floor"
                        />
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-3">
                      <Label>Amenities</Label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_AMENITIES.map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              amenities.includes(amenity)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                            }`}
                          >
                            {amenity}
                          </button>
                        ))}
                        {/* Custom amenities (not in presets) */}
                        {amenities
                          .filter((a) => !PRESET_AMENITIES.includes(a))
                          .map((amenity) => (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className="px-3 py-1.5 rounded-full text-sm border bg-primary text-primary-foreground border-primary flex items-center gap-1"
                            >
                              {amenity}
                              <X className="size-3" />
                            </button>
                          ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          placeholder="Add custom amenity"
                          className="max-w-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomAmenity()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomAmenity}
                          disabled={!customAmenity.trim()}
                        >
                          <Plus className="size-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* House Rules */}
                    <div className="space-y-2">
                      <Label htmlFor="houseRules">House Rules</Label>
                      <Textarea
                        id="houseRules"
                        value={houseRules}
                        onChange={(e) => setHouseRules(e.target.value)}
                        placeholder="One rule per line, e.g.&#10;Clean up after yourself&#10;Keep noise to a minimum&#10;No phone calls in the open area"
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        One rule per line
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSaveLandingContent}
                      disabled={isSavingContent}
                    >
                      {isSavingContent ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-4 mr-2" />
                          Save Landing Page Content
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Custom visit application fields (only when guest access enabled and space exists) */}
              {hasSpace && guestAccessEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Visit Application Fields</CardTitle>
                    <CardDescription>
                      Add custom questions for guest visitors to answer when
                      applying to visit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <VisitFieldsEditor
                      value={customVisitFields}
                      onChange={setCustomVisitFields}
                    />

                    <Button
                      type="button"
                      onClick={handleSaveCustomFields}
                      disabled={isSavingFields}
                    >
                      {isSavingFields ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-4 mr-2" />
                          Save Custom Fields
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
