import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Shield,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import type { EngagementLevel } from "~/components/engagement/EngagementBadge";
import {
  EngagementBadge,
  PendingEngagementBadge,
} from "~/components/engagement/EngagementBadge";
import { OverrideDialog } from "~/components/engagement/OverrideDialog";
import { AuthHeader } from "~/components/layout/auth-header";
import { ExportButton } from "~/components/org/ExportButton";
import {
  MemberFilters,
  type MemberFiltersType,
} from "~/components/org/MemberFilters";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/members")({
  component: OrgAdminMembers,
});

// Type for engagement data from query
type EngagementData = {
  _id: Id<"memberEngagement">;
  userId: string;
  level: EngagementLevel;
  computedLevel: EngagementLevel;
  adminExplanation: string;
  hasOverride: boolean;
  overrideNotes?: string;
};

function OrgAdminMembers() {
  const { slug } = Route.useParams();
  const [filters, setFilters] = useState<MemberFiltersType>({});
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Reset page to 1 when filters change
  const handleFiltersChange = (newFilters: MemberFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  };

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const members = useQuery(
    api.orgs.admin.getAllMembersWithProfiles,
    org && membership?.role === "admin" ? { orgId: org._id } : "skip"
  );

  // Fetch engagement data for all members
  const engagementData = useQuery(
    api.engagement.queries.getOrgEngagementForAdmin,
    org && membership?.role === "admin" ? { orgId: org._id } : "skip"
  );

  // Create a Map for fast userId -> engagement lookup
  const engagementMap = useMemo(() => {
    const map = new Map<string, EngagementData>();
    if (engagementData) {
      for (const e of engagementData) {
        map.set(e.userId, e as EngagementData);
      }
    }
    return map;
  }, [engagementData]);

  // Extract available skills from members data
  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    members?.forEach((m) =>
      m.profile?.skills?.forEach((s) => skills.add(s))
    );
    return Array.from(skills).sort();
  }, [members]);

  // Extract available locations from members data
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    members?.forEach((m) => {
      if (m.profile?.location) locations.add(m.profile.location);
    });
    return Array.from(locations).sort();
  }, [members]);

  // Filter members by all active filters
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((member) => {
      // Search filter (name, email)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const name = member.profile?.name?.toLowerCase() ?? "";
        const email = member.email?.toLowerCase() ?? "";
        if (!name.includes(query) && !email.includes(query)) return false;
      }

      // Engagement filter
      if (filters.engagementLevels?.length) {
        const engagement = engagementMap.get(member.membership.userId);
        const level = engagement?.level ?? "new";
        if (!filters.engagementLevels.includes(level)) return false;
      }

      // Skills filter (any match)
      if (filters.skills?.length) {
        const memberSkills = member.profile?.skills ?? [];
        if (!filters.skills.some((s) => memberSkills.includes(s))) return false;
      }

      // Location filter
      if (filters.locations?.length) {
        const location = member.profile?.location ?? "";
        if (!filters.locations.includes(location)) return false;
      }

      // Join date range
      if (
        filters.joinedAfter &&
        member.membership.joinedAt < filters.joinedAfter
      ) {
        return false;
      }
      if (
        filters.joinedBefore &&
        member.membership.joinedAt > filters.joinedBefore
      ) {
        return false;
      }

      // Directory visibility filter
      if (
        filters.directoryVisibility &&
        filters.directoryVisibility !== "all"
      ) {
        if (member.membership.directoryVisibility !== filters.directoryVisibility) {
          return false;
        }
      }

      return true;
    });
  }, [members, engagementMap, filters]);

  // Calculate paginated members
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  // Loading state
  if (org === undefined || membership === undefined) {
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

  // Not an admin
  if (!membership || membership.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
              <span className="text-slate-700">Members</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Members</h1>
                <p className="text-slate-600 mt-1">
                  {members?.length ?? "..."} members in {org.name}
                </p>
              </div>
              <ExportButton orgId={org._id} orgSlug={slug} />
            </div>
          </div>

          {/* Filters */}
          <MemberFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableSkills={availableSkills}
            availableLocations={availableLocations}
          />

          {/* Members Table */}
          {members === undefined ? (
            <Card className="p-8 text-center">
              <Spinner className="size-8 mx-auto" />
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="size-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {Object.keys(filters).length > 0
                  ? "No members found"
                  : "No members yet"}
              </h3>
              <p className="text-slate-500 text-sm">
                {Object.keys(filters).length > 0
                  ? "Try adjusting your filters"
                  : "Share an invite link to add members"}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Name
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Email
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Role
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Engagement
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Directory
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Joined
                      </th>
                      <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">
                        Profile
                      </th>
                      <th className="text-right text-sm font-medium text-slate-500 px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedMembers.map((member) => (
                      <MemberRow
                        key={member.membership._id}
                        member={member}
                        engagement={engagementMap.get(member.membership.userId) || null}
                        orgId={org._id}
                        currentMembershipId={membership._id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-slate-500">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredMembers.length)} of{" "}
                    {filteredMembers.length} members
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

interface MemberRowProps {
  member: {
    membership: Doc<"orgMemberships">;
    profile: Doc<"profiles"> | null;
    email: string | null;
    completeness: number;
  };
  engagement: EngagementData | null;
  orgId: Id<"organizations">;
  currentMembershipId: Id<"orgMemberships">;
}

function MemberRow({ member, engagement, orgId, currentMembershipId }: MemberRowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const removeMember = useMutation(api.orgs.admin.removeMember);
  const promoteToAdmin = useMutation(api.orgs.admin.promoteToAdmin);
  const demoteToMember = useMutation(api.orgs.admin.demoteToMember);

  const isSelf = member.membership._id === currentMembershipId;
  const isAdmin = member.membership.role === "admin";
  const joinedDate = new Date(member.membership.joinedAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const handlePromote = async () => {
    setIsLoading(true);
    try {
      await promoteToAdmin({
        orgId,
        membershipId: member.membership._id,
      });
    } catch (error) {
      console.error("Failed to promote member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemote = async () => {
    setIsLoading(true);
    try {
      await demoteToMember({
        orgId,
        membershipId: member.membership._id,
      });
    } catch (error) {
      console.error("Failed to demote member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${member.profile?.name || "this member"} from the organization?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await removeMember({
        orgId,
        membershipId: member.membership._id,
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <div className="font-medium text-slate-900">
            {member.profile?.name || "No name"}
          </div>
          {member.profile?.headline && (
            <div className="text-sm text-slate-500 truncate max-w-[200px]">
              {member.profile.headline}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-slate-600">
          {member.email || "—"}
        </td>
        <td className="px-4 py-3">
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin && <Shield className="size-3 mr-1" />}
            {isAdmin ? "Admin" : "Member"}
          </Badge>
        </td>
        <td className="px-4 py-3">
          {engagement ? (
            <EngagementBadge
              level={engagement.level}
              hasOverride={engagement.hasOverride}
              adminExplanation={engagement.adminExplanation}
              onClick={() => setOverrideDialogOpen(true)}
            />
          ) : (
            <PendingEngagementBadge />
          )}
        </td>
        <td className="px-4 py-3">
          <Badge
            variant={
              member.membership.directoryVisibility === "visible"
                ? "outline"
                : "secondary"
            }
          >
            {member.membership.directoryVisibility === "visible"
              ? "Visible"
              : "Hidden"}
          </Badge>
        </td>
        <td className="px-4 py-3 text-slate-600">{joinedDate}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  member.completeness > 70
                    ? "bg-green-500"
                    : member.completeness >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${member.completeness}%` }}
              />
            </div>
            <span className="text-sm text-slate-500">
              {member.completeness}%
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <MoreHorizontal className="size-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {engagement && (
                <>
                  <DropdownMenuItem onClick={() => setOverrideDialogOpen(true)}>
                    <Settings className="size-4 mr-2" />
                    Override Engagement
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isAdmin && (
                <DropdownMenuItem onClick={handlePromote}>
                  <Shield className="size-4 mr-2" />
                  Promote to Admin
                </DropdownMenuItem>
              )}
              {isAdmin && !isSelf && (
                <DropdownMenuItem onClick={handleDemote}>
                  <ShieldOff className="size-4 mr-2" />
                  Demote to Member
                </DropdownMenuItem>
              )}
              {isAdmin && isSelf && (
                <DropdownMenuItem disabled>
                  <ShieldOff className="size-4 mr-2 opacity-50" />
                  Cannot demote self
                </DropdownMenuItem>
              )}
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRemove}
                    className="text-red-600"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Remove from Organization
                  </DropdownMenuItem>
                </>
              )}
              {isSelf && (
                <DropdownMenuItem disabled>
                  <Trash2 className="size-4 mr-2 opacity-50" />
                  Use &quot;Leave Org&quot; instead
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Override Dialog */}
      {engagement && (
        <OverrideDialog
          open={overrideDialogOpen}
          onOpenChange={setOverrideDialogOpen}
          engagementId={engagement._id}
          memberName={member.profile?.name || "Member"}
          currentLevel={engagement.level}
          currentExplanation={engagement.adminExplanation}
          hasOverride={engagement.hasOverride}
          overrideNotes={engagement.overrideNotes}
          orgId={orgId}
          userId={member.membership.userId}
        />
      )}
    </>
  );
}
