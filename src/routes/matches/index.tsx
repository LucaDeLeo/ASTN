import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useAction } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { MatchTierSection } from "~/components/matches/MatchTierSection";
import { Sparkles, RefreshCw, User } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/matches/")({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
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
    </div>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchesData?.needsComputation]);

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

  if (matchesData === undefined) {
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create Your Profile First
          </h1>
          <p className="text-slate-500 mb-6">
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Finding Your Matches
          </h1>
          <p className="text-slate-500 mb-4">
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Matches</h1>
            <p className="text-slate-500 mt-1">
              Opportunities matched to your profile and goals
            </p>
            {computedAt && (
              <p className="text-xs text-slate-400 mt-1">
                Last updated: {new Date(computedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleCompute}
            disabled={isComputing}
          >
            <RefreshCw className={`size-4 mr-2 ${isComputing ? "animate-spin" : ""}`} />
            Refresh Matches
          </Button>
        </div>

        {/* No matches state */}
        {!hasMatches && (
          <Card className="p-8 text-center">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="size-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No matches yet
            </h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
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
          </>
        )}
      </div>
    </main>
  );
}
