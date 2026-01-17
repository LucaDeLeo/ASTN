import { createFileRoute } from "@tanstack/react-router";
import { OpportunityForm } from "~/components/admin/opportunity-form";

export const Route = createFileRoute("/admin/opportunities/new")({
  component: NewOpportunityPage,
});

function NewOpportunityPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Add New Opportunity
      </h1>
      <OpportunityForm mode="create" />
    </div>
  );
}
