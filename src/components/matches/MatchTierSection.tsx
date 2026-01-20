import { Compass, Sparkles, ThumbsUp } from "lucide-react";
import { MatchCard } from "./MatchCard";
import { AnimatedCard } from "~/components/animation/AnimatedCard";

interface MatchTierSectionProps {
  tier: "great" | "good" | "exploring";
  matches: Array<{
    _id: string;
    tier: "great" | "good" | "exploring";
    isNew: boolean;
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
  if (matches.length === 0) return null;

  const meta = tierMeta[tier];
  const Icon = meta.icon;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-5 ${meta.color}`} />
        <h2 className="text-lg font-semibold text-slate-900">{meta.title}</h2>
        <span className="text-sm text-slate-500">({matches.length})</span>
      </div>
      <p className="text-sm text-slate-500 mb-4">{meta.description}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match, index) => (
          <AnimatedCard key={match._id} index={index}>
            <MatchCard match={match} />
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}
