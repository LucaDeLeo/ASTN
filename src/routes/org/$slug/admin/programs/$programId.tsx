import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  Building2,
  Minus,
  MoreHorizontal,
  Plus,
  Shield,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthHeader } from "~/components/layout/auth-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/programs/$programId")({
  component: ProgramDetailPage,
});

const statusColors = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-slate-50 text-slate-500",
};

const typeLabels = {
  reading_group: "Reading Group",
  fellowship: "Fellowship",
  mentorship: "Mentorship",
  cohort: "Cohort",
  workshop_series: "Workshop Series",
  custom: "Custom",
};

const enrollmentLabels = {
  admin_only: "Admin Only",
  self_enroll: "Self Enroll",
  approval_required: "Approval Required",
};

const participantStatusColors = {
  enrolled: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  withdrawn: "bg-slate-100 text-slate-500",
  removed: "bg-slate-100 text-slate-500",
};

function ProgramDetailPage() {
  const { slug, programId } = Route.useParams();

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const programs = useQuery(
    api.programs.getOrgPrograms,
    org && membership?.role === "admin" ? { orgId: org._id } : "skip"
  );
  const participants = useQuery(
    api.programs.getProgramParticipants,
    org && membership?.role === "admin"
      ? { programId: programId as Id<"programs"> }
      : "skip"
  );

  const program = programs?.find((p) => p._id === programId);

  // Loading
  if (org === undefined || membership === undefined || programs === undefined) {
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
    );
  }

  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Organization Not Found
            </h1>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!membership || membership.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Shield className="size-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
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
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
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
    );
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
                  <h1 className="text-2xl font-bold text-slate-900">
                    {program.name}
                  </h1>
                  <Badge className={statusColors[program.status]}>
                    {program.status}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-1">
                  {typeLabels[program.type]} &middot;{" "}
                  {enrollmentLabels[program.enrollmentMethod]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AddParticipantDialog
                  orgId={org._id}
                  programId={program._id}
                  existingParticipantUserIds={
                    participants
                      ?.filter((p) => p.status === "enrolled" || p.status === "pending")
                      .map((p) => p.userId) ?? []
                  }
                />
                <ProgramActions
                  program={program}
                  slug={slug}
                />
              </div>
            </div>
          </div>

          {/* Program Info Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-900">
                    {program.description || "No description"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Capacity</p>
                  <p className="text-slate-900">
                    {program.maxParticipants
                      ? `${program.participantCount} / ${program.maxParticipants}`
                      : `${program.participantCount} (unlimited)`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Completion Criteria
                  </p>
                  <p className="text-slate-900">
                    {program.completionCriteria
                      ? program.completionCriteria.type === "attendance_count"
                        ? `${program.completionCriteria.requiredCount} sessions`
                        : program.completionCriteria.type ===
                            "attendance_percentage"
                          ? `${program.completionCriteria.requiredPercentage}% attendance`
                          : "Manual"
                      : "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
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
  );
}

interface ParticipantRowProps {
  participant: {
    _id: Id<"programParticipation">;
    userId: string;
    status: "enrolled" | "pending" | "completed" | "withdrawn" | "removed";
    manualAttendanceCount?: number;
    enrolledAt: number;
    memberName: string;
  };
  program: {
    _id: Id<"programs">;
    completionCriteria?: {
      type: "attendance_count" | "attendance_percentage" | "manual";
      requiredCount?: number;
      requiredPercentage?: number;
    };
  };
}

function ParticipantRow({ participant, program }: ParticipantRowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(
    participant.manualAttendanceCount ?? 0
  );

  const markCompleted = useMutation(api.programs.markCompleted);
  const unenrollMember = useMutation(api.programs.unenrollMember);
  const updateAttendance = useMutation(api.programs.updateManualAttendance);

  const enrolledDate = new Date(participant.enrolledAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const handleMarkCompleted = async () => {
    setIsLoading(true);
    try {
      await markCompleted({ participationId: participant._id });
      toast.success("Participant marked as completed");
    } catch (error) {
      toast.error("Failed to mark as completed");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${participant.memberName} from this program?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await unenrollMember({ participationId: participant._id });
      toast.success("Participant removed");
    } catch (error) {
      toast.error("Failed to remove participant");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAttendance = async (newCount: number) => {
    if (newCount < 0) return;
    setAttendanceCount(newCount);
    try {
      await updateAttendance({
        participationId: participant._id,
        count: newCount,
      });
    } catch (error) {
      toast.error("Failed to update attendance");
      setAttendanceCount(participant.manualAttendanceCount ?? 0);
      console.error(error);
    }
  };

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{participant.memberName}</div>
      </td>
      <td className="px-4 py-3">
        <Badge className={participantStatusColors[participant.status]}>
          {participant.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {participant.status === "enrolled" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              onClick={() => handleUpdateAttendance(attendanceCount - 1)}
              disabled={attendanceCount <= 0}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-12 text-center text-slate-900">
              {attendanceCount}
              {program.completionCriteria?.type === "attendance_count" &&
                ` / ${program.completionCriteria.requiredCount}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              onClick={() => handleUpdateAttendance(attendanceCount + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : (
          <span className="text-slate-500">
            {participant.manualAttendanceCount ?? 0}
          </span>
        )}
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
            {participant.status === "enrolled" && (
              <>
                <DropdownMenuItem onClick={handleMarkCompleted}>
                  <UserCheck className="size-4 mr-2" />
                  Mark Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {(participant.status === "enrolled" ||
              participant.status === "pending") && (
              <DropdownMenuItem
                onClick={handleRemove}
                className="text-red-600"
              >
                <UserMinus className="size-4 mr-2" />
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

interface AddParticipantDialogProps {
  orgId: Id<"organizations">;
  programId: Id<"programs">;
  existingParticipantUserIds: Array<string>;
}

function AddParticipantDialog({
  orgId,
  programId,
  existingParticipantUserIds,
}: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  const members = useQuery(api.orgs.admin.getAllMembersWithProfiles, { orgId });
  const enrollMember = useMutation(api.programs.enrollMember);

  const availableMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      // Filter out already enrolled
      if (existingParticipantUserIds.includes(m.membership.userId)) return false;

      // Filter by search
      if (search) {
        const query = search.toLowerCase();
        const name = m.profile?.name?.toLowerCase() ?? "";
        const email = m.email?.toLowerCase() ?? "";
        if (!name.includes(query) && !email.includes(query)) return false;
      }

      return true;
    });
  }, [members, existingParticipantUserIds, search]);

  const handleEnroll = async (userId: string) => {
    setIsEnrolling(userId);
    try {
      await enrollMember({ programId, userId });
      toast.success("Member enrolled");
    } catch (error) {
      toast.error("Failed to enroll member");
      console.error(error);
    } finally {
      setIsEnrolling(null);
    }
  };

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
                  ? "No matching members found"
                  : "All members are already enrolled"}
              </p>
            ) : (
              <div className="space-y-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.membership._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {member.profile?.name || "No name"}
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
                        "Enroll"
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
  );
}

interface ProgramActionsProps {
  program: {
    _id: Id<"programs">;
    status: "planning" | "active" | "completed" | "archived";
  };
  slug: string;
}

function ProgramActions({ program, slug }: ProgramActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const updateProgram = useMutation(api.programs.updateProgram);
  const deleteProgram = useMutation(api.programs.deleteProgram);

  const handleStatusChange = async (
    newStatus: "planning" | "active" | "completed" | "archived"
  ) => {
    setIsLoading(true);
    try {
      await updateProgram({ programId: program._id, status: newStatus });
      toast.success(`Program status changed to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (
      !confirm(
        "Are you sure you want to archive this program? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteProgram({ programId: program._id });
      toast.success("Program archived");
      // Navigate back to programs list would happen via Link
      window.location.href = `/org/${slug}/admin/programs`;
    } catch (error) {
      toast.error("Failed to archive program");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? <Spinner className="size-4" /> : <MoreHorizontal className="size-4" />}
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
              v as "planning" | "active" | "completed" | "archived"
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
  );
}
