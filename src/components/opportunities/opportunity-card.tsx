import { Link } from "@tanstack/react-router";
import { Banknote, Building2, Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

const ACTIVE_OPPORTUNITY_KEY = "view-transition-opportunity-id";

type Opportunity = {
  _id: Id<"opportunities">;
  title: string;
  organization: string;
  organizationLogoUrl?: string;
  location: string;
  isRemote: boolean;
  roleType: string;
  salaryRange?: string;
  deadline?: number;
  lastVerified: number;
};

const ROLE_TYPE_COLORS: Record<string, string> = {
  research: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50",
  engineering: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  operations: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
  policy: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50",
  other: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600/50",
};

export function OpportunityCard({
  opportunity,
  index = 0
}: {
  opportunity: Opportunity;
  index?: number;
}) {
  const roleColorClass = ROLE_TYPE_COLORS[opportunity.roleType] || ROLE_TYPE_COLORS.other;

  // Check if this card should have view-transition-name (for back navigation)
  const isActiveTransition =
    typeof window !== "undefined" &&
    sessionStorage.getItem(ACTIVE_OPPORTUNITY_KEY) === opportunity._id;

  return (
    <Link
      to="/opportunities/$id"
      params={{ id: opportunity._id }}
      viewTransition
      onClick={(e) => {
        // Clear existing view-transition-names to prevent duplicates, then set on clicked card
        document.querySelectorAll<HTMLElement>("[style*='view-transition-name']").forEach((el) => {
          el.style.viewTransitionName = "";
        });

        sessionStorage.setItem(ACTIVE_OPPORTUNITY_KEY, opportunity._id);

        const h3 = e.currentTarget.querySelector("h3") as HTMLElement | null;
        if (h3) h3.style.viewTransitionName = "opportunity-title";
      }}
    >
      <Card
        className="
          hover:shadow-lg transition-all duration-200 cursor-pointer
          border-slate-200 dark:border-border hover:border-primary/30
          hover:-translate-y-0.5 active:translate-y-0
          rounded-none sm:rounded-sm
        "
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Organization Logo - sharp corners for Lyra */}
            <div className="flex-shrink-0">
              {opportunity.organizationLogoUrl ? (
                <img
                  src={opportunity.organizationLogoUrl}
                  alt={`${opportunity.organization} logo`}
                  className="w-12 h-12 rounded-sm object-contain bg-slate-50 dark:bg-muted border border-slate-100 dark:border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    suppressHydrationWarning
                    style={isActiveTransition ? { viewTransitionName: "opportunity-title" } : undefined}
                    className="font-semibold text-foreground leading-tight font-mono tracking-tight"
                  >
                    {opportunity.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {opportunity.organization}
                  </p>
                </div>
                <Badge className={`${roleColorClass} capitalize flex-shrink-0 rounded-sm border`}>
                  {opportunity.roleType}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {opportunity.location}
                  {opportunity.isRemote && (
                    <Badge variant="outline" className="ml-1 text-xs py-0 rounded-sm">
                      Remote
                    </Badge>
                  )}
                </span>

                {opportunity.salaryRange && (
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" />
                    {opportunity.salaryRange}
                  </span>
                )}

                {opportunity.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Closes {formatDistanceToNow(opportunity.deadline, { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Freshness indicator (OPPS-06) */}
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Last verified: {formatDistanceToNow(opportunity.lastVerified, { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
