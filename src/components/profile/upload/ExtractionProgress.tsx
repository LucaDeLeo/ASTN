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
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="rounded-lg border bg-card p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="relative flex items-center justify-center h-16 w-16">
          {stageOrder.map((s) => {
            const StageIcon = stages[s].icon;
            return (
              <StageIcon
                key={s}
                className={`absolute h-8 w-8 transition-all duration-300 ease-out ${
                  s === stage
                    ? "opacity-100 scale-100 text-primary"
                    : "opacity-0 scale-75"
                }`}
              />
            );
          })}
          <Loader2 className="absolute h-16 w-16 text-primary/40 animate-spin" />
        </div>
      </div>
      <div className="space-y-1 h-12 flex flex-col justify-center">
        {stageOrder.map((s) => (
          <p
            key={s}
            className={`font-medium text-foreground transition-all duration-300 ease-out ${
              s === stage
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 absolute pointer-events-none"
            }`}
          >
            {stages[s].label}
          </p>
        ))}
        {fileName && (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {stageOrder.map((s, index) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-all duration-300 ease-out ${
              index === currentIndex
                ? "bg-primary scale-125"
                : index < currentIndex
                  ? "bg-primary/50 scale-100"
                  : "bg-muted scale-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
