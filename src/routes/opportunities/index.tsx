import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
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

const PAGE_SIZE = 20;

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
  const searchPagination = usePaginatedQuery(
    api.opportunities.searchPaginated,
    searchTerm
      ? {
          searchTerm,
          roleType: roleType && roleType !== "all" ? roleType : undefined,
          isRemote,
        }
      : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  const listPagination = usePaginatedQuery(
    api.opportunities.listPaginated,
    !searchTerm
      ? {
          roleType: roleType && roleType !== "all" ? roleType : undefined,
          isRemote,
        }
      : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  const { results, status, loadMore } = searchTerm ? searchPagination : listPagination;
  const isLoading = status === "LoadingFirstPage";

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <OpportunityFilters />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-600 mt-1">
            {results.length} {results.length !== 1 ? "opportunities" : "opportunity"} loaded
            {status !== "Exhausted" && " (more available)"}
          </p>
        </div>
        <OpportunityList
          opportunities={results}
          isLoading={isLoading}
          status={status}
          onLoadMore={() => loadMore(PAGE_SIZE)}
        />
      </main>
    </div>
  );
}
