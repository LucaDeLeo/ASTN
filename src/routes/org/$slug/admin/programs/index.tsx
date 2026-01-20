import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building2, FolderPlus, Plus, Shield } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { ProgramCard } from "~/components/programs/ProgramCard";
import { CreateProgramDialog } from "~/components/programs/CreateProgramDialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/programs/")({
  component: ProgramsListPage,
});

function ProgramsListPage() {
  const { slug } = Route.useParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const programs = useQuery(
    api.programs.getOrgPrograms,
    org && membership?.role === "admin"
      ? {
          orgId: org._id,
          status: statusFilter !== "all" ? (statusFilter as "planning" | "active" | "completed" | "archived") : undefined,
        }
      : "skip"
  );

  // Loading
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-slate-100 rounded-xl" />
                ))}
              </div>
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
            <h1 className="text-2xl font-bold text-foreground mb-4">Organization Not Found</h1>
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
            <h1 className="text-2xl font-bold text-foreground mb-4">Admin Access Required</h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>Back to Organization</Link>
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
              <Link to="/org/$slug" params={{ slug }} className="hover:text-slate-700 transition-colors">
                {org.name}
              </Link>
              <span>/</span>
              <Link to="/org/$slug/admin" params={{ slug }} className="hover:text-slate-700 transition-colors">
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-700">Programs</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Programs</h1>
                <p className="text-slate-600 mt-1">
                  Manage reading groups, fellowships, and other activities
                </p>
              </div>
              <CreateProgramDialog
                orgId={org._id}
                trigger={
                  <Button>
                    <Plus className="size-4 mr-2" />
                    New Program
                  </Button>
                }
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Programs Grid */}
          {programs === undefined ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : programs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderPlus className="size-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {statusFilter === "all" ? "No programs yet" : `No ${statusFilter} programs`}
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Create a program to track member participation in activities
                </p>
                {statusFilter === "all" && (
                  <CreateProgramDialog
                    orgId={org._id}
                    trigger={
                      <Button>
                        <Plus className="size-4 mr-2" />
                        Create First Program
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard key={program._id} program={program} slug={slug} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
