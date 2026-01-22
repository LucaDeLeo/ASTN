import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Calendar, MapPin, Settings } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { AnimatedCard } from "~/components/animation/AnimatedCard";
import { AuthHeader } from "~/components/layout/auth-header";
import { GradientBg } from "~/components/layout/GradientBg";
import { MobileShell } from "~/components/layout/mobile-shell";
import { EventCard } from "~/components/events/EventCard";
import { OrgCarousel } from "~/components/org/OrgCarousel";
import { useIsMobile } from "~/hooks/use-media-query";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const isMobile = useIsMobile();
  const profile = useQuery(api.profiles.getOrCreateProfile);
  const user = profile ? { name: profile.name || "User" } : null;

  const loadingContent = (
    <main className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    </main>
  );

  const pageContent = (
    <>
      <AuthLoading>
        {loadingContent}
      </AuthLoading>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );

  if (isMobile) {
    return (
      <MobileShell user={user}>
        <GradientBg variant="subtle">
          {pageContent}
        </GradientBg>
      </MobileShell>
    );
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      {pageContent}
    </GradientBg>
  );
}

function LandingPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-display font-semibold text-foreground mb-4 tracking-tight">
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
  const dashboardEvents = useQuery(api.events.queries.getDashboardEvents);

  // Determine if user has location discovery enabled
  const locationEnabled = locationPrivacy?.locationDiscoverable ?? false;

  // Group user's org events by org for display
  const eventsByOrg = dashboardEvents?.userOrgEvents.reduce(
    (acc, event) => {
      const orgName = event.org.name;
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(event);
      return acc;
    },
    {} as Record<string, typeof dashboardEvents.userOrgEvents | undefined>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Org Suggestions Section */}
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Suggested Organizations
        </h2>
        <p className="text-muted-foreground mb-4">
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

      {/* Upcoming Events Section */}
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Upcoming Events
        </h2>
        <p className="text-muted-foreground mb-4">Events from your organizations</p>

        {dashboardEvents === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : dashboardEvents.userOrgEvents.length > 0 ? (
          // Show events grouped by org
          <div className="space-y-6">
            {eventsByOrg &&
              Object.entries(eventsByOrg).map(([orgName, events]) => {
                if (!events) return null;
                return (
                  <div key={orgName}>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                      {orgName} Events
                    </h3>
                    <div className="space-y-3">
                      {events.slice(0, 5).map((event, index) => (
                        <AnimatedCard key={event._id} index={index}>
                          <EventCard event={event} />
                        </AnimatedCard>
                      ))}
                      {events.length > 5 && (
                        <p className="text-sm text-slate-500 pl-1">
                          +{events.length - 5} more events
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : dashboardEvents.otherOrgEvents.length > 0 ? (
          // No org events but other events exist
          <div className="space-y-4">
            <Card className="p-4 text-center bg-slate-50">
              <p className="text-slate-600 text-sm">
                No events from your organizations.{" "}
                <Link
                  to="/orgs"
                  className="text-primary hover:underline font-medium"
                >
                  Join organizations
                </Link>{" "}
                to see their events here.
              </p>
            </Card>
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Discover Events
              </h3>
              <div className="space-y-3">
                {dashboardEvents.otherOrgEvents.slice(0, 3).map((event, index) => (
                  <AnimatedCard key={event._id} index={index}>
                    <EventCard event={event} />
                  </AnimatedCard>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // No events at all
          <EventsEmptyState />
        )}
      </section>

      {/* Browse Opportunities CTA */}
      <section className="text-center py-8">
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Explore Opportunities
        </h2>
        <p className="text-muted-foreground mb-4">
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
        <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <MapPin className="size-6 text-coral-400" />
        </div>
        <h3 className="text-lg font-display font-medium text-foreground mb-2">
          No organizations near you yet
        </h3>
        <p className="text-muted-foreground text-sm">
          We are still growing our network. Check back later for organizations in your area.
        </p>
      </Card>
    );
  }

  // User has not enabled location discovery
  return (
    <Card className="p-6 text-center">
      <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        <MapPin className="size-6 text-coral-400" />
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-2">
        Enable location-based suggestions
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
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

function EventsEmptyState() {
  return (
    <Card className="p-6 text-center">
      <div className="size-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        <Calendar className="size-6 text-coral-400" />
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-2">
        No upcoming events
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        Join organizations to see their events here.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/orgs">Browse Organizations</Link>
      </Button>
    </Card>
  );
}
