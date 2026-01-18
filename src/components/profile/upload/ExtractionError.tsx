import { AlertCircle, Edit3, RotateCcw, Type } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ExtractionErrorProps {
  error: string;
  onRetry: () => void;
  onPasteText: () => void;
  onManualEntry: () => void;
  canRetry: boolean;
}

/**
 * Error UI for failed extractions with recovery options.
 * Provides retry button, text paste fallback, and manual entry option.
 */
export function ExtractionError({
  error,
  onRetry,
  onPasteText,
  onManualEntry,
  canRetry,
}: ExtractionErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-destructive">Extraction failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {canRetry && (
          <Button onClick={onRetry} variant="outline" className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
        <Button onClick={onPasteText} variant="outline" className="flex-1">
          <Type className="mr-2 h-4 w-4" />
          Paste text instead
        </Button>
        <Button onClick={onManualEntry} variant="outline" className="flex-1">
          <Edit3 className="mr-2 h-4 w-4" />
          Enter manually
        </Button>
      </div>
    </div>
  );
}
