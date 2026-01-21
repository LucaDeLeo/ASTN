import { useDrag } from "@use-gesture/react";
import { useState, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { useHaptic } from "~/hooks/use-haptic";
import { Check, X } from "lucide-react";

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
  const haptic = useHaptic();

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

          // Animate out then trigger callback
          setTimeout(() => {
            if (direction === "left" && onSwipeLeft) {
              onSwipeLeft();
            } else if (direction === "right" && onSwipeRight) {
              onSwipeRight();
            }
            setIsAnimatingOut(null);
            setOffset(0);
          }, 200);
        } else {
          setOffset(0);
        }
      } else {
        // Apply some resistance at the edges
        const resistance = Math.abs(mx) > SWIPE_THRESHOLD ? 0.5 : 1;
        setOffset(mx * resistance);
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
    <div className={cn("relative overflow-hidden", className)}>
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
