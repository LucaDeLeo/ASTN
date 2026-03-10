import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Archive,
  BookOpen,
  Building2,
  Calendar,
  ClipboardCheck,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { AttendanceSheet } from '~/components/programs/AttendanceSheet'
import { ModuleFormDialog } from '~/components/programs/ModuleFormDialog'
import { SessionFormDialog } from '~/components/programs/SessionFormDialog'
import { AuthHeader } from '~/components/layout/auth-header'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import {
  moduleStatusColors,
  programStatusColors,
  programTypeLabels,
} from '~/lib/program-constants'

export const Route = createFileRoute('/org/$slug/admin/programs/$programId')({
  component: ProgramDetailPage,
})

const enrollmentLabels = {
  admin_only: 'Admin Only',
  self_enroll: 'Self Enroll',
  approval_required: 'Approval Required',
}

const participantStatusColors = {
  enrolled: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  withdrawn: 'bg-slate-100 text-slate-500',
  removed: 'bg-slate-100 text-slate-500',
}

function ProgramDetailPage() {
  const { slug, programId } = Route.useParams()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const program = useQuery(
    api.programs.getProgram,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const participants = useQuery(
    api.programs.getProgramParticipants,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const linkedOppInfo = useQuery(
    api.programs.getLinkedOpportunityInfo,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const programModules = useQuery(
    api.programs.getProgramModules,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const programSessions = useQuery(
    api.programs.getProgramSessions,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const sessionAttendance = useQuery(
    api.programs.getSessionAttendance,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )
  const allRsvps = useQuery(
    api.programs.getSessionRsvps,
    org && membership?.role === 'admin'
      ? { programId: programId as Id<'programs'> }
      : 'skip',
  )

  // Pre-build attendance count per user (one record per session+user from backend)
  const attendanceCountMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!sessionAttendance) return map
    for (const a of sessionAttendance) {
      map.set(a.userId, (map.get(a.userId) ?? 0) + 1)
    }
    return map
  }, [sessionAttendance])

  // Loading
  if (org === undefined || membership === undefined || program === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
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

  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Shield className="size-16 text-slate-300 mx-auto mb-4" />
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

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-display text-foreground mb-4">
              Program Not Found
            </h1>
            <Button asChild>
              <Link to="/org/$slug/admin/programs" params={{ slug }}>
                Back to Programs
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
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
              <Link
                to="/org/$slug/admin/programs"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Programs
              </Link>
              <span>/</span>
              <span className="text-slate-700">{program.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-display text-foreground">
                    {program.name}
                  </h1>
                  <Badge className={programStatusColors[program.status]}>
                    {program.status}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-1">
                  {programTypeLabels[program.type]} &middot;{' '}
                  {enrollmentLabels[program.enrollmentMethod]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AddParticipantDialog
                  orgId={org._id}
                  programId={program._id}
                  existingParticipantUserIds={
                    participants
                      ?.filter(
                        (p) =>
                          p.status === 'enrolled' || p.status === 'pending',
                      )
                      .map((p) => p.userId) ?? []
                  }
                />
                <ProgramActions program={program} slug={slug} />
              </div>
            </div>
          </div>

          {/* Program Info Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-foreground">
                    {program.description || 'No description'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Capacity</p>
                  <p className="text-foreground">
                    {program.maxParticipants
                      ? `${program.participantCount} / ${program.maxParticipants}`
                      : `${program.participantCount} (unlimited)`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Completion Criteria
                  </p>
                  <p className="text-foreground">
                    {program.completionCriteria
                      ? program.completionCriteria.type === 'attendance_count'
                        ? `${program.completionCriteria.requiredCount} sessions`
                        : program.completionCriteria.type ===
                            'attendance_percentage'
                          ? `${program.completionCriteria.requiredPercentage}% attendance`
                          : 'Manual'
                      : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Opportunity */}
          <LinkedOpportunityCard
            orgId={org._id}
            programId={program._id}
            linkedOppInfo={linkedOppInfo}
            hasLinkedOpportunity={!!program.linkedOpportunityId}
          />

          {/* Sessions */}
          <ProgramSessionsCard
            programId={program._id}
            sessions={programSessions}
            allRsvps={allRsvps}
          />

          {/* Curriculum */}
          <CurriculumCard
            programId={program._id}
            modules={programModules}
            sessions={programSessions}
          />

          {/* Attendance */}
          <AttendanceCard
            sessions={programSessions}
            participants={participants}
            attendance={sessionAttendance}
            rsvps={allRsvps}
          />

          {/* Participants Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  Participants
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {participants === undefined ? (
                <div className="flex justify-center py-8">
                  <Spinner className="size-8" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No participants yet
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Add members to this program to track their participation
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                          Name
                        </th>
                        <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                          Sessions
                        </th>
                        <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                          Enrolled
                        </th>
                        <th className="text-right text-sm font-medium text-slate-500 px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {participants.map((participant) => (
                        <ParticipantRow
                          key={participant._id}
                          participant={participant}
                          program={program}
                          attendedCount={
                            attendanceCountMap.get(participant.userId) ?? 0
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

interface ParticipantRowProps {
  participant: {
    _id: Id<'programParticipation'>
    userId: string
    status: 'enrolled' | 'pending' | 'completed' | 'withdrawn' | 'removed'
    enrolledAt: number
    memberName: string
  }
  program: {
    _id: Id<'programs'>
    completionCriteria?: {
      type: 'attendance_count' | 'attendance_percentage' | 'manual'
      requiredCount?: number
      requiredPercentage?: number
    }
  }
  attendedCount: number
}

function ParticipantRow({
  participant,
  program,
  attendedCount,
}: ParticipantRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const markCompleted = useMutation(api.programs.markCompleted)
  const unenrollMember = useMutation(api.programs.unenrollMember)

  const enrolledDate = new Date(participant.enrolledAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )

  const handleMarkCompleted = async () => {
    setIsLoading(true)
    try {
      await markCompleted({ participationId: participant._id })
      toast.success('Participant marked as completed')
    } catch (error) {
      toast.error('Failed to mark as completed')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${participant.memberName} from this program?`,
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      await unenrollMember({ participationId: participant._id })
      toast.success('Participant removed')
    } catch (error) {
      toast.error('Failed to remove participant')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const requiredCount =
    program.completionCriteria?.type === 'attendance_count'
      ? program.completionCriteria.requiredCount
      : undefined

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">
          {participant.memberName}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={participantStatusColors[participant.status]}>
          {participant.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-foreground">
          {attendedCount}
          {requiredCount !== undefined && ` / ${requiredCount}`}
          {requiredCount !== undefined && ' sessions'}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{enrolledDate}</td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {participant.status === 'enrolled' && (
              <>
                <DropdownMenuItem onClick={handleMarkCompleted}>
                  <UserCheck className="size-4 mr-2" />
                  Mark Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {(participant.status === 'enrolled' ||
              participant.status === 'pending') && (
              <DropdownMenuItem onClick={handleRemove} className="text-red-600">
                <UserMinus className="size-4 mr-2" />
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

interface AddParticipantDialogProps {
  orgId: Id<'organizations'>
  programId: Id<'programs'>
  existingParticipantUserIds: Array<string>
}

function AddParticipantDialog({
  orgId,
  programId,
  existingParticipantUserIds,
}: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null)

  const members = useQuery(api.orgs.admin.getAllMembersWithProfiles, { orgId })
  const enrollMember = useMutation(api.programs.enrollMember)

  const availableMembers = useMemo(() => {
    if (!members) return []
    return members.filter((m) => {
      // Filter out already enrolled
      if (existingParticipantUserIds.includes(m.membership.userId)) return false

      // Filter by search
      if (search) {
        const query = search.toLowerCase()
        const name = m.profile?.name?.toLowerCase() ?? ''
        const email = m.email?.toLowerCase() ?? ''
        if (!name.includes(query) && !email.includes(query)) return false
      }

      return true
    })
  }, [members, existingParticipantUserIds, search])

  const handleEnroll = async (userId: string) => {
    setIsEnrolling(userId)
    try {
      await enrollMember({ programId, userId })
      toast.success('Member enrolled')
    } catch (error) {
      toast.error('Failed to enroll member')
      console.error(error)
    } finally {
      setIsEnrolling(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto">
            {members === undefined ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-6" />
              </div>
            ) : availableMembers.length === 0 ? (
              <p className="text-center text-slate-500 py-4">
                {search
                  ? 'No matching members found'
                  : 'All members are already enrolled'}
              </p>
            ) : (
              <div className="space-y-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.membership._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {member.profile?.name || 'No name'}
                      </div>
                      {member.email && (
                        <div className="text-sm text-slate-500">
                          {member.email}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(member.membership.userId)}
                      disabled={isEnrolling === member.membership.userId}
                    >
                      {isEnrolling === member.membership.userId ? (
                        <Spinner className="size-4" />
                      ) : (
                        'Enroll'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ProgramActionsProps {
  program: {
    _id: Id<'programs'>
    status: 'planning' | 'active' | 'completed' | 'archived'
  }
  slug: string
}

function ProgramActions({ program, slug }: ProgramActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const updateProgram = useMutation(api.programs.updateProgram)
  const deleteProgram = useMutation(api.programs.deleteProgram)

  const handleStatusChange = async (
    newStatus: 'planning' | 'active' | 'completed' | 'archived',
  ) => {
    setIsLoading(true)
    try {
      await updateProgram({ programId: program._id, status: newStatus })
      toast.success(`Program status changed to ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    if (
      !confirm(
        'Are you sure you want to archive this program? This action cannot be undone.',
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      await deleteProgram({ programId: program._id })
      toast.success('Program archived')
      // Navigate back to programs list would happen via Link
      window.location.href = `/org/${slug}/admin/programs`
    } catch (error) {
      toast.error('Failed to archive program')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Spinner className="size-4" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium text-slate-500">
          Change Status
        </div>
        <Select
          value={program.status}
          onValueChange={(v) =>
            handleStatusChange(
              v as 'planning' | 'active' | 'completed' | 'archived',
            )
          }
        >
          <SelectTrigger className="mx-2 mb-2 w-[calc(100%-16px)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleArchive} className="text-red-600">
          <Archive className="size-4 mr-2" />
          Archive Program
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================
// Linked Opportunity Card
// ============================================================

function LinkedOpportunityCard({
  orgId,
  programId,
  linkedOppInfo,
  hasLinkedOpportunity,
}: {
  orgId: Id<'organizations'>
  programId: Id<'programs'>
  linkedOppInfo:
    | { title: string; status: string; acceptedCount: number }
    | null
    | undefined
  hasLinkedOpportunity: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const opportunities = useQuery(
    api.orgOpportunities.listAllByOrg,
    showPicker ? { orgId } : 'skip',
  )
  const updateProgram = useMutation(api.programs.updateProgram)
  const bulkEnroll = useMutation(api.programs.bulkEnrollFromOpportunity)

  const handleLink = async (oppId: Id<'orgOpportunities'>) => {
    try {
      await updateProgram({ programId, linkedOpportunityId: oppId })
      toast.success('Opportunity linked')
      setShowPicker(false)
    } catch (error) {
      toast.error('Failed to link opportunity')
      console.error(error)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const result = await bulkEnroll({ programId })
      toast.success(
        `Enrolled ${result.enrolled}, skipped ${result.skipped}${result.noAccount > 0 ? `, ${result.noAccount} without accounts` : ''}`,
      )
    } catch (error) {
      toast.error('Failed to import applicants')
      console.error(error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          Linked Opportunity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasLinkedOpportunity && linkedOppInfo ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                {linkedOppInfo.title}
              </p>
              <p className="text-sm text-slate-500">
                {linkedOppInfo.acceptedCount} accepted applicant
                {linkedOppInfo.acceptedCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={isImporting || linkedOppInfo.acceptedCount === 0}
            >
              {isImporting ? (
                <Spinner className="size-4 mr-1" />
              ) : (
                <Upload className="size-4 mr-1" />
              )}
              Import Accepted Applicants
            </Button>
          </div>
        ) : hasLinkedOpportunity && linkedOppInfo === undefined ? (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {!showPicker ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">
                  No opportunity linked yet
                </p>
                <Button variant="outline" onClick={() => setShowPicker(true)}>
                  <Link2 className="size-4 mr-1" />
                  Link to Opportunity
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Select an opportunity:
                </p>
                {opportunities === undefined ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="size-6" />
                  </div>
                ) : opportunities.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No opportunities found
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {opportunities.map((opp) => (
                      <button
                        key={opp._id}
                        onClick={() => handleLink(opp._id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">
                          {opp.title}
                        </span>
                        <Badge
                          className={
                            opp.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }
                        >
                          {opp.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPicker(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Program Sessions Card
// ============================================================

function ProgramSessionsCard({
  programId,
  sessions,
  allRsvps,
}: {
  programId: Id<'programs'>
  sessions:
    | Array<{
        _id: Id<'programSessions'>
        dayNumber: number
        title: string
        date: number
        morningStartTime: string
        afternoonStartTime: string
        lumaUrl?: string
      }>
    | undefined
  allRsvps:
    | Array<{
        sessionId: Id<'programSessions'>
        userId: string
        userName: string
        preference: 'morning' | 'afternoon' | 'either'
      }>
    | undefined
}) {
  const deleteSession = useMutation(api.programs.deleteSession)

  const handleDelete = async (
    sessionId: Id<'programSessions'>,
    title: string,
  ) => {
    if (
      !confirm(
        `Delete session "${title}"? This will also delete all RSVPs and attendance for this session.`,
      )
    )
      return
    try {
      await deleteSession({ sessionId })
      toast.success('Session deleted')
    } catch (error) {
      toast.error('Failed to delete session')
      console.error(error)
    }
  }

  const rsvpCountBySession = useMemo(() => {
    const map = new Map<string, number>()
    if (!allRsvps) return map
    for (const r of allRsvps) {
      map.set(r.sessionId, (map.get(r.sessionId) ?? 0) + 1)
    }
    return map
  }, [allRsvps])

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Sessions
          </CardTitle>
          <SessionFormDialog programId={programId} />
        </div>
      </CardHeader>
      <CardContent>
        {sessions === undefined ? (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No sessions created yet
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    Day {session.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {session.morningStartTime} /{' '}
                      {session.afternoonStartTime}
                      {(rsvpCountBySession.get(session._id) ?? 0) > 0 && (
                        <> · {rsvpCountBySession.get(session._id)} RSVPs</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {session.lumaUrl && (
                    <a
                      href={session.lumaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <ExternalLink className="size-3.5" />
                      </Button>
                    </a>
                  )}
                  <SessionFormDialog
                    programId={programId}
                    session={session}
                    trigger={
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(session._id, session.title)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Attendance Card
// ============================================================

function AttendanceCard({
  sessions,
  participants,
  attendance,
  rsvps,
}: {
  sessions:
    | Array<{
        _id: Id<'programSessions'>
        dayNumber: number
        title: string
      }>
    | undefined
  participants:
    | Array<{
        _id: Id<'programParticipation'>
        userId: string
        memberName: string
        status: string
      }>
    | undefined
  attendance:
    | Array<{
        sessionId: Id<'programSessions'>
        userId: string
        slot: 'morning' | 'afternoon'
        markedAt: number
      }>
    | undefined
  rsvps:
    | Array<{
        sessionId: Id<'programSessions'>
        userId: string
        preference: 'morning' | 'afternoon' | 'either'
      }>
    | undefined
}) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="size-5" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions === undefined ||
        participants === undefined ||
        attendance === undefined ? (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No sessions created yet
          </p>
        ) : (
          <AttendanceSheet
            sessions={sessions}
            participants={participants}
            attendance={attendance}
            rsvps={rsvps ?? []}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Curriculum Card
// ============================================================

function CurriculumCard({
  programId,
  modules,
  sessions,
}: {
  programId: Id<'programs'>
  modules:
    | Array<{
        _id: Id<'programModules'>
        _creationTime: number
        programId: Id<'programs'>
        title: string
        description?: string
        weekNumber: number
        orderIndex: number
        linkedSessionId?: Id<'programSessions'>
        materials?: Array<{
          label: string
          url: string
          type: 'link' | 'pdf' | 'video' | 'reading'
          estimatedMinutes?: number
        }>
        status: 'locked' | 'available' | 'completed'
        createdAt: number
        updatedAt: number
      }>
    | undefined
  sessions?:
    | Array<{
        _id: Id<'programSessions'>
        dayNumber: number
        title: string
      }>
    | undefined
}) {
  const deleteModule = useMutation(api.programs.deleteModule)

  const handleDelete = async (
    moduleId: Id<'programModules'>,
    title: string,
  ) => {
    if (!confirm(`Delete module "${title}"? This cannot be undone.`)) return
    try {
      await deleteModule({ moduleId })
      toast.success('Module deleted')
    } catch (error) {
      toast.error('Failed to delete module')
      console.error(error)
    }
  }

  const sessionMap = new Map((sessions ?? []).map((s) => [s._id, s]))

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Curriculum
          </CardTitle>
          <ModuleFormDialog programId={programId} sessions={sessions ?? []} />
        </div>
      </CardHeader>
      <CardContent>
        {modules === undefined ? (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        ) : modules.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No modules added yet
          </p>
        ) : (
          <div className="space-y-2">
            {modules.map((mod) => {
              const linkedSession = mod.linkedSessionId
                ? sessionMap.get(mod.linkedSessionId)
                : undefined
              return (
                <div
                  key={mod._id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Week {mod.weekNumber}
                    </span>
                    <span className="font-medium text-foreground text-sm truncate">
                      {mod.title}
                    </span>
                    <Badge className={moduleStatusColors[mod.status]}>
                      {mod.status}
                    </Badge>
                    {linkedSession && (
                      <span className="text-xs text-slate-400 shrink-0">
                        → Day {linkedSession.dayNumber}
                      </span>
                    )}
                    {mod.materials && mod.materials.length > 0 && (
                      <span className="text-xs text-slate-500 shrink-0">
                        {mod.materials.length} material
                        {mod.materials.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ModuleFormDialog
                      programId={programId}
                      module={mod}
                      sessions={sessions ?? []}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(mod._id, mod.title)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
