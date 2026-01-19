import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, max = 5, size = "md" }: StarRatingProps) {
  const sizeClasses = {
    sm: "size-5",
    md: "size-6",
  };

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          aria-checked={value >= star}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              value >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-300 hover:text-yellow-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
