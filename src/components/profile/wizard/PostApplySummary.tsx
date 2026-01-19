import { useQuery } from "convex/react";
import { CheckCircle, PenLine, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface PostApplySummaryProps {
  onContinueToEnrichment: () => void;
  onSkip: () => void;
  onBackToManual: () => void;
}

export function PostApplySummary({
  onContinueToEnrichment,
  onSkip,
  onBackToManual,
}: PostApplySummaryProps) {
  const completeness = useQuery(api.profiles.getMyCompleteness);

  // Show loading state while fetching completeness
  const percentage = completeness?.percentage ?? 0;
  const completedCount = completeness?.completedCount ?? 0;
  const totalCount = completeness?.totalCount ?? 7;

  return (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="space-y-6 text-center">
        {/* Success icon and message */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Profile updated from your resume!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              We extracted your information and added it to your profile.
            </p>
          </div>
        </div>

        {/* Completeness indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile completeness</span>
            <span className="font-medium text-slate-900">
              {completedCount} of {totalCount} sections
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-2xl font-bold text-primary">{percentage}% complete</p>
        </div>

        {/* Call to action */}
        <div className="pt-4 space-y-3">
          <p className="text-sm text-slate-600">
            Continue to chat with our AI to fill in the gaps and make your profile shine.
          </p>
          <Button onClick={onContinueToEnrichment} size="lg" className="w-full gap-2">
            <Sparkles className="size-4" />
            Continue to Enrichment
          </Button>
        </div>

        {/* Secondary options */}
        <div className="flex flex-col items-center gap-2 pt-2 text-sm">
          <button
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip enrichment for now
          </button>
          <button
            onClick={onBackToManual}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <PenLine className="size-3" />
            Or edit your profile manually
          </button>
        </div>
      </div>
    </Card>
  );
}
