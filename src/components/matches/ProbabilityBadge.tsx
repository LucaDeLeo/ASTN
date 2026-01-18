import { Badge } from "~/components/ui/badge";
import { TrendingUp, AlertCircle } from "lucide-react";

interface ProbabilityBadgeProps {
  probability: {
    interviewChance: string;
    ranking: string;
    confidence: string;
  };
}

const chanceColors: Record<string, string> = {
  "Strong chance": "bg-emerald-100 text-emerald-800",
  "Good chance": "bg-blue-100 text-blue-800",
  "Moderate chance": "bg-amber-100 text-amber-800",
};

export function ProbabilityBadge({ probability }: ProbabilityBadgeProps) {
  const chanceColor = chanceColors[probability.interviewChance] || "bg-slate-100 text-slate-800";

  return (
    <div className="bg-slate-50 rounded-lg p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">Interview Likelihood</span>
        <Badge variant="outline" className="text-xs ml-auto">
          <AlertCircle className="size-3 mr-1" />
          experimental
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <Badge className={`${chanceColor} text-sm`}>
          {probability.interviewChance}
        </Badge>
        <span className="text-sm text-slate-600">
          {probability.ranking}
        </span>
      </div>

      {probability.confidence !== "HIGH" && (
        <p className="text-xs text-slate-400 mt-2">
          Confidence: {probability.confidence.toLowerCase()}
        </p>
      )}
    </div>
  );
}
