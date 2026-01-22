import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AuthHeader } from "~/components/layout/auth-header";
import { GradientBg } from "~/components/layout/GradientBg";
import { OpportunityDetail } from "~/components/opportunities/opportunity-detail";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/opportunities/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.opportunities.get, {
        id: params.id as Id<"opportunities">,
      })
    );
  },
  component: OpportunityPage,
});

function OpportunityPage() {
  const { id } = Route.useParams();

  // Data is synchronously available - preloaded by route loader
  const { data: opportunity } = useSuspenseQuery(
    convexQuery(api.opportunities.get, {
      id: id as Id<"opportunities">,
    })
  );

  if (opportunity === null) {
    return (
      <GradientBg variant="subtle">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-display font-semibold text-foreground mb-4">
              Opportunity Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              This opportunity may have been removed or the link is incorrect.
            </p>
            <Button asChild>
              <Link to="/opportunities">Browse All Opportunities</Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    );
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <OpportunityDetail opportunity={opportunity} />
      </main>
    </GradientBg>
  );
}
