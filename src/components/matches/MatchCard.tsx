import { Link } from "@tanstack/react-router";
import { Compass, ExternalLink, MapPin, Sparkles, ThumbsUp } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface MatchCardProps {
  match: {
    _id: string;
    tier: "great" | "good" | "exploring";
    isNew: boolean;
    explanation: {
      strengths: Array<string>;
    };
    opportunity: {
      _id: string;
      title: string;
      organization: string;
      location: string;
      isRemote: boolean;
      roleType: string;
    };
  };
}

const tierConfig = {
  great: { label: "Great match", color: "bg-emerald-100 text-emerald-800", icon: Sparkles },
  good: { label: "Good match", color: "bg-blue-100 text-blue-800", icon: ThumbsUp },
  exploring: { label: "Worth exploring", color: "bg-amber-100 text-amber-800", icon: Compass },
};

export function MatchCard({ match }: MatchCardProps) {
  const tier = tierConfig[match.tier];
  const TierIcon = tier.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={tier.color}>
              <TierIcon className="size-3 mr-1" />
              {tier.label}
            </Badge>
            {match.isNew && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                New
              </Badge>
            )}
          </div>

          <Link
            to="/matches/$id"
            params={{ id: match._id }}
            className="block group"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary truncate">
              {match.opportunity.title}
            </h3>
            <p className="text-sm text-slate-600">{match.opportunity.organization}</p>
          </Link>

          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{match.opportunity.location}</span>
            {match.opportunity.isRemote && (
              <Badge variant="outline" className="text-xs shrink-0">Remote</Badge>
            )}
          </div>

          {/* Explanation preview - first 2 strengths */}
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {match.explanation.strengths.slice(0, 2).map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">+</span>
                <span className="line-clamp-1">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/matches/$id"
          params={{ id: match._id }}
          className="text-slate-400 hover:text-primary"
        >
          <ExternalLink className="size-5" />
        </Link>
      </div>
    </Card>
  );
}
