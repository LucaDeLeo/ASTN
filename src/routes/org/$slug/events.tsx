import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building2, Calendar, ExternalLink } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { LumaEmbed } from "~/components/events/LumaEmbed";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/org/$slug/events")({
  component: OrgEventsPage,
});

function OrgEventsPage() {
  const { slug } = Route.useParams();
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });

  // Loading state
  if (org === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-[600px] bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not found state
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

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-12 rounded-lg object-cover"
                />
              ) : (
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="size-6 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Link
                    to="/org/$slug"
                    params={{ slug }}
                    className="hover:text-slate-700 transition-colors"
                  >
                    {org.name}
                  </Link>
                  <span>/</span>
                  <span className="text-slate-700">Events</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  <Calendar className="size-5 inline-block mr-2 -mt-0.5" />
                  Events Calendar
                </h1>
              </div>
            </div>
          </Card>

          {/* Events content */}
          {org.lumaCalendarUrl ? (
            <div className="space-y-4">
              <LumaEmbed calendarUrl={org.lumaCalendarUrl} />
              <p className="text-center text-sm text-slate-500">
                <a
                  href={org.lumaCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                >
                  View on lu.ma
                  <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="size-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                No Events Calendar
              </h2>
              <p className="text-slate-600">
                This organization hasn&apos;t set up their event calendar yet.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
