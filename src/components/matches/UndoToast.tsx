import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface UndoToastProps {
  /** The title of the dismissed opportunity */
  title: string;
  /** Callback when undo is clicked */
  onUndo: () => void;
  /** Callback when toast is dismissed (timeout or manual) */
  onDismiss: () => void;
  /** Duration before auto-dismiss in ms (default: 5000) */
  duration?: number;
}

export function UndoToast({
  title,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Animate progress bar countdown
  useEffect(() => {
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  const handleUndo = () => {
    setIsExiting(true);
    setTimeout(() => {
      onUndo();
      onDismiss();
    }, 150);
  };

  return (
    <div
      className={cn(
        // Positioning - fixed at bottom, above tab bar
        "fixed bottom-20 left-4 right-4 z-50",
        "sm:left-auto sm:right-6 sm:max-w-md",
        // Animation
        "transition-all duration-200 ease-out",
        isExiting
          ? "opacity-0 translate-y-4 scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-4"
      )}
    >
      {/* Main toast container */}
      <div
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "rounded-2xl shadow-2xl",
          "border border-slate-700/50"
        )}
      >
        {/* Subtle warm glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-coral-500/10 via-transparent to-coral-500/5 pointer-events-none" />

        {/* Content */}
        <div className="relative flex items-center gap-3 p-4">
          {/* Dismiss icon indicator */}
          <div className="flex-shrink-0 size-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
            <X className="size-5 text-slate-400" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200">
              Match dismissed
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {title}
            </p>
          </div>

          {/* Undo button - the star of the show */}
          <button
            onClick={handleUndo}
            className={cn(
              "flex-shrink-0 flex items-center gap-2",
              "px-4 py-2.5 rounded-xl",
              "bg-gradient-to-br from-coral-400 to-coral-500",
              "text-white font-semibold text-sm",
              "shadow-lg shadow-coral-500/25",
              "hover:from-coral-300 hover:to-coral-400",
              "hover:shadow-coral-400/30 hover:shadow-xl",
              "active:scale-95",
              "transition-all duration-150"
            )}
          >
            <RotateCcw className="size-4" />
            <span>Undo</span>
          </button>
        </div>

        {/* Progress bar - visual countdown */}
        <div className="h-1 bg-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-coral-400 to-coral-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
