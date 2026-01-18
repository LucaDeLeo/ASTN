import { useState } from "react";
import { AlertCircle, ChevronDown, ClipboardPaste } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

const SOFT_LIMIT = 10000;

interface TextPasteZoneProps {
  onTextSubmit: (text: string) => void;
  disabled?: boolean;
}

/**
 * Collapsible text paste area for users who prefer to paste text
 * instead of uploading a file.
 *
 * Features:
 * - Collapsed state by default with "Or paste text instead" link
 * - Expands with animation on click
 * - Encouraging placeholder text
 * - Character count display
 * - Soft warning for very long text (>10k chars)
 * - Continue/Cancel actions
 */
export function TextPasteZone({
  onTextSubmit,
  disabled = false,
}: TextPasteZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState("");

  const charCount = text.length;
  const showWarning = charCount > SOFT_LIMIT;

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text.trim());
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setText("");
  };

  const handleExpand = () => {
    if (!disabled) {
      setIsExpanded(true);
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <ClipboardPaste className="size-4" />
        <span>Or paste text instead</span>
        <ChevronDown className="size-3" />
      </button>
    );
  }

  return (
    <div className="w-full animate-reveal">
      <div className="rounded-xl border bg-card p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <ClipboardPaste className="size-4 text-primary" />
          <span>Paste your career info</span>
        </div>

        {/* Textarea */}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume, LinkedIn summary, career bio, or anything career-related..."
          disabled={disabled}
          className="min-h-[150px] resize-y"
          autoFocus
        />

        {/* Footer with character count and warning */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {showWarning && (
              <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
                <AlertCircle className="size-4" />
                <span>That's quite a lot! We'll do our best.</span>
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-sm tabular-nums",
              showWarning
                ? "text-amber-600 dark:text-amber-500"
                : "text-muted-foreground"
            )}
          >
            {charCount.toLocaleString()} characters
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
