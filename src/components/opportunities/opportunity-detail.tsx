import { Link } from "@tanstack/react-router";
import {
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatLocation } from "~/lib/formatLocation";

type Opportunity = {
  _id: Id<"opportunities">;
  title: string;
  organization: string;
  organizationLogoUrl?: string;
  location: string;
  isRemote: boolean;
  roleType: string;
  experienceLevel?: string;
  description: string;
  requirements?: Array<string>;
  salaryRange?: string;
  deadline?: number;
  sourceUrl: string;
  source: "80k_hours" | "aisafety_com" | "manual";
  alternateSources?: Array<{ sourceId: string; source: string; sourceUrl: string }>;
  lastVerified: number;
  createdAt: number;
};

const SOURCE_NAMES: Record<string, string> = {
  "80k_hours": "80,000 Hours",
  aisafety_com: "aisafety.com",
  manual: "Direct submission",
};

const ROLE_TYPE_COLORS: Record<string, string> = {
  research: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  engineering: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  operations: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  policy: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-muted text-muted-foreground",
};

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const roleColorClass = ROLE_TYPE_COLORS[opportunity.roleType] || ROLE_TYPE_COLORS.other;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card rounded-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {opportunity.organizationLogoUrl ? (
            <img
              src={opportunity.organizationLogoUrl}
              alt={`${opportunity.organization} logo`}
              className="w-16 h-16 rounded-sm object-contain bg-muted flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1
                  style={{ viewTransitionName: "opportunity-title" }}
                  className="text-xl sm:text-2xl font-bold text-foreground font-mono break-words"
                >
                  {opportunity.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mt-1">
                  {opportunity.organization}
                </p>
              </div>
              <Badge className={`${roleColorClass} capitalize rounded-sm shrink-0 self-start`}>
                {opportunity.roleType}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-muted-foreground text-sm sm:text-base">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[200px]">{formatLocation(opportunity.location)}</span>
                {opportunity.isRemote && (
                  <Badge variant="outline" className="ml-1 rounded-sm shrink-0">Remote</Badge>
                )}
              </span>

              {opportunity.experienceLevel && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  {opportunity.experienceLevel.charAt(0).toUpperCase() +
                    opportunity.experienceLevel.slice(1)}{" "}
                  level
                </span>
              )}

              {opportunity.salaryRange && opportunity.salaryRange !== "Not Found" && (
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 shrink-0" />
                  {opportunity.salaryRange}
                </span>
              )}

              {opportunity.deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 shrink-0" />
                  Deadline: {format(opportunity.deadline, "MMM d, yyyy")}
                </span>
              )}
            </div>

            <div className="mt-6">
              <Button asChild size="lg" className="rounded-sm w-full sm:w-auto">
                <a
                  href={opportunity.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6 rounded-sm">
        <CardHeader>
          <CardTitle>About This Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {opportunity.description.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {opportunity.requirements && opportunity.requirements.length > 0 && (
        <Card className="mb-6 rounded-sm">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              {opportunity.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Source attribution (OPPS-06 freshness + source) */}
      <div className="text-sm text-muted-foreground border-t border-border pt-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1 font-mono">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              Last verified:{" "}
              {formatDistanceToNow(opportunity.lastVerified, { addSuffix: true })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span>Source:</span>
            <a
              href={opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {SOURCE_NAMES[opportunity.source] || opportunity.source}
            </a>

            {opportunity.alternateSources && opportunity.alternateSources.length > 0 && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>Also on:</span>
                {opportunity.alternateSources.map((alt, i) => (
                  <a
                    key={i}
                    href={alt.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {SOURCE_NAMES[alt.source] || alt.source}
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Button variant="outline" asChild className="rounded-sm">
          <Link to="/opportunities" viewTransition>Back to all opportunities</Link>
        </Button>
      </div>
    </div>
  );
}
