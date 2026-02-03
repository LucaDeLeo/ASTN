import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  AlertTriangle,
  Building2,
  Loader2,
  MapPin,
  Save,
  Shield,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const createSpace = useMutation(api.coworkingSpaces.createSpace)
  const updateSpace = useMutation(api.coworkingSpaces.updateSpace)
  const deleteSpace = useMutation(api.coworkingSpaces.deleteSpace)
  const updateCustomVisitFields = useMutation(
    api.coworkingSpaces.updateCustomVisitFields,
  )

  // Form state
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

  const [isSaving, setIsSaving] = useState(false)
  const [isSavingFields, setIsSavingFields] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Populate form when space loads
  useEffect(() => {
    if (space) {
      setName(space.name)
      setCapacity(space.capacity)
      setTimezone(space.timezone)
      setOperatingHours(space.operatingHours)
      setGuestAccessEnabled(space.guestAccessEnabled)
      setCustomVisitFields(space.customVisitFields || [])
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
      await createSpace({
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
      await updateSpace({
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
      await deleteSpace({ spaceId: space._id })
      toast.success('Co-working space deleted')
      // Reset form to defaults
      setName('Main Co-working Space')
      setCapacity(20)
      setTimezone(getBrowserTimezone())
      setOperatingHours(getDefaultOperatingHours())
      setGuestAccessEnabled(false)
      setCustomVisitFields([])
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

  const hasSpace = space !== null && space !== undefined

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
