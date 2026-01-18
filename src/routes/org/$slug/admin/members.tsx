import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { AuthHeader } from "~/components/layout/auth-header";
import { ExportButton } from "~/components/org/ExportButton";
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
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/members")({
  component: OrgAdminMembers,
});

function OrgAdminMembers() {
  const { slug } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const members = useQuery(
    api.orgs.admin.getAllMembersWithProfiles,
    org && membership?.role === "admin" ? { orgId: org._id } : "skip"
  );

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

  // Filter members by search query
  const filteredMembers =
    members?.filter((m) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = m.profile?.name?.toLowerCase() || "";
      const email = m.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    }) || [];

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

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

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
                {searchQuery ? "No members found" : "No members yet"}
              </h3>
              <p className="text-slate-500 text-sm">
                {searchQuery
                  ? "Try a different search term"
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
                    {filteredMembers.map((member) => (
                      <MemberRow
                        key={member.membership._id}
                        member={member}
                        orgId={org._id}
                        currentMembershipId={membership._id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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
  orgId: Id<"organizations">;
  currentMembershipId: Id<"orgMemberships">;
}

function MemberRow({ member, orgId, currentMembershipId }: MemberRowProps) {
  const [isLoading, setIsLoading] = useState(false);
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
  );
}
