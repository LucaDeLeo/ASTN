import { FileText, X, RefreshCw } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onReplace?: () => void;
  disabled?: boolean;
}

/**
 * Shows selected file information with remove/replace actions.
 *
 * Displays:
 * - File icon
 * - Filename (truncated if long)
 * - File size in human-readable format
 * - Remove button
 * - Optional replace button
 */
export function FilePreview({
  file,
  onRemove,
  onReplace,
  disabled = false,
}: FilePreviewProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted/50 p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        disabled && "opacity-50"
      )}
    >
      {/* File icon */}
      <div className="flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-2">
        <FileText className="size-5 text-primary" />
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {onReplace && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onReplace}
            disabled={disabled}
            title="Replace file"
          >
            <RefreshCw className="size-4" />
            <span className="sr-only">Replace file</span>
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
          title="Remove file"
        >
          <X className="size-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    </div>
  );
}
