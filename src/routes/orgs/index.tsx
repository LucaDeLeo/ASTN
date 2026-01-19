import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AuthHeader } from "~/components/layout/auth-header";
import { OrgCard } from "~/components/org/OrgCard";
import { OrgFilters } from "~/components/org/OrgFilters";
import { OrgMap } from "~/components/org/OrgMap";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/orgs/")({
  component: OrgBrowsePage,
});

function OrgBrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState<string | undefined>();
  const [selectedOrgId, setSelectedOrgId] = useState<Id<"organizations"> | null>(
    null
  );

  // Debounced search - only query when search is 2+ chars or empty
  const effectiveSearch = searchQuery.length >= 2 ? searchQuery : undefined;

  const orgs = useQuery(api.orgs.discovery.getAllOrgs, {
    country,
    searchQuery: effectiveSearch,
  });

  // Memoize orgs for map to avoid re-renders
  const orgsForMap = useMemo(() => orgs ?? [], [orgs]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="flex flex-col lg:flex-row h-[calc(100vh-65px)]">
        {/* Map - left side on desktop, hidden on mobile */}
        <div className="hidden lg:block w-1/2 h-full p-4">
          <OrgMap
            orgs={orgsForMap}
            selectedOrgId={selectedOrgId}
            onOrgSelect={setSelectedOrgId}
          />
        </div>

        {/* List - right side, scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Organizations
            </h1>
            <p className="text-slate-600">
              Discover AI safety organizations around the world
            </p>
          </div>

          <OrgFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            country={country}
            onCountryChange={setCountry}
          />

          {/* Results */}
          {orgs === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : orgs.length === 0 ? (
            <EmptyState hasFilters={!!searchQuery || !!country} />
          ) : (
            <div className="space-y-4">
              {orgs.map((org) => (
                <div
                  key={org._id}
                  className={`transition-colors rounded-lg ${
                    selectedOrgId === org._id
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  onClick={() => setSelectedOrgId(org._id)}
                >
                  <OrgCard org={org} variant="list" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Building2 className="size-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {hasFilters ? "No organizations found" : "No organizations yet"}
      </h3>
      <p className="text-slate-500">
        {hasFilters
          ? "Try adjusting your filters or search query"
          : "Organizations will appear here once added"}
      </p>
    </div>
  );
}
