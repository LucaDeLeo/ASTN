import { useState } from "react";
import { Bookmark, ChevronDown } from "lucide-react";
import { MatchCard } from "./MatchCard";
import { AnimatedCard } from "~/components/animation/AnimatedCard";
import { cn } from "~/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface SavedMatchesSectionProps {
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

export function SavedMatchesSection({ matches }: SavedMatchesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (matches.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-3 rounded-lg",
          "bg-emerald-50 border border-emerald-200",
          "hover:bg-emerald-100 transition-colors",
          "text-left"
        )}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="size-5 text-emerald-600 fill-emerald-600" />
          <span className="font-medium text-emerald-800">
            {matches.length} Saved
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-5 text-emerald-600 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-4"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, index) => (
              <AnimatedCard key={match._id} index={index}>
                <MatchCard match={match} isSaved />
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
