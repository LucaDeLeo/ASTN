import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated, useQuery  } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Compass,
  ExternalLink,
  Lightbulb,
  MapPin,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AuthHeader } from "~/components/layout/auth-header";
import { GradientBg } from "~/components/layout/GradientBg";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";
import { ProbabilityBadge } from "~/components/matches/ProbabilityBadge";

export const Route = createFileRoute("/matches/$id")({
  component: MatchDetailPage,
});

function MatchDetailPage() {
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
        <MatchDetailContent />
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

const tierConfig = {
  great: { label: "Great match", color: "bg-emerald-100 text-emerald-800", icon: Sparkles },
  good: { label: "Good match", color: "bg-blue-100 text-blue-800", icon: ThumbsUp },
  exploring: { label: "Worth exploring", color: "bg-amber-100 text-amber-800", icon: Compass },
};

function MatchDetailContent() {
  const { id } = Route.useParams();
  const match = useQuery(api.matches.getMatchById, {
    matchId: id as Id<"matches">,
  });

  if (match === undefined) {
    return <LoadingState />;
  }

  if (match === null) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Match Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This match may have been updated or removed.
          </p>
          <Button asChild>
            <Link to="/matches">Back to Matches</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const tier = tierConfig[match.tier];
  const TierIcon = tier.icon;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/matches"
          className="inline-flex items-center text-sm text-slate-500 hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to matches
        </Link>

        {/* Opportunity header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={tier.color}>
                  <TierIcon className="size-3 mr-1" />
                  {tier.label}
                </Badge>
                {match.isNew && (
                  <Badge variant="secondary">New</Badge>
                )}
              </div>

              <h1 className="text-2xl font-display font-semibold text-foreground">
                {match.opportunity.title}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                {match.opportunity.organization}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {match.opportunity.location}
                  {match.opportunity.isRemote && (
                    <Badge variant="outline" className="ml-1">Remote</Badge>
                  )}
                </div>
                {match.opportunity.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    Deadline: {new Date(match.opportunity.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <Button asChild>
              <a
                href={match.opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4 mr-2" />
                Apply
              </a>
            </Button>
          </div>
        </Card>

        {/* Why this matches */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-emerald-500" />
            Why This Fits You
          </h2>

          <ul className="space-y-3">
            {match.explanation.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  +
                </span>
                <span className="text-slate-700">{strength}</span>
              </li>
            ))}
          </ul>

          {match.explanation.gap && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                To strengthen your application
              </h3>
              <p className="text-slate-600 pl-6">{match.explanation.gap}</p>
            </div>
          )}
        </Card>

        {/* Probability assessment */}
        <Card className="p-6 mb-6">
          <ProbabilityBadge probability={match.probability} />
        </Card>

        {/* Recommendations */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            Recommendations
          </h2>

          <div className="space-y-4">
            {match.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  rec.type === "specific" ? "bg-primary/5" : "bg-slate-50"
                }`}
              >
                <Badge
                  variant="outline"
                  className={
                    rec.priority === "high"
                      ? "border-primary text-primary"
                      : rec.priority === "medium"
                        ? "border-blue-500 text-blue-500"
                        : "border-slate-400 text-slate-400"
                  }
                >
                  {rec.type === "specific" ? "For this role" : rec.type}
                </Badge>
                <span className="text-slate-700">{rec.action}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Opportunity description */}
        <Card className="p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            About This Opportunity
          </h2>

          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap">{match.opportunity.description}</p>
          </div>

          {match.opportunity.requirements && match.opportunity.requirements.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium text-foreground mb-3">Requirements</h3>
              <ul className="space-y-2">
                {match.opportunity.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600">
                    <span className="text-slate-400">-</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
