import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookmarkX,
  Calendar,
  Compass,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatLocation } from "~/lib/formatLocation";

const ACTIVE_MATCH_KEY = "view-transition-match-id";

interface MatchCardProps {
  match: {
    _id: string;
    tier: "great" | "good" | "exploring";
    isNew: boolean;
    explanation: {
      strengths: Array<string>;
    };
    probability?: {
      interviewChance: string;
      ranking: string;
    };
    opportunity: {
      _id: string;
      title: string;
      organization: string;
      location: string;
      isRemote: boolean;
      roleType: string;
      deadline?: number;
    };
  };
  /** Whether this match is saved/bookmarked */
  isSaved?: boolean;
  /** Callback to unsave this match */
  onUnsave?: () => void;
}

const tierConfig = {
  great: { label: "Great match", color: "bg-emerald-100 text-emerald-800", icon: Sparkles },
  good: { label: "Good match", color: "bg-blue-100 text-blue-800", icon: ThumbsUp },
  exploring: { label: "Worth exploring", color: "bg-amber-100 text-amber-800", icon: Compass },
};

/** Format deadline date for display */
function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return "Closed";
  }
  if (daysUntil === 0) {
    return "Today";
  }
  if (daysUntil === 1) {
    return "Tomorrow";
  }
  if (daysUntil <= 7) {
    return `${daysUntil} days`;
  }
  // Format as "Feb 15" for dates further out
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MatchCard({ match, isSaved, onUnsave }: MatchCardProps) {
  const tier = tierConfig[match.tier];
  const TierIcon = tier.icon;

  // Check if this card should have view-transition-name (for back navigation)
  // Must be synchronous so the name is set during first render for view transition capture
  const isActiveTransition =
    typeof window !== "undefined" &&
    sessionStorage.getItem(ACTIVE_MATCH_KEY) === match._id;

  return (
    <Link
      to="/matches/$id"
      params={{ id: match._id }}
      viewTransition
      className="block"
      onClick={(e) => {
        // Clear existing view-transition-names to prevent duplicates, then set on clicked card
        document.querySelectorAll<HTMLElement>("[style*='view-transition-name']").forEach((el) => {
          el.style.viewTransitionName = "";
        });

        sessionStorage.setItem(ACTIVE_MATCH_KEY, match._id);

        const card = e.currentTarget;
        const h3 = card.querySelector("h3");
        const strength = card.querySelector<HTMLElement>("[data-morph='strength']");
        if (h3) h3.style.viewTransitionName = "match-title";
        if (strength) strength.style.viewTransitionName = "match-strength";
      }}
    >
      <Card className="p-4 transition-shadow hover:shadow-md cursor-pointer">
        {/* Row 1: Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className={tier.color}>
            <TierIcon className="mr-1 size-3" />
            {tier.label}
          </Badge>
          {match.opportunity.isRemote && (
            <Badge variant="outline" className="text-xs">Remote</Badge>
          )}
          {isSaved && onUnsave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnsave();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800 transition-colors group"
            >
              <Bookmark className="size-3 fill-current group-hover:hidden" />
              <BookmarkX className="size-3 hidden group-hover:block" />
              <span className="group-hover:hidden">Saved</span>
              <span className="hidden group-hover:inline">Unsave</span>
            </button>
          )}
          {isSaved && !onUnsave && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              <Bookmark className="mr-1 size-3 fill-current" />
              Saved
            </Badge>
          )}
          {match.isNew && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              New
            </Badge>
          )}
        </div>

        {/* Row 2: Title + Org */}
        <div className="group">
          <h3
            suppressHydrationWarning
            style={isActiveTransition ? { viewTransitionName: "match-title" } : undefined}
            className="font-semibold text-foreground group-hover:text-primary"
          >
            {match.opportunity.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {match.opportunity.organization} · {formatLocation(match.opportunity.location)}
          </p>
        </div>

        {/* Row 3: One key strength (full, not truncated) */}
        {match.explanation.strengths[0] && (
          <p
            suppressHydrationWarning
            data-morph="strength"
            style={isActiveTransition ? { viewTransitionName: "match-strength" } : undefined}
            className="mt-3 text-sm text-muted-foreground"
          >
            <span className="text-emerald-500">+</span> {match.explanation.strengths[0]}
          </p>
        )}

        {/* Row 4: Probability + Deadline */}
        {(match.probability || match.opportunity.deadline) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {match.probability && (
              <span className="font-medium text-primary">
                {match.probability.ranking} · {match.probability.interviewChance}
              </span>
            )}
            {match.opportunity.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDeadline(match.opportunity.deadline)}
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
