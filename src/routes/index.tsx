import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated, useQuery } from "convex/react";
import { MapPin, Settings } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { OrgCarousel } from "~/components/org/OrgCarousel";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <AuthLoading>
        <main className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </main>
      </AuthLoading>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </div>
  );
}

function LandingPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4 font-mono tracking-tight">
          AI Safety Talent Network
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Find opportunities in AI safety research, policy, and engineering.
        </p>
        <Button
          asChild
          size="lg"
          className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link to="/opportunities">Browse Opportunities</Link>
        </Button>
      </div>
    </main>
  );
}

function Dashboard() {
  const suggestedOrgs = useQuery(api.orgs.discovery.getSuggestedOrgs);
  const locationPrivacy = useQuery(api.profiles.getLocationPrivacy);

  // Determine if user has location discovery enabled
  const locationEnabled = locationPrivacy?.locationDiscoverable ?? false;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Org Suggestions Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Suggested Organizations
        </h2>
        <p className="text-slate-600 mb-4">
          Organizations near you or with global presence
        </p>

        {suggestedOrgs === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : suggestedOrgs.length > 0 ? (
          <OrgCarousel orgs={suggestedOrgs} />
        ) : (
          <EmptyStatePrompt locationEnabled={locationEnabled} />
        )}
      </section>

      {/* Browse Opportunities CTA */}
      <section className="text-center py-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Explore Opportunities
        </h2>
        <p className="text-slate-600 mb-4">
          Find AI safety roles that match your skills and interests
        </p>
        <Button
          asChild
          size="lg"
          className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link to="/opportunities">Browse Opportunities</Link>
        </Button>
      </section>
    </main>
  );
}

function EmptyStatePrompt({ locationEnabled }: { locationEnabled: boolean }) {
  if (locationEnabled) {
    // User has location enabled but no orgs matched
    return (
      <Card className="p-6 text-center">
        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <MapPin className="size-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No organizations near you yet
        </h3>
        <p className="text-slate-500 text-sm">
          We are still growing our network. Check back later for organizations in your area.
        </p>
      </Card>
    );
  }

  // User has not enabled location discovery
  return (
    <Card className="p-6 text-center">
      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <MapPin className="size-6 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        Enable location-based suggestions
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        Discover AI safety organizations near you. Your exact location is never
        shared with organizations.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/settings" className="inline-flex items-center gap-2">
          <Settings className="size-4" />
          Enable in Settings
        </Link>
      </Button>
    </Card>
  );
}
