import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building2, Download, Shield, UserPlus, Users } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { OrgStats } from "~/components/org/OrgStats";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/")({
  component: OrgAdminDashboard,
});

function OrgAdminDashboard() {
  const { slug } = Route.useParams();
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const stats = useQuery(
    api.orgs.stats.getOrgStats,
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
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl" />
                ))}
              </div>
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
            <p className="text-slate-600 mb-6">
              This organization doesn&apos;t exist or the link is incorrect.
            </p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Not an admin - redirect to org page
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
            <p className="text-slate-600 mb-6">
              You need to be an admin of this organization to access this page.
            </p>
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
              <span className="text-slate-700">Admin Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Manage members and view organization statistics
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total Members
                </CardTitle>
                <Users className="size-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {stats?.memberCount ?? <Spinner className="size-6" />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Admins
                </CardTitle>
                <Shield className="size-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {stats?.adminCount ?? <Spinner className="size-6" />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  New This Month
                </CardTitle>
                <UserPlus className="size-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {stats?.joinedThisMonth ?? <Spinner className="size-6" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Button asChild className="h-auto py-4">
              <Link to="/org/$slug/admin/members" params={{ slug }}>
                <Users className="size-5 mr-2" />
                View Members
              </Link>
            </Button>

            <InviteLinkButton orgId={org._id} />

            <Button
              variant="outline"
              className="h-auto py-4"
              asChild
            >
              <Link to="/org/$slug/admin/members" params={{ slug }}>
                <Download className="size-5 mr-2" />
                Export Data
              </Link>
            </Button>
          </div>

          {/* Statistics Visualization */}
          {stats && <OrgStats stats={stats} />}
        </div>
      </main>
    </div>
  );
}

// Separate component for invite link creation
function InviteLinkButton({
  orgId,
}: {
  orgId: import("../../../../../convex/_generated/dataModel").Id<"organizations">;
}) {
  const inviteLinks = useQuery(api.orgs.admin.getInviteLinks, { orgId });

  // If there's an active invite link, show it
  const activeLink = inviteLinks?.[0];

  if (activeLink) {
    const inviteUrl = `${window.location.origin}/org/join?token=${activeLink.token}`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(inviteUrl);
    };

    return (
      <Button
        variant="outline"
        className="h-auto py-4"
        onClick={copyToClipboard}
      >
        <UserPlus className="size-5 mr-2" />
        Copy Invite Link
      </Button>
    );
  }

  return (
    <Button variant="outline" className="h-auto py-4" disabled>
      <UserPlus className="size-5 mr-2" />
      Create Invite Link
    </Button>
  );
}
