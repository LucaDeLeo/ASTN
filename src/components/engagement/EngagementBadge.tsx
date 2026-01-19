import { Activity, AlertCircle, Clock, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export type EngagementLevel =
  | "highly_engaged"
  | "moderate"
  | "at_risk"
  | "new"
  | "inactive";

interface EngagementBadgeProps {
  level: EngagementLevel;
  hasOverride?: boolean;
  adminExplanation?: string;
  onClick?: () => void;
  className?: string;
}

const levelConfig: Record<
  EngagementLevel,
  {
    label: string;
    icon: typeof Activity;
    className: string;
  }
> = {
  highly_engaged: {
    label: "Active",
    icon: Activity,
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
  },
  moderate: {
    label: "Moderate",
    icon: TrendingUp,
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  },
  at_risk: {
    label: "At Risk",
    icon: AlertCircle,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  },
  new: {
    label: "New",
    icon: Sparkles,
    className:
      "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
  },
  inactive: {
    label: "Inactive",
    icon: Clock,
    className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
  },
};

export function EngagementBadge({
  level,
  hasOverride,
  adminExplanation,
  onClick,
  className,
}: EngagementBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-colors",
        config.className,
        className
      )}
      onClick={onClick}
    >
      <Icon className="size-3" />
      {config.label}
      {hasOverride && (
        <span className="ml-0.5 text-[10px] opacity-75">(Manual)</span>
      )}
    </Badge>
  );

  if (adminExplanation) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-slate-900 text-slate-100"
        >
          <p className="text-xs">{adminExplanation}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

/**
 * Pending engagement badge for new members before computation
 */
export function PendingEngagementBadge({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "cursor-default bg-slate-50 text-slate-400 border-slate-200",
        className
      )}
      onClick={onClick}
    >
      <Clock className="size-3" />
      Pending
    </Badge>
  );
}
