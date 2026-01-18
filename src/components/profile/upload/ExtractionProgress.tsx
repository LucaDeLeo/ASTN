import { Brain, FileText, Loader2, Tags } from "lucide-react";
import type { ExtractionStage } from "./hooks/useExtraction";

interface ExtractionProgressProps {
  stage: ExtractionStage;
  fileName?: string;
}

const stages: Record<ExtractionStage, { label: string; icon: typeof FileText }> =
  {
    reading: { label: "Reading document...", icon: FileText },
    extracting: { label: "Extracting information...", icon: Brain },
    matching: { label: "Matching skills...", icon: Tags },
  };

const stageOrder: Array<ExtractionStage> = ["reading", "extracting", "matching"];

/**
 * Displays extraction progress with animated stage indicators.
 * Shows the current operation (reading, extracting, matching) with
 * visual feedback for completed and pending stages.
 */
export function ExtractionProgress({ stage, fileName }: ExtractionProgressProps) {
  const currentStage = stages[stage];
  const Icon = currentStage.icon;
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="rounded-lg border bg-card p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <Icon className="h-12 w-12 text-primary/30" />
          <Loader2 className="absolute inset-0 h-12 w-12 text-primary animate-spin" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{currentStage.label}</p>
        {fileName && (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {stageOrder.map((s, index) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentIndex
                ? "bg-primary"
                : index < currentIndex
                  ? "bg-primary/50"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
