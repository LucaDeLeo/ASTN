import { Compass, Sparkles, ThumbsUp } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MatchCard } from "./MatchCard";
import { AnimatedCard } from "~/components/animation/AnimatedCard";
import { SwipeableCard } from "~/components/gestures/swipeable-card";
import { useIsMobile } from "~/hooks/use-media-query";
import type { Id } from "../../../convex/_generated/dataModel";

interface MatchTierSectionProps {
  tier: "great" | "good" | "exploring";
  matches: Array<{
    _id: Id<"matches">;
    tier: "great" | "good" | "exploring";
    isNew: boolean;
    status?: "active" | "dismissed" | "saved";
    explanation: { strengths: Array<string> };
    opportunity: {
      _id: string;
      title: string;
      organization: string;
      location: string;
      isRemote: boolean;
      roleType: string;
    };
  }>;
}

const tierMeta = {
  great: {
    title: "Great Matches",
    description: "Strong alignment with your background and goals",
    icon: Sparkles,
    color: "text-emerald-600",
  },
  good: {
    title: "Good Matches",
    description: "Good fit with some areas to develop",
    icon: ThumbsUp,
    color: "text-blue-600",
  },
  exploring: {
    title: "Worth Exploring",
    description: "Stretch opportunities that could expand your horizons",
    icon: Compass,
    color: "text-amber-600",
  },
};

export function MatchTierSection({ tier, matches }: MatchTierSectionProps) {
  const isMobile = useIsMobile();
  const dismissMatch = useMutation(api.matches.dismissMatch);
  const saveMatch = useMutation(api.matches.saveMatch);

  if (matches.length === 0) return null;

  const meta = tierMeta[tier];
  const Icon = meta.icon;

  return (
    <section className="mb-8">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`size-5 ${meta.color}`} />
        <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
        <span className="text-sm text-slate-500">({matches.length})</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">{meta.description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match, index) => {
          const card = (
            <MatchCard match={match} isSaved={match.status === "saved"} />
          );

          if (isMobile) {
            return (
              <AnimatedCard key={match._id} index={index}>
                <SwipeableCard
                  onSwipeLeft={() => dismissMatch({ matchId: match._id })}
                  onSwipeRight={() => saveMatch({ matchId: match._id })}
                >
                  {card}
                </SwipeableCard>
              </AnimatedCard>
            );
          }

          return (
            <AnimatedCard key={match._id} index={index}>
              {card}
            </AnimatedCard>
          );
        })}
      </div>
    </section>
  );
}
