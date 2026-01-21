import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated, useAction, useQuery  } from "convex/react";
import { RefreshCw, Sparkles, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { GradientBg } from "~/components/layout/GradientBg";
import { MobileShell } from "~/components/layout/mobile-shell";
import { useIsMobile } from "~/hooks/use-media-query";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { MatchTierSection } from "~/components/matches/MatchTierSection";
import { GrowthAreas } from "~/components/matches/GrowthAreas";

// Aggregate recommendations from all matches into growth areas
function aggregateGrowthAreas(matches: {
  great: Array<{ recommendations: Array<{ type: string; action: string }> }>;
  good: Array<{ recommendations: Array<{ type: string; action: string }> }>;
  exploring: Array<{ recommendations: Array<{ type: string; action: string }> }>;
}) {
  const allMatches = [...matches.great, ...matches.good, ...matches.exploring];
  const byType: Record<string, Set<string>> = {
    skill: new Set(),
    experience: new Set(),
  };

  for (const match of allMatches) {
    for (const rec of match.recommendations) {
      // Skip "specific" type as those are per-match, not general growth areas
      if (rec.type === "skill" || rec.type === "experience") {
        byType[rec.type].add(rec.action);
      }
    }
  }

  const areas: Array<{ theme: string; items: Array<string> }> = [];

  if (byType.skill.size > 0) {
    areas.push({ theme: "Skills to build", items: [...byType.skill].slice(0, 5) });
  }
  if (byType.experience.size > 0) {
    areas.push({ theme: "Experience to gain", items: [...byType.experience].slice(0, 5) });
  }

  return areas;
}

export const Route = createFileRoute("/matches/")({
  component: MatchesPage,
});

function MatchesPage() {
  const isMobile = useIsMobile();
  const profile = useQuery(api.profiles.getOrCreateProfile);
  const user = profile ? { name: profile.name || "User" } : null;

  // Loading and unauthenticated states use standard layout
  if (isMobile) {
    return (
      <>
        <AuthLoading>
          <GradientBg variant="subtle">
            <AuthHeader />
            <LoadingState />
          </GradientBg>
        </AuthLoading>
        <Unauthenticated>
          <GradientBg variant="subtle">
            <AuthHeader />
            <UnauthenticatedRedirect />
          </GradientBg>
        </Unauthenticated>
        <Authenticated>
          <MobileShell user={user}>
            <GradientBg variant="subtle">
              <MatchesContent />
            </GradientBg>
          </MobileShell>
        </Authenticated>
      </>
    );
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      <AuthLoading>
        <LoadingState />
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <MatchesContent />
      </Authenticated>
    </GradientBg>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  );
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/login" });
  }, [navigate]);
  return <LoadingState />;
}

function MatchesContent() {
  const matchesData = useQuery(api.matches.getMyMatches);
  const triggerComputation = useAction(api.matches.triggerMatchComputation);
  const markViewed = useAction(api.matches.markMatchesViewed);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);

  // Mark matches as viewed on mount
  useEffect(() => {
    if (matchesData && !matchesData.needsProfile && !matchesData.needsComputation) {
      markViewed().catch(console.error);
    }
  }, [matchesData?.needsComputation, matchesData?.needsProfile, markViewed]);

  // Auto-trigger computation if needed
  useEffect(() => {
    if (matchesData?.needsComputation && !isComputing) {
      handleCompute();
    }
  }, [matchesData?.needsComputation, isComputing]);

  const handleCompute = async () => {
    setIsComputing(true);
    setComputeError(null);
    try {
      await triggerComputation();
    } catch (err) {
      setComputeError(err instanceof Error ? err.message : "Failed to compute matches");
    } finally {
      setIsComputing(false);
    }
  };

  // Aggregate growth areas - must be called unconditionally (React hooks rule)
  const growthAreas = useMemo(() => {
    if (matchesData?.matches === undefined) return [];
    return aggregateGrowthAreas(matchesData.matches);
  }, [matchesData?.matches]);

  if (matchesData === undefined || matchesData === null) {
    return <LoadingState />;
  }

  // No profile yet
  if (matchesData.needsProfile) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Create Your Profile First
          </h1>
          <p className="text-muted-foreground mb-6">
            Complete your profile to get matched with AI safety opportunities tailored to your background and goals.
          </p>
          <Button asChild>
            <Link to="/profile/edit">Create Profile</Link>
          </Button>
        </Card>
      </main>
    );
  }

  // Computing matches
  if (isComputing) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="size-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Finding Your Matches
          </h1>
          <p className="text-muted-foreground mb-4">
            Our AI is analyzing opportunities against your profile...
          </p>
          <Spinner />
        </Card>
      </main>
    );
  }

  // Compute error
  if (computeError) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-red-500 mb-6">{computeError}</p>
          <Button onClick={handleCompute}>Try Again</Button>
        </Card>
      </main>
    );
  }

  const { matches, computedAt } = matchesData;
  const hasMatches = matches.great.length + matches.good.length + matches.exploring.length > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-foreground">Your Matches</h1>
            <p className="text-muted-foreground mt-1">
              Opportunities matched to your profile and goals
            </p>
            {computedAt !== null && computedAt !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(computedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleCompute}
            disabled={isComputing}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="size-4 mr-2" />
            Refresh Matches
          </Button>
        </div>

        {/* No matches state */}
        {!hasMatches && (
          <Card className="p-8 text-center">
            <div className="size-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="size-8 text-coral-400" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              No matches yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find strong matches right now. Try completing more of your profile or check back when new opportunities are posted.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/profile/edit">Improve Profile</Link>
              </Button>
              <Button asChild>
                <Link to="/opportunities">Browse All Opportunities</Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Match sections by tier */}
        {hasMatches && (
          <>
            <MatchTierSection tier="great" matches={matches.great} />
            <MatchTierSection tier="good" matches={matches.good} />
            <MatchTierSection tier="exploring" matches={matches.exploring} />

            {/* Growth areas aggregated from recommendations */}
            {growthAreas.length > 0 && (
              <div className="mt-8">
                <GrowthAreas areas={growthAreas} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
