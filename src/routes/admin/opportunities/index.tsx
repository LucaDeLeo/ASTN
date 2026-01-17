import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Trash2, Pencil, Plus, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin/opportunities/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.opportunities.listAll, { includeArchived: true })
    );
  },
  component: AdminOpportunitiesPage,
});

function AdminOpportunitiesPage() {
  const { data: opportunities } = useSuspenseQuery(
    convexQuery(api.opportunities.listAll, { includeArchived: true })
  );

  const deleteMutationFn = useConvexMutation(api.admin.deleteOpportunity);
  const { mutate: deleteOpportunity } = useMutation({
    mutationFn: deleteMutationFn,
  });

  const archiveMutationFn = useConvexMutation(api.admin.archiveOpportunity);
  const { mutate: archiveOpportunity } = useMutation({
    mutationFn: archiveMutationFn,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
        <Button asChild>
          <Link to="/admin/opportunities/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Link>
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            No opportunities yet. Add your first one!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Card
              key={opp._id}
              className={opp.status === "archived" ? "opacity-60" : ""}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">{opp.title}</h3>
                      <Badge
                        variant={opp.status === "active" ? "default" : "secondary"}
                      >
                        {opp.status}
                      </Badge>
                      <Badge variant="outline">{opp.source}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {opp.organization} &bull; {opp.location}
                      {opp.isRemote && " - Remote"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last verified:{" "}
                      {formatDistanceToNow(opp.lastVerified, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to="/admin/opportunities/$id/edit"
                        params={{ id: opp._id }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    {opp.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveOpportunity({ id: opp._id })}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this opportunity?")) {
                          deleteOpportunity({ id: opp._id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
