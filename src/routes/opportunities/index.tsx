import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PublicHeader } from "~/components/layout/public-header";
import { OpportunityFilters } from "~/components/opportunities/opportunity-filters";
import { OpportunityList } from "~/components/opportunities/opportunity-list";

// Define search params schema for this route
type OpportunitySearchParams = {
  role?: string;
  location?: string;
  q?: string;
};

export const Route = createFileRoute("/opportunities/")({
  validateSearch: (search: Record<string, unknown>): OpportunitySearchParams => {
    return {
      role: search.role as string | undefined,
      location: search.location as string | undefined,
      q: search.q as string | undefined,
    };
  },
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { role: roleType, location: locationFilter, q: searchTerm } = Route.useSearch();

  // Determine which query to use based on filters
  const isRemote =
    locationFilter === "remote"
      ? true
      : locationFilter === "onsite"
        ? false
        : undefined;

  // Use search query if there's a search term, otherwise use list query
  const searchResults = useQuery(
    api.opportunities.search,
    searchTerm
      ? {
          searchTerm,
          roleType: roleType && roleType !== "all" ? roleType : undefined,
          isRemote,
          limit: 50,
        }
      : "skip"
  );

  const listResults = useQuery(
    api.opportunities.list,
    !searchTerm
      ? {
          roleType: roleType && roleType !== "all" ? roleType : undefined,
          isRemote,
          limit: 50,
        }
      : "skip"
  );

  const opportunities = searchTerm ? searchResults : listResults;
  const isLoading = opportunities === undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <OpportunityFilters />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          {opportunities && (
            <p className="text-sm text-slate-600 mt-1">
              {opportunities.length} opportunity{opportunities.length !== 1 ? "ies" : "y"} found
            </p>
          )}
        </div>
        <OpportunityList opportunities={opportunities} isLoading={isLoading} />
      </main>
    </div>
  );
}
