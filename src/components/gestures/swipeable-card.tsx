import { useDrag } from "@use-gesture/react";
import {  useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type {ReactNode} from "react";
import { cn } from "~/lib/utils";
import { useHaptic } from "~/hooks/use-haptic";

const SWIPE_THRESHOLD = 100; // Pixels to trigger action
const SWIPE_VELOCITY = 0.5; // Min velocity to trigger

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
  /** Additional class names */
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState<"left" | "right" | null>(
    null
  );
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const haptic = useHaptic();

  // Measure height on mount for smooth collapse
  useEffect(() => {
    if (containerRef.current && measuredHeight === null) {
      setMeasuredHeight(containerRef.current.offsetHeight);
    }
  }, [measuredHeight]);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last, cancel }) => {
      if (!enabled || isAnimatingOut) {
        cancel();
        return;
      }

      if (last) {
        const shouldTrigger =
          Math.abs(mx) > SWIPE_THRESHOLD ||
          (Math.abs(vx) > SWIPE_VELOCITY && Math.abs(mx) > 50);

        if (shouldTrigger) {
          const direction = mx < 0 ? "left" : "right";
          setIsAnimatingOut(direction);
          haptic.tap();

          // Animate out horizontally, then collapse height, then trigger callback
          setTimeout(() => {
            // Start height collapse
            setIsCollapsing(true);

            // After height collapse completes, fire the callback
            setTimeout(() => {
              if (direction === "left" && onSwipeLeft) {
                onSwipeLeft();
              } else if (direction === "right" && onSwipeRight) {
                onSwipeRight();
              }
              // Reset state (component will unmount anyway due to list update)
              setIsAnimatingOut(null);
              setIsCollapsing(false);
              setOffset(0);
            }, 200); // Height collapse duration
          }, 200); // Horizontal swipe duration
        } else {
          setOffset(0);
        }
      } else {
        // Smooth rubber-band resistance (no sudden jump at threshold)
        // Use logarithmic curve for natural feel
        const absMx = Math.abs(mx);
        let visualOffset: number;
        if (absMx <= SWIPE_THRESHOLD) {
          visualOffset = mx;
        } else {
          // Past threshold: continue moving but with diminishing returns
          const overThreshold = absMx - SWIPE_THRESHOLD;
          const dampened = SWIPE_THRESHOLD + overThreshold * 0.3;
          visualOffset = mx < 0 ? -dampened : dampened;
        }
        setOffset(visualOffset);
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Calculate action indicator opacity
  const leftOpacity = Math.min(
    Math.abs(Math.min(offset, 0)) / SWIPE_THRESHOLD,
    1
  );
  const rightOpacity = Math.min(Math.max(offset, 0) / SWIPE_THRESHOLD, 1);

  // Determine final position for animation
  const translateX = isAnimatingOut
    ? isAnimatingOut === "left"
      ? -400
      : 400
    : offset;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{
        height: isCollapsing ? 0 : measuredHeight ?? "auto",
        marginTop: isCollapsing ? 0 : undefined,
        marginBottom: isCollapsing ? 0 : undefined,
        paddingTop: isCollapsing ? 0 : undefined,
        paddingBottom: isCollapsing ? 0 : undefined,
        opacity: isCollapsing ? 0 : 1,
        transition: isCollapsing
          ? "height 250ms ease-out, opacity 200ms ease-out, margin 250ms ease-out, padding 250ms ease-out"
          : "none",
      }}
    >
      {/* Background action indicators */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6">
        {/* Dismiss indicator (left swipe) */}
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

        {/* Save indicator (right swipe) */}
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
      </div>

      {/* Swipeable content */}
      <div
        {...bind()}
        className={cn(
          "relative bg-background",
          isAnimatingOut && "transition-transform duration-200 ease-out"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
