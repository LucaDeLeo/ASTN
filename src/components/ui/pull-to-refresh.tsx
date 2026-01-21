import type { ReactNode } from "react";
import { usePullToRefresh } from "~/hooks/use-pull-to-refresh";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
  /** Additional class names for the container */
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  enabled = true,
  className,
}: PullToRefreshProps) {
  const { bind, pullDistance, isRefreshing, isTriggered } = usePullToRefresh({
    onRefresh,
    enabled,
  });

  // Calculate indicator opacity and transform
  const indicatorOpacity = Math.min(pullDistance / 60, 1);
  const indicatorTransform = `translateY(${Math.min(pullDistance - 40, 20)}px)`;

  return (
    <div
      {...bind()}
      data-pull-to-refresh
      className={cn(
        "relative overflow-y-auto overscroll-y-contain",
        className
      )}
      style={{ touchAction: "pan-y" }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none",
          "transition-opacity duration-150",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: "8px",
          opacity: isRefreshing ? 1 : indicatorOpacity,
          transform: isRefreshing ? "translateY(0)" : indicatorTransform,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-background/95 backdrop-blur-sm",
            "border border-border shadow-warm-sm",
            isTriggered || isRefreshing
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {isRefreshing ? (
            <Spinner className="size-5" />
          ) : (
            <svg
              className={cn(
                "size-5 transition-transform duration-150",
                isTriggered ? "rotate-180" : "rotate-0"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: isRefreshing
            ? "translateY(48px)"
            : `translateY(${pullDistance * 0.5}px)`,
          transition:
            pullDistance === 0 && !isRefreshing
              ? "transform 200ms ease-out"
              : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
