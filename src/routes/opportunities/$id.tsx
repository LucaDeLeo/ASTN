import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { OpportunityDetail } from "~/components/opportunities/opportunity-detail";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/opportunities/$id")({
  component: OpportunityPage,
});

function OpportunityPage() {
  const { id } = Route.useParams();
  const opportunity = useQuery(api.opportunities.get, {
    id: id as Id<"opportunities">,
  });

  if (opportunity === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-slate-100 rounded-sm" />
              <div className="h-64 bg-slate-100 rounded-sm" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (opportunity === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-4 font-mono">
              Opportunity Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              This opportunity may have been removed or the link is incorrect.
            </p>
            <Button asChild className="rounded-sm">
              <Link to="/opportunities">Browse All Opportunities</Link>
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
        <OpportunityDetail opportunity={opportunity} />
      </main>
    </div>
  );
}
