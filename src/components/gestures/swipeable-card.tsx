import { useDrag } from "@use-gesture/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Check, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { useHaptic } from "~/hooks/use-haptic";

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 0.5;
const UNDO_DURATION = 5000;

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
  className?: string;
}

type AnimationPhase =
  | "idle"
  | "swiping"
  | "exiting"
  | "undo-settling"
  | "undo-visible"
  | "undo-fading"
  | "restoring" // Card sliding back in
  | "restore-spring" // Final spring settle
  | "collapsing"
  | "done";

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const [undoProgress, setUndoProgress] = useState(100);
  const [trailOffset, setTrailOffset] = useState(0);
  const [cardOffset, setCardOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const undoTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const nestedTimeoutsRef = useRef<Array<number>>([]);
  const haptic = useHaptic();

  // Measure height on mount
  useEffect(() => {
    if (containerRef.current && measuredHeight === null) {
      setMeasuredHeight(containerRef.current.offsetHeight);
    }
  }, [measuredHeight]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      nestedTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Handle undo - reverse animation sequence
  const handleUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    nestedTimeoutsRef.current.forEach(clearTimeout);
    nestedTimeoutsRef.current = [];

    haptic.tap();

    // Determine direction for restore animation
    const fromLeft = swipeDirection === "left";

    // Phase 1: Fade out undo button
    setPhase("undo-fading");

    // Phase 2: Start restoring - card slides back in from the direction it left
    const t1 = window.setTimeout(() => {
      setPhase("restoring");
      setCardOffset(fromLeft ? -400 : 400); // Start off-screen in exit direction

      // Animate card sliding in
      requestAnimationFrame(() => {
        const t2 = window.setTimeout(() => {
          setCardOffset(fromLeft ? 8 : -8); // Slight overshoot in opposite direction
        }, 50);
        nestedTimeoutsRef.current.push(t2);
      });

      // Phase 3: Spring settle
      const t3 = window.setTimeout(() => {
        setPhase("restore-spring");
        setCardOffset(0);

        // Phase 4: Back to idle
        const t4 = window.setTimeout(() => {
          setPhase("idle");
          setSwipeDirection(null);
          setOffset(0);
          setTrailOffset(0);
          setUndoProgress(100);
        }, 200);
        nestedTimeoutsRef.current.push(t4);
      }, 280);
      nestedTimeoutsRef.current.push(t3);
    }, 200);
    nestedTimeoutsRef.current.push(t1);
  }, [haptic, swipeDirection]);

  // Start undo countdown
  const startUndoCountdown = useCallback(() => {
    setUndoProgress(100);

    const interval = 50;
    const decrement = (interval / UNDO_DURATION) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setUndoProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 0;
        }
        return next;
      });
    }, interval);

    undoTimerRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setPhase("undo-fading");

      const t1 = window.setTimeout(() => {
        setPhase("collapsing");
        const t2 = window.setTimeout(() => {
          if (swipeDirection === "left" && onSwipeLeft) {
            onSwipeLeft();
          } else if (swipeDirection === "right" && onSwipeRight) {
            onSwipeRight();
          }
        }, 300);
        nestedTimeoutsRef.current.push(t2);
      }, 250);
      nestedTimeoutsRef.current.push(t1);
    }, UNDO_DURATION);
  }, [swipeDirection, onSwipeLeft, onSwipeRight]);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last, cancel }) => {
      if (!enabled || (phase !== "idle" && phase !== "swiping")) {
        cancel();
        return;
      }

      if (last) {
        const shouldTrigger =
          Math.abs(mx) > SWIPE_THRESHOLD ||
          (Math.abs(vx) > SWIPE_VELOCITY && Math.abs(mx) > 50);

        if (shouldTrigger) {
          const direction = mx < 0 ? "left" : "right";
          setSwipeDirection(direction);
          setPhase("exiting");
          haptic.tap();

          // Both directions show undo trail
          setTrailOffset(offset * 0.5);

          // Card exits, trail follows then settles
          setTimeout(() => {
            setPhase("undo-settling");
            setTrailOffset(0);

            setTimeout(() => {
              setPhase("undo-visible");
              startUndoCountdown();
            }, 400);
          }, 180);
        } else {
          setOffset(0);
          setTrailOffset(0);
          setPhase("idle");
        }
      } else {
        setPhase("swiping");
        const absMx = Math.abs(mx);
        let visualOffset: number;
        if (absMx <= SWIPE_THRESHOLD) {
          visualOffset = mx;
        } else {
          const overThreshold = absMx - SWIPE_THRESHOLD;
          const dampened = SWIPE_THRESHOLD + overThreshold * 0.3;
          visualOffset = mx < 0 ? -dampened : dampened;
        }
        setOffset(visualOffset);
        setTrailOffset(visualOffset * 0.35);
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Indicator opacities
  const leftOpacity = phase === "exiting" && swipeDirection === "left"
    ? 1 : Math.min(Math.abs(Math.min(offset, 0)) / SWIPE_THRESHOLD, 1);
  const rightOpacity = phase === "exiting" && swipeDirection === "right"
    ? 1 : Math.min(Math.max(offset, 0) / SWIPE_THRESHOLD, 1);

  // Card transform
  const getCardTransform = () => {
    if (phase === "restoring" || phase === "restore-spring") {
      return cardOffset;
    }
    if (phase === "exiting") {
      return swipeDirection === "left" ? -500 : 500;
    }
    if (["undo-settling", "undo-visible", "undo-fading", "collapsing"].includes(phase)) {
      return -500;
    }
    return offset;
  };

  // Container height
  const getContainerHeight = () => {
    if (phase === "collapsing") return 0;
    if (["undo-settling", "undo-visible", "undo-fading"].includes(phase)) return 56;
    return measuredHeight ?? "auto";
  };

  const isCollapsing = phase === "collapsing";
  const showUndoCard = ["undo-settling", "undo-visible", "undo-fading"].includes(phase);
  const showTrailGhost = (phase === "swiping" || phase === "exiting") && Math.abs(offset) > 30;
  const showMainCard = ["idle", "swiping", "exiting", "restoring", "restore-spring"].includes(phase);

  // Calculate trail ghost opacity (capped at 0.9)
  const trailGhostOpacity = phase === "exiting"
    ? 0.9
    : Math.min(Math.abs(offset) / (SWIPE_THRESHOLD * 0.7), 0.9);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        height: getContainerHeight(),
        marginTop: isCollapsing ? 0 : undefined,
        marginBottom: isCollapsing ? 0 : undefined,
        opacity: isCollapsing ? 0 : 1,
        transition: (() => {
          if (phase === "collapsing") {
            return "height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease-out, margin 300ms cubic-bezier(0.4, 0, 0.2, 1)";
          }
          if (phase === "undo-settling") {
            // Ease-out: quick response, gentle settle
            return "height 300ms cubic-bezier(0.22, 1, 0.36, 1)";
          }
          if (phase === "restoring" || phase === "restore-spring") {
            // Ease-out: quick response, gentle settle
            return "height 280ms cubic-bezier(0.22, 1, 0.36, 1)";
          }
          return "none";
        })(),
      }}
    >
      {/* Background action indicators */}
      {showMainCard && !["restoring", "restore-spring"].includes(phase) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6">
          <div
            className={cn(
              "flex items-center justify-center",
              "size-12 rounded-full",
              "bg-emerald-500 text-white",
              "transition-opacity duration-100"
            )}
            style={{ opacity: rightOpacity }}
          >
            <Check className="size-6" />
          </div>
          <div
            className={cn(
              "flex items-center justify-center",
              "size-12 rounded-full",
              "bg-destructive text-white",
              "transition-opacity duration-100"
            )}
            style={{ opacity: leftOpacity }}
          >
            <X className="size-6" />
          </div>
        </div>
      )}

      {/* Trailing ghost card - follows during swipe, morphs into undo button */}
      {showTrailGhost && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            // Trail behind card: +100 for left swipe, -100 for right swipe
            transform: `translateX(${trailOffset + (offset < 0 ? 100 : -100)}px)`,
            opacity: trailGhostOpacity,
            transition: phase === "exiting"
              ? "transform 350ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 300ms ease-out"
              : "transform 80ms ease-out",
          }}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-full",
              "bg-white/95 dark:bg-slate-800/95",
              "border border-slate-200/70 dark:border-slate-700/70",
              "shadow-xl shadow-slate-300/40 dark:shadow-slate-900/50",
              "backdrop-blur-sm"
            )}
            style={{
              transform: `scale(${0.85 + Math.min(Math.abs(offset) / 500, 0.12)})`,
              transition: phase === "exiting" ? "transform 300ms ease-out" : "none",
            }}
          >
            {offset < 0 ? (
              // Left swipe (dismiss) - show undo icon
              <>
                <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <RotateCcw className="size-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Undo?</span>
              </>
            ) : (
              // Right swipe (save) - show saved icon
              <>
                <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Bookmark className="size-3.5 text-emerald-600 dark:text-emerald-400 fill-current" />
                </div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Saved!</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settled undo button */}
      {showUndoCard && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex items-center justify-center h-14",
            "transition-all",
            phase === "undo-settling" && "duration-400",
            phase === "undo-fading" && "duration-250 opacity-0 scale-90"
          )}
          style={{
            transform: phase === "undo-settling"
              ? `translateX(${trailOffset}px)`
              : "translateX(0)",
            transitionTimingFunction: phase === "undo-settling"
              ? "cubic-bezier(0.22, 1, 0.36, 1)"
              : "ease-out",
          }}
        >
          <button
            onClick={handleUndo}
            className={cn(
              "group relative flex items-center gap-3",
              "pl-2.5 pr-5 py-1.5 rounded-full",
              "bg-white dark:bg-slate-800",
              "border border-slate-200/80 dark:border-slate-700",
              "shadow-sm shadow-slate-300/20 dark:shadow-slate-900/40",
              "active:scale-[0.96]",
              "transition-all duration-200 ease-out",
              // Direction-specific hover styles
              swipeDirection === "right"
                ? "hover:shadow hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                : "hover:shadow hover:border-coral-300 dark:hover:border-coral-500 hover:bg-coral-50 dark:hover:bg-coral-950/30"
            )}
          >
            {/* Circular progress timer */}
            <div className="relative size-10 flex items-center justify-center">
              <svg className="absolute inset-0 size-10 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-slate-100 dark:text-slate-700"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={swipeDirection === "right" ? "text-emerald-400 dark:text-emerald-500" : "text-coral-400 dark:text-coral-500"}
                  strokeDasharray={106.8}
                  strokeDashoffset={106.8 - (106.8 * undoProgress) / 100}
                  style={{ transition: "stroke-dashoffset 60ms linear" }}
                />
              </svg>
              {swipeDirection === "right" ? (
                <Bookmark
                  className={cn(
                    "size-4 relative z-10 fill-current",
                    "text-emerald-500 dark:text-emerald-400",
                    "group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
                    "transition-colors duration-200"
                  )}
                />
              ) : (
                <RotateCcw
                  className={cn(
                    "size-4 relative z-10",
                    "text-slate-500 dark:text-slate-400",
                    "group-hover:text-coral-500 dark:group-hover:text-coral-400",
                    "transition-colors duration-200"
                  )}
                />
              )}
            </div>

            <span
              className={cn(
                "text-sm font-semibold",
                "transition-colors duration-200",
                swipeDirection === "right"
                  ? "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                  : "text-slate-600 dark:text-slate-300 group-hover:text-coral-600 dark:group-hover:text-coral-400"
              )}
            >
              {swipeDirection === "right" ? "Saved" : "Undo"}
            </span>
          </button>
        </div>
      )}

      {/* Main swipeable content */}
      <div
        {...bind()}
        className={cn(
          "relative bg-background",
          !showMainCard && "pointer-events-none"
        )}
        style={{
          transform: `translateX(${getCardTransform()}px)`,
          touchAction: "pan-y",
          opacity: showMainCard ? 1 : 0,
          transition: (() => {
            if (phase === "exiting") return "transform 220ms ease-out";
            if (phase === "restoring") return "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)";
            if (phase === "restore-spring") return "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
            if (phase === "idle" && offset === 0) return "transform 200ms ease-out";
            return "none";
          })(),
        }}
      >
        {children}
      </div>
    </div>
  );
}
